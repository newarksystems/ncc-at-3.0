#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Force fresh import
import importlib
if 'services.africastalking_service' in sys.modules:
    importlib.reload(sys.modules['services.africastalking_service'])

from services.africastalking_service import AfricasTalkingService

# Create fresh service instance
service = AfricasTalkingService()

print("=== Fresh AT Service Test ===")
print(f"Username: {service.username}")
print(f"Voice initialized: {service.voice is not None}")
print(f"Phone numbers: {service.phone_numbers}")

# Test call
result = service.make_call(to='0756232181')
print(f"Call result: {result}")
