export type Platform = "facebook" | "instagram" | "tiktok" | "twitter" | "youtube";

export interface CrawlResponse {
  task_id: string;
  status: string;
  mode: string;
}

export interface TaskStatus {
  task_id: string;
  status: string;
  result?: any;
  error?: string;
}

export interface CrawlerProps {
  onResponse: (response: CrawlResponse, payload?: any) => void;
  onError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export interface BatchTask {
  platform: Platform;
  task_id: string;
  status: string;
  mode: string;
}

export interface BatchCrawlResponse {
  tasks: BatchTask[];
  total: number;
  status: string;
  errors?: Array<{
    platform: Platform;
    error: string;
  }>;
}

