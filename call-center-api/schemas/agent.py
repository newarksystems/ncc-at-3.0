from pydantic import BaseModel, field_serializer
from typing import Optional, Literal, List, Dict, Any
from uuid import UUID
from datetime import datetime

class AgentCreate(BaseModel):
    agent_id_3cx: Optional[str] = None
    agent_type: Optional[Literal["recovery-agent", "marketing-agent", "compliance-agent"]] = None
    group: Optional[Literal["CC1", "CC2", "Field", "IDC"]] = None
    region: Optional[Literal["A", "B", "C", "D", "E"]] = None
    status: Optional[Literal["available", "busy", "on_call", "on_hold", "away", "break", "offline", "dnd"]] = "offline"
    max_concurrent_calls: int = 1
    auto_answer: bool = False
    call_recording_enabled: bool = True
    department: Optional[str] = None
    supervisor_id: Optional[UUID] = None
    notes: Optional[str] = None
    assigned_queues: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None
    languages: Optional[Dict[str, Any]] = None

class AgentUpdate(BaseModel):
    agent_id_3cx: Optional[str] = None
    agent_type: Optional[Literal["recovery-agent", "marketing-agent", "compliance-agent"]] = None
    group: Optional[Literal["CC1", "CC2", "Field", "IDC"]] = None
    region: Optional[Literal["A", "B", "C", "D", "E"]] = None
    status: Optional[Literal["available", "busy", "on_call", "on_hold", "away", "break", "offline", "dnd"]] = None
    max_concurrent_calls: Optional[int] = None
    auto_answer: Optional[bool] = None
    call_recording_enabled: Optional[bool] = None
    department: Optional[str] = None
    supervisor_id: Optional[UUID] = None
    notes: Optional[str] = None
    assigned_queues: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None
    languages: Optional[Dict[str, Any]] = None

class AgentOut(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    # User profile fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    extension: Optional[str] = None  # Now comes from user profile
    sip_username: Optional[str] = None
    sip_password: Optional[str] = None
    # Agent specific fields
    agent_id_3cx: Optional[str]
    agent_type: Optional[str]
    group: Optional[str]
    region: Optional[str]
    status: str
    last_status_change: Optional[datetime]
    is_logged_in: bool
    login_time: Optional[datetime]
    last_activity: Optional[datetime]
    current_call_id: Optional[UUID]
    total_calls_today: int
    answered_calls_today: int
    missed_calls_today: int
    total_talk_time_today: int
    total_hold_time_today: int
    total_calls: int
    answered_calls: int
    missed_calls: int
    total_talk_time: int
    average_call_duration: float
    assigned_queues: Optional[Dict[str, Any]]
    skills: Optional[Dict[str, Any]]
    languages: Optional[Dict[str, Any]]
    max_concurrent_calls: int
    auto_answer: bool
    call_recording_enabled: bool
    department: Optional[str]
    supervisor_id: Optional[UUID]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]

    @field_serializer('id', 'user_id', 'current_call_id', 'supervisor_id')
    def serialize_uuid(self, value: UUID) -> str:
        return str(value) if value else None

    class Config:
        from_attributes = True
    
class AgentStatusUpdate(BaseModel):
    status: Literal["available", "busy", "on_call", "on_hold", "away", "break", "offline", "dnd"]

class AgentFilters(BaseModel):
    status: Optional[Literal["available", "busy", "on_call", "on_hold", "away", "break", "offline", "dnd"]] = None
    department: Optional[str] = None
    is_logged_in: Optional[bool] = None
    supervisor_id: Optional[UUID] = None
    queue_name: Optional[str] = None
    skill: Optional[str] = None
    agent_type: Optional[str] = None 

class AgentsResponse(BaseModel):
    agents: List[AgentOut]
    total: int