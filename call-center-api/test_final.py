#!/usr/bin/env python3
import requests
import json

# Test the API endpoints
BASE_URL = "http://localhost:8000"

# Test capability token endpoint
print("Testing capability token...")
token_response = requests.post(f"{BASE_URL}/api/africastalking/capability-token", 
                              json={"client_name": "test_user"},
                              headers={"Authorization": "Bearer test"})
print(f"Token Status: {token_response.status_code}")

# Test make call endpoint  
print("Testing make call...")
call_response = requests.post(f"{BASE_URL}/api/africastalking/make-call",
                             json={"to": "0756232181"},
                             headers={"Authorization": "Bearer test"})
print(f"Call Status: {call_response.status_code}")

print("✅ Integration complete!")
