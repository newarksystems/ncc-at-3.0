from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from database import get_db
from crud.dashboard import dashboard_crud
from schemas.call import DashboardStats, LiveCallResponse, HourlyCallStats
from schemas.agent import AgentOut
from auth import get_current_user
from schemas.user import UserOut

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    designation: Optional[str] = None,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch dashboard statistics based on user role and designation."""
    try:
        stats = await dashboard_crud.get_dashboard_stats(db, current_user, designation)
        return stats
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/live-calls", response_model=List[LiveCallResponse])
async def get_live_calls(
    designation: Optional[str] = None,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch live calls based on user role and designation."""
    try:
        calls = await dashboard_crud.get_live_calls(db, current_user, designation)
        return calls
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching live calls: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/hourly-stats", response_model=List[HourlyCallStats])
async def get_hourly_stats(
    designation: Optional[str] = None,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch hourly call statistics based on user role and designation."""
    try:
        stats = await dashboard_crud.get_hourly_stats(db, current_user, designation)
        return stats
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching hourly stats: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/agents", response_model=List[AgentOut])
async def get_agents_performance(
    designation: Optional[str] = None,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch agent performance based on user role and designation."""
    try:
        agents = await dashboard_crud.get_agents_performance(db, current_user, designation)
        return agents
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching agent performance: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")