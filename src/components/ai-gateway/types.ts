// Service Info
export interface ServiceInfo {
  service: string;
  version: string;
  status: string;
  port: number;
  endpoints: {
    sentiment: string;
    aspect: string;
    entity: string;
    emotion: string;
    topic: string;
    trend: string;
    batch: string;
  };
}

// Health Check
export interface HealthCheck {
  status: string;
  service: string;
  version: string;
  checks: {
    database: string;
    redis: string;
  };
}

// AI Analysis Request (common for all)
export interface AnalysisRequest {
  text: string;
  language: string;
  content_id: number; // REQUIRED - must be valid content_id from raw_social_posts table
}

// Trend Analysis Request
export interface TrendAnalysisRequest {
  start: string; // Start date (YYYY-MM-DD)
  end: string; // End date (YYYY-MM-DD)
}

// Trend Analysis Response
export interface TrendAnalysisResponse {
  date: string;
  trend_type: "upward" | "downward" | "stable";
  avg_sentiment_score: number;
  moving_average_7d: number;
  moving_average_30d: number;
  has_spike: boolean;
  spike_percentage: number;
  spike_direction: "positive" | "negative";
  has_anomaly: boolean;
  anomaly_description: string | null;
  anomaly_method: string;
  statistics: {
    mean: number;
    std: number;
    variance: number;
    min: number;
    max: number;
    median: number;
  };
}

// Sentiment Analysis Response
export interface SentimentResponse {
  content_id: number;
  sentiment_label: string;
  sentiment_score: number;
  confidence: number;
  positive_score: number;
  negative_score: number;
  neutral_score: number;
  processing_time: number;
  model_version: string;
}

// Aspect Analysis Response
export interface AspectResponse {
  content_id: number;
  aspects_analyzed: number;
  results: Array<{
    aspect: string;
    sentiment: string;
    confidence: number;
  }>;
}

// Entity Extraction Response
export interface EntityResponse {
  content_id: number;
  entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  total_entities: number;
}

// Emotion Detection Response
export interface EmotionResponse {
  content_id: number;
  dominant_emotion: string;
  anger_score: number;
  joy_score: number;
  sadness_score: number;
  fear_score: number;
  surprise_score: number;
  id: number;
  created_at: string;
}

// Topic Classification Response
export interface TopicResponse {
  content_id: number;
  primary_topic: string;
  primary_topic_score: number;
  topic_distribution: Record<string, number>;
  keywords: string[];
  classification: {
    categories: Record<string, number>;
    primary_category: string;
    primary_category_score: number;
  };
  id: number;
  created_at: string;
}

// Batch Submit Request
export interface BatchSubmitRequest {
  service: BatchServiceType;
  items: Array<{
    id: string;
    text: string;
    language: string;
    content_id: number; // REQUIRED for each item
  }>;
}

// Batch Submit Response
export interface BatchSubmitResponse {
  status: string;
  job_id: string;
  service: string;
  total_items: number;
  estimated_time_seconds: number;
  status_url: string;
}

// Batch Status Response
export interface BatchStatusResponse {
  status: string;
  job_id: string;
  service: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  results: Array<{
    id: string;
    result: any;
    status: string;
  }>;
  error_message: string | null;
  created_at: string;
  completed_at: string;
}

// Dashboard Statistics
export interface AIGatewayStats {
  total_requests: number;
  active_services: number;
  cache_hit_rate: number;
  avg_response_time: number;
  requests_by_service: {
    sentiment: number;
    aspect: number;
    entity: number;
    emotion: number;
    topic: number;
    trend: number;
  };
}

// Service Types
export type ServiceType = "sentiment" | "aspect" | "entity" | "emotion" | "topic" | "trend";

// Batch Service Types (trend not supported - uses GET with date params)
export type BatchServiceType = "sentiment" | "aspect" | "entity" | "emotion" | "topic";
