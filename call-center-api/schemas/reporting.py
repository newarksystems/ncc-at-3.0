from pydantic import BaseModel, Field, field_serializer
from typing import Optional, Literal, List, Dict, Any
from uuid import UUID
from datetime import datetime
from core.utils import to_eat_timezone

class ReportBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    report_type: Literal["call_summary", "agent_activity", "system_event", "performance_metric", "quality_assurance", "compliance", "custom"] = Field(...)
    frequency: Literal["on_demand", "daily", "weekly", "monthly", "quarterly"] = Field(default="on_demand")

class ReportCreate(ReportBase):
    data: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    status: Literal["pending", "processing", "completed", "failed"] = Field(default="pending")
    generated_by: Optional[UUID] = None
    generated_at: Optional[datetime] = None
    processing_time_ms: Optional[int] = None
    file_path: Optional[str] = Field(None, max_length=500)
    file_size: Optional[int] = None
    is_scheduled: Optional[bool] = False
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None

class ReportUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    report_type: Optional[Literal["call_summary", "agent_activity", "system_event", "performance_metric", "quality_assurance", "compliance", "custom"]] = None
    frequency: Optional[Literal["on_demand", "daily", "weekly", "monthly", "quarterly"]] = None
    data: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    status: Optional[Literal["pending", "processing", "completed", "failed"]] = None
    generated_by: Optional[UUID] = None
    generated_at: Optional[datetime] = None
    processing_time_ms: Optional[int] = None
    file_path: Optional[str] = Field(None, max_length=500)
    file_size: Optional[int] = None
    is_scheduled: Optional[bool] = None
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None

class ReportResponse(ReportBase):
    id: UUID
    data: Optional[Dict[str, Any]]
    filters: Optional[Dict[str, Any]]
    metrics: Optional[Dict[str, Any]]
    status: str
    generated_by: Optional[UUID]
    generated_at: Optional[datetime]
    processing_time_ms: Optional[int]
    file_path: Optional[str]
    file_size: Optional[int]
    is_scheduled: bool
    next_run: Optional[datetime]
    last_run: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    formatted_processing_time: str

    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)
    
    @field_serializer('generated_by')
    def serialize_generated_by(self, generated_by: UUID | None) -> str | None:
        return str(generated_by) if generated_by else None
    
    @field_serializer('generated_at')
    def serialize_generated_at(self, generated_at: datetime | None) -> str | None:
        return to_eat_timezone(generated_at)
    
    @field_serializer('next_run')
    def serialize_next_run(self, next_run: datetime | None) -> str | None:
        return to_eat_timezone(next_run)
    
    @field_serializer('last_run')
    def serialize_last_run(self, last_run: datetime | None) -> str | None:
        return to_eat_timezone(last_run)
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime) -> str:
        return to_eat_timezone(created_at)
    
    @field_serializer('updated_at')
    def serialize_updated_at(self, updated_at: datetime) -> str:
        return to_eat_timezone(updated_at)

    class Config:
        from_attributes = True

class PaginatedReports(BaseModel):
    reports: List[ReportResponse]
    total_reports: int
    total_pages: int
    current_page: int
    page_size: int