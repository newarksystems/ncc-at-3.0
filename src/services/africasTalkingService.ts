interface CallOptions {
  to: string;
  from_?: string;
}

interface CallResponse {
  call_id: string;
  at_response: any;
}

type CallResult = {
  call_id: string;
  at_response: any;
} | any;

class AfricasTalkingService {
  private baseUrl: string;

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

  async makeCall(options: CallOptions): Promise<CallResult> {
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

  async getCallStatus(sessionId: string) {
    return this.makeRequest('/africastalking/call-status', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }
}

const atService = new AfricasTalkingService();
export default atService;
