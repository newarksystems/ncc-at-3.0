from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from datetime import timedelta
from typing import Dict

from database import get_db
from crud.user import user_crud
from schemas.user import UserOut, UserCreate
from schemas.auth import LoginRequest, LoginResponse
from core.config import settings
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/init-admin", response_model=UserOut)
async def create_initial_admin(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create the first super admin user - only works if no users exist"""
    
    # Check if any users exist
    existing_users = await user_crud.get_users_count(db)
    if existing_users > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin user already exists. Use regular user creation."
        )
    
    # Force super-admin role and verified status
    user_data.role = "super-admin"
    user_data.is_verified = True
    
    user = await user_crud.create_user_simple(db, user_data)
    return UserOut.from_orm(user)

@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> LoginResponse:
    """Authenticate a user and return access and refresh tokens."""
    logger.debug(f"Login attempt for email: {data.email}")
    user = await user_crud.authenticate_user(db, data.email, data.password)
    if not user:
        logger.warning(f"Login failed for email: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await user_crud.create_access_token(
        data={"sub": user.email, "user_id": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = await user_crud.create_refresh_token(
        data={"sub": user.email, "user_id": str(user.id)}, expires_delta=refresh_token_expires
    )
    
    await user_crud.update_last_login(db, user.id)
    logger.info(f"Login successful for email: {data.email}")
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user
    )

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """Refresh an access token using a refresh token."""
    try:
        return await user_crud.refresh_access_token(db, refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me")
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserOut:
    """Retrieve the current authenticated user."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await user_crud.get_user_by_email(db, email, current_user=None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserOut.from_orm(user)

@router.post("/logout")
async def logout(db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """Log out the current user."""
    return {"message": "Successfully logged out"}