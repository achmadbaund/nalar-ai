// Trend Analyzer Type Definitions

// Service Info & Health Check
export interface ServiceInfo {
  service: string;
  version: string;
  status: string;
}

export interface HealthCheck {
  status: string;
}

// Trend Analysis
export type TrendGranularity = "single" | "daily";

export interface TrendAnalyzeRequest {
  start_date: string;
  end_date: string;
  target_date?: string;
  granularity?: TrendGranularity;
}

export interface TrendStatistics {
  mean: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  median: number;
}

// Breakdown Analysis Types
export interface BreakdownDataPoint {
  label: string;
  sentiment_score: number;
  count: number;
  percentage: number;
}

export interface TrendBreakdowns {
  by_source: BreakdownDataPoint[];
  by_topic: BreakdownDataPoint[];
  by_hour: BreakdownDataPoint[];
  by_day: BreakdownDataPoint[];
  total_posts: number;
}

export interface TrendAnalyzeResponse {
  date: string;
  trend_type: "upward" | "downward" | "stable";
  avg_sentiment_score: number;
  moving_average_7d: number | null;
  moving_average_30d: number | null;
  has_spike: boolean;
  spike_percentage: number | null;
  spike_direction: "positive" | "negative" | null;
  has_anomaly: boolean;
  anomaly_description: string | null;
  anomaly_method: string | null;
  statistics: TrendStatistics | null;
  breakdowns?: TrendBreakdowns; // Optional breakdown analysis (single mode only)
}

// Type guard for checking if response is an array (daily granularity)
export function isTrendAnalyzeArray(
  response: TrendAnalyzeResponse | TrendAnalyzeResponse[]
): response is TrendAnalyzeResponse[] {
  return Array.isArray(response);
}

// Type for API response that can be either single or array
export type TrendAnalyzeApiResponse = TrendAnalyzeResponse | TrendAnalyzeResponse[];

// Trend Results
export interface TrendResult {
  id: number;
  date: string;
  trend_type: string;
  avg_sentiment_score: number;
  moving_average_7d: number;
  moving_average_30d?: number;
  has_spike: boolean;
  spike_percentage?: number;
  spike_direction?: string;
  has_anomaly?: boolean;
  anomaly_description?: string | null;
  anomaly_method?: string;
  created_at: string;
}

export interface TrendResultsQuery {
  date?: string;
  start_date?: string;
  end_date?: string;
  trend_type?: string;
  has_spike?: boolean;
  has_anomaly?: boolean;
}

export interface TrendResultsResponse extends TrendResult {}

// Virality Prediction
export interface ViralityPredictRequest {
  sentiment_score: number; // Required, 0-1
  emotion_distribution?: Record<string, number>;
  topic_category?: string;
  credibility_score?: number;
  source_type?: string;
  early_engagement_rate?: number;
}

export interface ViralityFeatures {
  sentiment_score: number;
  emotion_intensity: number;
  topic_trending: number;
  source_credibility: number;
  temporal_factor: number;
}

export interface ViralityPredictResponse {
  is_viral: boolean;
  virality_score: number;
  rule_based_score: number;
  ml_score: number | null;
  threshold: number;
  features: ViralityFeatures;
}

// Sentiment Aggregation
export type AggregationType = "daily" | "weekly" | "monthly";

export interface AggregateRequest {
  start_date: string;
  end_date: string;
  aggregation_type: AggregationType;
}

export interface AggregateDataPoint {
  date: string;
  sentiment_score: number;
  count: number;
}

export interface AggregateResponse {
  aggregation_type: AggregationType;
  start_date: string;
  end_date: string;
  data: AggregateDataPoint[];
  count: number;
}

// Statistics Summary
export interface TrendStatisticsSummary {
  total_trends_detected: number;
  total_spikes_detected: number;
  avg_trend_duration?: number;
  most_common_trend_type?: string;
  date_range?: {
    earliest: string;
    latest: string;
  };
  trend_type_counts?: {
    upward: number;
    downward: number;
    stable: number;
  };
}

// Dashboard Widget Data
export interface TrendAnalyzerStats {
  total_trends: number;
  total_spikes: number;
  avg_sentiment: number;
  trend_type_counts: {
    upward: number;
    downward: number;
    stable: number;
  };
  recent_trends: TrendResult[];
}

// Posts by Topic
export interface TopicSamplePost {
  id: number;
  platform: string;
  content: string;
  posted_at: string | null;
  url: string | null;
  sentiment_score: number;
  sentiment_label: string;
  topic: string;
}

export interface TopicSamplesResponse {
  topic: string;
  count: number;
  posts: TopicSamplePost[];
}

// Posts by Platform
export interface PlatformSamplePost {
  id: number;
  platform: string;
  content: string;
  posted_at: string | null;
  url: string | null;
  sentiment_score: number;
  sentiment_label: string;
  topic: string;
}

export interface PlatformSamplesResponse {
  platform: string;
  count: number;
  posts: PlatformSamplePost[];
}

// Posts by Date
export interface PostDetail {
  id: number;
  platform: string;
  content: string;
  posted_at: string | null;
  url: string | null;
  sentiment_score: number;
  sentiment_label: string;
  topic: string;
}

export interface PostsByDateResponse {
  date: string;
  total_count: number;
  posts: PostDetail[];
}
