// sipConfig.ts
export interface SipConfiguration {
  wsUrl: string;
  wsPort: number;
  useWss: boolean;
  domain: string;
  displayName: string;
  stunServers: string[];
  turnServers?: {
    urls: string;
    username?: string;
    credential?: string;
  }[];
  registerExpires: number;
  connectionRecoveryMaxInterval: number;
  connectionRecoveryMinInterval: number;
  sessionTimers: boolean;
  hackIpInContact: boolean;
  hackWssInScheme: boolean;
}

export const getSipConfig = (): SipConfiguration => {
  return {
    wsUrl: process.env.NEXT_PUBLIC_SIP_WS_URL || 'ws://localhost:8089/ws',
    wsPort: parseInt(process.env.NEXT_PUBLIC_SIP_WS_PORT || '8089', 10),
    useWss: process.env.NEXT_PUBLIC_SIP_USE_WSS === 'true',
    domain: process.env.NEXT_PUBLIC_SIP_DOMAIN || 'localhost',
    displayName: process.env.NEXT_PUBLIC_SIP_DISPLAY_NAME || 'Call Center Agent',
    stunServers: [
      process.env.NEXT_PUBLIC_STUN_SERVER_1 || 'stun:stun.l.google.com:19302',
      process.env.NEXT_PUBLIC_STUN_SERVER_2 || 'stun:stun1.l.google.com:19302',
      process.env.NEXT_PUBLIC_STUN_SERVER_3 || 'stun:stun2.l.google.com:19302'
    ],
    registerExpires: parseInt(process.env.NEXT_PUBLIC_SIP_REGISTER_EXPIRES || '600', 10),
    connectionRecoveryMaxInterval: parseInt(process.env.NEXT_PUBLIC_SIP_CONNECTION_RECOVERY_MAX || '30', 10),
    connectionRecoveryMinInterval: parseInt(process.env.NEXT_PUBLIC_SIP_CONNECTION_RECOVERY_MIN || '2', 10),
    sessionTimers: process.env.NEXT_PUBLIC_SIP_SESSION_TIMERS === 'true',
    hackIpInContact: process.env.NEXT_PUBLIC_SIP_HACK_IP_IN_CONTACT === 'true',
    hackWssInScheme: process.env.NEXT_PUBLIC_SIP_HACK_WSS_IN_SCHEME === 'true',
  };
};

// Environment variables that should be defined in .env.local
export const requiredEnvVars = [
  'NEXT_PUBLIC_SIP_WS_URL',
  'NEXT_PUBLIC_SIP_WS_PORT',
  'NEXT_PUBLIC_SIP_DOMAIN',
  'NEXT_PUBLIC_SIP_USE_WSS',
  'NEXT_PUBLIC_SIP_DISPLAY_NAME',
  'NEXT_PUBLIC_STUN_SERVER_1',
  'NEXT_PUBLIC_STUN_SERVER_2',
  'NEXT_PUBLIC_STUN_SERVER_3',
  'NEXT_PUBLIC_SIP_REGISTER_EXPIRES',
  'NEXT_PUBLIC_SIP_CONNECTION_RECOVERY_MAX',
  'NEXT_PUBLIC_SIP_CONNECTION_RECOVERY_MIN',
  'NEXT_PUBLIC_SIP_SESSION_TIMERS',
  'NEXT_PUBLIC_SIP_HACK_IP_IN_CONTACT',
  'NEXT_PUBLIC_SIP_HACK_WSS_IN_SCHEME',
];

// Validate required environment variables
export const validateSipConfig = (): void => {
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    console.warn(`Missing SIP configuration environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('Using default values for missing configuration');
  }
};

// Call validation on module load
validateSipConfig();

export default getSipConfig;