from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Lead Identity
    customer_name = Column(String, nullable=False)
    associate_agent = Column(String)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    latest_loan = Column(String)
    business_address = Column(String, nullable=False)
   
    # Lead Management
    status = Column(String, default="new", index=True)  # Replaced LeadStatus
    priority = Column(String, default="medium", index=True)  # Replaced LeadPriority
    source = Column(String, default="other", index=True)  # Replaced LeadSource
    
    # Assignment
    assigned_agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), index=True)
    assigned_date = Column(DateTime(timezone=True))
    
    # Lead Scoring and Value
    lead_score = Column(Integer, default=0)
    estimated_value = Column(Float)
    probability = Column(Float)
    
    # Additional Information
    notes = Column(Text)
    tags = Column(JSONB)
    custom_fields = Column(JSONB)
        
    # Communication Preferences
    preferred_contact_method = Column(String, default="phone")
    best_time_to_call = Column(String)
    timezone = Column(String)
    do_not_call = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_activity = Column(DateTime(timezone=True))
    
    # Relationships
    assigned_agent = relationship("Agent", backref="assigned_leads")
    calls = relationship("Call", back_populates="lead", foreign_keys="Call.lead_id")
    
    def __repr__(self):
        return f"<Lead(id={self.id}, name={self.customer_name}, status={self.status})>"
    
    @property
    def contact_rate(self) -> float:
        """Calculate successful contact rate percentage"""
        # Assuming total_calls and successful_contacts are computed elsewhere
        total_calls = len(self.calls)
        successful_contacts = len([call for call in self.calls if call.status == "answered"])
        if total_calls == 0:
            return 0.0
        return (successful_contacts / total_calls) * 100
    
    @property
    def is_qualified(self) -> bool:
        """Check if lead is qualified"""
        return self.status in ["qualified", "proposal", "negotiation"]

    @property
    def days_since_last_contact(self) -> int:
        """Calculate days since last contact"""
        if not self.last_activity:
            return -1
        from datetime import datetime
        from zoneinfo import ZoneInfo
        delta = datetime.now(tz=ZoneInfo("Africa/Nairobi")) - self.last_activity
        return delta.days