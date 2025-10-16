'use client'

import { useState, useEffect } from 'react'
import atService from '@/services/africasTalkingService'

export default function TestWebRTC() {
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [phoneNumber, setPhoneNumber] = useState('')

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const testWebRTC = async () => {
    try {
      setStatus('initializing')
      addLog('Starting WebRTC test...')
      
      // Initialize WebRTC client
      addLog('Initializing WebRTC client...')
      await atService.initializeWebRTCClient()
      addLog('WebRTC client initialized successfully')
      
      // Wait a bit for client to be ready
      setStatus('waiting')
      addLog('Waiting for client to be ready...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Make a test call
      if (phoneNumber) {
        setStatus('calling')
        addLog(`Making test call to ${phoneNumber}...`)
        const result = await atService.makeWebRTCCall({ to: phoneNumber })
        addLog(`Call result: ${JSON.stringify(result)}`)
      }
      
      setStatus('complete')
      addLog('Test completed successfully')
    } catch (error) {
      setStatus('error')
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Test error:', error)
    }
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">WebRTC Test</h2>
      
      <div className="mb-4">
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          className="w-full px-3 py-2 text-black rounded"
        />
      </div>
      
      <button
        onClick={testWebRTC}
        disabled={status === 'initializing' || status === 'waiting' || status === 'calling'}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {status === 'idle' && 'Test WebRTC'}
        {status === 'initializing' && 'Initializing...'}
        {status === 'waiting' && 'Waiting...'}
        {status === 'calling' && 'Calling...'}
        {status === 'complete' && 'Complete'}
        {status === 'error' && 'Error - Retry'}
      </button>
      
      <div className="mt-4">
        <h3 className="font-bold mb-2">Logs:</h3>
        <div className="bg-black text-green-400 p-2 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}