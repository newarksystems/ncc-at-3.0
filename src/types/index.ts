import { z } from 'zod';

// Zod schemas for validation
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  personal_phone: z.string(),
  role: z.enum(['super-admin', 'admin', 'agent', 'viewer']),
  status: z.enum(['active', 'disabled', 'former']),
  designation: z.enum(['call-center-admin', 'marketing-admin', 'compliance-admin']).nullable(),
  is_verified: z.boolean(),
  last_login: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  agent_profile: z.any().nullable(),
});

export const AgentSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  // User profile fields
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().email().nullable(),
  // Agent specific fields
  agent_id_3cx: z.string().nullable(),
  agent_type: z.enum(['recovery-agent', 'marketing-agent', 'compliance-agent']).nullable(),
  group: z.string().nullable(),
  region: z.string().nullable(),
  status: z.string(),
  last_status_change: z.string().nullable(),
  is_logged_in: z.boolean(),
  login_time: z.string().nullable(),
  last_activity: z.string().nullable(),
  current_call_id: z.string().nullable(),
  total_calls_today: z.number(),
  answered_calls_today: z.number(),
  missed_calls_today: z.number(),
  total_talk_time_today: z.number(),
  total_hold_time_today: z.number(),
  total_calls: z.number(),
  answered_calls: z.number(),
  missed_calls: z.number(),
  total_talk_time: z.number(),
  average_call_duration: z.number(),
  assigned_queues: z.array(z.string()).nullable(),
  skills: z.array(z.string()).nullable(),
  languages: z.array(z.string()).nullable(),
  max_concurrent_calls: z.number(),
  auto_answer: z.boolean(),
  call_recording_enabled: z.boolean(),
  department: z.string().nullable(),
  supervisor_id: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  last_login: z.string().nullable(),
});

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  user: UserSchema,
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types derived from Zod schemas
export type User = z.infer<typeof UserSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Other interfaces
export interface LiveCall {
  id: string;
  caller_number: string;
  caller_display_name: string | null;
  callee_number: string;
  callee_display_name: string | null;
  status: 'ringing' | 'answered' | 'on_hold' | 'talking' | 'ended' | 'unanswered' | 'transferred';
  direction: 'inbound' | 'outbound' | 'internal';
  talk_time: string;
  hold_time: string;
  agent_name: string | null;
  agent_extension: string | null;
  queue_name: string | null;
  call_start: string;
}

export interface Call {
  id: string;
  call_id_3cx: string | null;
  session_id: string | null;
  caller_number: string;
  caller_display_name: string | null;
  callee_number: string;
  callee_display_name: string | null;
  status: 'ringing' | 'answered' | 'on_hold' | 'talking' | 'ended' | 'unanswered' | 'transferred';
  direction: 'inbound' | 'outbound' | 'internal';
  call_start: string;
  call_answered: string | null;
  call_end: string | null;
  ringing_duration: number;
  talk_duration: number;
  hold_duration: number;
  total_duration: number;
  agent_id: string | null;
  agent_extension: string | null;
  queue_name: string | null;
  has_recording: boolean;
  recording_url: string | null;
  is_transferred: boolean;
  transfer_target: string | null;
  description: string | null;
  tags: string[] | null;
  custom_fields: Record<string, any> | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  duration_formatted: string;
}

export interface CallStats {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  average_duration: number;
  total_talk_time: number;
  calls_by_status: Record<string, number>;
  calls_by_direction: Record<string, number>;
  calls_by_hour: Record<string, { connected: number; offline: number; missed: number; other: number }>;
}

export interface PaginatedCalls {
  calls: Call[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export type UserRole = 'super-admin' | 'admin' | 'agent' | 'viewer';
export type AdminDesignation = 'call-center-admin' | 'marketing-admin' | 'compliance-admin';
export type AgentType = 'recovery-agent' | 'marketing-agent' | 'compliance-agent';
export type RecoveryAgentGroup = 'CC1' | 'CC2' | 'Field' | 'IDC';
export type Region = 'A' | 'B' | 'C' | 'D' | 'E';

export interface BaseUser {
  id: string;
  first_name: string;
  last_name: string;
  personal_phone: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  status: 'active' | 'disabled' | 'former';
  full_name: string;
}

export interface Admin extends BaseUser {
  designation: AdminDesignation;
}

export interface RecoveryAgent extends Agent {
  group: RecoveryAgentGroup;
}

export interface MarketingAgent extends Agent {
  region: Region;
}

export interface ComplianceAgent extends Agent {}

export interface CreateUserRequest {
  user_data: {
    username: string;
    first_name: string;
    last_name: string;
    personal_phone: string;
    email: string;
    password: string;
    role: UserRole;
    designation?: AdminDesignation;
    agent_type?: AgentType;
    group?: RecoveryAgentGroup;
    region?: Region;
    extension?: string | null;
    supervisor_id?: string | null;
  };
  agent_data?: {
    extension: string;
    personal_number?: string | null;
    agent_type?: AgentType;
    group?: RecoveryAgentGroup;
    region?: Region;
    agent_id_3cx?: string | null;
    sip_username?: string | null;
    status?: string;
    is_logged_in?: boolean;
    max_concurrent_calls?: number;
    auto_answer?: boolean;
    call_recording_enabled?: boolean;
    department?: string | null;
    supervisor_id?: string | null;
    notes?: string | null;
  };
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  personal_phone?: string;
  status?: 'active' | 'disabled' | 'former';
  designation?: AdminDesignation;
  agent_status?: Agent['status'];
  group?: RecoveryAgentGroup;
  region?: Region;
  extension?: string;
  supervisor_id?: string;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface DashboardStats {
  active_calls: number;
  calling_agents: number;
  total_agents: number;
  available_agents: number;
  total_dialed_calls: number;
  connected_calls: number;
  follow_up_calls: number;
  disconnected_calls: number;
  callbacks: number;
  service_level: number;
  passed_sla: number;
  failed_sla: number;
  fcr: number;
  far: number;
  right_party_contact_rate: number;
  ptp_fulfillment: number;
  average_talk_time: string;
  longest_talk_time: string;
  avg_call_attempt_duration: string;
  total_collected: number;
}

export interface Lead {
  id: string;
  [key: string]: any;
}

export interface AgentCall {
  id: string;
  date: string;
  duration: string;
  outcome: 'answered' | 'unanswered' | 'missed' | 'voicemail';
  caller_name?: string;
  caller_number: string;
  direction: 'inbound' | 'outbound';
  queue_name?: string;
}

export interface AgentStats {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  average_talk_time: string;
  max_wait_time: string;
  calls_by_day: {
    [day: string]: {
      total: number;
      answered: number;
      unanswered: number;
    };
  };
}

export interface QueueStatus {
  queue_name: string;
  calls_waiting: number;
  position: number;
}