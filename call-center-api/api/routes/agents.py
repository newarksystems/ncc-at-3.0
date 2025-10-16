from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

from database import get_db
from models.agent import Agent
from models.user import User
from schemas.agent import AgentCreate, AgentUpdate, AgentOut, AgentStatusUpdate, AgentFilters
from schemas.user import UserOut
from api.websocket import manager
from crud.agent import agent_crud
from auth import get_current_user
from utils.activity_logging import activity_logger

router = APIRouter()

class AgentsByDesignationResponse(BaseModel):
    agents: List[AgentOut]
    total: int

@router.get("/", response_model=List[AgentOut])
async def get_agents(
    status: Optional[str] = Query(None, regex="^(available|busy|on_call|on_hold|away|break|offline|dnd)?$"),
    department: Optional[str] = None,
    agent_type: Optional[str] = Query(None, regex="^(recovery-agent|marketing-agent|compliance-agent)?$"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all agents with optional filters."""
    filters = AgentFilters(
        status=status,
        department=department,
        agent_type=agent_type
    )
    agents, total = await agent_crud.get_agents_paginated(db, 1, 100, filters)
    return agents

@router.get("/{agent_id}/queue-status")
async def get_agent_queue_status(
    agent_id: UUID,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get queue status for a specific agent."""
    # Verify agent exists
    agent = await agent_crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Return mock queue status - replace with actual queue integration
    return {
        "agent_id": str(agent_id),
        "queue_status": "available",
        "calls_in_queue": 0,
        "average_wait_time": 0,
        "last_updated": "2025-01-08T09:39:00Z"
    }

@router.get("/{agent_id}/calls")
async def get_agent_calls(
    agent_id: UUID,
    limit: int = Query(10, ge=1, le=100),
    current_user: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get calls for a specific agent."""
    # Verify agent exists
    agent = await agent_crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Return mock data for now - replace with actual call data when available
    return {
        "calls": [],
        "total": 0,
        "agent_id": str(agent_id),
        "message": "Call data integration pending"
    }

@router.get("/by-designation", response_model=AgentsByDesignationResponse)
async def get_agents_by_designation(
    page: int = Query(1, ge=1),
    size: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, regex="^(available|busy|on_call|on_hold|away|break|offline|dnd)?$"),
    department: Optional[str] = None,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve agents filtered by the current admin's designation."""
    if current_user.role not in ["admin", "super-admin"]:
        raise HTTPException(status_code=403, detail="Only admins can access this endpoint")
    
    designation = current_user.designation if current_user.role == "admin" else None
    if current_user.role == "admin" and not designation:
        raise HTTPException(status_code=400, detail="Admin designation is missing")
    
    filters = AgentFilters(status=status, department=department)
    designation = designation or "super-admin"
    try:
        agents, total = await agent_crud.get_agents_by_designation(db, designation, page, size, filters)
        # Serialize agents to include user profile data
        serialized_agents = [agent_crud._serialize_agent(agent) for agent in agents]
        agent_outs = [AgentOut(**agent_data) for agent_data in serialized_agents]
        return {"agents": agent_outs, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agents: {str(e)}")

@router.get("/{agent_id}", response_model=AgentOut)
async def get_agent(agent_id: UUID, db: AsyncSession = Depends(get_db)):
    """Retrieve a specific agent by ID."""
    agent = await agent_crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.get("/by-user/{user_id}", response_model=AgentOut)
async def get_agent_by_user_id(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Retrieve a specific agent by user ID."""
    agent = await agent_crud.get_agent_by_user_id(db, user_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found for this user")
    
    # Log the activity
    # Handle both dict (from cache) and object formats
    agent_id = agent["id"] if isinstance(agent, dict) else agent.id
    agent_name = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip() if isinstance(agent, dict) else agent.full_name
    
    await activity_logger.log_agent_activity(
        db=db,
        activity_type="agent_accessed",
        actor_id=current_user.id,
        actor_name=current_user.username,
        agent_id=agent_id,
        agent_name=agent_name,
        description=f"Accessed agent {agent_name} by user ID {user_id}"
    )
    
    return agent

@router.post("/", response_model=AgentOut)
async def create_agent(
    agent_data: AgentCreate,
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user)
):
    """Create a new agent."""
    actor_id = current_user.id
    actor_name = current_user.full_name
    
    agent = await agent_crud.create_agent(db, agent_data, actor_id, actor_name)
    # Broadcast agent creation
    background_tasks.add_task(
        manager.broadcast_agent_update,
        {"id": str(agent.id), "status": agent.status}
    )
    return agent

@router.put("/{agent_id}/status")
async def update_agent_status(
    agent_id: UUID,
    status_data: AgentStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update agent status."""
    actor_id = current_user.id
    actor_name = current_user.full_name
    
    agent = await agent_crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    original_status = agent.status
    agent.status = status_data.status.lower().replace("_", "-")
    await db.commit()
    
    # Log activity
    from utils.activity_logging import activity_logger, ActivityType
    await activity_logger.log_agent_activity(
        db=db,
        activity_type=ActivityType.AGENT_STATUS_CHANGED,
        actor_id=actor_id,
        actor_name=actor_name,
        agent_id=agent_id,
        agent_name=agent.full_name,
        description=f"Changed agent status from {original_status} to {agent.status}"
    )
    
    # Broadcast status update
    background_tasks.add_task(
        manager.broadcast_agent_update,
        {"id": str(agent.id), "status": agent.status}
    )
    
    return {"message": "Agent status updated"}