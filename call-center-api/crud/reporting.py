from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import List, Tuple, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from models.report import Report

class ReportCRUD:
    """CRUD operations for Report model"""
    
    async def create_report(
        self, 
        db: AsyncSession, 
        title: str,
        description: str,
        report_type: str,
        generated_by: UUID,
        data: Optional[Dict[Any, Any]] = None,
        filters: Optional[Dict[Any, Any]] = None,
        metrics: Optional[Dict[Any, Any]] = None,
        frequency: str = "on_demand"
    ) -> Report:
        """Create a new report"""
        report = Report(
            title=title,
            description=description,
            report_type=report_type,
            generated_by=generated_by,
            data=data,
            filters=filters,
            metrics=metrics,
            frequency=frequency
        )
        
        db.add(report)
        await db.commit()
        await db.refresh(report)
        
        return report
    
    async def get_report(self, db: AsyncSession, report_id: UUID) -> Optional[Report]:
        """Get report by ID"""
        query = select(Report).where(Report.id == report_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_reports_paginated(
        self,
        db: AsyncSession,
        page: int,
        size: int,
        report_type: Optional[str] = None,
        status: Optional[str] = None,
        generated_by: Optional[UUID] = None
    ) -> Tuple[List[Report], int]:
        """Get paginated reports with filters"""
        query = select(Report)
        count_query = select(func.count(Report.id))
        
        conditions = []
        
        if report_type:
            conditions.append(Report.report_type == report_type)
        if status:
            conditions.append(Report.status == status)
        if generated_by:
            conditions.append(Report.generated_by == generated_by)
            
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        query = query.order_by(desc(Report.created_at))
        query = query.offset((page - 1) * size).limit(size)
        
        result = await db.execute(query)
        reports = result.scalars().all()
        
        return reports, total
    
    async def update_report_status(
        self,
        db: AsyncSession,
        report_id: UUID,
        status: str,
        processing_time_ms: Optional[int] = None,
        file_path: Optional[str] = None,
        file_size: Optional[int] = None
    ) -> Optional[Report]:
        """Update report status and metadata"""
        report = await self.get_report(db, report_id)
        if not report:
            return None
            
        report.status = status
        report.processing_time_ms = processing_time_ms
        report.generated_at = datetime.utcnow()
        
        if file_path:
            report.file_path = file_path
        if file_size:
            report.file_size = file_size
            
        await db.commit()
        await db.refresh(report)
        
        return report
    
    async def delete_report(self, db: AsyncSession, report_id: UUID) -> bool:
        """Delete report"""
        report = await self.get_report(db, report_id)
        if not report:
            return False
            
        await db.delete(report)
        await db.commit()
        return True
    
report_crud=ReportCRUD()