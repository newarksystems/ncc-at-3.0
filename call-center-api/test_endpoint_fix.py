#!/usr/bin/env python3

# Test the WebRTC response handling
from services.africastalking_service import AfricasTalkingService

service = AfricasTalkingService()
result = service.make_call("0756232181", client_name="test_user")

print("=== Call Result ===")
print(f"Success: {result.get('success')}")
print(f"Data keys: {list(result.get('data', {}).keys())}")

data = result.get("data", {})
if "callType" in data and data["callType"] == "webrtc":
    print("✅ WebRTC response detected")
    session_id = f"webrtc_{1234567890}_123"
    print(f"Generated session_id: {session_id}")
elif "entries" in data:
    print("✅ Voice API response detected") 
    session_id = data["entries"][0]["sessionId"]
    print(f"AT session_id: {session_id}")
else:
    print("⚠️  Unknown response format")
    print(f"Data: {data}")

print("✅ Fix should work!")
