from pydantic import BaseModel, Field, field_serializer
from typing import Optional, Literal, List, Dict, Any
from uuid import UUID
from datetime import datetime
from core.utils import to_eat_timezone

class LeadBase(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=50)
    associate_agent: Optional[str] = Field(None, max_length=100)
    phone: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    branch: Optional[str] = Field(None, max_length=100)
    latest_loan: Optional[str] = Field(None, max_length=100)
    business_address: str = Field(..., min_length=1, max_length=50)
    status: Literal["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost", "on_hold", "follow_up"] = Field(default="new")
    priority: Literal["cold", "warm", "hot", "urgent"] = Field(default="medium")
    source: Literal["website", "phone", "email", "referral", "social_media", "advertisement", "trade_show", "cold_call", "other"] = Field(default="other")
    preferred_contact_method: Optional[str] = Field(default="phone", max_length=20)
    best_time_to_call: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    do_not_call: Optional[bool] = False

class LeadCreate(LeadBase):
    assigned_agent_id: Optional[UUID] = None
    assigned_date: Optional[datetime] = None
    lead_score: Optional[int] = Field(default=0, ge=0)
    estimated_value: Optional[float] = None
    probability: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class LeadUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=1, max_length=50)
    associate_agent: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    branch: Optional[str] = Field(None, max_length=100)
    latest_loan: Optional[str] = Field(None, max_length=100)
    business_address: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[Literal["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost", "on_hold", "follow_up"]] = None
    priority: Optional[Literal["cold", "warm", "hot", "urgent"]] = None
    source: Optional[Literal["website", "phone", "email", "referral", "social_media", "advertisement", "trade_show", "cold_call", "other"]] = None
    assigned_agent_id: Optional[UUID] = None
    assigned_date: Optional[datetime] = None
    lead_score: Optional[int] = Field(None, ge=0)
    estimated_value: Optional[float] = None
    probability: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    preferred_contact_method: Optional[str] = Field(None, max_length=20)
    best_time_to_call: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    do_not_call: Optional[bool] = None
    last_activity: Optional[datetime] = None

class LeadResponse(LeadBase):
    id: UUID
    assigned_agent_id: Optional[UUID]
    assigned_date: Optional[datetime]
    lead_score: int
    estimated_value: Optional[float]
    probability: Optional[float]
    notes: Optional[str]
    tags: Optional[List[str]]
    custom_fields: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    last_activity: Optional[datetime]
    contact_rate: float
    is_qualified: bool
    days_since_last_contact: int

    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)
    
    @field_serializer('assigned_agent_id')
    def serialize_assigned_agent_id(self, assigned_agent_id: UUID | None) -> str | None:
        return str(assigned_agent_id) if assigned_agent_id else None
    
    @field_serializer('assigned_date')
    def serialize_assigned_date(self, assigned_date: datetime | None) -> str | None:
        return to_eat_timezone(assigned_date)
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime) -> str:
        return to_eat_timezone(created_at)
    
    @field_serializer('updated_at')
    def serialize_updated_at(self, updated_at: datetime) -> str:
        return to_eat_timezone(updated_at)
    
    @field_serializer('last_activity')
    def serialize_last_activity(self, last_activity: datetime | None) -> str | None:
        return to_eat_timezone(last_activity)

    class Config:
        from_attributes = True

class PaginatedLeads(BaseModel):
    leads: List[LeadResponse]
    total_leads: int
    total_pages: int
    current_page: int
    page_size: int