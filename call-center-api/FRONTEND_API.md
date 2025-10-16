# Frontend API Documentation

## Authentication
```javascript
// Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin"
}
// Returns: { "access_token": "...", "token_type": "bearer" }
```

## Call Management

### 1. Initiate Call
```javascript
POST /api/calls/initiate
Headers: { "Authorization": "Bearer <token>" }
{
  "to": "+254112153848",
  "from_": "+254111052357" // optional
}
// Returns: { "session_id": "ATVId_...", "status": "queued", "from_number": "...", "to_number": "..." }
```

### 2. Get Active Calls
```javascript
GET /api/calls/active
Headers: { "Authorization": "Bearer <token>" }
// Returns: [{ "session_id": "...", "from": "...", "to": "...", "status": "...", "duration": 0, "recording_url": null }]
```

### 3. Get Call Details
```javascript
GET /api/calls/{session_id}
Headers: { "Authorization": "Bearer <token>" }
// Returns: { "session_id": "...", "status": "...", "duration": 0, "recording_url": "...", "started_at": "...", "answered_at": "...", "ended_at": "..." }
```

## WebSocket Streaming

### Connect to Call Stream
```javascript
const ws = new WebSocket('ws://localhost:8000/api/calls/stream/{session_id}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'call_status':
      console.log('Call status:', data.status);
      break;
    case 'call_update':
      console.log('Call updated:', data);
      if (data.recording_url) {
        console.log('Recording available:', data.recording_url);
      }
      break;
  }
};
```

## Frontend Integration Example

```javascript
class CallManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.baseUrl = 'http://localhost:8000/api';
    this.wsUrl = 'ws://localhost:8000/api';
  }

  async initiateCall(phoneNumber) {
    const response = await fetch(`${this.baseUrl}/calls/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ to: phoneNumber })
    });
    
    const call = await response.json();
    this.streamCall(call.session_id);
    return call;
  }

  streamCall(sessionId) {
    const ws = new WebSocket(`${this.wsUrl}/calls/stream/${sessionId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleCallUpdate(data);
    };
    
    return ws;
  }

  handleCallUpdate(data) {
    switch(data.type) {
      case 'call_update':
        if (data.status === 'in-progress') {
          console.log('Call answered!');
        }
        if (data.recording_url) {
          this.playRecording(data.recording_url);
        }
        break;
    }
  }

  playRecording(url) {
    const audio = new Audio(url);
    audio.play();
  }

  async getActiveCalls() {
    const response = await fetch(`${this.baseUrl}/calls/active`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }
}

// Usage
const callManager = new CallManager();
callManager.initiateCall('+254112153848');
```

## Call Status Flow
1. **queued** → Call initiated
2. **ringing** → Phone is ringing
3. **in-progress** → Call answered
4. **completed** → Call ended
5. **failed/busy/no-answer** → Call unsuccessful

## Recording Access
- Recordings are available via `recording_url` in call updates
- URLs are provided by Africa's Talking after call completion
- Frontend can stream/download recordings directly
