export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: Record<string, any>; // The result after execution
  status?: 'pending' | 'success' | 'error';
}

export interface Message {
  id: string;
  role: MessageRole;
  text?: string;
  toolCalls?: ToolCallData[];
  timestamp: number;
  isThinking?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

// Tool Definitions for the simulated environment
export interface EmailPayload {
  recipient: string;
  subject: string;
  body: string;
}

export interface MeetingPayload {
  title: string;
  participants: string[];
  startTime: string;
  durationMinutes: number;
}

export interface NotePayload {
  title: string;
  content: string;
  tags?: string[];
}
