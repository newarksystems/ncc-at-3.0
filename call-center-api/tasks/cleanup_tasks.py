import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from database import engine
from crud.activity_log import activity_log_crud
from utils.activity_logger import log_system_event

logger = logging.getLogger(__name__)

class CleanupTasks:
    """Background cleanup tasks for maintaining system performance"""
    
    def __init__(self):
        self.async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async def cleanup_old_activity_logs(self, days_to_keep: int = 90):
        """Clean up old activity logs"""
        try:
            async with self.async_session() as db:
                deleted_count = await activity_log_crud.cleanup_old_activities(db, days_to_keep)
                
                if deleted_count > 0:
                    await log_system_event(
                        activity_type="system_cleanup",
                        description=f"Cleaned up {deleted_count} old activity logs (older than {days_to_keep} days)",
                        severity="info",
                        context_data={"deleted_count": deleted_count, "days_to_keep": days_to_keep}
                    )
                    
                logger.info(f"Activity log cleanup completed: {deleted_count} records deleted")
                
        except Exception as e:
            logger.error(f"Activity log cleanup failed: {e}")
            await log_system_event(
                activity_type="system_cleanup_failed",
                description=f"Activity log cleanup failed: {str(e)}",
                severity="error"
            )
    
    async def optimize_database(self):
        """Run database optimization tasks"""
        try:
            async with self.async_session() as db:
                # Run VACUUM ANALYZE on activity_logs table (PostgreSQL specific)
                await db.execute("VACUUM ANALYZE activity_logs")
                await db.commit()
                
                await log_system_event(
                    activity_type="system_optimization",
                    description="Database optimization completed",
                    severity="info"
                )
                
                logger.info("Database optimization completed")
                
        except Exception as e:
            logger.error(f"Database optimization failed: {e}")
            await log_system_event(
                activity_type="system_optimization_failed",
                description=f"Database optimization failed: {str(e)}",
                severity="error"
            )

# Global instance
cleanup_tasks = CleanupTasks()
