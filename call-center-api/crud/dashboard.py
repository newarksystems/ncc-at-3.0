from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, Float, literal
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID
import logging
import json

from models.call import Call
from models.agent import Agent
from models.user import User
from crud.user import UserOut
from api.redis_client import redis_client
from schemas.call import DashboardStats, LiveCallResponse, HourlyCallStats
from schemas.agent import AgentOut

logger = logging.getLogger(__name__)

class DashboardCRUD:
    """CRUD operations for Dashboard statistics with Redis caching."""
    
    async def get_dashboard_stats(self, db: AsyncSession, user: 'UserOut', designation: Optional[str] = None) -> DashboardStats:
        """Get dashboard statistics with Redis caching and role-based filtering."""
        cache_key = f"dashboard_stats:{user.id}:{designation or 'all'}"
        cached_stats = await redis_client.get(cache_key)
        if cached_stats:
            logger.info(f"Cache hit for dashboard stats: {cache_key}")
            return DashboardStats.model_validate_json(cached_stats)

        logger.info(f"Cache miss for dashboard stats: {cache_key}, fetching from database")
        
        # Get today's date range in EAT
        today = datetime.now(tz=timezone(timedelta(hours=3))).date()
        start_of_day = datetime.combine(today, datetime.min.time(), tzinfo=timezone(timedelta(hours=3)))

        # Determine agent_type based on user role and designation
        agent_type = None
        if user.role in ["admin", "viewer"]:
            if user.designation == "call-center-admin":
                agent_type = "call-center-agent"
            elif user.designation == "marketing-admin":
                agent_type = "marketing-agent"
            elif user.designation == "compliance-admin":
                agent_type = "compliance-agent"
            elif user.designation is None and user.role != "super-admin":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin designation")

        # Mock data for viewer admin
        if user.role == "viewer":
            stats = DashboardStats(
                total_calls=25,
                active_calls=5,
                answered_calls=20,
                missed_calls=5,
                total_collected=50000.0,
                total_agents=10,
                available_agents=7,
                total_dialed_calls=100,
                connected_calls=80,
                follow_up_calls=10,
                disconnected_calls=10,
                callbacks=5,
                service_level=85,
                passed_sla=90,
                failed_sla=10,
                fcr=75,
                far=60,
                right_party_contact_rate=70,
                ptp_fulfillment=80,
                average_talk_time="00:03:30",
                longest_talk_time="00:10:00",
                avg_call_attempt_duration="00:01:00"
            )
            await redis_client.set(cache_key, json.dumps(stats.model_dump()), 30)
            return stats

        # Build query
        query = select(
            func.count(Call.id).label("total_calls"),
            func.count(Call.id).filter(
                Call.status.in_(["queued", "ringing", "in-progress"])
            ).label("active_calls"),
            func.count(Call.id).filter(Call.status == "completed").label("answered_calls"),
            func.count(Call.id).filter(
                Call.status.in_(["failed", "busy", "no-answer"])
            ).label("missed_calls"),
            func.count(distinct(Call.agent_id)).filter(
                Call.status.in_(["queued", "ringing", "in-progress"])
            ).label("calling_agents"),
            func.count(distinct(Agent.id)).label("total_agents"),
            func.count(distinct(Agent.id)).filter(Agent.status == "available").label("available_agents"),
            func.count(Call.id).filter(Call.call_start >= start_of_day).label("total_dialed_calls"),
            func.count(Call.id).filter(
                Call.status == "answered",
                Call.call_start >= start_of_day
            ).label("connected_calls"),
            func.count(Call.id).filter(
                Call.status == "follow_up",
                Call.call_start >= start_of_day
            ).label("follow_up_calls"),
            func.count(Call.id).filter(
                Call.status == "disconnected",
                Call.call_start >= start_of_day
            ).label("disconnected_calls"),
            func.count(Call.id).filter(
                Call.status == "callback",
                Call.call_start >= start_of_day
            ).label("callbacks"),
            func.avg(Call.total_duration).label("average_talk_time"),
            func.max(Call.total_duration).label("longest_talk_time"),
            func.avg(Call.total_duration).label("avg_call_attempt_duration"),
            literal(0).label("total_collected")  # AT doesn't provide collection data
        ).join(Agent, Call.agent_id == Agent.id, isouter=True).join(
            User, Agent.user_id == User.id, isouter=True
        )

        # Apply role-based filters
        if agent_type:
            query = query.filter(Agent.agent_type == agent_type)
        if designation and user.role == "super-admin":
            query = query.filter(User.designation == designation)

        result = await db.execute(query)
        stats = result.first()

        # Placeholder calculations for SLA, FCR, FAR, etc.
        service_level = 85  # Implement actual logic
        passed_sla = 90
        failed_sla = 10
        fcr = 75
        far = 60
        right_party_contact_rate = 70
        ptp_fulfillment = 80

        dashboard_stats = DashboardStats(
            total_calls=stats.total_calls or 0,
            active_calls=stats.active_calls or 0,
            answered_calls=stats.answered_calls or 0,
            missed_calls=stats.missed_calls or 0,
            total_collected=0.0  # AT doesn't provide collection data
        )

        # Cache for 30 seconds
        await redis_client.set(cache_key, json.dumps(dashboard_stats.model_dump()), 30)
        return dashboard_stats
    
    async def get_live_calls(self, db: AsyncSession, user: 'UserOut', designation: Optional[str] = None) -> List['LiveCallResponse']:
        """Get live calls with role-based filtering."""
        cache_key = f"live_calls:{user.id}:{designation or 'all'}"
        cached_calls = await redis_client.get(cache_key)
        if cached_calls:
            logger.info(f"Cache hit for live calls: {cache_key}")
            return [LiveCallResponse.model_validate_json(call) for call in json.loads(cached_calls)]

        logger.info(f"Cache miss for live calls: {cache_key}, fetching from database")

        agent_type = None
        if user.role in ["admin", "viewer"]:
            if user.designation == "call-center-admin":
                agent_type = "call-center-agent"
            elif user.designation == "marketing-admin":
                agent_type = "marketing-agent"
            elif user.designation == "compliance-admin":
                agent_type = "compliance-agent"
            elif user.designation is None and user.role != "super-admin":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin designation")

        if user.role == "viewer":
            mock_calls = [
                LiveCallResponse(
                    id=UUID(int=1),
                    caller_number="+254712345678",
                    caller_display_name="Jane Smith",
                    callee_number="+254723456789",
                    callee_display_name="John Doe",
                    status="talking",
                    direction="inbound",
                    talk_time="00:02:15",
                    hold_time="00:00:30",
                    agent_name="John Doe",
                    agent_extension="1001",
                    queue_name="CC1",
                    call_start=datetime.now(tz=timezone(timedelta(hours=3)))
                ),
                LiveCallResponse(
                    id=UUID(int=2),
                    caller_number="+254723456789",
                    caller_display_name="Bob Johnson",
                    callee_number="+254712345678",
                    callee_display_name="Alice Brown",
                    status="ringing",
                    direction="outbound",
                    talk_time="00:00:00",
                    hold_time="00:00:00",
                    agent_name="Alice Brown",
                    agent_extension="1002",
                    queue_name="CC2",
                    call_start=datetime.now(tz=timezone(timedelta(hours=3)))
                )
            ]
            await redis_client.set(cache_key, json.dumps([call.model_dump_json() for call in mock_calls]), 30)
            return mock_calls

        query = select(Call, Agent, User).join(
            Agent, Call.agent_id == Agent.id, isouter=True
        ).join(
            User, Agent.user_id == User.id, isouter=True
        ).filter(
            Call.status.in_(["ringing", "answered", "talking", "on_hold"])
        )

        if agent_type:
            query = query.filter(Agent.agent_type == agent_type)
        if designation and user.role == "super-admin":
            query = query.filter(User.designation == designation)

        result = await db.execute(query)
        calls = result.all()

        live_calls = [
            LiveCallResponse(
                id=call[0].id,
                caller_number=call[0].caller_number,
                caller_display_name=call[0].caller_display_name,
                callee_number=call[0].callee_number,
                callee_display_name=call[0].callee_display_name,
                status=call[0].status,
                direction=call[0].direction,
                talk_time=str(timedelta(seconds=int(call[0].total_duration or 0))),
                hold_time="00:00:00",  # AT doesn't provide hold time
                agent_name=f"{call[2].first_name} {call[2].last_name}" if call[2] else None,
                agent_extension=call[0].agent_extension,
                queue_name=call[0].queue_name,
                call_start=call[0].call_start
            ) for call in calls
        ]

        await redis_client.set(cache_key, json.dumps([call.model_dump_json() for call in live_calls]), 30)
        return live_calls
    
    async def get_hourly_stats(self, db: AsyncSession, user: 'UserOut', designation: Optional[str] = None) -> List['HourlyCallStats']:
        """Get hourly call statistics with role-based filtering."""
        cache_key = f"hourly_stats:{user.id}:{designation or 'all'}"
        cached_stats = await redis_client.get(cache_key)
        if cached_stats:
            logger.info(f"Cache hit for hourly stats: {cache_key}")
            return [HourlyCallStats.model_validate_json(stat) for stat in json.loads(cached_stats)]

        logger.info(f"Cache miss for hourly stats: {cache_key}, fetching from database")

        agent_type = None
        if user.role in ["admin", "viewer"]:
            if user.designation == "call-center-admin":
                agent_type = "call-center-agent"
            elif user.designation == "marketing-admin":
                agent_type = "marketing-agent"
            elif user.designation == "compliance-admin":
                agent_type = "compliance-agent"
            elif user.designation is None and user.role != "super-admin":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin designation")

        if user.role == "viewer":
            mock_stats = [
                HourlyCallStats(hour="08:00", connected=20, offline=5, missed=3, other=2),
                HourlyCallStats(hour="09:00", connected=25, offline=4, missed=2, other=1),
                HourlyCallStats(hour="10:00", connected=30, offline=3, missed=1, other=0)
            ]
            await redis_client.set(cache_key, json.dumps([stat.model_dump_json() for stat in mock_stats]), 30)
            return mock_stats

        # Build the main query for hourly stats with proper joins and filters
        query = select(
            func.date_trunc('hour', Call.call_start).label("hour"),
            Call.status
        ).join(
            Agent, Call.agent_id == Agent.id, isouter=True
        ).join(
            User, Agent.user_id == User.id, isouter=True
        ).filter(
            Call.call_start >= datetime.now(tz=timezone(timedelta(hours=3))) - timedelta(days=1)
        )

        if agent_type:
            query = query.filter(Agent.agent_type == agent_type)
        if designation and user.role == "super-admin":
            query = query.filter(User.designation == designation)

        # Apply the filters and create a subquery for grouping
        subquery = query.subquery()

        # Now create the final query with grouping
        final_query = select(
            subquery.c.hour,
            func.count().filter(subquery.c.status == "answered").label("connected"),
            func.count().filter(subquery.c.status == "disconnected").label("offline"),
            func.count().filter(subquery.c.status == "missed").label("missed"),
            func.count().filter(
                ~subquery.c.status.in_(["answered", "disconnected", "missed"])
            ).label("other")
        ).group_by(subquery.c.hour)

        logger.debug(f"Executing hourly stats query: {final_query}")

        result = await db.execute(final_query)
        stats = result.all()

        hourly_stats = [
            HourlyCallStats(
                hour=stat.hour.astimezone(timezone(timedelta(hours=3))).strftime("%H:%M"),
                connected=stat.connected or 0,
                offline=stat.offline or 0,
                missed=stat.missed or 0,
                other=stat.other or 0
            ) for stat in stats
        ]

        await redis_client.set(cache_key, json.dumps([stat.model_dump_json() for stat in hourly_stats]), 30)
        return hourly_stats
    
    async def get_agents_performance(self, db: AsyncSession, user: 'UserOut', designation: Optional[str] = None) -> List['AgentOut']:
        """Get agent performance with role-based filtering."""
        cache_key = f"agents_performance:{user.id}:{designation or 'all'}"
        cached_agents = await redis_client.get(cache_key)
        if cached_agents:
            logger.info(f"Cache hit for agents performance: {cache_key}")
            return [AgentOut.model_validate_json(agent) for agent in json.loads(cached_agents)]

        logger.info(f"Cache miss for agents performance: {cache_key}, fetching from database")

        agent_type = None
        if user.role in ["admin", "viewer"]:
            if user.designation == "call-center-admin":
                agent_type = "call-center-agent"
            elif user.designation == "marketing-admin":
                agent_type = "marketing-agent"
            elif user.designation == "compliance-admin":
                agent_type = "compliance-agent"
            elif user.designation is None and user.role != "super-admin":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin designation")

        if user.role == "viewer":
            mock_agents = [
                AgentOut(
                    id=UUID(int=1),
                    full_name="John Doe",
                    status="available",
                    total_calls_today=50,
                    answered_calls_today=40,
                    average_call_duration=210,
                    is_logged_in=True,
                    login_time="2025-09-25T08:00:00+03:00"
                ),
                AgentOut(
                    id=UUID(int=2),
                    full_name="Alice Brown",
                    status="busy",
                    total_calls_today=45,
                    answered_calls_today=35,
                    average_call_duration=240,
                    is_logged_in=True,
                    login_time="2025-09-25T08:30:00+03:00"
                )
            ]
            await redis_client.set(cache_key, json.dumps([agent.model_dump_json() for agent in mock_agents]), 30)
            return mock_agents

        today = datetime.now(tz=timezone(timedelta(hours=3))).date()
        start_of_day = datetime.combine(today, datetime.min.time(), tzinfo=timezone(timedelta(hours=3)))

        query = select(
            Agent,
            User,
            func.count(Call.id).filter(Call.call_start >= start_of_day).label("total_calls_today"),
            func.count(Call.id).filter(
                Call.status == "answered",
                Call.call_start >= start_of_day
            ).label("answered_calls_today"),
            func.avg(Call.total_duration).filter(Call.call_start >= start_of_day).label("average_call_duration")
        ).join(
            User, Agent.user_id == User.id
        ).join(
            Call, Agent.id == Call.agent_id, isouter=True
        ).group_by(Agent.id, User.id)

        if agent_type:
            query = query.filter(Agent.agent_type == agent_type)
        if designation and user.role == "super-admin":
            query = query.filter(User.designation == designation)

        result = await db.execute(query)
        agents = result.all()

        agent_performance = [
            AgentOut(
                id=agent[0].id,
                full_name=f"{agent[1].first_name} {agent[1].last_name}" if agent[1] else "",
                status=agent[0].status,
                total_calls_today=agent.total_calls_today or 0,
                answered_calls_today=agent.answered_calls_today or 0,
                average_call_duration=int(agent.average_call_duration or 0),
                is_logged_in=agent[0].is_logged_in,
                login_time=agent[0].login_time.isoformat() if agent[0].login_time else None
            ) for agent in agents
        ]

        await redis_client.set(cache_key, json.dumps([agent.model_dump_json() for agent in agent_performance]), 30)
        return agent_performance
    
    async def invalidate_dashboard_cache(self, user_id: str, designation: Optional[str] = None):
        """Invalidate dashboard statistics cache."""
        await redis_client.delete_pattern(f"dashboard_stats:{user_id}:*")
        await redis_client.delete_pattern(f"live_calls:{user_id}:*")
        await redis_client.delete_pattern(f"hourly_stats:{user_id}:*")
        await redis_client.delete_pattern(f"agents_performance:{user_id}:*")

dashboard_crud = DashboardCRUD()