export interface AnalyzePocRequest {
  text: string;
  source_id?: number;
  platform?: string;
  source_type?: string;
}

export interface AnalyzePocResponse {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  confidence: number;
  positive_score: number;
  negative_score: number;
  neutral_score: number;
  processing_time: number;
  mode: string;
  platform?: string;
  text_length: number;
}

export interface AnalyzeRequest {
  content_id: number;
  content: string;
  source_type?: string;
}

export interface AnalyzeResponse {
  content_id: number;
  sentiment_label: "positive" | "negative" | "neutral";
  sentiment_score: number;
  confidence: number;
  positive_score: number;
  negative_score: number;
  neutral_score: number;
  processing_time: number;
  model_version: string;
}

export interface BatchItem {
  content_id: number;
  content?: string;
  source_type?: string;
}

export interface BatchRequest {
  items: Array<{
    content_id: number;
    content?: string;
  }>;
  process_all?: boolean;
}

export interface BatchResponse {
  results: Array<{
    content_id: number;
    sentiment_label: "positive" | "negative" | "neutral";
    sentiment_score: number;
    confidence: number;
    processing_time: number | null;
  }>;
  total_items: number;
  processing_time: number;
}

export interface StatisticsResponse {
  summary: {
    total_posts_analyzed: number;
    date_range: {
      from: string;
      to: string;
    };
    avg_processing_time: number;
    avg_confidence: number;
  };
  sentiment_distribution: {
    positive: {
      count: number;
      percentage: number;
      avg_score: number;
    };
    negative: {
      count: number;
      percentage: number;
      avg_score: number;
    };
    neutral: {
      count: number;
      percentage: number;
      avg_score: number;
    };
  };
  platform_breakdown: {
    [platform: string]: {
      count: number;
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  performance_metrics: {
    latency_percentiles: {
      p50: number;
      p95: number;
      p99: number;
      max: number;
    };
    confidence_distribution: {
      high: number;
      medium: number;
      low: number;
    };
    text_length_stats: {
      avg: number;
      min: number;
      max: number;
    };
  };
  hourly_trend: Array<{
    hour: string;
    count: number;
    positive: number;
    negative: number;
    neutral: number;
  }>;
}

export interface PocPost {
  id: number;
  raw_social_post_id: number;
  platform: string;
  sentiment_label: "positive" | "negative" | "neutral";
  sentiment_score: number;
  confidence: number;
  positive_score: number;
  negative_score: number;
  neutral_score: number;
  processing_time: number;
  text_length: number;
  text_preview: string;
  created_at: string;
}

export interface PocPostsResponse {
  total: number;
  limit: number;
  offset: number;
  posts: PocPost[];
}

export interface ProductionResult {
  id: number;
  content_id: number;
  sentiment_label: "positive" | "negative" | "neutral";
  sentiment_score: number;
  confidence: number;
  positive_score: number;
  negative_score: number;
  neutral_score: number;
  processing_time: number;
  model_version: string;
  created_at: string;
}

export interface ProductionResultsResponse {
  total: number;
  limit: number;
  offset: number;
  results: ProductionResult[];
}

