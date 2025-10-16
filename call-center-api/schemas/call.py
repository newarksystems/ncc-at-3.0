from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from uuid import UUID
from datetime import datetime

class CallBase(BaseModel):
    caller_number: str = Field(..., min_length=1, max_length=50)
    callee_number: str = Field(..., min_length=1, max_length=50)
    direction: Literal["inbound", "outbound"] = Field(...)
    description: Optional[str] = None

class CallCreate(CallBase):
    at_session_id: Optional[str] = Field(None, max_length=100)
    at_call_id: Optional[str] = Field(None, max_length=100)
    agent_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    status: Optional[str] = "initiated"

class CallUpdate(BaseModel):
    status: Optional[str] = None
    call_answered: Optional[datetime] = None
    call_end: Optional[datetime] = None
    total_duration: Optional[int] = None
    description: Optional[str] = None

class CallResponse(CallBase):
    id: UUID
    at_session_id: Optional[str]
    at_call_id: Optional[str]
    status: str
    call_start: datetime
    call_answered: Optional[datetime]
    call_end: Optional[datetime]
    total_duration: Optional[int]
    agent_id: Optional[UUID]
    lead_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginatedCalls(BaseModel):
    calls: List[CallResponse]
    total: int
    skip: int
    limit: int

class CallFilters(BaseModel):
    status: Optional[str] = None
    direction: Optional[str] = None
    agent_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CallStatsResponse(BaseModel):
    total_calls: int
    answered_calls: int
    missed_calls: int
    average_duration: float

class MakeCallRequest(BaseModel):
    to: str
    from_: Optional[str] = None

class DashboardStats(BaseModel):
    total_calls: int
    active_calls: int
    answered_calls: int
    missed_calls: int
    total_collected: float = 0.0

class LiveCallResponse(BaseModel):
    id: UUID
    caller_number: str
    callee_number: str
    status: str
    duration: int
    agent_id: Optional[UUID]

class HourlyCallStats(BaseModel):
    hour: int
    total_calls: int
    answered_calls: int
