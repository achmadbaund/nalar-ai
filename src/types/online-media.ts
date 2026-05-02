/**
 * Types for Online Media Crawler API
 */

export interface NewsSource {
  id: number;
  name: string;
  url: string;
  tier: 1 | 2 | 3;
  category: string | null;
  active: boolean;
  crawl_config: Record<string, any>;
  extraction_strategy: "generic" | "specific";
  extraction_script: Record<string, any>;
  use_llm_fallback: boolean;
  last_crawled_at: string | null;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface RawArticle {
  id: number;
  source: number;
  source_name: string;
  source_url: string;
  url: string;
  title: string | null;
  content: string | null;
  author: string | null;
  published_at: string | null;
  crawled_at: string;
  content_hash: string;
  metadata: Record<string, any>;
}

export interface DuplicateRecord {
  id: number;
  original_article: number | null;
  new_url: string;
  new_title: string | null;
  detection_method: "url" | "content" | "similarity";
  similarity_score: number | null;
  source_id: number | null;
  created_at: string;
}

export interface ExtractionLog {
  id: number;
  source: number | null;
  article_url: string;
  extraction_strategy: "specific" | "generic" | "llm";
  success: boolean;
  failure_reason: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CrawlResponse {
  status: "queued" | "success" | "duplicate" | "error";
  message: string;
  source_id?: number;
  article_id?: number;
  existing_article_id?: number;
  url?: string;
  title?: string;
}

export interface CrawlJob {
  id: number;
  source: number;
  source_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  trigger_type: 'manual' | 'scheduled';
  started_at: string;
  completed_at: string | null;
  items_crawled: number;
  error_message: string | null;
}

export type TabType = "sources" | "articles" | "crawl" | "statistics" | "tasks";

export interface NewsSourceFormData {
  name: string;
  url: string;
  tier: 1 | 2 | 3;
  category: string;
  active: boolean;
  extraction_strategy: "generic" | "specific";
  use_llm_fallback: boolean;
  crawl_config?: Record<string, any>;
  extraction_script?: Record<string, any>;
}

export const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 (High Priority - Every 1 hour)",
  2: "Tier 2 (Medium Priority - Every 6 hours)",
  3: "Tier 3 (Low Priority - Every 24 hours)",
};

export const TIER_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  2: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  3: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export const EXTRACTION_STRATEGY_LABELS: Record<string, string> = {
  generic: "Generic Crawl4AI",
  specific: "Specific Script",
};
