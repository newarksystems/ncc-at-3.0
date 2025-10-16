# WebRTC Integration Guide

## Overview

The call-center-ATA system now supports Africa's Talking WebRTC capability tokens, which provide a more reliable calling experience compared to direct Voice API calls.

## Key Improvements

1. **WebRTC Capability Tokens**: Generate tokens for WebRTC-based calling
2. **Fallback Support**: Falls back to direct Voice API if WebRTC fails
3. **Better Call Reliability**: WebRTC calls are more stable and have better audio quality

## API Endpoints

### 1. Get Capability Token
```
POST /api/africastalking/capability-token
```

**Request Body:**
```json
{
  "client_name": "user123",  // Optional, defaults to current user's username
  "phone_number": "+254111052357"  // Optional, auto-selects if not provided
}
```

**Response:**
```json
{
  "token": "ATCAPtkn_...",
  "phoneNumber": "+254111052357",
  "clientName": "user123",
  "lifeTimeSec": "86400",
  "incoming": true,
  "outgoing": true
}
```

### 2. Make Call (WebRTC-enabled)
```
POST /api/africastalking/make-call
```

**Request Body:**
```json
{
  "to": "0756232181",
  "from_": "+254111052357",  // Optional
  "record": true,
  "callback_url": "https://your-domain.com/api/webhooks/africastalking"
}
```

**Response (WebRTC):**
```json
{
  "token": "ATCAPtkn_...",
  "phoneNumber": "+254111052357",
  "clientName": "user123",
  "destination": "+254756232181",
  "callType": "webrtc"
}
```

## Frontend Integration

### 1. Include Africa's Talking WebRTC SDK

Add to your HTML:
```html
<script src="https://webrtc.africastalking.com/js/africastalking-webrtc.js"></script>
```

### 2. Initialize WebRTC Client

```javascript
// Get capability token from your backend
const tokenResponse = await fetch('/api/africastalking/capability-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    client_name: 'user123'
  })
});

const tokenData = await tokenResponse.json();

// Initialize WebRTC client
const client = new AfricasTalkingWebRTC({
  token: tokenData.token,
  phoneNumber: tokenData.phoneNumber
});

// Set up event listeners
client.on('ready', () => {
  console.log('WebRTC client ready');
});

client.on('call', (call) => {
  console.log('Incoming call:', call);
});

client.on('error', (error) => {
  console.error('WebRTC error:', error);
});
```

### 3. Make Outgoing Calls

```javascript
// Method 1: Use the make-call endpoint (recommended)
const callResponse = await fetch('/api/africastalking/make-call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    to: '0756232181'
  })
});

const callData = await callResponse.json();

if (callData.callType === 'webrtc') {
  // Use WebRTC client to make the call
  const call = client.call(callData.destination);
  
  call.on('answered', () => {
    console.log('Call answered');
  });
  
  call.on('ended', () => {
    console.log('Call ended');
  });
}

// Method 2: Direct WebRTC call (if you have a token)
const call = client.call('+254756232181');
```

## Testing

Run the test script to verify the integration:

```bash
cd /home/izaack/Pictures/call-centre-ATA/call-center-api
python3 test_webrtc_token.py
```

## Environment Configuration

Ensure these environment variables are set:

```env
AT_API_KEY=your_api_key
AT_USERNAME=your_username
AT_PHONE_NUMBERS=+254111052357,+254709155527
AT_SANDBOX=false
```

## Benefits of WebRTC Approach

1. **Better Call Quality**: Direct peer-to-peer audio connection
2. **Reduced Latency**: No server-side audio processing
3. **More Reliable**: Less dependent on webhook delivery
4. **Real-time Events**: Immediate call state updates
5. **Browser Native**: Works directly in modern browsers

## Migration from Direct Voice API

The system automatically tries WebRTC first and falls back to direct Voice API if needed. No changes required for existing code, but WebRTC provides better user experience.

## Troubleshooting

1. **Token Generation Fails**: Check API credentials and network connectivity
2. **WebRTC Not Supported**: System falls back to direct Voice API automatically
3. **Call Quality Issues**: Ensure stable internet connection and proper browser permissions
4. **Audio Permissions**: Browser must have microphone access for WebRTC calls
