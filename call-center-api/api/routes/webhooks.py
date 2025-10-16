from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Dict, Any
import logging

from database import get_db
from models.call import Call
from api.routes.call_streaming import call_manager

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/call")
async def handle_call_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Africa's Talking call callback (matches your callback URL)"""
    try:
        logger.info("=== WEBHOOK RECEIVED: /call ===")
        form_data = await request.form()
        logger.info(f"Form data: {dict(form_data)}")
        
        session_id = form_data.get("sessionId")
        caller_number = form_data.get("callerNumber") 
        destination_number = form_data.get("destinationNumber")
        status = form_data.get("status")
        duration = form_data.get("durationInSeconds", "0")
        
        logger.info(f"AT call callback: session={session_id}, status={status}, duration={duration}")
        
        if session_id:
            query = select(Call).where(Call.at_session_id == session_id)
            result = await db.execute(query)
            call = result.scalar_one_or_none()
            
            if not call:
                call = Call(
                    at_session_id=session_id,
                    caller_number=caller_number,
                    callee_number=destination_number,
                    status=status,
                    direction="outbound",
                    total_duration=int(duration) if duration.isdigit() else 0
                )
                db.add(call)
            else:
                call.status = status
                call.total_duration = int(duration) if duration.isdigit() else 0
                
                if status in ["completed", "failed", "busy", "no-answer"]:
                    call.call_end = datetime.utcnow()
            
            await db.commit()
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Call callback error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/call")
async def handle_call_callback_legacy(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle legacy callback URL from AT dashboard"""
    return await handle_call_callback(request, db)

@router.post("/callback") 
async def handle_callback_legacy(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle legacy events URL from AT dashboard"""
    try:
        logger.info("=== WEBHOOK RECEIVED: /callback ===")
        form_data = await request.form()
        logger.info(f"Callback form data: {dict(form_data)}")
        return await handle_africastalking_webhook(request, db)
    except Exception as e:
        logger.error(f"Callback error: {str(e)}")
        return {"status": "error", "message": str(e)}
async def handle_africastalking_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Africa's Talking webhooks for call events and recordings"""
    try:
        form_data = await request.form()
        
        session_id = form_data.get("sessionId")
        event = form_data.get("event")
        caller_number = form_data.get("callerNumber")
        destination_number = form_data.get("destinationNumber")
        status = form_data.get("status")
        duration = form_data.get("durationInSeconds", "0")
        recording_url = form_data.get("recordingUrl")
        
        logger.info(f"AT webhook: session={session_id}, event={event}, status={status}")
        
        if recording_url:
            logger.info(f"Recording available: {recording_url}")
        
        if session_id:
            query = select(Call).where(Call.at_session_id == session_id)
            result = await db.execute(query)
            call = result.scalar_one_or_none()
            
            if not call:
                call = Call(
                    at_session_id=session_id,
                    caller_number=caller_number,
                    callee_number=destination_number,
                    status=status or event,
                    direction="outbound",
                    total_duration=int(duration) if duration and duration.isdigit() else 0,
                    recording_url=recording_url
                )
                db.add(call)
            else:
                if status:
                    call.status = status
                elif event:
                    if event == "ringing":
                        call.status = "ringing"
                    elif event == "answered":
                        call.status = "in-progress"
                        call.call_answered = datetime.utcnow()
                    elif event == "hangup":
                        call.status = "completed"
                        call.call_end = datetime.utcnow()
                
                if duration and duration.isdigit():
                    call.total_duration = int(duration)
            
            await db.commit()
            
            # Broadcast to WebSocket clients
            client_id = f"call_stream_{session_id}"
            await call_manager.send_to_client(client_id, {
                "type": "call_update",
                "session_id": session_id,
                "status": status or event,
                "duration": int(duration) if duration and duration.isdigit() else 0
            })
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"AT webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

