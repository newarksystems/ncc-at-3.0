import asyncio
import logging
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from database import engine
from utils.activity_logger import activity_logger

logger = logging.getLogger(__name__)

class ActivityLogWorker:
    """Background worker for processing activity log queue"""
    
    def __init__(self):
        self.async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        self.running = False
    
    async def start(self):
        """Start the background worker"""
        self.running = True
        logger.info("Activity log worker started")
        
        while self.running:
            try:
                async with self.async_session() as db:
                    await activity_logger.process_queue(db)
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(5)  # Wait before retrying
    
    async def stop(self):
        """Stop the background worker"""
        self.running = False
        logger.info("Activity log worker stopped")

# Global worker instance
worker = ActivityLogWorker()

async def start_worker():
    """Start the activity log worker"""
    await worker.start()

async def stop_worker():
    """Stop the activity log worker"""
    await worker.stop()
