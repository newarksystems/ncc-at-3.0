// Minimal WebRTC integration for call-center-ATA frontend

// 1. Get capability token
async function getCapabilityToken() {
  const response = await fetch('/api/africastalking/capability-token', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  return response.json();
}

// 2. Initialize WebRTC client
async function initWebRTC() {
  const tokenData = await getCapabilityToken();
  const client = new AfricasTalkingWebRTC({
    token: tokenData.token,
    phoneNumber: tokenData.phoneNumber
  });
  
  client.on('ready', () => console.log('WebRTC ready'));
  return client;
}

// 3. Make call using WebRTC
async function makeCall(phoneNumber) {
  const response = await fetch('/api/africastalking/make-webrtc-call', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}` 
    },
    body: JSON.stringify({ to: phoneNumber })
  });
  
  const callData = await response.json();
  
  if (callData.callType === 'webrtc') {
    // Initialize WebRTC client using the token from the API response
    const client = new AfricasTalkingWebRTC({
      token: callData.token,
      phoneNumber: callData.phoneNumber
    });
    
    // Return the client call promise
    return client.call(callData.destination);
  } else {
    throw new Error('WebRTC call setup failed: ' + JSON.stringify(callData));
  }
}

// Usage: makeCall('0756232181')
