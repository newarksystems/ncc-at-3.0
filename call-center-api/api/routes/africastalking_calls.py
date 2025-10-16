from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.africastalking_service import africastalking_service
from auth import get_current_user

router = APIRouter(prefix="/africastalking", tags=["africastalking"])

class MakeCallRequest(BaseModel):
    to: str
    from_: str = None
    record: bool = True
    callback_url: str = "https://ncc.newarkfrontierstech.co.ke/api/webhooks/africastalking"

class CallStatusRequest(BaseModel):
    session_id: str

class CapabilityTokenRequest(BaseModel):
    client_name: str = None
    phone_number: str = None

@router.post("/capability-token")
async def get_capability_token(request: CapabilityTokenRequest, current_user=Depends(get_current_user)):
    """Get WebRTC capability token for making calls"""
    try:
        # Use username as client name if not provided
        client_name = request.client_name or current_user.username
        
        result = africastalking_service.get_capability_token(
            client_name=client_name,
            phone_number=request.phone_number
        )
        
        if not result.get("success", True):
            error_detail = result.get("error", result.get("message", "Unknown error"))
            raise HTTPException(status_code=400, detail=error_detail)
        
        return result.get("data", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

class MakeWebRTCCallRequest(BaseModel):
    to: str
    from_: str = None

@router.post("/make-call")
async def make_call(request: MakeCallRequest, current_user=Depends(get_current_user)):
    """Make a call using Africa's Talking API"""
    try:
        result = africastalking_service.make_call(
            to=request.to,
            from_=request.from_,
            record=request.record,
            callback_url=request.callback_url,
            client_name=current_user.username
        )
        
        if not result.get("success", True):  # Default to success=True for backward compatibility
            error_detail = result.get("error", result.get("message", "Unknown error"))
            raise HTTPException(status_code=400, detail=error_detail)
        
        return result.get("data", result)  # Return data if available, otherwise return the whole result
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/make-webrtc-call")
async def make_webrtc_call(request: MakeWebRTCCallRequest, current_user=Depends(get_current_user)):
    """Make a WebRTC call using capability token"""
    try:
        result = africastalking_service.make_webrtc_call(
            to=request.to,
            client_name=current_user.username,
            from_=request.from_
        )
        
        if not result.get("success", True):
            error_detail = result.get("error", result.get("message", "Unknown error"))
            raise HTTPException(status_code=400, detail=error_detail)
        
        return result.get("data", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/call-status")
async def get_call_status(request: CallStatusRequest, current_user=Depends(get_current_user)):
    """Get call status by session ID"""
    try:
        result = africastalking_service.get_call_status(request.session_id)
        
        if not result.get("success", True):  # Default to success=True for backward compatibility
            error_detail = result.get("error", result.get("message", "Unknown error"))
            raise HTTPException(status_code=400, detail=error_detail)
        
        return result.get("data", result)  # Return data if available, otherwise return the whole result
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/webhook")
async def handle_webhook(payload: dict):
    """Handle Africa's Talking webhooks"""
    # Process webhook events (call status updates, etc.)
    return {"status": "received"}
