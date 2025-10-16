#!/usr/bin/env python3

import asyncio
import websockets
import json
import time
from datetime import datetime

async def monitor_websocket():
    """Monitor WebSocket connections for call updates"""
    uri = "ws://localhost:8000/api/calls/stream/test_monitor"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"[{datetime.now()}] Connected to WebSocket")
            
            async for message in websocket:
                data = json.loads(message)
                print(f"[{datetime.now()}] WebSocket: {data}")
                
    except Exception as e:
        print(f"[{datetime.now()}] WebSocket error: {e}")

def test_call():
    """Test a call and monitor response"""
    import requests
    
    print(f"[{datetime.now()}] Testing call to 0756232181...")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/calls/initiate",
            json={"to": "0756232181"},
            headers={"Authorization": "Bearer your_token_here"}
        )
        
        print(f"[{datetime.now()}] Call response: {response.status_code}")
        print(f"[{datetime.now()}] Response data: {response.json()}")
        
    except Exception as e:
        print(f"[{datetime.now()}] Call test error: {e}")

if __name__ == "__main__":
    print("=== Call Center Live Monitor ===")
    print("1. Make sure FastAPI server is running on port 8000")
    print("2. Make sure ngrok is forwarding to port 8000")
    print("3. Monitoring WebSocket and API calls...")
    print()
    
    # Test call first
    test_call()
    
    # Monitor WebSocket
    asyncio.run(monitor_websocket())
