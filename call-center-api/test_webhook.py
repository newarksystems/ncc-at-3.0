#!/usr/bin/env python3

import requests

# Test the webhook endpoint
url = "http://localhost:8000/api/webhooks/call"

# Simulate AT webhook call
data = {
    "sessionId": "test_session_123",
    "callerNumber": "+254111052357", 
    "clientDialedNumber": "+254794415701",
    "isActive": "1"
}

print("Testing webhook with call routing...")
response = requests.post(url, data=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if "Dial" in response.text and "phoneNumbers" in response.text:
    print("✅ XML routing response working!")
else:
    print("❌ XML routing not working")
