#!/usr/bin/env python3

import asyncio
import websockets
import json
import sys
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.africastalking_service import africastalking_service

async def test_call_with_websocket():
    """Test making a call and connecting to WebSocket for updates"""
    test_phone = "+254112153848"
    
    print("=== Testing Call with WebSocket ===")
    print(f"Target Phone: {test_phone}")
    
    # Make the call
    print("Making call...")
    result = africastalking_service.make_call(to=test_phone)
    
    if not result.get("success"):
        print(f"Call failed: {result.get('error')}")
        return
    
    session_id = result["data"]["entries"][0]["sessionId"]
    print(f"Call initiated with session ID: {session_id}")
    
    # Connect to WebSocket
    ws_url = f"ws://localhost:8000/api/calls/stream/{session_id}"
    print(f"Connecting to WebSocket: {ws_url}")
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("WebSocket connected!")
            
            # Listen for messages for 30 seconds
            timeout = 30
            print(f"Listening for updates for {timeout} seconds...")
            
            try:
                while timeout > 0:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    print(f"Received: {data}")
                    timeout -= 1
                    
            except asyncio.TimeoutError:
                print("No more messages received")
                
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    asyncio.run(test_call_with_websocket())
