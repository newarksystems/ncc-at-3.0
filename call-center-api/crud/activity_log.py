from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import List, Tuple, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import logging

from models.activity_log import ActivityLog

logger = logging.getLogger(__name__)

class ActivityLogCRUD:
    """CRUD operations for ActivityLog model"""
    
    async def log_activity(
        self,
        db: AsyncSession,
        activity_type: str,
        actor_type: str,
        actor_id: Optional[UUID],
        actor_name: str,
        description: str,
        target_type: Optional[str] = None,
        target_id: Optional[UUID] = None,
        target_name: Optional[str] = None,
        changes: Optional[Dict[Any, Any]] = None,
        context_data: Optional[Dict[Any, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: str = "info"
    ) -> ActivityLog:
        """Log a new activity - optimized for background processing"""
        try:
            activity = ActivityLog(
                activity_type=activity_type,
                description=description,
                actor_type=actor_type,
                actor_id=actor_id,
                actor_name=actor_name,
                target_type=target_type,
                target_id=target_id,
                target_name=target_name,
                changes=changes,
                context_data=context_data,
                ip_address=ip_address,
                user_agent=user_agent,
                severity=severity
            )
            
            db.add(activity)
            await db.commit()
            await db.refresh(activity)
            
            return activity
            
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
            await db.rollback()
            raise
    
    async def get_activity_logs_paginated(
        self,
        db: AsyncSession,
        page: int,
        size: int,
        activity_type: Optional[str] = None,
        actor_type: Optional[str] = None,
        actor_id: Optional[UUID] = None,
        target_type: Optional[str] = None,
        target_id: Optional[UUID] = None,
        severity: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[ActivityLog], int]:
        """Get paginated activity logs with filters"""
        query = select(ActivityLog)
        count_query = select(func.count(ActivityLog.id))
        
        conditions = []
        
        if activity_type:
            conditions.append(ActivityLog.activity_type == activity_type)
        if actor_type:
            conditions.append(ActivityLog.actor_type == actor_type)
        if actor_id:
            conditions.append(ActivityLog.actor_id == actor_id)
        if target_type:
            conditions.append(ActivityLog.target_type == target_type)
        if target_id:
            conditions.append(ActivityLog.target_id == target_id)
        if severity:
            conditions.append(ActivityLog.severity == severity)
        if start_date:
            conditions.append(ActivityLog.timestamp >= start_date)
        if end_date:
            conditions.append(ActivityLog.timestamp <= end_date)
            
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        query = query.order_by(desc(ActivityLog.timestamp))
        query = query.offset((page - 1) * size).limit(size)
        
        result = await db.execute(query)
        activities = result.scalars().all()
        
        return activities, total
    
    async def get_recent_activities(
        self,
        db: AsyncSession,
        limit: int = 50,
        actor_id: Optional[UUID] = None
    ) -> List[ActivityLog]:
        """Get recent activities with optional actor filter"""
        query = select(ActivityLog)
        
        if actor_id:
            query = query.where(ActivityLog.actor_id == actor_id)
            
        query = query.order_by(desc(ActivityLog.timestamp)).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_activities_by_date_range(
        self,
        db: AsyncSession,
        start_date: datetime,
        end_date: datetime,
        activity_type: Optional[str] = None
    ) -> List[ActivityLog]:
        """Get activities within a date range"""
        query = select(ActivityLog).where(
            and_(
                ActivityLog.timestamp >= start_date,
                ActivityLog.timestamp <= end_date
            )
        )
        
        if activity_type:
            query = query.where(ActivityLog.activity_type == activity_type)
            
        query = query.order_by(ActivityLog.timestamp)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_activity_summary(
        self,
        db: AsyncSession,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get activity summary for the last N days"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        total_query = select(func.count(ActivityLog.id)).where(
            ActivityLog.timestamp >= start_date
        )
        total_result = await db.execute(total_query)
        total_activities = total_result.scalar()
        
        type_query = select(
            ActivityLog.activity_type,
            func.count(ActivityLog.id)
        ).where(
            ActivityLog.timestamp >= start_date
        ).group_by(ActivityLog.activity_type)
        
        type_result = await db.execute(type_query)
        activities_by_type = dict(type_result.all())
        
        severity_query = select(
            ActivityLog.severity,
            func.count(ActivityLog.id)
        ).where(
            ActivityLog.timestamp >= start_date
        ).group_by(ActivityLog.severity)
        
        severity_result = await db.execute(severity_query)
        activities_by_severity = dict(severity_result.all())
        
        daily_query = select(
            func.date(ActivityLog.timestamp),
            func.count(ActivityLog.id)
        ).where(
            ActivityLog.timestamp >= start_date
        ).group_by(func.date(ActivityLog.timestamp)).order_by(func.date(ActivityLog.timestamp))
        
        daily_result = await db.execute(daily_query)
        daily_activities = dict(daily_result.all())
        
        return {
            "total_activities": total_activities,
            "activities_by_type": activities_by_type,
            "activities_by_severity": activities_by_severity,
            "daily_activities": daily_activities,
            "period_days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    
    async def cleanup_old_activities(
        self,
        db: AsyncSession,
        days_to_keep: int = 90
    ) -> int:
        """Clean up old activity logs to maintain performance"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Count activities to be deleted
        count_query = select(func.count(ActivityLog.id)).where(
            ActivityLog.timestamp < cutoff_date
        )
        count_result = await db.execute(count_query)
        count_to_delete = count_result.scalar()
        
        if count_to_delete > 0:
            # Delete old activities
            delete_query = ActivityLog.__table__.delete().where(
                ActivityLog.timestamp < cutoff_date
            )
            await db.execute(delete_query)
            await db.commit()
            
            logger.info(f"Cleaned up {count_to_delete} old activity logs")
        
        return count_to_delete

activity_log_crud = ActivityLogCRUD()