export interface Article {
  id: string;
  topic: string;
  focus?: string;
  targetLength?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational';
  research?: string;
  outline?: string;
  content: string;
  wordCount?: number;
  status: 'draft' | 'scheduled' | 'posted';
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  postedAt?: string;
  taskId?: string;
}

export interface PostingTime {
  hour: number;
  minute: number;
  jitterMinutes: number;
}

export interface ScheduleConfig {
  enabled: boolean;
  timezone: string;
  topics: string[];
  currentTopicIndex: number;
  postingTimes: PostingTime[];
  weekdays: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

export interface GeneratePostRequest {
  topic: string;
  useAI?: boolean;
}

export interface GenerateArticleRequest {
  topic: string;
  focus?: string;
  targetLength?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string; // JWT token for auth responses
}

export interface PostResponse {
  task_id: string;
  status: string;
  live_url?: string;
  topic: string;
  ai_generated?: boolean;
}

export interface User {
  authenticated: boolean;
}
