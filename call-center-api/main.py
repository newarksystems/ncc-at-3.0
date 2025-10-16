from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from contextlib import asynccontextmanager
import asyncio
from typing import List
import logging
from dotenv import load_dotenv
from database import engine

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from api.websocket import manager
from crud.dashboard import dashboard_crud
from models.user import User
from schemas.user import UserOut
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
import json

# Load environment variables
load_dotenv()

from api.routes import calls, agents, leads, dashboard, auth, reporting, users, activity_logs, websocket_route, africastalking_calls, webhooks, call_streaming
from database import init_db
from api.websocket import ConnectionManager
from api.redis_client import redis_client
from services.activity_worker import start_worker, stop_worker
from middleware.activity_context import ActivityContextMiddleware
from tasks.cleanup_tasks import cleanup_tasks

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# WebSocket connection manager
manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Call Center API...")
    await init_db()
    logger.info("Database initialized")
    # Initialize Redis connection
    await redis_client.connect()
    logger.info("Redis initialized")
    
    # Start activity log worker
    worker_task = asyncio.create_task(start_worker())
    logger.info("Activity log worker started")
    
    yield
    
    # Shutdown
    await stop_worker()
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass
    logger.info("Activity log worker stopped")
    
    await redis_client.disconnect()
    logger.info("Redis connection closed")
    logger.info("Shutting down Call Center API...")

app = FastAPI(
    title="Call Center API",
    description="Scalable FastAPI backend for call center management with 3CX integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Activity context middleware
app.add_middleware(ActivityContextMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(activity_logs.router, prefix="/api/activity-logs", tags=["ActivityLogs"])
app.include_router(reporting.router, prefix="/api/reporting", tags=["Reporting"])
app.include_router(websocket_route.router, prefix="/api/ws", tags=["WebSockets"])
app.include_router(africastalking_calls.router, prefix="/api", tags=["Africa's Talking"])
app.include_router(call_streaming.router, prefix="/api", tags=["Call Streaming"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

@app.get("/")
async def root():
    return {"message": "Call Center API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "call-center-api"}



def setup_hourly_stats_scheduler(app: FastAPI):
    scheduler = AsyncIOScheduler(timezone="Africa/Nairobi")

    async def publish_hourly_stats():
        async with app.state.db() as db:
            try:
                for client_id, subscriptions in manager.user_subscriptions.items():
                    if "hourly_stats" in subscriptions:
                        user_id = client_id.replace("user-", "")
                        result = await db.execute(select(User).filter(User.id == user_id))
                        user = result.scalar_one_or_none()
                        if not user:
                            continue
                        designations = [None]
                        if user.designation:
                            designations.append(user.designation)
                        for designation in designations:
                            stats = await dashboard_crud.get_hourly_stats(
                                db, UserOut.model_validate(user), designation
                            )
                            message = {
                                "type": "hourly_stats",
                                "data": [stat.model_dump() for stat in stats]
                            }
                            channel = f"hourly_stats:{user.id}:{designation or 'all'}"
                            await redis_client.publish(channel, json.dumps(message))
                            logger.info(f"Published hourly stats to {channel}")
            except Exception as e:
                logger.error(f"Error publishing hourly stats: {str(e)}")

    scheduler.add_job(
        lambda: asyncio.create_task(publish_hourly_stats()),
        "interval",
        hours=1,
        next_run_time=datetime.now(tz=scheduler.timezone) + timedelta(minutes=1),
    )
    scheduler.start()
    app.state.scheduler = scheduler

def setup_cleanup_scheduler():
    """Setup cleanup tasks scheduler"""
    scheduler = AsyncIOScheduler(timezone="Africa/Nairobi")
    
    # Daily cleanup at 2 AM
    scheduler.add_job(
        lambda: asyncio.create_task(cleanup_tasks.cleanup_old_activity_logs()),
        "cron",
        hour=2,
        minute=0
    )
    
    # Weekly database optimization on Sunday at 3 AM
    scheduler.add_job(
        lambda: asyncio.create_task(cleanup_tasks.optimize_database()),
        "cron",
        day_of_week=6,  # Sunday
        hour=3,
        minute=0
    )
    
    scheduler.start()
    return scheduler

@app.on_event("startup")
async def startup_event():
    app.state.db = async_session
    setup_hourly_stats_scheduler(app)
    app.state.cleanup_scheduler = setup_cleanup_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    await engine.dispose()
    app.state.scheduler.shutdown(wait=False)
    if hasattr(app.state, 'cleanup_scheduler'):
        app.state.cleanup_scheduler.shutdown(wait=False)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
