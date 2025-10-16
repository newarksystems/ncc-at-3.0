from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
import logging
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import json

from models.user import User
from models.agent import Agent
from schemas.user import UserCreate, UserUpdate, UserOut
from schemas.agent import AgentCreate, AgentUpdate
from api.redis_client import redis_client
from core.config import settings
from core.security import get_password_hash

logger = logging.getLogger(__name__)

class UserCRUD:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)
    """CRUD operations for User model with Redis caching and authentication."""

    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def _check_access(self, current_user: User, target_user_id: UUID, db: AsyncSession, operation: str):
        """Check if the current user has permission to perform the operation on the target user."""
        if current_user.status != "active":
            raise HTTPException(status_code=403, detail="Current user is not active")
        
        if current_user.role == "super-admin":
            return  # Super admins have full access

        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can perform user management")

        query = select(User).where(User.id == target_user_id).options(selectinload(User.agent))
        result = db.execute(query)
        target_user = result.scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

        if target_user.role != "agent":
            raise HTTPException(status_code=403, detail="Admins can only manage agents")

        agent = target_user.agent
        if not agent:
            raise HTTPException(status_code=400, detail="Target user has no agent profile")

        if current_user.designation == "call-center-admin":
            if agent.agent_type not in {"recovery-agent", "compliance-agent"}:
                raise HTTPException(status_code=403, detail="Call center admins can only manage recovery or compliance agents")
        elif current_user.designation == "marketing-admin":
            if agent.agent_type != "marketing-agent":
                raise HTTPException(status_code=403, detail="Marketing admins can only manage marketing agents")
        elif current_user.designation == "compliance-admin":
            if agent.agent_type != "compliance-agent":
                raise HTTPException(status_code=403, detail="Compliance admins can only manage compliance agents")
        else:
            raise HTTPException(status_code=403, detail="Invalid admin designation")

    async def authenticate_user(self, db: AsyncSession, email: str, password: str) -> Optional[UserOut]:
        """Authenticate user by email and password, returning UserOut."""
        user = await self.get_user_by_email(db, email, current_user=None)
        if not user:
            logger.info(f"Authentication failed: User with email {email} not found")
            return None
        if not self.pwd_context.verify(password, user.hashed_password):
            logger.info(f"Authentication failed: Incorrect password for email {email}")
            return None
        return UserOut.from_orm(user)

    async def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    async def create_refresh_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    async def update_last_login(self, db: AsyncSession, user_id: UUID) -> None:
        """Update the last login timestamp for a user."""
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        if not user:
            logger.warning(f"Cannot update last_login: User {user_id} not found")
            return
        user.last_login = datetime.utcnow()
        await db.commit()
        cache_key = f"user:{user_id}"
        await redis_client.delete(cache_key)
        await redis_client.delete_pattern("users:*")
        if user.role == "agent":
            await redis_client.delete_pattern("agents:*")
            await redis_client.delete("available_agents")
        await redis_client.publish(f"user_status:{user_id}", json.dumps({"user_id": str(user_id), "last_login": user.last_login.isoformat()}))

    async def refresh_access_token(self, db: AsyncSession, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email: str = payload.get("sub")
            token_type: str = payload.get("type")
            
            if email is None or token_type != "refresh":
                logger.warning("Invalid refresh token: Missing email or incorrect token type")
                raise HTTPException(status_code=401, detail="Invalid refresh token")
            
            user = await self.get_user_by_email(db, email, current_user=None)
            if not user:
                logger.warning(f"User not found for email {email} during token refresh")
                raise HTTPException(status_code=401, detail="User not found")
            if user.status != "active":
                logger.warning(f"User {email} is not active during token refresh")
                raise HTTPException(status_code=401, detail="User is not active")
            
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            new_access_token = await self.create_access_token(
                data={"sub": user.email, "user_id": str(user.id)},
                expires_delta=access_token_expires
            )
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer"
            }
        except JWTError as e:
            logger.warning(f"JWT error during token refresh: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    async def get_user(self, db: AsyncSession, user_id: UUID, current_user: User) -> Optional[UserOut]:
        """Get user by ID with Redis caching."""
        self._check_access(current_user, user_id, db, "read")
        cache_key = f"user:{user_id}"
        cached_user = await redis_client.get(cache_key)
        if cached_user:
            logger.info(f"Cache hit for user {user_id}")
            return UserOut.model_validate_json(cached_user)
        
        logger.info(f"Cache miss for user {user_id}, fetching from database")
        query = select(User).where(User.id == user_id).options(selectinload(User.agent))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if user:
            user_out = UserOut.from_orm(user)
            await redis_client.set(cache_key, user_out.model_dump_json(), expire=300)
            return user_out
        return None

    async def get_user_by_email(self, db: AsyncSession, email: str, current_user: Optional[User] = None) -> Optional[User]:
        """Get user by email with Redis caching."""
        cache_key = f"user:email:{email}"
        cached_user = await redis_client.get(cache_key)
        if cached_user:
            logger.info(f"Cache hit for user email {email}")
            user_data = json.loads(cached_user)
            query = select(User).where(User.id == user_data["id"]).options(selectinload(User.agent))
            result = await db.execute(query)
            user = result.scalar_one_or_none()
            if user:
                if current_user:
                    self._check_access(current_user, user.id, db, "read")
                return user
            logger.warning(f"Cache hit but user {user_data['id']} not found in database")
            await redis_client.delete(cache_key)  # Clear stale cache
        
        logger.info(f"Cache miss for user email {email}, fetching from database")
        query = select(User).where(User.email == email).options(selectinload(User.agent))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if user:
            if current_user:
                self._check_access(current_user, user.id, db, "read")
            user_out = UserOut.from_orm(user)
            await redis_client.set(cache_key, user_out.model_dump_json(), expire=300)
            return user
        return None

    async def get_users(self, db: AsyncSession, current_user: User, role: Optional[str] = None) -> List[UserOut]:
        """Get all users with optional role filter."""
        if current_user.status != "active":
            raise HTTPException(status_code=403, detail="Current user is not active")

        cache_key = f"users:{role if role else 'all'}"
        cached_users = await redis_client.get(cache_key)
        if cached_users:
            logger.info(f"Cache hit for users with role {role}")
            return [UserOut.model_validate_json(user) for user in json.loads(cached_users)]
        
        logger.info(f"Cache miss for users with role {role}, fetching from database")
        query = select(User).options(selectinload(User.agent))
        if role:
            query = query.where(User.role == role.lower().replace("_", "-"))
        
        if current_user.role != "super-admin" and current_user.role == "admin":
            query = query.where(User.role == "agent")
            if current_user.designation == "call-center-admin":
                query = query.join(Agent, User.id == Agent.user_id).where(
                    Agent.agent_type.in_(["recovery-agent", "compliance-agent"])
                )
            elif current_user.designation == "marketing-admin":
                query = query.join(Agent, User.id == Agent.user_id).where(Agent.agent_type == "marketing-agent")
            elif current_user.designation == "compliance-admin":
                query = query.join(Agent, User.id == Agent.user_id).where(Agent.agent_type == "compliance-agent")

        result = await db.execute(query)
        users = result.scalars().all()
        
        user_outs = [UserOut.from_orm(user) for user in users]
        if user_outs:
            await redis_client.set(cache_key, json.dumps([user.model_dump_json() for user in user_outs]), expire=120)
        return user_outs

    async def get_users_count(self, db: AsyncSession) -> int:
        """Get total count of users in the system."""
        query = select(func.count(User.id))
        result = await db.execute(query)
        return result.scalar() or 0

    async def create_user_simple(self, db: AsyncSession, user_data: UserCreate) -> User:
        """Create a user without permission checks - for initial admin creation."""
        hashed_password = self.get_password_hash(user_data.password)
        
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            personal_phone=user_data.personal_phone,
            hashed_password=hashed_password,
            role=user_data.role,
            status=user_data.status,
            designation=user_data.designation,
            is_verified=user_data.is_verified
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    async def create_user(self, db: AsyncSession, current_user: Optional[User], user_data: UserCreate, agent_data: Optional[AgentCreate] = None) -> UserOut:
        """Create a new user and optional agent profile, restricted to admins."""
        if current_user and current_user.role not in ["super-admin", "admin"]:
            raise HTTPException(status_code=403, detail="Only admins can create users")
        if current_user and current_user.status != "active":
            raise HTTPException(status_code=403, detail="Current user is not active")
        
        logger.debug(f"Received user_data: {user_data.dict()}")
        logger.debug(f"Received agent_data: {agent_data.dict() if agent_data else None}")
        
        user_dict = user_data.dict(exclude_unset=True)
        
        for field in ["role", "status", "designation"]:
            if field in user_dict and user_dict[field]:
                user_dict[field] = user_dict[field].lower().replace("_", "-")
                logger.debug(f"Normalized {field}: {user_dict[field]}")
        
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        user_dict["id"] = str(uuid4())
        
        db_user = User(**user_dict)
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        if user_dict["role"] == "agent":
            if not agent_data:
                raise HTTPException(status_code=422, detail="agent_data is required for agent role")
            
            # Extension validation is now done on user level, not agent level
            if user_dict.get("extension"):
                # Check for unique extension in users table
                existing_user = await db.execute(select(User).filter(User.extension == user_dict["extension"]))
                if existing_user.scalars().first():
                    raise HTTPException(status_code=422, detail="Extension already exists")
            
            agent_dict = agent_data.dict(exclude_unset=True)
            agent_dict["user_id"] = db_user.id
            for field in ["agent_type", "group", "region", "status"]:
                if field in agent_dict and agent_dict[field]:
                    agent_dict[field] = agent_dict[field].lower().replace("_", "-")
                    logger.debug(f"Normalized agent {field}: {agent_dict[field]}")
            if "supervisor_id" in agent_dict and agent_dict["supervisor_id"]:
                agent_dict["supervisor_id"] = str(agent_dict["supervisor_id"])
            
            try:
                db_agent = Agent(**agent_dict)
                db.add(db_agent)
                await db.commit()
                await db.refresh(db_agent)
                logger.debug(f"Created agent: {agent_dict}")
            except Exception as e:
                logger.error(f"Failed to create agent: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")
        
        await redis_client.delete_pattern("users:*")
        if user_dict["role"] == "agent":
            await redis_client.delete_pattern("agents:*")
            await redis_client.delete("available_agents")
        
        return UserOut.from_orm(db_user)

    async def update_user(self, db: AsyncSession, user_id: UUID, user_data: UserUpdate, agent_data: Optional[AgentUpdate] = None, current_user: Optional[User] = None) -> Optional[UserOut]:
        """Update an existing user."""
        self._check_access(current_user, user_id, db, "update")
        query = select(User).where(User.id == user_id).options(selectinload(User.agent))
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = user_data.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = self.pwd_context.hash(update_data.pop("password"))
        for field in ["role", "status", "designation"]:
            if field in update_data and update_data[field]:
                update_data[field] = update_data[field].lower().replace("_", "-")
        for field, value in update_data.items():
            setattr(user, field, value)

        if user.role == "agent" and agent_data:
            if not user.agent:
                raise HTTPException(status_code=400, detail="User has no agent profile")
            update_agent_data = agent_data.dict(exclude_unset=True)
            for field in ["agent_type", "group", "region", "status"]:
                if field in update_agent_data and update_agent_data[field]:
                    update_agent_data[field] = update_agent_data[field].lower().replace("_", "-")
            if "supervisor_id" in update_agent_data and update_agent_data["supervisor_id"]:
                update_agent_data["supervisor_id"] = str(update_agent_data["supervisor_id"])
            for field, value in update_agent_data.items():
                setattr(user.agent, field, value)

        await db.commit()
        await db.refresh(user)

        cache_key = f"user:{user_id}"
        await redis_client.delete(cache_key)
        await redis_client.delete_pattern("users:*")
        if user.role == "agent":
            await redis_client.delete_pattern("agents:*")
            await redis_client.delete("available_agents")

        return UserOut.from_orm(user)

    async def delete_user(self, db: AsyncSession, user_id: UUID, current_user: User) -> None:
        """Delete a user."""
        self._check_access(current_user, user_id, db, "delete")
        query = select(User).where(User.id == user_id).options(selectinload(User.agent))
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.agent:
            await db.delete(user.agent)
        await db.delete(user)
        await db.commit()

        cache_key = f"user:{user_id}"
        await redis_client.delete(cache_key)
        await redis_client.delete_pattern("users:*")
        if user.role == "agent":
            await redis_client.delete_pattern("agents:*")
            await redis_client.delete("available_agents")

user_crud = UserCRUD()