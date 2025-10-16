#!/usr/bin/env python3

import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
API_BASE_URL = "http://localhost:8000"
TEST_PHONE = "+254112153848"
CALLBACK_URL = "https://ncc.newarkfrontierstech.co.ke/api/call"

def get_auth_token():
    """Get authentication token"""
    # You'll need to replace these with actual credentials
    login_data = {
        "username": "admin",  # Replace with actual username
        "password": "admin"   # Replace with actual password
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_make_call(token):
    """Test making a call"""
    headers = {"Authorization": f"Bearer {token}"}
    call_data = {
        "to": TEST_PHONE
    }
    
    print(f"Making call to: {TEST_PHONE}")
    print(f"Using callback: {CALLBACK_URL}")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/africastalking/make-call",
            json=call_data,
            headers=headers
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Call test error: {e}")
        return False

def main():
    print("=== Africa's Talking Call Test ===")
    print(f"Target Phone: {TEST_PHONE}")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Callback URL: {CALLBACK_URL}")
    print()
    
    # Get auth token
    print("Getting authentication token...")
    token = get_auth_token()
    
    if not token:
        print("Failed to get auth token. Please check credentials.")
        return
    
    print("Authentication successful!")
    print()
    
    # Test the call
    print("Testing call...")
    success = test_make_call(token)
    
    if success:
        print("Call test completed successfully!")
    else:
        print("Call test failed!")

if __name__ == "__main__":
    main()
