#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.africastalking_service import africastalking_service

def test_call_with_recording():
    """Test making a call with recording enabled"""
    test_phone = "+254112153848"
    callback_url = "https://ncc.newarkfrontierstech.co.ke/api/webhooks/africastalking"
    
    print("=== Testing Call with Recording ===")
    print(f"Target Phone: {test_phone}")
    print(f"Callback URL: {callback_url}")
    print()
    
    # Make the call with recording
    result = africastalking_service.make_call(
        to=test_phone,
        record=True,
        callback_url=callback_url
    )
    
    print("Call Result:")
    print(f"  Success: {result.get('success')}")
    print(f"  From Number: {result.get('from_number')}")
    print(f"  To Number: {result.get('to_number')}")
    
    if result.get('data'):
        data = result['data']
        print(f"  Session ID: {data.get('entries', [{}])[0].get('sessionId')}")
        print(f"  Status: {data.get('entries', [{}])[0].get('status')}")
        print(f"  Error Message: {data.get('errorMessage')}")
    
    return result

if __name__ == "__main__":
    test_call_with_recording()
