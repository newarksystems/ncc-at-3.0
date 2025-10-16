from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Tuple, Optional
from uuid import UUID
import logging
import json

from models.agent import Agent
from models.user import User
from schemas.agent import AgentCreate, AgentUpdate, AgentOut, AgentFilters
from api.redis_client import redis_client
from utils.activity_logging import activity_logger

logger = logging.getLogger(__name__)

class AgentCRUD:
    """CRUD operations for Agent model with Redis caching."""
    
    def _serialize_agent(self, agent: Agent) -> dict:
        """Convert Agent model to dictionary for caching."""
        if not agent:
            return None
            
        login_time = agent.login_time.isoformat() if agent.login_time else None
        last_activity = agent.last_activity.isoformat() if agent.last_activity else None
        created_at = agent.created_at.isoformat() if agent.created_at else None
        updated_at = agent.updated_at.isoformat() if agent.updated_at else None
        last_login = agent.last_login.isoformat() if agent.last_login else None
        last_status_change = agent.last_status_change.isoformat() if agent.last_status_change else None
        
        user = agent.user
        first_name = user.first_name if user else None
        last_name = user.last_name if user else None
        email = user.email if user else None
        
        return {
            "id": str(agent.id),
            "user_id": str(agent.user_id) if agent.user_id else None,
            # User profile fields
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            # Agent specific fields
            # Agent specific fields
            "agent_id_3cx": agent.agent_id_3cx,
            "agent_type": agent.agent_type,
            "group": agent.group,
            "region": agent.region,
            "status": agent.status,
            "last_status_change": last_status_change,
            "is_logged_in": agent.is_logged_in,
            "login_time": login_time,
            "last_activity": last_activity,
            "current_call_id": str(agent.current_call_id) if agent.current_call_id else None,
            "total_calls_today": agent.total_calls_today,
            "answered_calls_today": agent.answered_calls_today,
            "missed_calls_today": agent.missed_calls_today,
            "total_talk_time_today": agent.total_talk_time_today,
            "total_hold_time_today": agent.total_hold_time_today,
            "total_calls": agent.total_calls,
            "answered_calls": agent.answered_calls,
            "missed_calls": agent.missed_calls,
            "total_talk_time": agent.total_talk_time,
            "average_call_duration": agent.average_call_duration,
            "assigned_queues": agent.assigned_queues,
            "skills": agent.skills,
            "languages": agent.languages,
            "max_concurrent_calls": agent.max_concurrent_calls,
            "auto_answer": agent.auto_answer,
            "call_recording_enabled": agent.call_recording_enabled,
            "department": agent.department,
            "supervisor_id": str(agent.supervisor_id) if agent.supervisor_id else None,
            "notes": agent.notes,
            "created_at": created_at,
            "updated_at": updated_at,
            "last_login": last_login
        }
    
    async def get_agent(self, db: AsyncSession, agent_id: UUID) -> Optional[Agent]:
        """Get agent by ID with Redis caching."""
        cache_key = f"agent:{agent_id}"
        cached_agent = await redis_client.get(cache_key)
        if cached_agent:
            logger.info(f"Cache hit for agent {agent_id}")
            return json.loads(cached_agent)
            
        logger.info(f"Cache miss for agent {agent_id}, fetching from database")
        query = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.user))
        result = await db.execute(query)
        agent = result.scalar_one_or_none()
        
        if agent:
            serialized_agent = self._serialize_agent(agent)
            await redis_client.set(cache_key, json.dumps(serialized_agent), 300)
            
        return agent
    
    async def get_agent_by_user_id(self, db: AsyncSession, user_id: UUID) -> Optional[Agent]:
        """Get agent by user ID with Redis caching."""
        cache_key = f"agent:user:{user_id}"
        cached_agent = await redis_client.get(cache_key)
        if cached_agent:
            logger.info(f"Cache hit for agent with user_id {user_id}")
            return json.loads(cached_agent)
            
        logger.info(f"Cache miss for agent with user_id {user_id}, fetching from database")
        query = select(Agent).where(Agent.user_id == user_id).options(selectinload(Agent.user))
        result = await db.execute(query)
        agent = result.scalar_one_or_none()
        
        if agent:
            serialized_agent = self._serialize_agent(agent)
            await redis_client.set(cache_key, json.dumps(serialized_agent), 300)
            
        return agent

    async def get_agents_paginated(
        self, 
        db: AsyncSession, 
        page: int, 
        size: int, 
        filters: AgentFilters
    ) -> Tuple[List[Agent], int]:
        """Get paginated agents with filters and caching."""
        filters_dict = filters.dict(exclude_unset=True) if filters else {}
        cache_key = f"agents:{page}:{size}:{hash(str(filters_dict))}"
        
        cached_result = await redis_client.get(cache_key)
        if cached_result:
            try:
                logger.info(f"Cache hit for agents page {page}")
                cached_data = json.loads(cached_result)
                if not isinstance(cached_data, list) or len(cached_data) != 2 or not isinstance(cached_data[0], list):
                    logger.error(f"Invalid cached data structure for key {cache_key}: {cached_data}")
                    await redis_client.delete(cache_key)
                else:
                    return [Agent(**AgentOut.model_validate(agent).dict()) for agent in cached_data[0]], cached_data[1]
            except Exception as e:
                logger.error(f"Error processing cached data for key {cache_key}: {str(e)}")
                await redis_client.delete(cache_key)
            
        logger.info(f"Cache miss for agents page {page}, fetching from database")
        
        query = select(Agent).options(selectinload(Agent.user))
        count_query = select(func.count(Agent.id))
        
        conditions = []
        if filters and filters.status:
            conditions.append(Agent.status == filters.status.lower().replace("_", "-"))
        if filters and filters.department:
            conditions.append(Agent.department == filters.department)
        if filters and filters.is_logged_in is not None:
            conditions.append(Agent.is_logged_in == filters.is_logged_in)
        if filters and filters.supervisor_id:
            conditions.append(Agent.supervisor_id == filters.supervisor_id)
        if filters and filters.queue_name:
            conditions.append(Agent.assigned_queues.contains([filters.queue_name]))
        if filters and filters.skill:
            conditions.append(Agent.skills.contains([filters.skill]))
        if filters and filters.agent_type:
            conditions.append(Agent.agent_type == filters.agent_type.lower().replace("_", "-"))
            
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0
        
        query = query.order_by(Agent.created_at.desc()).offset((page - 1) * size).limit(size)
        result = await db.execute(query)
        agents = result.scalars().all()
        
        if agents:
            serialized_agents = [self._serialize_agent(agent) for agent in agents]
            cache_result = [serialized_agents, total]
            await redis_client.set(cache_key, json.dumps(cache_result), 120)
            
        return agents, total
    
    async def get_agents_by_designation(
            self,
            db: AsyncSession,
            designation: Optional[str],
            page: int,
            size: int,
            filters: AgentFilters
        ) -> Tuple[List[Agent], int]:
            """Get paginated agents filtered by admin designation."""
            designation_to_agent_type = {
                "call-center-admin": "recovery-agent",
                "marketing-admin": "marketing-agent",
                "compliance-admin": "compliance-agent",
            }
            agent_type = designation_to_agent_type.get(designation.lower().replace("_", "-")) if designation and designation != "super-admin" else None

            filters_dict = filters.dict(exclude_unset=True) if filters else {}
            if agent_type:
                filters_dict["agent_type"] = agent_type
            cache_key = f"agents:by-designation:{designation or 'all'}:{page}:{size}:{hash(str(filters_dict))}"
            
            cached_result = await redis_client.get(cache_key)
            if cached_result:
                try:
                    logger.info(f"Cache hit for agents by designation {designation or 'all'}, page {page}")
                    cached_data = json.loads(cached_result)
                    if not isinstance(cached_data, list) or len(cached_data) != 2 or not isinstance(cached_data[0], list):
                        logger.error(f"Invalid cached data structure for key {cache_key}: {cached_data}")
                        await redis_client.delete(cache_key)
                    else:
                        return [Agent(**AgentOut.model_validate(agent).dict()) for agent in cached_data[0]], cached_data[1]
                except Exception as e:
                    logger.error(f"Error processing cached data for key {cache_key}: {str(e)}")
                    await redis_client.delete(cache_key)
                    
            logger.info(f"Cache miss for agents by designation {designation or 'all'}, page {page}, fetching from database")
            
            query = select(Agent).options(selectinload(Agent.user))
            count_query = select(func.count(Agent.id))
            
            conditions = []
            if agent_type:
                conditions.append(Agent.agent_type == agent_type)
            if filters and filters.status:
                conditions.append(Agent.status == filters.status.lower().replace("_", "-"))
            if filters and filters.department:
                conditions.append(Agent.department == filters.department)
            if filters and filters.is_logged_in is not None:
                conditions.append(Agent.is_logged_in == filters.is_logged_in)
            if filters and filters.supervisor_id:
                conditions.append(Agent.supervisor_id == filters.supervisor_id)
            if filters and filters.queue_name:
                conditions.append(Agent.assigned_queues.contains([filters.queue_name]))
            if filters and filters.skill:
                conditions.append(Agent.skills.contains([filters.skill]))
                    
            if conditions:
                query = query.where(and_(*conditions))
                count_query = count_query.where(and_(*conditions))
            
            count_result = await db.execute(count_query)
            total = count_result.scalar() or 0
            
            query = query.order_by(Agent.created_at.desc()).offset((page - 1) * size).limit(size)
            result = await db.execute(query)
            agents = result.scalars().all()
            
            serialized_agents = [self._serialize_agent(agent) for agent in agents]
            cache_result = [serialized_agents, total]
            try:
                await redis_client.set(cache_key, json.dumps(cache_result), 120)
                logger.info(f"Cached agents for key {cache_key}")
            except Exception as e:
                logger.error(f"Failed to cache agents for key {cache_key}: {str(e)}")
                    
            return agents, total

    async def get_available_agents(self, db: AsyncSession) -> List[Agent]:
        """Get all currently available agents with caching."""
        cache_key = "available_agents"
        cached_agents = await redis_client.get(cache_key)
        if cached_agents:
            logger.info("Cache hit for available agents")
            return [AgentOut.model_validate_json(agent).to_orm(Agent) for agent in json.loads(cached_agents)]
            
        logger.info("Cache miss for available agents, fetching from database")
        query = (
            select(Agent)
            .where(
                and_(
                    Agent.status == "available",
                    Agent.is_logged_in == True
                )
            )
            .options(selectinload(Agent.user))
            .order_by(Agent.last_activity.desc())
        )
        result = await db.execute(query)
        agents = result.scalars().all()
        
        if agents:
            serialized_agents = [self._serialize_agent(agent) for agent in agents]
            await redis_client.set(cache_key, 30, json.dumps([AgentOut(**agent).model_dump_json() for agent in serialized_agents]))
            
        return agents

    async def create_agent(self, db: AsyncSession, agent_data: AgentCreate, actor_id: UUID, actor_name: str) -> Agent:
        """Create a new agent and log activity."""
        agent_dict = agent_data.dict(exclude_unset=True)
        for field in ["agent_type", "group", "region", "status"]:
            if field in agent_dict and agent_dict[field]:
                agent_dict[field] = agent_dict[field].lower().replace("_", "-")
                logger.debug(f"Normalized agent {field}: {agent_dict[field]}")
        if "supervisor_id" in agent_dict and agent_dict["supervisor_id"]:
            agent_dict["supervisor_id"] = str(agent_dict["supervisor_id"])
        
        agent = Agent(**agent_dict)
        db.add(agent)
        await db.commit()
        await db.refresh(agent)
        
        await activity_logger.log_agent_activity(
            db=db,
            activity_type="agent_created",
            actor_id=actor_id,
            actor_name=actor_name,
            agent_id=agent.id,
            agent_name=agent.full_name,
            description=f"Created new agent {agent.full_name} with extension {agent.user.extension if agent.user else 'N/A'}"
        )
        
        await redis_client.delete_pattern("agents:*")
        await redis_client.delete("available_agents")
        
        return agent
    
    async def update_agent(
        self, 
        db: AsyncSession, 
        agent_id: UUID, 
        agent_data: AgentUpdate,
        actor_id: UUID,
        actor_name: str
    ) -> Optional[Agent]:
        """Update an existing agent and log activity."""
        query = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.user))
        result = await db.execute(query)
        agent = result.scalar_one_or_none()
        
        if not agent:
            return None
        
        original_name = agent.full_name
        original_extension = agent.user.extension if agent.user else None
        original_status = agent.status
        
        update_data = agent_data.dict(exclude_unset=True)
        for field in ["agent_type", "group", "region", "status"]:
            if field in update_data and update_data[field]:
                update_data[field] = update_data[field].lower().replace("_", "-")
        if "supervisor_id" in update_data and update_data["supervisor_id"]:
            update_data["supervisor_id"] = str(update_data["supervisor_id"])
        for field, value in update_data.items():
            setattr(agent, field, value)
        
        await db.commit()
        await db.refresh(agent)
        
        # Update corresponding user record if exists
        if agent.user:
            user = agent.user
            if "first_name" in update_data:
                user.first_name = update_data["first_name"]
            if "last_name" in update_data:
                user.last_name = update_data["last_name"]
            if "extension" in update_data:
                user.extension = update_data["extension"]
            await db.commit()
            await db.refresh(user)
        
        changes = {}
        if ("first_name" in update_data or "last_name" in update_data) and agent.full_name != original_name:
            changes["name"] = {"from": original_name, "to": agent.full_name}
        if "extension" in update_data and update_data["extension"] != original_extension:
            changes["extension"] = {"from": original_extension, "to": update_data["extension"]}
        if "status" in update_data and update_data["status"] != original_status:
            changes["status"] = {"from": original_status, "to": update_data["status"]}
        
        await activity_logger.log_agent_activity(
            db=db,
            activity_type="agent_updated",
            actor_id=actor_id,
            actor_name=actor_name,
            agent_id=agent.id,
            agent_name=agent.full_name,
            description=f"Updated agent {agent.full_name}",
            changes=changes if changes else None
        )
        
        cache_key = f"agent:{agent_id}"
        await redis_client.delete(cache_key)
        await redis_client.delete_pattern("agents:*")
        await redis_client.delete("available_agents")
        
        return agent
    
    async def delete_agent(self, db: AsyncSession, agent_id: UUID, actor_id: UUID, actor_name: str) -> bool:
        """Delete an agent and log activity."""
        query = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.user))
        result = await db.execute(query)
        agent = result.scalar_one_or_none()
        
        if not agent:
            return False
        
        agent_name = agent.full_name
        agent_extension = agent.user.extension if agent.user else 'N/A'
        
        await db.delete(agent)
        await db.commit()
        
        await activity_logger.log_agent_activity(
            db=db,
            activity_type="agent_deleted",
            actor_id=actor_id,
            actor_name=actor_name,
            agent_id=agent_id,
            agent_name=agent_name,
            description=f"Deleted agent {agent_name} with extension {agent_extension}"
        )
        
        cache_key = f"agent:{agent_id}"
        await redis_client.delete(cache_key)
        await redis_client.delete_pattern("agents:*")
        await redis_client.delete("available_agents")
        
        return True

agent_crud = AgentCRUD()