from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime

from crud.activity_log import ActivityLogCRUD

class ActivityLogger:
    """Utility class for logging activities throughout the application"""
    
    def __init__(self):
        self.activity_log_crud = ActivityLogCRUD()
    
    async def log_call_activity(
        self,
        db: AsyncSession,
        activity_type: str,
        actor_id: UUID,
        actor_name: str,
        call_id: UUID,
        call_name: str,
        description: str,
        changes: Optional[Dict[Any, Any]] = None,
        context_data: Optional[Dict[Any, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: str = "info"
    ):
        """Log call-related activities"""
        await self.activity_log_crud.log_activity(
            db=db,
            activity_type=activity_type,
            actor_type="user",
            actor_id=actor_id,
            actor_name=actor_name,
            description=description,
            target_type="call",
            target_id=call_id,
            target_name=call_name,
            changes=changes,
            context_data=context_data,
            ip_address=ip_address,
            user_agent=user_agent,
            severity=severity
        )
    
    async def log_agent_activity(
        self,
        db: AsyncSession,
        activity_type: str,
        actor_id: UUID,
        actor_name: str,
        agent_id: UUID,
        agent_name: str,
        description: str,
        changes: Optional[Dict[Any, Any]] = None,
        context_data: Optional[Dict[Any, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: str = "info"
    ):
        """Log agent-related activities"""
        await self.activity_log_crud.log_activity(
            db=db,
            activity_type=activity_type,
            actor_type="user",
            actor_id=actor_id,
            actor_name=actor_name,
            description=description,
            target_type="agent",
            target_id=agent_id,
            target_name=agent_name,
            changes=changes,
            context_data=context_data,
            ip_address=ip_address,
            user_agent=user_agent,
            severity=severity
        )
    
    async def log_lead_activity(
        self,
        db: AsyncSession,
        activity_type: str,
        actor_id: UUID,
        actor_name: str,
        lead_id: UUID,
        lead_name: str,
        description: str,
        changes: Optional[Dict[Any, Any]] = None,
        context_data: Optional[Dict[Any, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: str = "info"
    ):
        """Log lead-related activities"""
        await self.activity_log_crud.log_activity(
            db=db,
            activity_type=activity_type,
            actor_type="user",
            actor_id=actor_id,
            actor_name=actor_name,
            description=description,
            target_type="lead",
            target_id=lead_id,
            target_name=lead_name,
            changes=changes,
            context_data=context_data,
            ip_address=ip_address,
            user_agent=user_agent,
            severity=severity
        )
    
    async def log_system_event(
        self,
        db: AsyncSession,
        activity_type: str,
        description: str,
        context_data: Optional[Dict[Any, Any]] = None,
        severity: str = "info"
    ):
        """Log system events"""
        await self.activity_log_crud.log_activity(
            db=db,
            activity_type=activity_type,
            actor_type="system",
            actor_id=None,
            actor_name="System",
            description=description,
            target_type=None,
            target_id=None,
            target_name=None,
            changes=None,
            context_data=context_data,
            ip_address=None,
            user_agent=None,
            severity=severity
        )
    
    async def log_security_event(
        self,
        db: AsyncSession,
        activity_type: str,
        actor_id: Optional[UUID],
        actor_name: str,
        description: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        context_data: Optional[Dict[Any, Any]] = None
    ):
        """Log security-related events"""
        await self.activity_log_crud.log_activity(
            db=db,
            activity_type=activity_type,
            actor_type="user" if actor_id else "system",
            actor_id=actor_id,
            actor_name=actor_name,
            description=description,
            target_type=None,
            target_id=None,
            target_name=None,
            changes=None,
            context_data=context_data,
            ip_address=ip_address,
            user_agent=user_agent,
            severity="warning" if activity_type == "security_login_failure" else "info"
        )

# Global instance
activity_logger = ActivityLogger()