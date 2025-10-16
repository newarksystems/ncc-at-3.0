#!/usr/bin/env python3

import requests
import time
from datetime import datetime

def test_webhook_endpoints():
    """Test all webhook endpoints"""
    
    base_url = "http://localhost:8000"
    ngrok_url = "https://5a96a420c938.ngrok-free.app"
    
    endpoints = [
        "/api/webhooks/call",
        "/api/webhooks/callback",
        "/api/webhooks/africastalking"
    ]
    
    test_data = {
        "sessionId": "test_session_123",
        "status": "ringing",
        "callerNumber": "+254111052357",
        "destinationNumber": "+254756232181"
    }
    
    print("=== Testing Webhook Endpoints ===")
    
    for endpoint in endpoints:
        print(f"\n[{datetime.now()}] Testing {endpoint}")
        
        # Test local
        try:
            response = requests.post(f"{base_url}{endpoint}", data=test_data)
            print(f"  Local: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"  Local error: {e}")
        
        # Test ngrok
        try:
            response = requests.post(f"{ngrok_url}{endpoint}", data=test_data)
            print(f"  Ngrok: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"  Ngrok error: {e}")

def monitor_ngrok_status():
    """Check ngrok status"""
    try:
        response = requests.get("http://localhost:4040/api/tunnels")
        tunnels = response.json()
        
        print("\n=== Ngrok Status ===")
        for tunnel in tunnels.get("tunnels", []):
            print(f"  {tunnel['name']}: {tunnel['public_url']} -> {tunnel['config']['addr']}")
            
    except Exception as e:
        print(f"Ngrok status error: {e}")

if __name__ == "__main__":
    monitor_ngrok_status()
    test_webhook_endpoints()
