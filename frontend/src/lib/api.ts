import axios from 'axios';
import type {
  Article,
  ScheduleConfig,
  GeneratePostRequest,
  GenerateArticleRequest,
  ApiResponse,
  PostResponse,
} from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized (401), redirect to login
    if (error.response?.status === 401) {
      // Clear any stale auth state
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (password: string) =>
  api.post<ApiResponse>('/api/auth/login', { password });

export const logout = () => api.post<ApiResponse>('/api/auth/logout');

// Schedule
export const getSchedule = () =>
  api.get<ScheduleConfig>('/api/schedule');

export const updateSchedule = (config: Partial<ScheduleConfig>) =>
  api.post<ApiResponse<ScheduleConfig>>('/api/schedule', config);

// Topics
export const generateTopics = (count = 5) =>
  api.post<ApiResponse<{ topics: string[] }>>('/api/generate-topics', { count });

// Posts
export const generatePost = (topic: string) =>
  api.post<ApiResponse<{ content: string }>>('/api/generate-post', { topic });

export const generatePostEmail = (topic: string) =>
  api.post<ApiResponse<{ content: string }>>('/api/generate-post-email', { topic });

export const postAction = (id: string, data: GeneratePostRequest) =>
  api.post<ApiResponse<PostResponse>>(`/api/action/${id}`, data);

// Articles
export const getArticles = () =>
  api.get<ApiResponse<{ articles: Article[] }>>('/api/articles');

export const getArticle = (id: string) =>
  api.get<ApiResponse<{ article: Article }>>(`/api/articles/${id}`);

export const generateArticle = (data: GenerateArticleRequest) =>
  api.post<ApiResponse<{ article: Article }>>('/api/articles/generate', data);

export const updateArticle = (id: string, data: Partial<Article>) =>
  api.put<ApiResponse<{ article: Article }>>(`/api/articles/${id}`, data);

export const deleteArticle = (id: string) =>
  api.delete<ApiResponse>(`/api/articles/${id}`);

export const scheduleArticle = (id: string, scheduledFor: string) =>
  api.post<ApiResponse<{ article: Article }>>(`/api/articles/${id}/schedule`, { scheduledFor });

export const postArticle = (id: string) =>
  api.post<ApiResponse<{ article: Article; task: { id: string; live_url?: string } }>>(
    `/api/articles/${id}/post`
  );

export default api;
