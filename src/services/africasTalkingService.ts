import Africastalking from 'africastalking-client'

interface CallOptions {
  to: string;
  from_?: string;
  call_type?: 'voice_api' | 'webrtc'
}

interface WebRTCCallOptions {
  to: string;
  from_?: string;
}

class AfricasTalkingService {
  private baseUrl: string;
  private client: any = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async makeCall(options: CallOptions): Promise<any> {
    const response = await this.makeRequest('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify(options),
    });
    
    console.log("Call Streaming Response:", response)
    
    return {
      call_id: response.session_id,
      at_response: response
    }
  }

  async getCapabilityToken(clientName?: string, phoneNumber?: string): Promise<any> {
    // Use consistent client name like Laravel project
    const token = localStorage.getItem('access_token');
    const payload = JSON.parse(atob(token?.split('.')[1] || ''));
    const username = payload?.username || 'default_client';
    
    const requestBody: any = {
      client_name: clientName || username,  // Use username like Laravel
      phone_number: phoneNumber
    };
    
    return this.makeRequest('/africastalking/capability-token', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async initializeWebRTCClient(): Promise<any> {
    try {
      console.log("Initializing WebRTC client via npm package...");
      
      // Debug WebRTC support in browser
      console.log("Browser WebRTC support check:");
      console.log("  window.RTCPeerConnection:", typeof window.RTCPeerConnection);
      console.log("  navigator.mediaDevices:", typeof navigator.mediaDevices);
      console.log("  navigator.mediaDevices?.getUserMedia:", typeof navigator.mediaDevices?.getUserMedia);
      console.log("  window.isSecureContext:", window.isSecureContext);
      console.log("  window.location.protocol:", window.location.protocol);
      
      // Check if we're in a secure context (required for WebRTC)
      if (!window.isSecureContext && window.location.protocol !== 'https:') {
        console.warn("WebRTC requires HTTPS context for production use");
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          console.error("WebRTC will not work properly without HTTPS in production");
        }
      }
      
      // Get capability token from backend
      const tokenResponse = await this.getCapabilityToken();
      console.log("Capability token response:", tokenResponse);
      
      if (!tokenResponse.token) {
        throw new Error("No capability token received from server");
      }
      
      // Initialize the WebRTC client using npm package
      const params = {
        sounds: {
          ringing: "https://newark.silica24.net/ringing.mp3"
        }
      };
      
      console.log("Creating WebRTC client with token:", tokenResponse.token.substring(0, 20) + "...");
      
      // Debug the Africastalking object
      console.log("Africastalking object:", typeof Africastalking);
      console.log("Africastalking keys:", Object.keys(Africastalking));
      console.log("Africastalking.Client:", typeof Africastalking.Client);
      
      // Create client using npm package (exactly like Laravel project)
      this.client = new Africastalking.Client(tokenResponse.token, params);
      
      console.log("WebRTC client created successfully:", !!this.client);
      console.log("Client object type:", typeof this.client);
      console.log("Client constructor:", this.client?.constructor?.name);
      
      // Check if client has the expected methods
      if (this.client) {
        console.log("Client methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)));
        
        // Check for specific methods we'll use
        console.log("Client has call method:", typeof this.client.call);
        console.log("Client has on method:", typeof this.client.on);
        console.log("Client has getState method:", typeof this.client.getState);
      }
      
      // Set up event listeners exactly like Laravel project
      this.client.on('ready', () => {
        console.log("WebRTC client is ready");
      });
      
      this.client.on('notready', () => {
        console.log("WebRTC client is not ready");
      });
      
      this.client.on('offline', function () {
        console.log("WebRTC client is offline");
      });
      
      this.client.on('closed', function () {
        console.log("WebRTC client connection closed");
      });
      
      this.client.on('calling', function (response: any) {
        console.log("WebRTC call initiated:", response);
      });
      
      // Add error listener to catch internal errors
      this.client.on('error', function (error: any) {
        console.error("WebRTC client error:", error);
      });
      
      return this.client;
    } catch (error) {
      console.error("Failed to initialize WebRTC client:", error);
      throw error;
    }
  }

  async makeWebRTCCall(options: WebRTCCallOptions): Promise<any> {
    try {
      // Get WebRTC token from backend
      const tokenResponse = await this.getCapabilityToken();
      
      if (!tokenResponse.token) {
        throw new Error('No WebRTC token received');
      }
      
      // Initialize WebRTC client with token (no sounds to avoid failures)
      this.client = new Africastalking.Client(tokenResponse.token);
      
      // Set up event listeners
      this.client.on('ready', () => console.log("WebRTC ready"));
      this.client.on('calling', (data: any) => console.log("WebRTC calling:", data));
      this.client.on('callaccepted', (data: any) => console.log("WebRTC accepted:", data));
      this.client.on('hangup', (data: any) => console.log("WebRTC ended:", data));
      
      // Format phone number
      let phoneNo = options.to.replace(/\s+/g, '');
      if (phoneNo.startsWith('0')) {
        phoneNo = '254' + phoneNo.substring(1);
      }
      
      // Make WebRTC call
      const callResult = this.client.call(phoneNo);
      
      return { success: true, call_result: callResult };
    } catch (error) {
      console.error("WebRTC Error:", error);
      throw error;
    }
  }

  async getCallStatus(sessionId: string) {
    return this.makeRequest('/africastalking/call-status', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }
}

const atService = new AfricasTalkingService();
export default atService;