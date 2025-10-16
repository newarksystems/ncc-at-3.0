#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.africastalking_service import africastalking_service

def test_direct_call():
    """Test making a call directly through the service"""
    test_phone = "+254112153848"
    
    print("=== Direct Africa's Talking Service Test ===")
    print(f"Target Phone: {test_phone}")
    print(f"Service Username: {africastalking_service.username}")
    print(f"Service Sandbox Mode: {africastalking_service.is_sandbox}")
    print(f"Voice Service Initialized: {africastalking_service.voice is not None}")
    print(f"Available Numbers: {africastalking_service.phone_numbers}")
    print()
    
    # Test phone number formatting
    formatted = africastalking_service.format_phone_number(test_phone)
    print(f"Phone formatting test: {test_phone} -> {formatted}")
    print()
    
    # Make the call
    print("Making call...")
    result = africastalking_service.make_call(to=test_phone)
    
    print("Call Result:")
    print(f"  Success: {result.get('success')}")
    print(f"  Error: {result.get('error')}")
    print(f"  Message: {result.get('message')}")
    print(f"  From Number: {result.get('from_number')}")
    print(f"  To Number: {result.get('to_number')}")
    
    if result.get('data'):
        print(f"  Data: {result['data']}")
    
    return result.get('success', False)

if __name__ == "__main__":
    test_direct_call()
