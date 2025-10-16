from fastapi import APIRouter, WebSocket, Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging
import json
from datetime import datetime, timedelta, timezone
import asyncio
from collections import defaultdict
from jose import jwt
from jose.exceptions import JWTError

from database import get_db
from crud.dashboard import dashboard_crud
from crud.agent import agent_crud
from crud.user import user_crud
from schemas.call import LiveCallResponse, HourlyCallStats
from schemas.agent import AgentFilters
from auth import get_current_user
from schemas.user import UserOut
from models.user import User
from api.websocket import manager
from api.redis_client import redis_client
from core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Throttle mechanism to prevent excessive messages
class MessageThrottle:
    def __init__(self, min_interval: float = 0.1):  # 100ms minimum interval
        self.min_interval = min_interval
        self.last_message_time = defaultdict(float)
        self.pending_messages = {}
        self.locks = defaultdict(asyncio.Lock)

    async def send_with_throttle(self, websocket: WebSocket, message: dict, message_key: str):
        """Send message with throttling to prevent excessive updates."""
        current_time = asyncio.get_event_loop().time()
        lock = self.locks[message_key]
        
        async with lock:
            last_time = self.last_message_time[message_key]
            elapsed = current_time - last_time
            
            if elapsed < self.min_interval:
                # Update pending message instead of sending immediately
                self.pending_messages[message_key] = message
            else:
                # Send the message and update the timestamp
                try:
                    await websocket.send_json(message)
                    self.last_message_time[message_key] = current_time
                    
                    # If there's a pending message, send it after the interval
                    if message_key in self.pending_messages:
                        # Schedule the pending message with a delay
                        pending_message = self.pending_messages.pop(message_key)
                        asyncio.create_task(self._send_delayed_message(
                            websocket, pending_message, message_key, current_time
                        ))
                except Exception:
                    # If sending fails, clear the pending message
                    self.pending_messages.pop(message_key, None)

    async def _send_delayed_message(self, websocket: WebSocket, message: dict, message_key: str, current_time: float):
        """Send a delayed message after the minimum interval."""
        await asyncio.sleep(self.min_interval)
        try:
            await websocket.send_json(message)
            self.last_message_time[message_key] = asyncio.get_event_loop().time()
        except Exception as e:
            logger.error(f"Error sending delayed message: {e}")

# Create a global throttle instance
message_throttle = MessageThrottle()

async def get_current_user_ws(websocket: WebSocket) -> UserOut:
    """Get current user from WebSocket connection using Bearer token."""
    # Extract Authorization header from WebSocket connection
    authorization = websocket.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        # Try to get the token from query parameters as fallback
        query_params = websocket.query_params
        token = query_params.get("token")
        if not token:
            await websocket.close(code=1001)  # 1001: Going away
            return None
    else:
        token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=1002)  # 1002: Protocol error
            return None
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        await websocket.close(code=1003)  # 1003: Unsupported data
        return None
    
    # Get user from database - properly handle the database session
    from database import engine
    from sqlalchemy.ext.asyncio import AsyncSession
    
    async with AsyncSession(engine) as db:
        user = await user_crud.get_user_by_email(db, email, current_user=None)
        if not user:
            await websocket.close(code=1008)  # 1008: Policy violation
            return None
        return UserOut.from_orm(user)

@router.websocket("/live-calls")
async def websocket_live_calls(
    websocket: WebSocket,
    designation: Optional[str] = None
):
    """WebSocket endpoint for live call updates."""
    await websocket.accept()
    
    # Authenticate the user
    current_user = await get_current_user_ws(websocket)
    if not current_user:
        # The authentication function already closed the connection
        return
    
    # Subscribe to both user-specific and general channels
    channels = [f"live_calls:{current_user.id}:{designation or 'all'}"]
    
    # Add general channels based on user role
    if current_user.role == "super-admin":
        channels.append(f"live_calls:general:super-admin")
    elif designation:
        channels.append(f"live_calls:general:{designation}")
    
    try:
        pubsub = redis_client.redis.pubsub()
        await pubsub.subscribe(*channels)  # Subscribe to multiple channels
        await websocket.send_json({"type": "connected", "message": "WebSocket connected"})
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    # Use call ID as the key to throttle updates for the same call
                    call_id = data.get("id", "unknown")
                    message_key = f"call_{call_id}"
                    await message_throttle.send_with_throttle(websocket, data, message_key)
                except json.JSONDecodeError:
                    logger.error("Failed to decode Redis message")
                except Exception as e:
                    logger.error(f"Error processing Redis message: {e}")
                
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=1000)
    finally:
        await pubsub.unsubscribe(*channels)
        await pubsub.close()

