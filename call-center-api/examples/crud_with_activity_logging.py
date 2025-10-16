"""
Example showing how to integrate activity logging into existing CRUD operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import BackgroundTasks, Request
from uuid import UUID
from typing import Optional

from utils.activity_logger import log_activity, log_call_activity, log_agent_activity
from models.call import Call
from models.agent import Agent
from schemas.call import CallCreate, CallUpdate

class ExampleCallCRUD:
    """Example CRUD with activity logging integration"""
    
    @log_activity(
        activity_type="call_created",
        description="New call record created",
        target_type="call",
        severity="info"
    )
    async def create_call(
        self,
        db: AsyncSession,
        call_data: CallCreate,
        background_tasks: BackgroundTasks = None,
        request: Request = None
    ) -> Call:
        """Create a new call with automatic activity logging"""
        call = Call(**call_data.model_dump())
        db.add(call)
        await db.commit()
        await db.refresh(call)
        return call
    
    @log_activity(
        activity_type="call_updated",
        description="Call record updated",
        target_type="call",
        severity="info"
    )
    async def update_call(
        self,
        db: AsyncSession,
        call_id: UUID,
        call_update: CallUpdate,
        background_tasks: BackgroundTasks = None,
        request: Request = None
    ) -> Optional[Call]:
        """Update call with automatic activity logging"""
        result = await db.execute(select(Call).where(Call.id == call_id))
        call = result.scalar_one_or_none()
        
        if not call:
            return None
        
        # Store changes for logging
        changes = {}
        for field, value in call_update.model_dump(exclude_unset=True).items():
            old_value = getattr(call, field)
            if old_value != value:
                changes[field] = {"old": old_value, "new": value}
                setattr(call, field, value)
        
        await db.commit()
        await db.refresh(call)
        
        # Manual logging with changes
        if background_tasks and changes:
            await log_call_activity(
                activity_type="call_field_updated",
                call_id=call.id,
                description=f"Call fields updated: {', '.join(changes.keys())}",
                changes=changes
            )
        
        return call
    
    # Manual logging example
    async def hangup_call(
        self,
        db: AsyncSession,
        call_id: UUID,
        agent_id: UUID,
        background_tasks: BackgroundTasks = None
    ) -> bool:
        """Hangup call with manual activity logging"""
        try:
            # Your hangup logic here
            result = await db.execute(select(Call).where(Call.id == call_id))
            call = result.scalar_one_or_none()
            
            if not call:
                return False
            
            call.status = "ended"
            await db.commit()
            
            # Manual activity logging
            if background_tasks:
                background_tasks.add_task(
                    log_call_activity,
                    activity_type="call_hangup",
                    call_id=call_id,
                    description=f"Call {call.caller_number} -> {call.callee_number} hung up by agent",
                    actor_id=agent_id,
                    severity="info"
                )
            
            return True
            
        except Exception as e:
            # Error logging
            if background_tasks:
                background_tasks.add_task(
                    log_call_activity,
                    activity_type="call_hangup_failed",
                    call_id=call_id,
                    description=f"Failed to hangup call: {str(e)}",
                    actor_id=agent_id,
                    severity="error"
                )
            raise

class ExampleAgentCRUD:
    """Example Agent CRUD with activity logging"""
    
    @log_activity(
        activity_type="agent_status_changed",
        description="Agent status updated",
        target_type="agent",
        severity="info"
    )
    async def update_agent_status(
        self,
        db: AsyncSession,
        agent_id: UUID,
        new_status: str,
        background_tasks: BackgroundTasks = None,
        request: Request = None
    ) -> Optional[Agent]:
        """Update agent status with activity logging"""
        result = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        
        if not agent:
            return None
        
        old_status = agent.status
        agent.status = new_status
        await db.commit()
        await db.refresh(agent)
        
        # Additional manual logging for status changes
        if background_tasks:
            await log_agent_activity(
                activity_type="agent_status_transition",
                agent_id=agent_id,
                description=f"Agent status changed from {old_status} to {new_status}",
                changes={"status": {"old": old_status, "new": new_status}}
            )
        
        return agent

# Usage in FastAPI routes:
"""
from fastapi import APIRouter, Depends, BackgroundTasks, Request

@router.post("/calls/")
async def create_call(
    call_data: CallCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    crud = ExampleCallCRUD()
    return await crud.create_call(
        db=db,
        call_data=call_data,
        background_tasks=background_tasks,
        request=request
    )
"""
