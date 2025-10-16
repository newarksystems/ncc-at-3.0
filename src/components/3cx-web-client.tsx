'use client';

import React, { useEffect, useRef } from 'react';

export const ThreeCXWebClient: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Load 3CX Web Client
    const iframe = iframeRef.current;
    if (iframe) {
      // 3CX Web Client URL with your credentials
      const webClientUrl = `https://newark.3cx.sc/webclient/#/login?user=69gZATkwyw&password=wMe4a3MhCL`;
      iframe.src = webClientUrl;
    }
  }, []);

  return (
    <div className="w-full h-96 bg-slate-800 rounded-lg overflow-hidden">
      <div className="bg-slate-700 p-2 text-white text-sm">
        3CX Web Client
      </div>
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="3CX Web Client"
        allow="microphone; camera; autoplay"
      />
    </div>
  );
};