@router.websocket("/hourly-stats")
async def websocket_hourly_stats(
    websocket: WebSocket,
    designation: Optional[str] = None
):
    """WebSocket endpoint for hourly stats updates."""
    await websocket.accept()
    
    # Authenticate the user
    current_user = await get_current_user_ws(websocket)
    if not current_user:
        # The authentication function already closed the connection
        return
        
    # Import here to avoid circular imports
    from database import engine
    from sqlalchemy.ext.asyncio import AsyncSession
    
    async with AsyncSession(engine) as db:
        # Subscribe to both user-specific and general channels
        channels = [f"hourly_stats:{current_user.id}:{designation or 'all'}"]
        
        # Add general channels based on user role
        if current_user.role == "super-admin":
            channels.append(f"hourly_stats:general:super-admin")
        elif designation:
            channels.append(f"hourly_stats:general:{designation}")
        
        try:
            pubsub = redis_client.redis.pubsub()
            await pubsub.subscribe(*channels)
            await websocket.send_json({"type": "connected", "message": "WebSocket connected for hourly stats"})
            
            # Send initial hourly stats
            stats = await dashboard_crud.get_hourly_stats(db, current_user, designation)
            await websocket.send_json({
                "type": "hourly_stats",
                "data": [stat.model_dump() for stat in stats]
            })
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        # Use a unique key for stats to apply throttling
                        message_key = f"stats_{current_user.id}"
                        await message_throttle.send_with_throttle(websocket, data, message_key)
                    except json.JSONDecodeError:
                        logger.error("Failed to decode Redis message")
                    except Exception as e:
                        logger.error(f"Error processing Redis message: {e}")
                    
        except Exception as e:
            logger.error(f"WebSocket error in hourly_stats: {str(e)}")
            await websocket.close(code=1000)
        finally:
            await pubsub.unsubscribe(*channels)
            await pubsub.close()

@router.websocket("/agents")
async def websocket_agents(
    websocket: WebSocket,
    designation: Optional[str] = None
):
    """WebSocket endpoint for agent updates."""
    await websocket.accept()
    
    # Authenticate the user
    current_user = await get_current_user_ws(websocket)
    if not current_user:
        # The authentication function already closed the connection
        return
        
    # Import here to avoid circular imports
    from database import engine
    from sqlalchemy.ext.asyncio import AsyncSession
    
    async with AsyncSession(engine) as db:
        # Subscribe to both user-specific and general channels
        channels = [f"agents:{current_user.id}:{designation or 'all'}"]
        
        # Add general channels based on user role
        if current_user.role == "super-admin":
            channels.append(f"agents:general:super-admin")
        elif designation:
            channels.append(f"agents:general:{designation}")
        
        try:
            pubsub = redis_client.redis.pubsub()
            await pubsub.subscribe(*channels)
            await websocket.send_json({"type": "connected", "message": "WebSocket connected for agent updates"})
            
            # Send initial agent data
            page, size = 1, 100
            agents, _ = await agent_crud.get_agents_by_designation(db, designation or current_user.designation or "super-admin", page, size, AgentFilters())
            await websocket.send_json({
                "type": "agent_update",
                "data": [agent_crud._serialize_agent(agent) for agent in agents]
            })
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        # Use agent ID as the key to throttle updates for the same agent
                        agent_id = data.get("id", "unknown")
                        message_key = f"agent_{agent_id}"
                        await message_throttle.send_with_throttle(websocket, data, message_key)
                    except json.JSONDecodeError:
                        logger.error("Failed to decode Redis message")
                    except Exception as e:
                        logger.error(f"Error processing Redis message: {e}")
                    
        except Exception as e:
            logger.error(f"WebSocket error in agents: {str(e)}")
            await websocket.close(code=1000)
        finally:
            await pubsub.unsubscribe(*channels)
            await pubsub.close()