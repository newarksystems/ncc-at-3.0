#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.africastalking_service import AfricasTalkingService

# Create service instance
service = AfricasTalkingService()

print("=== WebRTC Capability Token Test ===")
print(f"Username: {service.username}")
print(f"API Key configured: {service.api_key is not None}")
print(f"Phone numbers: {service.phone_numbers}")

# Test capability token generation
print("\n--- Testing Capability Token ---")
token_result = service.get_capability_token("test_client")
print(f"Token result: {token_result}")

# Test WebRTC call setup
print("\n--- Testing WebRTC Call Setup ---")
call_result = service.make_webrtc_call("0756232181", "test_client")
print(f"WebRTC call result: {call_result}")

# Test regular call (should now use WebRTC approach)
print("\n--- Testing Regular Call (WebRTC) ---")
regular_call_result = service.make_call("0756232181", client_name="test_client")
print(f"Regular call result: {regular_call_result}")
