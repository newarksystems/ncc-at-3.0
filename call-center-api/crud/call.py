from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import List, Tuple, Optional
from uuid import UUID
import logging
import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from models.call import Call
from models.agent import Agent
from models.user import User
from schemas.call import CallCreate, CallUpdate, CallFilters, LiveCallResponse
from api.redis_client import redis_client
from utils.activity_logging import activity_logger

logger = logging.getLogger(__name__)

class CallCRUD:
    """CRUD operations for Call model"""
    
    def _serialize_call(self, call: Call) -> dict:
        """Convert Call model to dictionary for caching"""
        if not call:
            return None
            
        call_start = call.call_start.isoformat() if call.call_start else None
        call_answered = call.call_answered.isoformat() if call.call_answered else None
        call_end = call.call_end.isoformat() if call.call_end else None
        created_at = call.created_at.isoformat() if call.created_at else None
        updated_at = call.updated_at.isoformat() if call.updated_at else None
        
        return {
            "id": str(call.id),
            "call_id_3cx": call.call_id_3cx,
            "session_id": call.session_id,
            "caller_number": call.caller_number,
            "caller_display_name": call.caller_display_name,
            "callee_number": call.callee_number,
            "callee_display_name": call.callee_display_name,
            "status": call.status,
            "direction": call.direction,
            "call_start": call_start,
            "call_answered": call_answered,
            "call_end": call_end,
            "ringing_duration": call.ringing_duration,
            "talk_duration": call.talk_duration,
            "hold_duration": call.hold_duration,
            "total_duration": call.total_duration,
            "agent_id": str(call.agent_id) if call.agent_id else None,
            "agent_extension": call.agent_extension,
            "queue_name": call.queue_name,
            "has_recording": call.has_recording,
            "recording_url": call.recording_url,
            "is_transferred": call.is_transferred,
            "transfer_target": call.transfer_target,
            "description": call.description,
            "tags": call.tags,
            "custom_fields": call.custom_fields,
            "lead_id": str(call.lead_id) if call.lead_id else None,
            "created_at": created_at,
            "updated_at": updated_at
        }
    
    def _deserialize_call(self, data: dict) -> dict:
        """Convert cached dictionary back to format suitable for response"""
        if not data:
            return None
        return data
    
    async def get_call_by_3cx_id(self, db: AsyncSession, call_id_3cx: str) -> Optional[Call]:
        """Get call by 3CX call ID"""
        try:
            result = await db.execute(
                select(Call)
                .options(selectinload(Call.agent))
                .where(Call.call_id_3cx == call_id_3cx)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting call by 3CX ID {call_id_3cx}: {str(e)}")
            return None

    async def create_call_from_webhook(self, db: AsyncSession, call_data: dict) -> Call:
        """Create call from 3CX webhook data"""
        try:
            # Find agent by extension if provided
            agent = None
            if call_data.get("agent_extension"):
                result = await db.execute(
                    select(Agent).where(Agent.extension == call_data["agent_extension"])
                )
                agent = result.scalar_one_or_none()
            
            call = Call(
                call_id_3cx=call_data["call_id_3cx"],
                caller_number=call_data.get("caller_number"),
                caller_display_name=call_data.get("caller_display_name"),
                callee_number=call_data.get("callee_number"),
                callee_display_name=call_data.get("callee_display_name"),
                direction=call_data.get("direction", "inbound"),
                status=call_data.get("status", "ringing"),
                call_start=call_data.get("call_start", datetime.utcnow()),
                queue_name=call_data.get("queue_name"),
                agent_extension=call_data.get("agent_extension"),
                agent_id=agent.id if agent else None
            )
            
            db.add(call)
            await db.commit()
            await db.refresh(call)
            
            logger.info(f"Created call from webhook: {call.id}")
            return call
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating call from webhook: {str(e)}")
            raise
        """Get call by ID with Redis caching"""
        cache_key = f"call:{call_id}"
        cached_call = await redis_client.get(cache_key)
        if cached_call:
            logger.info(f"Cache hit for call {call_id}")
            return self._deserialize_call(json.loads(cached_call))
            
        logger.info(f"Cache miss for call {call_id}, fetching from database")
        query = (
            select(Call)
            .options(selectinload(Call.agent), selectinload(Call.lead))
            .where(Call.id == call_id)
        )
        result = await db.execute(query)
        call = result.scalar_one_or_none()
        
        if call:
            serialized_call = self._serialize_call(call)
            await redis_client.setex(cache_key, 300, json.dumps(serialized_call))
            
        return call
    
    async def get_call_by_3cx_id(self, db: AsyncSession, call_id_3cx: str) -> Optional[Call]:
        """Get call by 3CX call ID"""
        query = (
            select(Call)
            .options(selectinload(Call.agent), selectinload(Call.lead))
            .where(Call.call_id_3cx == call_id_3cx)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_calls_paginated(
        self, 
        db: AsyncSession, 
        page: int, 
        size: int, 
        filters: CallFilters
    ) -> Tuple[List[Call], int]:
        """Get paginated calls with filters and Redis caching"""
        filters_dict = filters.model_dump(exclude_unset=True) if filters else {}
        cache_key = f"calls:{page}:{size}:{hash(str(filters_dict))}"
        
        cached_result = await redis_client.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for calls page {page}")
            cached_data = json.loads(cached_result)
            return [self._deserialize_call(call) for call in cached_data[0]], cached_data[1]
            
        logger.info(f"Cache miss for calls page {page}, fetching from database")
        
        query = select(Call).options(selectinload(Call.agent), selectinload(Call.lead))
        count_query = select(func.count(Call.id))
        
        conditions = []
        if filters.status:
            conditions.append(Call.status == filters.status)
        if filters.direction:
            conditions.append(Call.direction == filters.direction)
        if filters.agent_id:
            conditions.append(Call.agent_id == filters.agent_id)
        if filters.queue_name:
            conditions.append(Call.queue_name == filters.queue_name)
        if filters.start_date:
            conditions.append(Call.call_start >= filters.start_date)
        if filters.end_date:
            conditions.append(Call.call_start <= filters.end_date)
        if filters.caller_number:
            conditions.append(Call.caller_number.ilike(f"%{filters.caller_number}%"))
        if filters.callee_number:
            conditions.append(Call.callee_number.ilike(f"%{filters.callee_number}%"))
        if filters.has_recording is not None:
            conditions.append(Call.has_recording == filters.has_recording)
            
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        query = query.order_by(desc(Call.call_start)).offset((page - 1) * size).limit(size)
        result = await db.execute(query)
        calls = result.scalars().all()
        
        if calls:
            serialized_calls = [self._serialize_call(call) for call in calls]
            cache_result = (serialized_calls, total)
            await redis_client.setex(cache_key, 120, json.dumps(cache_result))
            
        return calls, total
    
    async def get_active_calls(self, db: AsyncSession) -> List[Call]:
        """Get all currently active calls with Redis caching"""
        cache_key = "active_calls"
        cached_calls = await redis_client.get(cache_key)
        if cached_calls:
            logger.info("Cache hit for active calls")
            return [self._deserialize_call(call) for call in json.loads(cached_calls)]
            
        logger.info("Cache miss for active calls, fetching from database")
        query = (
            select(Call)
            .options(selectinload(Call.agent))
            .where(Call.status.in_(["ringing", "answered", "on_hold", "talking"]))
            .order_by(Call.call_start.desc())
        )
        result = await db.execute(query)
        calls = result.scalars().all()
        
        if calls:
            serialized_calls = [self._serialize_call(call) for call in calls]
            await redis_client.setex(cache_key, 30, json.dumps(serialized_calls))
            
        return calls
    
    async def get_agent_calls(
        self, 
        db: AsyncSession, 
        agent_id: UUID, 
        limit: int = 50
    ) -> List[Call]:
        """Get recent calls for specific agent"""
        query = (
            select(Call)
            .options(selectinload(Call.lead))
            .where(Call.agent_id == agent_id)
            .order_by(desc(Call.call_start))
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create_call(self, db: AsyncSession, call_data: CallCreate, actor_id: UUID, actor_name: str) -> Call:
        """Create new call and invalidate relevant caches"""
        agent_id = None
        if call_data.agent_extension:
            agent_query = select(Agent).where(Agent.extension == call_data.agent_extension)
            agent_result = await db.execute(agent_query)
            agent = agent_result.scalar_one_or_none()
            if agent:
                agent_id = agent.id
        
        call = Call(
            call_id_3cx=call_data.call_id_3cx,
            session_id=call_data.session_id,
            caller_number=call_data.caller_number,
            caller_display_name=call_data.caller_display_name,
            callee_number=call_data.callee_number,
            callee_display_name=call_data.callee_display_name,
            direction=call_data.direction,
            queue_name=call_data.queue_name,
            description=call_data.description,
            tags=call_data.tags,
            agent_id=agent_id,
            agent_extension=call_data.agent_extension,
            lead_id=call_data.lead_id,
            call_start=datetime.now(tz=ZoneInfo("Africa/Nairobi"))
        )
        
        db.add(call)
        await db.commit()
        await db.refresh(call)
        
        await activity_logger.log_call_activity(
            db=db,
            activity_type="call_created",
            actor_id=actor_id,
            actor_name=actor_name,
            call_id=call.id,
            call_name=f"Call from {call.caller_number} to {call.callee_number}",
            description=f"Created new call from {call.caller_number} to {call.callee_number}"
        )
        
        cache_key = f"call:{call.id}"
        await redis_client.delete(cache_key)
        await redis_client.delete("active_calls")
        await redis_client.delete_pattern(f"calls_by_number:{call.caller_number}:*")
        await redis_client.delete_pattern(f"calls_by_number:{call.callee_number}:*")
        await redis_client.delete_pattern("calls:*")
        
        # Publish WebSocket update
        if call.status in ["ringing", "answered", "talking", "on_hold"]:
            agent = await db.execute(select(Agent, User).join(User, Agent.user_id == User.id).where(Agent.id == call.agent_id))
            agent_data = agent.first()
            designations = [None]
            if agent_data and agent_data.User.designation:
                designations.append(agent_data.User.designation)
            for designation in designations:
                live_call = LiveCallResponse(
                    id=call.id,
                    caller_number=call.caller_number,
                    caller_display_name=call.caller_display_name,
                    callee_number=call.callee_number,
                    callee_display_name=call.callee_display_name,
                    status=call.status,
                    direction=call.direction,
                    talk_time=str(timedelta(seconds=int(call.talk_duration or 0))),
                    hold_time=str(timedelta(seconds=int(call.hold_duration or 0))),
                    agent_name=f"{agent_data.User.first_name} {agent_data.User.last_name}" if agent_data else None,
                    agent_extension=call.agent_extension,
                    queue_name=call.queue_name,
                    call_start=call.call_start
                )
                channel = f"live_calls:{actor_id}:{designation or 'all'}"
                await redis_client.publish(channel, json.dumps(live_call.model_dump()))
        
        return call
    
    async def update_call(
        self, 
        db: AsyncSession, 
        call_id: UUID, 
        call_data: CallUpdate,
        actor_id: UUID,
        actor_name: str
    ) -> Optional[Call]:
        """Update existing call and invalidate cache"""
        call = await self.get_call(db, call_id)
        if not call:
            return None
        
        original_caller_number = call.caller_number
        original_callee_number = call.callee_number
        original_status = call.status
        
        update_data = call_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(call, field, value)
        
        await db.commit()
        await db.refresh(call)
        
        changes = {}
        if 'status' in update_data and update_data['status'] != original_status:
            changes['status'] = {'from': original_status, 'to': update_data['status']}
        if 'caller_number' in update_data and update_data['caller_number'] != original_caller_number:
            changes['caller_number'] = {'from': original_caller_number, 'to': update_data['caller_number']}
        if 'callee_number' in update_data and update_data['callee_number'] != original_callee_number:
            changes['callee_number'] = {'from': original_callee_number, 'to': update_data['callee_number']}
        
        await activity_logger.log_call_activity(
            db=db,
            activity_type="call_updated",
            actor_id=actor_id,
            actor_name=actor_name,
            call_id=call.id,
            call_name=f"Call from {call.caller_number} to {call.callee_number}",
            description=f"Updated call from {call.caller_number} to {call.callee_number}",
            changes=changes if changes else None
        )
        
        cache_key = f"call:{call_id}"
        await redis_client.delete(cache_key)
        if 'status' in update_data:
            await redis_client.delete("active_calls")
        if 'caller_number' in update_data or 'callee_number' in update_data:
            await redis_client.delete_pattern(f"calls_by_number:{original_caller_number}:*")
            await redis_client.delete_pattern(f"calls_by_number:{original_callee_number}:*")
            await redis_client.delete_pattern(f"calls_by_number:{call.caller_number}:*")
            await redis_client.delete_pattern(f"calls_by_number:{call.callee_number}:*")
        await redis_client.delete_pattern("calls:*")
        
        # Publish WebSocket update
        if call.status in ["ringing", "answered", "talking", "on_hold"]:
            agent = await db.execute(select(Agent, User).join(User, Agent.user_id == User.id).where(Agent.id == call.agent_id))
            agent_data = agent.first()
            designations = [None]
            if agent_data and agent_data.User.designation:
                designations.append(agent_data.User.designation)
            for designation in designations:
                live_call = LiveCallResponse(
                    id=call.id,
                    caller_number=call.caller_number,
                    caller_display_name=call.caller_display_name,
                    callee_number=call.callee_number,
                    callee_display_name=call.callee_display_name,
                    status=call.status,
                    direction=call.direction,
                    talk_time=str(timedelta(seconds=int(call.talk_duration or 0))),
                    hold_time=str(timedelta(seconds=int(call.hold_duration or 0))),
                    agent_name=f"{agent_data.User.first_name} {agent_data.User.last_name}" if agent_data else None,
                    agent_extension=call.agent_extension,
                    queue_name=call.queue_name,
                    call_start=call.call_start
                )
                channel = f"live_calls:{actor_id}:{designation or 'all'}"
                await redis_client.publish(channel, json.dumps(live_call.model_dump()))
        
        return call
    
    async def delete_call(self, db: AsyncSession, call_id: UUID, actor_id: UUID, actor_name: str) -> bool:
        """Delete call and invalidate cache"""
        call = await self.get_call(db, call_id)
        if not call:
            return False
        
        caller_number = call.caller_number
        callee_number = call.callee_number
        call_description = f"Call from {call.caller_number} to {call.callee_number}"
        
        await db.delete(call)
        await db.commit()
        
        await activity_logger.log_call_activity(
            db=db,
            activity_type="call_deleted",
            actor_id=actor_id,
            actor_name=actor_name,
            call_id=call_id,
            call_name=call_description,
            description=f"Deleted call {call_description}"
        )
        
        cache_key = f"call:{call_id}"
        await redis_client.delete(cache_key)
        await redis_client.delete("active_calls")
        await redis_client.delete_pattern(f"calls_by_number:{caller_number}:*")
        await redis_client.delete_pattern(f"calls_by_number:{callee_number}:*")
        await redis_client.delete_pattern("calls:*")
        
        # Publish WebSocket update
        agent = await db.execute(select(Agent, User).join(User, Agent.user_id == User.id).where(Agent.id == call.agent_id))
        agent_data = agent.first()
        designations = [None]
        if agent_data and agent_data.User.designation:
            designations.append(agent_data.User.designation)
        for designation in designations:
            channel = f"live_calls:{actor_id}:{designation or 'all'}"
            await redis_client.publish(channel, json.dumps({"id": str(call_id), "deleted": True}))
        
        return True
    
    async def update_call_status(
        self, 
        db: AsyncSession, 
        call_id: UUID, 
        status: str,
        actor_id: UUID,
        actor_name: str
    ) -> Optional[Call]:
        """Update call status and log activity"""
        call = await self.get_call(db, call_id)
        if not call:
            return None
        
        original_status = call.status
        call.status = status
        
        now = datetime.now(tz=ZoneInfo("Africa/Nairobi"))
        if status == "answered" and not call.call_answered:
            call.call_answered = now
            if call.call_start:
                call.ringing_duration = int((now - call.call_start).total_seconds())
        elif status == "ended" and not call.call_end:
            call.call_end = now
            if call.call_start:
                call.total_duration = int((now - call.call_start).total_seconds())
            if call.call_answered:
                call.talk_duration = int((now - call.call_answered).total_seconds())
        
        await db.commit()
        await db.refresh(call)
        
        await activity_logger.log_call_activity(
            db=db,
            activity_type="call_status_changed",
            actor_id=actor_id,
            actor_name=actor_name,
            call_id=call_id,
            call_name=f"Call from {call.caller_number} to {call.callee_number}",
            description=f"Changed call status from {original_status} to {status}"
        )
        
        cache_key = f"call:{call_id}"
        await redis_client.delete(cache_key)
        await redis_client.delete("active_calls")
        await redis_client.delete_pattern("calls:*")
        
        # Publish WebSocket update
        if call.status in ["ringing", "answered", "talking", "on_hold"]:
            agent = await db.execute(select(Agent, User).join(User, Agent.user_id == User.id).where(Agent.id == call.agent_id))
            agent_data = agent.first()
            designations = [None]
            if agent_data and agent_data.User.designation:
                designations.append(agent_data.User.designation)
            for designation in designations:
                live_call = LiveCallResponse(
                    id=call.id,
                    caller_number=call.caller_number,
                    caller_display_name=call.caller_display_name,
                    callee_number=call.callee_number,
                    callee_display_name=call.callee_display_name,
                    status=call.status,
                    direction=call.direction,
                    talk_time=str(timedelta(seconds=int(call.talk_duration or 0))),
                    hold_time=str(timedelta(seconds=int(call.hold_duration or 0))),
                    agent_name=f"{agent_data.User.first_name} {agent_data.User.last_name}" if agent_data else None,
                    agent_extension=call.agent_extension,
                    queue_name=call.queue_name,
                    call_start=call.call_start
                )
                channel = f"live_calls:{actor_id}:{designation or 'all'}"
                await redis_client.publish(channel, json.dumps(live_call.model_dump()))
        
        return call
    
    async def get_calls_by_number(
        self, 
        db: AsyncSession, 
        phone_number: str, 
        limit: int = 10
    ) -> List[Call]:
        """Get recent calls for a phone number with Redis caching"""
        cache_key = f"calls_by_number:{phone_number}:{limit}"
        cached_calls = await redis_client.get(cache_key)
        if cached_calls:
            logger.info(f"Cache hit for calls by number {phone_number}")
            return [self._deserialize_call(call) for call in json.loads(cached_calls)]
            
        logger.info(f"Cache miss for calls by number {phone_number}, fetching from database")
        query = (
            select(Call)
            .options(selectinload(Call.agent))
            .where(
                or_(
                    Call.caller_number == phone_number,
                    Call.callee_number == phone_number
                )
            )
            .order_by(desc(Call.call_start))
            .limit(limit)
        )
        result = await db.execute(query)
        calls = result.scalars().all()
        
        if calls:
            serialized_calls = [self._serialize_call(call) for call in calls]
            await redis_client.setex(cache_key, 120, json.dumps(serialized_calls))
            
        return calls

    async def get_call_stats(self, db: AsyncSession, start_date: str = None, end_date: str = None):
        """Get call statistics for the given date range."""
        return {
            "total_calls": 0,
            "answered_calls": 0,
            "missed_calls": 0,
            "average_duration": 0,
            "total_duration": 0
        }
    
call_crud= CallCRUD()