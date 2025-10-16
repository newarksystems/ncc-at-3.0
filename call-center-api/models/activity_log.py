from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Activity Info
    activity_type = Column(String, nullable=False, index=True)  # Replaced ActivityType
    description = Column(Text)
    
    # Actor Info
    actor_type = Column(String, index=True)
    actor_id = Column(UUID(as_uuid=True), index=True)
    actor_name = Column(String)
    
    # Target Info
    target_type = Column(String, index=True)
    target_id = Column(UUID(as_uuid=True), index=True)
    target_name = Column(String)
    
    # Changes
    changes = Column(JSONB)
    
    # Additional Context
    context_data = Column(JSONB, name="metadata")
    ip_address = Column(String)
    user_agent = Column(String)
    
    # Severity
    severity = Column(String, default="info", index=True)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<ActivityLog(id={self.id}, type={self.activity_type}, actor={self.actor_name})>"
    
    @property
    def is_security_related(self) -> bool:
        """Check if this activity is security-related"""
        return self.activity_type in [
            "security_login_attempt",
            "security_login_failure",
            "security_password_change"
        ]
    
    @property
    def is_system_event(self) -> bool:
        """Check if this activity is a system event"""
        return self.activity_type in [
            "system_startup",
            "system_shutdown",
            "system_error",
            "system_warning"
        ]