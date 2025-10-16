from pydantic import BaseModel, Field, field_serializer
from typing import Optional, Literal, List, Dict, Any
from uuid import UUID
from datetime import datetime
from core.utils import to_eat_timezone

class ActivityLogBase(BaseModel):
    activity_type: Literal[
        "call_created", "call_updated", "call_deleted", "call_status_changed", "call_ended",
        "agent_login", "agent_logout", "agent_status_changed", "agent_created", "agent_updated", "agent_deleted",
        "lead_created", "lead_updated", "lead_deleted", "lead_status_changed",
        "user_login", "user_logout", "user_created", "user_updated", "user_deleted", "user_role_changed",
        "system_startup", "system_shutdown", "system_error", "system_warning",
        "api_call", "data_export", "report_generated",
        "security_login_attempt", "security_login_failure", "security_password_change",
        "custom"
    ] = Field(...)
    description: Optional[str] = None
    actor_type: Optional[str] = Field(None, max_length=50)
    actor_id: Optional[UUID] = None
    actor_name: Optional[str] = Field(None, max_length=100)
    target_type: Optional[str] = Field(None, max_length=50)
    target_id: Optional[UUID] = None
    target_name: Optional[str] = Field(None, max_length=100)
    severity: Literal["info", "warning", "error", "critical"] = Field(default="info")

class ActivityLogCreate(ActivityLogBase):
    changes: Optional[Dict[str, Any]] = None
    context_data: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = Field(None, max_length=500)

class ActivityLogResponse(ActivityLogBase):
    id: UUID
    changes: Optional[Dict[str, Any]]
    context_data: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    is_security_related: bool
    is_system_event: bool

    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)
    
    @field_serializer('actor_id')
    def serialize_actor_id(self, actor_id: UUID | None) -> str | None:
        return str(actor_id) if actor_id else None
    
    @field_serializer('target_id')
    def serialize_target_id(self, target_id: UUID | None) -> str | None:
        return str(target_id) if target_id else None
    
    @field_serializer('timestamp')
    def serialize_timestamp(self, timestamp: datetime) -> str:
        return to_eat_timezone(timestamp)

    class Config:
        from_attributes = True

class PaginatedActivityLogs(BaseModel):
    activity_logs: List[ActivityLogResponse]
    total_activity_logs: int
    total_pages: int
    current_page: int
    page_size: int