from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Dict, Any
import logging

from database import get_db
from models.call import Call
from api.routes.call_streaming import call_manager
from services.africastalking_service import call_mappings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/call")
@router.get("/call")
async def handle_call_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Africa's Talking call webhook - returns XML for call routing"""
    try:
        # Get form data or query params
        if request.method == "POST":
            form_data = await request.form()
            data = dict(form_data)
        else:
            data = dict(request.query_params)
        
        logger.info(f"Call webhook received: {data}")
        logger.info(f"FULL WEBHOOK DATA: {data}")
        
        # Extract key parameters
        session_id = data.get('sessionId', '')
        caller_number = data.get('callerNumber', '')
        destination_number = data.get('destinationNumber', '')
        client_dialed_number = data.get('clientDialedNumber', '')  # This is the target for WebRTC
        call_state = data.get('callSessionState', '')
        is_active = data.get('isActive', '1')
        dial_dest = data.get('dialDestinationNumber', '')
        
        logger.info(f"Key params: caller='{caller_number}', dest='{destination_number}', dialDest='{dial_dest}', state='{call_state}', active='{is_active}'")
        
        # For WebRTC calls - bridge using clientDialedNumber
        if is_active == '1' and call_state == 'Ringing' and client_dialed_number:
            xml_response = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial phoneNumbers="{client_dialed_number}"/>
</Response>'''
            
            logger.info(f"🎯 BRIDGING WEBRTC CALL {session_id} TO: {client_dialed_number}")
            return PlainTextResponse(xml_response, media_type="application/xml")
        
        # For Voice API calls - use mapping
        elif is_active == '1' and call_state in ['', 'Ringing', 'Answered']:
            target_number = call_mappings.get(session_id)
            
            if target_number:
                xml_response = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial record="true" phoneNumbers="{target_number}"/>
</Response>'''
                
                logger.info(f"🎯 ROUTING CALL {session_id} TO TARGET: {target_number}")
                return PlainTextResponse(xml_response, media_type="application/xml")
            else:
                logger.info(f"❌ NO MAPPING FOUND for session {session_id}")
        
        # For other webhook events, process normally
        return await handle_call_callback_data(data, db)
        
    except Exception as e:
        logger.error(f"Call webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

async def handle_call_callback_data(data: dict, db: AsyncSession):
    """Process call callback data"""
    try:
        session_id = data.get("sessionId")
        caller_number = data.get("callerNumber") 
        destination_number = data.get("destinationNumber")
        status = data.get("status")
        duration = data.get("durationInSeconds", "0")
        
        logger.info(f"Processing callback: session={session_id}, status={status}")
        
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
        logger.error(f"Callback processing error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/callback") 
async def handle_callback_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Africa's Talking event callbacks"""
    try:
        logger.info("=== EVENT CALLBACK RECEIVED ===")
        form_data = await request.form()
        data = dict(form_data)
        logger.info(f"Event data: {data}")
        
        return await handle_call_callback_data(data, db)
        
    except Exception as e:
        logger.error(f"Event callback error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/africastalking")
async def handle_africastalking_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle general Africa's Talking webhooks"""
    try:
        form_data = await request.form()
        data = dict(form_data)
        
        session_id = data.get("sessionId")
        event = data.get("event")
        recording_url = data.get("recordingUrl")
        
        logger.info(f"AT webhook: session={session_id}, event={event}")
        
        if recording_url:
            logger.info(f"Recording available: {recording_url}")
        
        return await handle_call_callback_data(data, db)
        
    except Exception as e:
        logger.error(f"AT webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}
