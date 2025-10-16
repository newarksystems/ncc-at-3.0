from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
import json
import logging
import time
from datetime import datetime

from database import get_db
from models.call import Call
from models.agent import Agent
from services.africastalking_service import africastalking_service
from auth import get_current_user
from api.websocket import ConnectionManager
from pydantic import BaseModel

router = APIRouter(prefix="/calls", tags=["Call Streaming"])
logger = logging.getLogger(__name__)

# WebSocket manager for call streaming
call_manager = ConnectionManager()

class CallRequest(BaseModel):
    to: str
    from_: str = None
    call_type: str = "webrtc"  # "webrtc" or "voice_api"

class CallResponse(BaseModel):
    session_id: str
    status: str
    from_number: str
    to_number: str
    call_type: str = "voice_api"
    token: str = None          # WebRTC token
    phone_number: str = None   # WebRTC phone number
    client_name: str = None    # WebRTC client name

@router.post("/initiate", response_model=CallResponse)
async def initiate_call(
    request: CallRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Initiate a call and return session info for streaming"""
    if request.call_type == "webrtc":
        # Use WebRTC approach for browser-based calls
        result = africastalking_service.make_webrtc_call(
            to=request.to, 
            client_name=current_user.username,
            from_=request.from_
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        # For WebRTC calls, we return token info instead of initiating backend call
        # The actual call will be made by the WebRTC client in the browser
        token_data = result.get("data", result)
        session_id = f"webrtc_{int(time.time())}_{current_user.id}"
        call_type = "webrtc"
        
        # Create call record but with pending status for WebRTC
        call = Call(
            at_session_id=session_id,
            caller_number=token_data.get("phoneNumber", ""),
            callee_number=request.to,
            status="pending_webrtc",
            direction="outbound"
        )
        db.add(call)
        await db.commit()
        
        # Notify WebSocket clients
        await call_manager.broadcast({
            "type": "webrtc_call_initiated",
            "session_id": session_id,
            "from": token_data.get("phoneNumber", ""),
            "to": request.to,
            "status": "pending_webrtc",
            "token_data": token_data  # Include token data for frontend WebRTC setup
        }, "calls")
        
    else:  # voice_api
        result = africastalking_service.make_call(to=request.to, from_=request.from_)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        data = result["data"]
        
        # Handle Voice API response (silica approach)
        if "entries" in data and len(data["entries"]) > 0:
            session_id = data["entries"][0]["sessionId"]
            call_type = "voice_api"
        else:
            # Fallback
            session_id = f"call_{int(time.time())}_{current_user.id}"
            call_type = "voice_api"
        
        # Check if user has agent record
        agent_query = select(Agent).where(Agent.id == current_user.id)
        agent_result = await db.execute(agent_query)
        agent = agent_result.scalar_one_or_none()
        
        # Create call record
        call = Call(
            at_session_id=session_id,
            caller_number=result["from_number"],
            callee_number=result["to_number"],
            status="queued",
            direction="outbound",
            agent_id=agent.id if agent else None
        )
        db.add(call)
        await db.commit()
        
        # Notify WebSocket clients
        await call_manager.broadcast({
            "type": "call_initiated",
            "session_id": session_id,
            "from": result["from_number"],
            "to": result["to_number"],
            "status": "queued"
        }, "calls")
        
        # Enable mock progression for testing until AT dashboard is configured
        import os
        enable_mock = os.getenv("ENABLE_MOCK_CALLS", "false").lower() == "true"
        if enable_mock:
            import asyncio
            async def mock_call_progression():
                client_id = f"call_stream_{session_id}"
                
                async for db_session in get_db():
                    try:
                        await asyncio.sleep(2)
                        call.status = "ringing"
                        await db_session.commit()
                        await call_manager.send_to_client(client_id, {
                            "type": "call_update",
                            "session_id": session_id,
                            "status": "ringing"
                        })
                        
                        await asyncio.sleep(3)
                        call.status = "in-progress"
                        call.call_answered = datetime.now()
                        await db_session.commit()
                        await call_manager.send_to_client(client_id, {
                            "type": "call_update", 
                            "session_id": session_id,
                            "status": "in-progress"
                        })
                        
                        await asyncio.sleep(15)
                        call.status = "completed"
                        call.call_end = datetime.now()
                        call.total_duration = 20
                        await db_session.commit()
                        await call_manager.send_to_client(client_id, {
                            "type": "call_update",
                            "session_id": session_id, 
                            "status": "completed"
                        })
                        
                    except Exception as e:
                        logger.error(f"Mock progression error: {e}")
                    finally:
                        break
            
            asyncio.create_task(mock_call_progression())

    if request.call_type == "webrtc":
        # For WebRTC calls, return token data for frontend client
        return CallResponse(
            session_id=session_id,
            status="pending_webrtc",
            from_number=token_data.get("phoneNumber", ""),
            to_number=request.to,
            call_type="webrtc",
            token=token_data.get("token"),
            phone_number=token_data.get("phoneNumber"),
            client_name=token_data.get("clientName")
        )
    else:
        # For voice API calls, use the original response
        return CallResponse(
            session_id=session_id,
            status="queued",
            from_number=result["from_number"],
            to_number=result["to_number"]
        )
    
    # Check if user has agent record
    agent_query = select(Agent).where(Agent.id == current_user.id)
    agent_result = await db.execute(agent_query)
    agent = agent_result.scalar_one_or_none()
    
    # Create call record
    call = Call(
        at_session_id=session_id,
        caller_number=result["from_number"],
        callee_number=result["to_number"],
        status="queued",
        direction="outbound",
        agent_id=agent.id if agent else None
    )
    db.add(call)
    await db.commit()
    
    # Notify WebSocket clients
    await call_manager.broadcast({
        "type": "call_initiated",
        "session_id": session_id,
        "from": result["from_number"],
        "to": result["to_number"],
        "status": "queued"
    }, "calls")
    
    # Enable mock progression for testing until AT dashboard is configured
    import os
    enable_mock = os.getenv("ENABLE_MOCK_CALLS", "false").lower() == "true"
    if enable_mock:
        import asyncio
        async def mock_call_progression():
            client_id = f"call_stream_{session_id}"
            
            async for db_session in get_db():
                try:
                    await asyncio.sleep(2)
                    call.status = "ringing"
                    await db_session.commit()
                    await call_manager.send_to_client(client_id, {
                        "type": "call_update",
                        "session_id": session_id,
                        "status": "ringing"
                    })
                    
                    await asyncio.sleep(3)
                    call.status = "in-progress"
                    call.call_answered = datetime.now()
                    await db_session.commit()
                    await call_manager.send_to_client(client_id, {
                        "type": "call_update", 
                        "session_id": session_id,
                        "status": "in-progress"
                    })
                    
                    await asyncio.sleep(15)
                    call.status = "completed"
                    call.call_end = datetime.now()
                    call.total_duration = 20
                    await db_session.commit()
                    await call_manager.send_to_client(client_id, {
                        "type": "call_update",
                        "session_id": session_id, 
                        "status": "completed"
                    })
                    
                except Exception as e:
                    logger.error(f"Mock progression error: {e}")
                finally:
                    break
        
        asyncio.create_task(mock_call_progression())
    
    return CallResponse(
        session_id=session_id,
        status="queued",
        from_number=result["from_number"],
        to_number=result["to_number"]
    )

@router.get("/active")
async def get_active_calls(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all active calls"""
    query = select(Call).where(
        Call.status.in_(["queued", "ringing", "in-progress"])
    ).order_by(desc(Call.call_start))
    
    result = await db.execute(query)
    calls = result.scalars().all()
    
    return [
        {
            "session_id": call.at_session_id,
            "from": call.caller_number,
            "to": call.callee_number,
            "status": call.status,
            "duration": call.total_duration,
            "started_at": call.call_start.isoformat() if call.call_start else None
        }
        for call in calls
    ]

@router.get("/{session_id}")
async def get_call_details(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get specific call details"""
    query = select(Call).where(Call.at_session_id == session_id)
    result = await db.execute(query)
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    return {
        "session_id": call.at_session_id,
        "from": call.caller_number,
        "to": call.callee_number,
        "status": call.status,
        "duration": call.total_duration,
        "started_at": call.call_start.isoformat() if call.call_start else None,
        "answered_at": call.call_answered.isoformat() if call.call_answered else None,
        "ended_at": call.call_end.isoformat() if call.call_end else None
    }

@router.websocket("/stream/{session_id}")
async def stream_call(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time call streaming"""
    client_id = f"call_stream_{session_id}"
    await call_manager.connect(websocket, client_id)
    
    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to Call Center API",
            "timestamp": datetime.now().isoformat(),
            "client_id": client_id
        })
        
        # Send initial call status
        async for db in get_db():
            query = select(Call).where(Call.at_session_id == session_id)
            result = await db.execute(query)
            call = result.scalar_one_or_none()
            
            if call:
                await websocket.send_json({
                    "type": "call_status",
                    "session_id": session_id,
                    "status": call.status,
                    "duration": call.total_duration or 0
                })
            break
        
        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                # Echo back for testing
                await websocket.send_json({"type": "echo", "data": data})
            except Exception as e:
                logger.error(f"Error receiving WebSocket message: {e}")
                break
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {client_id}")
        call_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        call_manager.disconnect(client_id)
