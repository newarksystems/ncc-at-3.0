from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
import logging

from database import get_db
from crud.reporting import ReportCRUD
from schemas.reporting import ReportCreate, ReportUpdate, ReportResponse, PaginatedReports

router = APIRouter()
report_crud = ReportCRUD()

@router.get("/", response_model=PaginatedReports)
async def get_reports(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    report_type: Optional[str] = Query(None, description="Filter by report type (e.g., 'call_summary', 'agent_activity')"),
    status: Optional[str] = Query(None, description="Filter by report status (e.g., 'pending', 'completed')"),
    generated_by: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of reports with optional filters"""
    try:
        reports, total = await report_crud.get_reports_paginated(db, page, size, report_type, status, generated_by)
        total_pages = (total + size - 1) // size
        
        return PaginatedReports(
            reports=[ReportResponse.model_validate(report) for report in reports],
            total_reports=total,
            total_pages=total_pages,
            current_page=page,
            page_size=size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get specific report by ID"""
    report = await report_crud.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.model_validate(report)

@router.post("/", response_model=ReportResponse)
async def create_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new report"""
    try:
        report = await report_crud.create_report(
            db,
            title=report_data.title,
            description=report_data.description,
            report_type=report_data.report_type,
            generated_by=report_data.generated_by,
            data=report_data.data,
            filters=report_data.filters,
            metrics=report_data.metrics,
            frequency=report_data.frequency
        )
        
        return ReportResponse.model_validate(report)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating report: {str(e)}")

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: UUID,
    report_data: ReportUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update existing report status and metadata"""
    try:
        report = await report_crud.update_report_status(
            db,
            report_id,
            status=report_data.status,
            processing_time_ms=report_data.processing_time_ms,
            file_path=report_data.file_path,
            file_size=report_data.file_size
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        return ReportResponse.model_validate(report)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating report: {str(e)}")

@router.delete("/{report_id}")
async def delete_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete report"""
    success = await report_crud.delete_report(db, report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted successfully"}