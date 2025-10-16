import asyncio
import json
import logging
from datetime import datetime
from functools import wraps
from typing import Any, Dict, Optional, Union
from uuid import UUID

from fastapi import BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.redis_client import redis_client
from crud.activity_log import activity_log_crud

logger = logging.getLogger(__name__)

class AsyncActivityLogger:
    """Non-blocking activity logger with Redis queue and background processing"""
    
    def __init__(self):
        self.queue_key = "activity_log_queue"
        self.retry_queue_key = "activity_log_retry_queue"
        self.max_retries = 3
    
    async def log_async(
        self,
        activity_type: str,
        description: str,
        actor_type: str = "user",
        actor_id: Optional[UUID] = None,
        actor_name: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[UUID] = None,
        target_name: Optional[str] = None,
        changes: Optional[Dict[Any, Any]] = None,
        context_data: Optional[Dict[Any, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: str = "info"
    ):
        """Queue activity log entry for background processing"""
        try:
            log_data = {
                "activity_type": activity_type,
                "description": description,
                "actor_type": actor_type,
                "actor_id": str(actor_id) if actor_id else None,
                "actor_name": actor_name,
                "target_type": target_type,
                "target_id": str(target_id) if target_id else None,
                "target_name": target_name,
                "changes": changes,
                "context_data": context_data,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "severity": severity,
                "timestamp": datetime.utcnow().isoformat(),
                "retry_count": 0
            }
            
            await redis_client.lpush(self.queue_key, json.dumps(log_data))
            
        except Exception as e:
            logger.error(f"Failed to queue activity log: {e}")
    
    def log_sync(self, background_tasks: BackgroundTasks, **kwargs):
        """Synchronous wrapper for FastAPI background tasks"""
        background_tasks.add_task(self._log_background, **kwargs)
    
    async def _log_background(self, **kwargs):
        """Background task wrapper"""
        await self.log_async(**kwargs)
    
    async def process_queue(self, db: AsyncSession):
        """Process queued activity logs"""
        try:
            while True:
                # Get log entry from queue
                log_json = await redis_client.brpop(self.queue_key, timeout=1)
                if not log_json:
                    continue
                
                try:
                    log_data = json.loads(log_json[1])
                    
                    # Convert string UUIDs back to UUID objects
                    if log_data.get("actor_id"):
                        log_data["actor_id"] = UUID(log_data["actor_id"])
                    if log_data.get("target_id"):
                        log_data["target_id"] = UUID(log_data["target_id"])
                    
                    # Remove timestamp and retry_count from log_data
                    log_data.pop("timestamp", None)
                    retry_count = log_data.pop("retry_count", 0)
                    
                    # Save to database
                    await activity_log_crud.log_activity(db=db, **log_data)
                    
                except Exception as e:
                    logger.error(f"Failed to process activity log: {e}")
                    
                    # Retry logic
                    if retry_count < self.max_retries:
                        log_data["retry_count"] = retry_count + 1
                        await redis_client.lpush(self.retry_queue_key, json.dumps(log_data))
                    else:
                        logger.error(f"Max retries exceeded for activity log: {log_data}")
                        
        except Exception as e:
            logger.error(f"Queue processor error: {e}")

# Global instance
activity_logger = AsyncActivityLogger()

def log_activity(
    activity_type: str,
    description: str = None,
    target_type: str = None,
    severity: str = "info"
):
    """Decorator for automatic activity logging on CRUD operations"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Extract common parameters
            db = kwargs.get('db') or (args[1] if len(args) > 1 else None)
            background_tasks = kwargs.get('background_tasks')
            request = kwargs.get('request')
            
            # Get user info from request if available
            actor_id = None
            actor_name = "System"
            ip_address = None
            user_agent = None
            
            if request and hasattr(request, 'state') and hasattr(request.state, 'user'):
                user = request.state.user
                actor_id = user.id
                actor_name = user.name or user.email
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
            
            try:
                # Execute the original function
                result = await func(*args, **kwargs)
                
                # Log successful operation
                log_desc = description or f"{func.__name__} executed successfully"
                
                # Extract target info from result if it's a model instance
                target_id = None
                target_name = None
                if hasattr(result, 'id'):
                    target_id = result.id
                    target_name = getattr(result, 'name', None) or str(result.id)
                
                if background_tasks:
                    activity_logger.log_sync(
                        background_tasks,
                        activity_type=activity_type,
                        description=log_desc,
                        actor_id=actor_id,
                        actor_name=actor_name,
                        target_type=target_type,
                        target_id=target_id,
                        target_name=target_name,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        severity=severity
                    )
                else:
                    # Fallback to async logging
                    asyncio.create_task(activity_logger.log_async(
                        activity_type=activity_type,
                        description=log_desc,
                        actor_id=actor_id,
                        actor_name=actor_name,
                        target_type=target_type,
                        target_id=target_id,
                        target_name=target_name,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        severity=severity
                    ))
                
                return result
                
            except Exception as e:
                # Log failed operation
                error_desc = f"{func.__name__} failed: {str(e)}"
                
                if background_tasks:
                    activity_logger.log_sync(
                        background_tasks,
                        activity_type=f"{activity_type}_failed",
                        description=error_desc,
                        actor_id=actor_id,
                        actor_name=actor_name,
                        target_type=target_type,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        severity="error"
                    )
                else:
                    asyncio.create_task(activity_logger.log_async(
                        activity_type=f"{activity_type}_failed",
                        description=error_desc,
                        actor_id=actor_id,
                        actor_name=actor_name,
                        target_type=target_type,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        severity="error"
                    ))
                
                raise
        
        return async_wrapper
    return decorator

# Convenience functions for common operations
async def log_call_activity(
    activity_type: str,
    call_id: UUID,
    description: str,
    actor_id: Optional[UUID] = None,
    actor_name: str = "System",
    changes: Optional[Dict] = None,
    **kwargs
):
    """Log call-related activity"""
    await activity_logger.log_async(
        activity_type=activity_type,
        description=description,
        actor_id=actor_id,
        actor_name=actor_name,
        target_type="call",
        target_id=call_id,
        changes=changes,
        **kwargs
    )

async def log_agent_activity(
    activity_type: str,
    agent_id: UUID,
    description: str,
    actor_id: Optional[UUID] = None,
    actor_name: str = "System",
    changes: Optional[Dict] = None,
    **kwargs
):
    """Log agent-related activity"""
    await activity_logger.log_async(
        activity_type=activity_type,
        description=description,
        actor_id=actor_id,
        actor_name=actor_name,
        target_type="agent",
        target_id=agent_id,
        changes=changes,
        **kwargs
    )

async def log_system_event(
    activity_type: str,
    description: str,
    severity: str = "info",
    **kwargs
):
    """Log system events"""
    await activity_logger.log_async(
        activity_type=activity_type,
        description=description,
        actor_type="system",
        actor_name="System",
        severity=severity,
        **kwargs
    )
