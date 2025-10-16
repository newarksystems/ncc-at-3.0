from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from database import get_db
from models.lead import Lead

router = APIRouter()

@router.get("/")
async def get_leads(db: AsyncSession = Depends(get_db)):
    """Get all leads"""
    query = select(Lead)
    result = await db.execute(query)
    leads = result.scalars().all()
    return leads

@router.get("/{lead_id}")
async def get_lead(lead_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get specific lead by ID"""
    query = select(Lead).where(Lead.id == lead_id)
    result = await db.execute(query)
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return lead
