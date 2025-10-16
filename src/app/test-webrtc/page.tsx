'use client'

import TestWebRTC from '@/components/test-webrtc'

export default function TestWebRTCPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebRTC Test Page</h1>
        <TestWebRTC />
      </div>
    </div>
  )
}