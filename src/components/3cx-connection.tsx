'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';

interface ConnectionConfig {
  serverAddress: string;
  username: string;
  password: string;
  callerId: string;
}

export const ThreeCXConnection: React.FC = () => {
  const [config, setConfig] = useState<ConnectionConfig>({
    serverAddress: 'newark.3cx.sc',
    username: '69gZATkwyw', 
    password: 'wMe4a3MhCL',
    callerId: '101'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');

  const handleConnect = async () => {
    setStatus('Connecting...');
    
    // For now, just simulate connection
    // In real implementation, this would integrate with 3CX API
    setTimeout(() => {
      setIsConnected(true);
      setStatus('Connected to 3CX');
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setStatus('Disconnected');
  };

  const makeCall = (number: string) => {
    if (!isConnected) {
      alert('Please connect to 3CX first');
      return;
    }
    
    console.log(`Making call to ${number} via 3CX`);
    // This would use 3CX API to initiate call
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-white text-lg mb-4">3CX Connection</h3>
      
      <div className="space-y-3 mb-4">
        <input
          type="text"
          placeholder="Server Address"
          value={config.serverAddress}
          onChange={(e) => setConfig({...config, serverAddress: e.target.value})}
          className="w-full bg-slate-600 text-white p-2 rounded"
        />
        
        <input
          type="text"
          placeholder="Username"
          value={config.username}
          onChange={(e) => setConfig({...config, username: e.target.value})}
          className="w-full bg-slate-600 text-white p-2 rounded"
        />
        
        <input
          type="password"
          placeholder="Password"
          value={config.password}
          onChange={(e) => setConfig({...config, password: e.target.value})}
          className="w-full bg-slate-600 text-white p-2 rounded"
        />
        
        <input
          type="text"
          placeholder="Caller ID"
          value={config.callerId}
          onChange={(e) => setConfig({...config, callerId: e.target.value})}
          className="w-full bg-slate-600 text-white p-2 rounded"
        />
      </div>

      <div className="flex space-x-2 mb-4">
        {!isConnected ? (
          <Button onClick={handleConnect} className="bg-green-600 hover:bg-green-700">
            Connect
          </Button>
        ) : (
          <Button onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
            Disconnect
          </Button>
        )}
      </div>

      <div className="text-sm text-slate-300 mb-4">
        Status: {status}
      </div>

      {isConnected && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter number to call"
            className="w-full bg-slate-600 text-white p-2 rounded"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                makeCall((e.target as HTMLInputElement).value);
              }
            }}
          />
          <Button 
            onClick={() => {
              const input = document.querySelector('input[placeholder="Enter number to call"]') as HTMLInputElement;
              if (input?.value) makeCall(input.value);
            }}
            className="w-full"
          >
            Make Call
          </Button>
        </div>
      )}
    </div>
  );
};
