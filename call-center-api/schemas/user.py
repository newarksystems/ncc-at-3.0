from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional, Literal, List
from uuid import UUID
from datetime import datetime
from core.utils import to_eat_timezone

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    personal_phone: Optional[str] = None
    password: str
    role: Optional[Literal["super-admin", "admin", "agent", "viewer"]] = "viewer"
    status: Optional[Literal["active", "disabled", "former"]] = "active"
    designation: Optional[Literal["call-center-admin", "marketing-admin", "compliance-admin"]] = None
    is_verified: bool = False
    # VoIP credentials
    sip_username: Optional[str] = None
    sip_password: Optional[str] = None
    extension: Optional[str] = None

class UserOut(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    personal_phone: str
    role: str
    status: str
    designation: Optional[str]
    is_verified: bool
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)
    
    @field_serializer('last_login')
    def serialize_last_login(self, last_login: datetime | None) -> str | None:
        return to_eat_timezone(last_login)
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime) -> str:
        return to_eat_timezone(created_at)
    
    @field_serializer('updated_at')
    def serialize_updated_at(self, updated_at: datetime) -> str:
        return to_eat_timezone(updated_at)

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    personal_phone: Optional[str] = None
    role: Optional[Literal["super-admin", "admin", "agent", "viewer"]] = None
    status: Optional[Literal["active", "disabled", "former"]] = None
    designation: Optional[Literal["call-center-admin", "marketing-admin", "compliance-admin"]] = None
    is_verified: Optional[bool] = None
    # VoIP credentials
    sip_username: Optional[str] = None
    sip_password: Optional[str] = None
    extension: Optional[str] = None

class PaginatedUsers(BaseModel):
    users: List[UserOut]
    total_users: int
    total_pages: int
    current_page: int
    page_size: int