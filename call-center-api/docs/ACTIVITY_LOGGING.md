# Activity Logging System

A high-performance, non-blocking activity logging system for comprehensive audit trails across the call center API.

## Features

- **Non-blocking**: Uses Redis queue and background processing
- **Silent failures**: Never blocks main application flow
- **Auto-scaling**: Handles high activity volumes without performance impact
- **Decorator support**: Easy integration with existing CRUD operations
- **Automatic cleanup**: Maintains performance with scheduled maintenance
- **Request context**: Automatically captures IP, user agent, and user info

## Quick Start

### 1. Decorator Usage (Recommended)

```python
from utils.activity_logger import log_activity
from fastapi import BackgroundTasks, Request

class CallCRUD:
    @log_activity(
        activity_type="call_created",
        description="New call record created",
        target_type="call"
    )
    async def create_call(
        self,
        db: AsyncSession,
        call_data: CallCreate,
        background_tasks: BackgroundTasks = None,
        request: Request = None
    ) -> Call:
        # Your existing logic
        call = Call(**call_data.model_dump())
        db.add(call)
        await db.commit()
        return call
```

### 2. Manual Logging

```python
from utils.activity_logger import log_call_activity, activity_logger

# Background task approach
background_tasks.add_task(
    log_call_activity,
    activity_type="call_hangup",
    call_id=call_id,
    description="Call ended by agent",
    actor_id=agent_id
)

# Direct async approach
await activity_logger.log_async(
    activity_type="system_event",
    description="System maintenance started",
    actor_type="system",
    severity="info"
)
```

### 3. FastAPI Route Integration

```python
@router.post("/calls/")
async def create_call(
    call_data: CallCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    crud = CallCRUD()
    return await crud.create_call(
        db=db,
        call_data=call_data,
        background_tasks=background_tasks,
        request=request
    )
```

## Architecture

### Components

1. **AsyncActivityLogger**: Core logging class with Redis queue
2. **ActivityLogWorker**: Background processor for queued logs
3. **ActivityContextMiddleware**: Automatic request context capture
4. **CleanupTasks**: Scheduled maintenance for performance

### Flow

```
API Request → Middleware (context) → CRUD (decorator/manual) → Redis Queue → Background Worker → Database
```

### Performance Features

- **Redis Queue**: Prevents database blocking
- **Background Processing**: Separate worker thread
- **Retry Logic**: Failed logs are retried up to 3 times
- **Automatic Cleanup**: Old logs cleaned up daily
- **Database Optimization**: Weekly VACUUM ANALYZE

## Configuration

### Environment Variables

```bash
REDIS_URL=redis://localhost:6379/0
ACTIVITY_LOG_RETENTION_DAYS=90  # Optional, defaults to 90
```

### Scheduler Configuration

- **Activity Log Cleanup**: Daily at 2:00 AM
- **Database Optimization**: Weekly on Sunday at 3:00 AM

## Activity Types

### Standard Types

- `call_created`, `call_updated`, `call_ended`
- `agent_status_changed`, `agent_login`, `agent_logout`
- `lead_created`, `lead_updated`, `lead_converted`
- `user_login`, `user_logout`, `user_created`
- `system_startup`, `system_shutdown`, `system_error`
- `api_request`, `api_error`

### Severity Levels

- `info`: Normal operations
- `warning`: Important events or slow requests
- `error`: Failures and exceptions

## Monitoring

### Health Checks

The system includes automatic monitoring:

- Failed log attempts are retried
- System events are logged for maintenance
- Performance metrics are captured

### Querying Activity Logs

```python
# Get recent activities
activities = await activity_log_crud.get_recent_activities(db, limit=100)

# Get activities by date range
activities = await activity_log_crud.get_activities_by_date_range(
    db, start_date, end_date, activity_type="call_created"
)

# Get activity summary
summary = await activity_log_crud.get_activity_summary(db, days=30)
```

## Best Practices

### 1. Use Decorators for CRUD Operations

```python
@log_activity("resource_updated", target_type="resource")
async def update_resource(self, db, resource_id, data, **kwargs):
    # Implementation
```

### 2. Include Background Tasks in Routes

```python
async def api_endpoint(
    background_tasks: BackgroundTasks,
    request: Request,
    # other params
):
    # Your logic
```

### 3. Log Important State Changes

```python
# Log status transitions
await log_agent_activity(
    "agent_status_changed",
    agent_id=agent.id,
    description=f"Status changed from {old_status} to {new_status}",
    changes={"status": {"old": old_status, "new": new_status}}
)
```

### 4. Use Appropriate Severity Levels

- `info`: Regular operations
- `warning`: Important events, slow requests (>2s)
- `error`: Failures, exceptions

## Troubleshooting

### Common Issues

1. **Redis Connection**: Ensure Redis is running and accessible
2. **Queue Backup**: Monitor Redis queue length
3. **Worker Status**: Check worker logs for processing errors

### Monitoring Commands

```bash
# Check Redis queue length
redis-cli LLEN activity_log_queue

# Monitor worker logs
docker logs -f call-center-api | grep "Activity log worker"

# Check database activity log count
SELECT COUNT(*) FROM activity_logs WHERE timestamp > NOW() - INTERVAL '1 day';
```

## Performance Considerations

- **Queue Size**: Monitor Redis memory usage
- **Retention**: Adjust cleanup schedule based on compliance needs
- **Worker Scaling**: Can run multiple workers if needed
- **Database Indexing**: Ensure proper indexes on timestamp, actor_id, target_id

The system is designed to handle thousands of activities per minute without impacting API performance.
