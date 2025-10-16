from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID
import logging

from database import get_db
from schemas.call import CallCreate, CallUpdate, CallResponse, PaginatedCalls, CallFilters, CallStatsResponse, LiveCallResponse
from crud.call import CallCRUD
from crud.dashboard import dashboard_crud
from models.call import Call
from models.agent import Agent
from auth import get_current_user
from crud.user import UserOut
from services.africastalking_service import africastalking_service

router = APIRouter()
logger = logging.getLogger(__name__)
call_crud = CallCRUD()

@router.get("/", response_model=PaginatedCalls)
async def get_calls(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    filters: CallFilters = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get paginated list of calls with optional filters"""
    calls = await call_crud.get_calls(db, skip=skip, limit=limit, filters=filters)
    total = await call_crud.count_calls(db, filters=filters)
    
    return PaginatedCalls(
        calls=calls,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/stats", response_model=CallStatsResponse)
async def get_call_statistics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get call statistics for the specified date range"""
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    stats = await call_crud.get_call_stats(db, start_date, end_date)
    return stats

@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific call by ID"""
    call = await call_crud.get_call(db, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call

@router.post("/", response_model=CallResponse)
async def create_call(
    call_data: CallCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new call record"""
    call = await call_crud.create_call(db, call_data)
    return call

@router.post("/make")
async def make_call(
    to: str,
    from_: str = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Make a call using Africa's Talking"""
    result = africastalking_service.make_call(to=to, from_=from_)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Create call record in database
    call_data = CallCreate(
        caller_number=from_ or "system",
        callee_number=to,
        direction="outbound",
        status="initiated",
        agent_id=current_user.id if hasattr(current_user, 'id') else None
    )
    
    call = await call_crud.create_call(db, call_data)
    
    return {
        "call_id": call.id,
        "at_response": result["data"]
    }

@router.put("/{call_id}", response_model=CallResponse)
async def update_call(
    call_id: UUID,
    call_update: CallUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a call"""
    call = await call_crud.update_call(db, call_id, call_update)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call

@router.delete("/{call_id}")
async def delete_call(
    call_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a call"""
    success = await call_crud.delete_call(db, call_id)
    if not success:
        raise HTTPException(status_code=404, detail="Call not found")
    return {"message": "Call deleted successfully"}

@router.get("/live", response_model=List[LiveCallResponse])
async def get_live_calls(
    designation: Optional[str] = Query(None, description="Agent designation filter"),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get live calls"""
    try:
        calls = await dashboard_crud.get_live_calls(db, current_user, designation)
        return calls or []  # Return empty list if None
    except Exception as e:
        logger.error(f"Error getting live calls: {str(e)}")
        return []  # Return empty list instead of error
