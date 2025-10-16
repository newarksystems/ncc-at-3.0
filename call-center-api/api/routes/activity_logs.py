from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import logging

from database import get_db
from crud.activity_log import activity_log_crud
from schemas.activity_log import ActivityLogCreate, ActivityLogResponse, PaginatedActivityLogs

router = APIRouter()

@router.get("/", response_model=PaginatedActivityLogs)
async def get_activity_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    activity_type: Optional[str] = Query(None, description="Filter by activity type (e.g., 'call_created', 'user_login')"),
    actor_type: Optional[str] = None,
    actor_id: Optional[UUID] = None,
    target_type: Optional[str] = None,
    target_id: Optional[UUID] = None,
    severity: Optional[str] = Query(None, description="Filter by severity (e.g., 'info', 'warning')"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of activity logs with optional filters"""
    try:
        activities, total = await activity_log_crud.get_activity_logs_paginated(
            db, page, size, activity_type, actor_type, actor_id, target_type, target_id, severity, start_date, end_date
        )
        total_pages = (total + size - 1) // size
        
        return PaginatedActivityLogs(
            activity_logs=[ActivityLogResponse.model_validate(activity) for activity in activities],
            total_activity_logs=total,
            total_pages=total_pages,
            current_page=page,
            page_size=size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity logs: {str(e)}")

@router.get("/recent", response_model=List[ActivityLogResponse])
async def get_recent_activities(
    limit: int = Query(50, ge=1, le=100),
    actor_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get recent activity logs with optional actor filter"""
    try:
        activities = await activity_log_crud.get_recent_activities(db, limit, actor_id)
        return [ActivityLogResponse.model_validate(activity) for activity in activities]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent activities: {str(e)}")

@router.get("/summary", response_model=Dict[str, Any])
async def get_activity_summary(
    days: int = Query(30, ge=1),
    db: AsyncSession = Depends(get_db)
):
    """Get activity summary for the last N days"""
    try:
        summary = await activity_log_crud.get_activity_summary(db, days)
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity summary: {str(e)}")

@router.post("/", response_model=ActivityLogResponse)
async def log_activity(
    activity_data: ActivityLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """Log a new activity"""
    try:
        activity = await activity_log_crud.log_activity(
            db,
            activity_type=activity_data.activity_type,
            actor_type=activity_data.actor_type,
            actor_id=activity_data.actor_id,
            actor_name=activity_data.actor_name,
            description=activity_data.description,
            target_type=activity_data.target_type,
            target_id=activity_data.target_id,
            target_name=activity_data.target_name,
            changes=activity_data.changes,
            context_data=activity_data.context_data,
            ip_address=activity_data.ip_address,
            user_agent=activity_data.user_agent,
            severity=activity_data.severity
        )
        
        return ActivityLogResponse.model_validate(activity)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging activity: {str(e)}")