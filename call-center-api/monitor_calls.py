#!/usr/bin/env python3

import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models.call import Call
from sqlalchemy import select, desc

async def monitor_calls():
    """Monitor recent calls and their status"""
    async for db in get_db():
        try:
            # Get recent calls
            query = select(Call).order_by(desc(Call.call_start)).limit(10)
            result = await db.execute(query)
            calls = result.scalars().all()
            
            print("=== Recent Calls ===")
            for call in calls:
                print(f"Session: {call.session_id}")
                print(f"  From: {call.caller_number} -> To: {call.callee_number}")
                print(f"  Status: {call.status}")
                print(f"  Duration: {call.total_duration}s")
                if call.recording_url:
                    print(f"  Recording: {call.recording_url}")
                print(f"  Started: {call.call_start}")
                print()
            
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(monitor_calls())
