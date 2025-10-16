from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Report Identity
    title = Column(String, nullable=False)
    description = Column(Text)
    report_type = Column(String, nullable=False, index=True)  # Replaced ReportType
    frequency = Column(String, default="on_demand", index=True)  # Replaced ReportFrequency
    
    # Report Content
    data = Column(JSONB)
    filters = Column(JSONB)
    metrics = Column(JSONB)
    
    # Generation Info
    status = Column(String, default="pending", index=True)  # Replaced ReportStatus
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    generated_at = Column(DateTime(timezone=True))
    processing_time_ms = Column(Integer)
    
    # File Storage
    file_path = Column(String)
    file_size = Column(Integer)
    
    # Scheduling
    is_scheduled = Column(Boolean, default=False)
    next_run = Column(DateTime(timezone=True))
    last_run = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[generated_by])
    
    def __repr__(self):
        return f"<Report(id={self.id}, title='{self.title}', type={self.report_type})>"
    
    @property
    def formatted_processing_time(self) -> str:
        """Format processing time in human-readable format"""
        if not self.processing_time_ms:
            return "N/A"
        if self.processing_time_ms < 1000:
            return f"{self.processing_time_ms}ms"
        seconds = self.processing_time_ms / 1000
        if seconds < 60:
            return f"{seconds:.2f}s"
        minutes = seconds / 60
        return f"{minutes:.2f}m"