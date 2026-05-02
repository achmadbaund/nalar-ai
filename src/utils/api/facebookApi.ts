/**
 * Facebook Service API Client
 * Semua pemanggilan melalui API route Next.js (server-side)
 * Base URL: /api/facebook-service
 */

const API_BASE_URL = "/api/facebook-service";

// Helper untuk build query params
function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

// Helper untuk handle API errors
async function handleApiError(response: Response): Promise<never> {
  try {
    const errorData = await response.json();
    const errorMessage = errorData.error || errorData.detail || `Request failed: ${response.statusText}`;
    throw new Error(errorMessage);
  } catch (jsonError: any) {
    if (jsonError.message) {
      throw jsonError;
    }
    throw new Error(`Request failed: ${response.statusText}`);
  }
}

// Types
export interface FacebookAccount {
  id: number;
  username: string;
  display_name?: string;
  profile_url?: string;
  status: "active" | "inactive" | "error";
  post_count?: number;
  last_crawled_at?: string; // Backend menggunakan last_crawled_at (dengan "ed")
  created_at: string;
  updated_at: string;
  // Additional fields from backend
  account_id?: string;
  name?: string;
  description?: string;
  active?: boolean;
  age?: number;
  crawl_count?: number;
  crawl_frequency?: number;
  crawler_type?: string;
  error_count?: number;
  followers_count?: number;
  last_error_message?: string | null;
  last_successful_crawl_at?: string;
  profile_picture_url?: string | null;
  success_count?: number;
  success_rate?: number;
  verified?: boolean;
}

export interface FacebookPost {
  id: number;
  account: number;
  account_username?: string;
  account_name?: string;
  post_id: string;
  content: string;
  url?: string;
  content_type?: string;
  source?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  reactions_count?: number;
  views_count?: number;
  posted_at?: string;
  posted_ago?: string;
  crawled_at: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  validated?: boolean;
  duplicate_of?: number;
}

export interface CrawlJob {
  id: number;
  account: number;
  account_username?: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  posts_crawled?: number;
  created_at: string;
}

export interface Statistics {
  total_accounts: number;
  active_accounts: number;
  inactive_accounts?: number;
  total_posts: number;
  total_jobs: number;
  completed_jobs?: number;
  failed_jobs?: number;
  running_jobs?: number;
  pending_jobs?: number;
  recent_posts_count?: number;
  success_rate?: number;
  // Charts & Visualizations Data
  posts_per_day?: Array<{ date: string; count: number }>;
  posts_per_week?: Array<{ week_start: string; week_end: string; count: number }>;
  posts_per_month?: Array<{ month: string; month_name: string; count: number }>;
  jobs_per_day?: Array<{ date: string; completed: number; failed: number; total: number }>;
  success_rate_over_time?: Array<{
    date: string;
    success_rate: number;
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
  }>;
  top_accounts?: Array<{ id: number; username: string; post_count: number }>;
  job_completion_timeline?: Array<{
    job_id: string;
    account_username: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number;
    posts_found: number;
    posts_saved: number;
    errors_count: number;
  }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

// Accounts API
export async function getAccounts(params?: {
  active?: boolean;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<FacebookAccount> | FacebookAccount[]> {
  const query = buildQueryParams(params || {});
  const response = await fetch(`${API_BASE_URL}/accounts${query ? `?${query}` : ""}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function getAccount(id: number): Promise<FacebookAccount> {
  const response = await fetch(`${API_BASE_URL}/accounts/${id}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function createAccount(data: {
  username: string;
  display_name?: string;
  profile_url?: string;
}): Promise<FacebookAccount> {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function updateAccount(
  id: number,
  data: Partial<{
    username: string;
    display_name: string;
    profile_url: string;
    status: "active" | "inactive";
  }>
): Promise<FacebookAccount> {
  const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function deleteAccount(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    await handleApiError(response);
  }
}

export async function triggerCrawl(id: number): Promise<{
  status: string;
  message: string;
  task_id: string;
  job_id: string;
  crawler_type: string;
}> {
  const response = await fetch(`${API_BASE_URL}/accounts/${id}/crawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function getAccountPosts(
  id: number,
  params?: {
    page?: number;
    page_size?: number;
  }
): Promise<PaginatedResponse<FacebookPost>> {
  const query = buildQueryParams(params || {});
  const response = await fetch(`${API_BASE_URL}/accounts/${id}/posts${query ? `?${query}` : ""}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function getAccountStatistics(id: number): Promise<{
  account: FacebookAccount;
  post_statistics: {
    total_posts: number;
    recent_posts_7d: number;
    average_success_rate: number | null;
    engagement: {
      avg_likes: number | null;
      avg_comments: number | null;
      avg_shares: number | null;
      max_likes: number | null;
      max_comments: number | null;
      max_shares: number | null;
    };
    posts_by_source: Array<{ source: string; count: number }>;
    posts_by_content_type: Array<{ content_type: string; count: number }>;
  };
  recent_crawl_jobs: CrawlJob[];
}> {
  const response = await fetch(`${API_BASE_URL}/accounts/${id}/statistics`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

// Posts API
export async function getPosts(params?: {
  account?: number;
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<PaginatedResponse<FacebookPost>> {
  const query = buildQueryParams(params || {});
  const response = await fetch(`${API_BASE_URL}/posts${query ? `?${query}` : ""}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function getPost(id: number): Promise<FacebookPost> {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function getTrendingPosts(
  hours: number = 24,
  params?: {
    page?: number;
    page_size?: number;
  }
): Promise<PaginatedResponse<FacebookPost>> {
  const queryParams = new URLSearchParams({ hours: String(hours) });
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.page_size) queryParams.append('page_size', String(params.page_size));
  
  const response = await fetch(`${API_BASE_URL}/posts/trending?${queryParams}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

// Jobs API
export async function getJobs(params?: {
  account?: number;
  status?: "pending" | "running" | "completed" | "failed";
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<CrawlJob>> {
  const query = buildQueryParams(params || {});
  const response = await fetch(`${API_BASE_URL}/jobs${query ? `?${query}` : ""}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

export async function getJob(id: number): Promise<CrawlJob> {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}

// Statistics API
export async function getStatistics(params?: {
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string; // Format: YYYY-MM-DD
  posts_per_day_start?: string;
  posts_per_day_end?: string;
  posts_per_week_start?: string;
  posts_per_week_end?: string;
  posts_per_month_start?: string;
  posts_per_month_end?: string;
  success_rate_start?: string;
  success_rate_end?: string;
  jobs_per_day_start?: string;
  jobs_per_day_end?: string;
  job_timeline_start?: string;
  job_timeline_end?: string;
}): Promise<Statistics> {
  const query = buildQueryParams(params || {});
  const response = await fetch(`${API_BASE_URL}/statistics${query ? `?${query}` : ""}`);
  if (!response.ok) {
    await handleApiError(response);
  }
  return response.json();
}
