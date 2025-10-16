#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.africastalking_service import africastalking_service

def test_at_integration():
    print("=== Africa's Talking Integration Test ===")
    
    # Test phone number formatting
    test_numbers = [
        "0112153848",
        "112153848", 
        "+254112153848",
        "254112153848"
    ]
    
    print("\n1. Testing phone number formatting:")
    for num in test_numbers:
        formatted = africastalking_service.format_phone_number(num)
        print(f"  {num} -> {formatted}")
    
    # Test service initialization
    print(f"\n2. Service Status:")
    print(f"  Username: {africastalking_service.username}")
    print(f"  Voice service initialized: {africastalking_service.voice is not None}")
    print(f"  Sandbox mode: {africastalking_service.is_sandbox}")
    print(f"  Available numbers: {africastalking_service.phone_numbers}")
    
    # Test making a call
    print(f"\n3. Testing call initiation:")
    test_to = "0112153848"  # The number from your log
    
    try:
        result = africastalking_service.make_call(to=test_to)
        print(f"  Call result: {result}")
        
        if result.get("success"):
            print("  ✅ Call initiated successfully")
            data = result.get("data", {})
            if "entries" in data and data["entries"]:
                session_id = data["entries"][0].get("sessionId")
                print(f"  Session ID: {session_id}")
                status_code = data["entries"][0].get("statusCode")
                print(f"  Status Code: {status_code}")
                status_desc = data["entries"][0].get("statusDescription")
                print(f"  Status: {status_desc}")
        else:
            print(f"  ❌ Call failed: {result.get('error')}")
            
    except Exception as e:
        print(f"  ❌ Exception during call: {str(e)}")

if __name__ == "__main__":
    test_at_integration()
