import uuid
from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_type = Column(String, nullable=True)
    group = Column(String, nullable=True)
    region = Column(String, nullable=True)
    status = Column(String, default="offline", index=True)
    last_status_change = Column(DateTime(timezone=True), server_default=func.now())
    is_logged_in = Column(Boolean, default=False, index=True)
    login_time = Column(DateTime(timezone=True))
    last_activity = Column(DateTime(timezone=True))
    total_calls_today = Column(Integer, default=0)
    answered_calls_today = Column(Integer, default=0)
    missed_calls_today = Column(Integer, default=0)
    total_talk_time_today = Column(Integer, default=0)
    total_calls = Column(Integer, default=0)
    answered_calls = Column(Integer, default=0)
    missed_calls = Column(Integer, default=0)
    total_talk_time = Column(Integer, default=0)
    average_call_duration = Column(Float, default=0.0)
    assigned_queues = Column(JSONB)
    skills = Column(JSONB)
    languages = Column(JSONB)
    max_concurrent_calls = Column(Integer, default=1)
    auto_answer = Column(Boolean, default=False)
    call_recording_enabled = Column(Boolean, default=True)
    department = Column(String)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    notes = Column(String)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="agent")
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    calls = relationship("Call", back_populates="agent")

    def __repr__(self):
        return f"<Agent(id={self.id}, user_id={self.user_id})>"

    @property
    def full_name(self) -> str:
        return self.user.full_name if self.user else ""

    @property
    def answer_rate(self) -> float:
        if self.total_calls == 0:
            return 0.0
        return (self.answered_calls / self.total_calls) * 100

    @property
    def answer_rate_today(self) -> float:
        if self.total_calls_today == 0:
            return 0.0
        return (self.answered_calls_today / self.total_calls_today) * 100

    @property
    def is_available(self) -> bool:
        return self.status == "available" and self.is_logged_in

    @property
    def average_talk_time_formatted(self) -> str:
        if not self.average_call_duration:
            return "00:00"
        minutes = int(self.average_call_duration) // 60
        seconds = int(self.average_call_duration) % 60
        return f"{minutes:02d}:{seconds:02d}"
