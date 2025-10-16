import os
import random
import time
import requests
import africastalking
from typing import Dict, Any, List

# Global call mapping storage
call_mappings = {}

class AfricasTalkingService:
    def __init__(self):
        username = os.getenv("AT_USERNAME")
        api_key = os.getenv("AT_API_KEY")
        
        # Parse phone numbers from environment first
        phone_numbers_str = os.getenv("AT_PHONE_NUMBERS", "")
        self.phone_numbers = [num.strip() for num in phone_numbers_str.split(",") if num.strip()]
        
        if not self.phone_numbers:
            # Fallback to a default number if none configured
            self.phone_numbers = ["+254700000000"]
            
        print(f"DEBUG: Initialized with phone numbers: {self.phone_numbers}")
        
        # Handle case where credentials are not set
        if not username or not api_key:
            print("WARNING: Africa's Talking credentials not configured. Running in mock mode.")
            self.voice = None
            self.is_sandbox = True
            self.username = None
            self.api_key = None
            return
        
        # Determine sandbox mode primarily from environment variable, not key format
        # Some production keys may start with 'atsk_' but are still production keys
        self.is_sandbox = os.getenv("AT_SANDBOX", "False").lower() == "true"
        
        try:
            africastalking.initialize(username, api_key)
            self.voice = africastalking.Voice
            self.username = username
            self.api_key = api_key
        except Exception as e:
            print(f"ERROR: Failed to initialize Africa's Talking: {str(e)}")
            print("WARNING: Running in mock mode due to credential error.")
            self.voice = None
            self.username = None
            self.api_key = None
    
    def get_available_number(self) -> str:
        """Get an available phone number using round-robin selection"""
        if not self.phone_numbers:
            raise ValueError("No phone numbers available")
        
        # Simple random selection - you could implement more sophisticated logic
        return random.choice(self.phone_numbers)
    
    def get_capability_token(self, client_name: str, phone_number: str = None) -> Dict[str, Any]:
        """Get WebRTC capability token for making calls"""
        try:
            if not self.username or not self.api_key:
                return {
                    "success": False,
                    "error": "Africa's Talking credentials not configured",
                    "message": "Missing username or API key"
                }
            
            # Use provided number or auto-select one
            if not phone_number:
                phone_number = self.get_available_number()
            
            url = "https://webrtc.africastalking.com/capability-token/request"
            
            headers = {
                'Content-Type': 'application/json',
                'apiKey': self.api_key,
            }
            
            data = {
                'username': self.username,
                'clientName': client_name,
                'phoneNumber': phone_number,
            }
            
            print(f"DEBUG: Requesting capability token for {client_name} with number {phone_number}")
            
            response = requests.post(url, json=data, headers=headers)
            
            if response.status_code in [200, 201]:  # Accept both 200 and 201 as success
                response_data = response.json()
                if 'token' in response_data:
                    return {
                        "success": True,
                        "data": {
                            "token": response_data['token'],
                            "phoneNumber": phone_number,
                            "clientName": client_name,
                            "lifeTimeSec": response_data.get('lifeTimeSec', '86400'),
                            "incoming": response_data.get('incoming', True),
                            "outgoing": response_data.get('outgoing', True)
                        }
                    }
                else:
                    return {
                        "success": False,
                        "error": "Token not found in response",
                        "message": f"Response: {response_data}"
                    }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "message": response.text
                }
                
        except Exception as e:
            print(f"DEBUG: Capability token error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to get capability token: {str(e)}"
            }
    
    def make_webrtc_call(self, to: str, client_name: str, from_: str = None) -> Dict[str, Any]:
        """Make a WebRTC call using capability token approach - NO Voice API calls"""
        try:
            # Get capability token first
            token_result = self.get_capability_token(client_name, from_)
            
            if not token_result.get("success"):
                return token_result
            
            token_data = token_result["data"]
            
            # Format the destination number
            formatted_to = self.format_phone_number(to)
            
            print(f"DEBUG: WebRTC call setup - Token obtained for {client_name}")
            print(f"DEBUG: Frontend will call from {token_data['phoneNumber']} to {formatted_to}")
            
            # Return ONLY token data - NO Voice API call made
            return {
                "success": True,
                "data": {
                    "token": token_data["token"],
                    "phoneNumber": token_data["phoneNumber"],
                    "clientName": token_data["clientName"],
                    "destination": formatted_to,
                    "callType": "webrtc"
                },
                "from_number": token_data["phoneNumber"],
                "to_number": formatted_to
            }
            
        except Exception as e:
            print(f"DEBUG: WebRTC call error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to setup WebRTC call: {str(e)}"
            }
        """Get an available phone number using round-robin selection"""
        if not self.phone_numbers:
            raise ValueError("No phone numbers available")
        
        # Simple random selection - you could implement more sophisticated logic
        return random.choice(self.phone_numbers)
    
    def format_phone_number(self, phone: str) -> str:
        """Format phone number to international format for AT"""
        if not phone:
            return phone
            
        # Remove spaces and special characters
        phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        
        # Convert Kenyan local format to international
        if phone.startswith("07") or phone.startswith("01"):
            phone = "+254" + phone[1:]  # 0712345678 -> +254712345678
        elif phone.startswith("7") and len(phone) == 9:
            phone = "+254" + phone      # 712345678 -> +254712345678
        elif phone.startswith("1") and len(phone) == 9:
            phone = "+254" + phone      # 112345678 -> +254112345678
        elif phone.startswith("254") and not phone.startswith("+"):
            phone = "+" + phone         # 254712345678 -> +254712345678
        elif phone.startswith("+254"):
            pass                        # Already correct format
        else:
            # If none of the above, assume it needs +254 prefix
            if len(phone) >= 9:
                phone = "+254" + phone.lstrip("0")
            
        return phone

    def make_call(self, to: str, from_: str = None, record: bool = True, callback_url: str = None, client_name: str = "default_client") -> Dict[str, Any]:
        """Make a voice call - using silica's direct approach"""
        try:
            print(f"DEBUG: Making direct Voice API call to {to}")
            
            # Use direct Voice API like silica does
            return self._make_direct_call(to, from_, record, callback_url)
            
        except Exception as e:
            print(f"DEBUG: Call error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to initiate call: {str(e)}"
            }
    
    def _make_direct_call(self, to: str, from_: str = None, record: bool = True, callback_url: str = None) -> Dict[str, Any]:
        """Webhook-based Voice API call - make call to trigger webhook that routes to target (like Laravel project)"""
        try:
            print(f"DEBUG: Making webhook-based call to trigger routing")
            
            # Format the target phone number
            target_number = self.format_phone_number(to)
            print(f"DEBUG: Target number: {target_number}")
            
            # Use AT phone number as caller
            caller_number = self.format_phone_number(from_) if from_ else self.get_available_number()
            print(f"DEBUG: Caller number: {caller_number}")
            
            if not self.voice:
                return {
                    "success": True, 
                    "data": {
                        "entries": [{"sessionId": f"mock_{int(time.time())}", "status": "Queued"}]
                    },
                    "from_number": caller_number,
                    "to_number": target_number
                }
            
            # Make call TO the AT number itself, which will trigger webhook to route to target
            # This creates a callback that gets handled by our webhook to route to the actual target
            response = self.voice.call(
                callFrom=caller_number,
                callTo=[caller_number]  # Call the same number to trigger webhook routing
            )
            
            # Store mapping with session ID for webhook routing
            if response.get('entries') and len(response['entries']) > 0:
                session_id = response['entries'][0].get('sessionId')
                if session_id:
                    call_mappings[session_id] = target_number
                    print(f"DEBUG: Stored mapping {session_id} -> {target_number}")
            
            print(f"DEBUG: AT API Webhook Call Response: {response}")
            
            return {
                "success": True, 
                "data": response,
                "from_number": caller_number,
                "to_number": target_number
            }
            
        except Exception as e:
            print(f"DEBUG: Webhook call error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to make webhook call: {str(e)}"
            }
    
    def get_call_status(self, session_id: str) -> Dict[str, Any]:
        """Get call status by session ID"""
        try:
            # Check if voice service is not initialized (credentials) or if explicitly in sandbox mode
            if not self.voice:
                # Return mock response for credential issues
                return {
                    "success": True,
                    "data": {
                        "status": "mock_status",
                        "duration": "0",
                        "cost": "0.00",
                        "sessionId": session_id
                    }
                }
            elif self.is_sandbox:
                # Return mock response for sandbox mode
                return {
                    "success": True,
                    "data": {
                        "status": "answered",
                        "duration": "30",
                        "cost": "0.00",
                        "sessionId": session_id
                    }
                }
            
            response = self.voice.fetch_queued_calls(
                phone_number=None,
                queue_name=session_id
            )
            return {"success": True, "data": response}
        except Exception as e:
            return {
                "success": False, 
                "error": str(e),
                "message": f"Failed to get call status: {str(e)}"
            }

# Global instance
africastalking_service = AfricasTalkingService()
