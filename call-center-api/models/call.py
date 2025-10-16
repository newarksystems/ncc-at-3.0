from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base

class Call(Base):
    __tablename__ = "calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Africa's Talking Call Information
    at_session_id = Column(String, unique=True, index=True)  # AT session ID
    at_call_id = Column(String, index=True)  # AT call ID
    
    # Call Details
    caller_number = Column(String, nullable=False, index=True)
    callee_number = Column(String, nullable=False, index=True)
    
    # Status
    status = Column(String, default="queued", index=True)
    
    # Direction
    direction = Column(String, default="outbound", index=True)
    
    # Timing
    call_start = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    call_answered = Column(DateTime(timezone=True))
    call_end = Column(DateTime(timezone=True))
    
    # Duration
    total_duration = Column(Integer, default=0)
    
    # Agent Information
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), index=True)
    
    # Additional Data
    description = Column(Text)
    
    # Lead Information
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    agent = relationship("Agent", back_populates="calls", foreign_keys=[agent_id])
    lead = relationship("Lead", back_populates="calls", foreign_keys=[lead_id])
    
    def __repr__(self):
        return f"<Call(id={self.id}, caller={self.caller_number}, status={self.status})>"
    
    @property
    def is_active(self) -> bool:
        """Check if call is currently active"""
        return self.status in ["queued", "ringing", "in-progress"]
    
    @property
    def formatted_duration(self) -> str:
        """Format duration as MM:SS"""
        if not self.total_duration:
            return "00:00"
        minutes = self.total_duration // 60
        seconds = self.total_duration % 60
        return f"{minutes:02d}:{seconds:02d}"
