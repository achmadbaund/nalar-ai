export interface EmotionAnalyzeRequest {
  content_id: number;
  text?: string;
}

export interface EmotionAnalyzeResponse {
  content_id: number;
  dominant_emotion: "anger" | "joy" | "sadness" | "fear" | "surprise";
  anger_score: number;
  joy_score: number;
  sadness_score: number;
  fear_score: number;
  surprise_score: number;
  id: number;
  created_at: string;
}

export interface EmotionBatchItem {
  content_id: number;
  text?: string;
}

export interface EmotionBatchRequest {
  items: EmotionBatchItem[];
}

export interface EmotionBatchResponse {
  results: EmotionAnalyzeResponse[];
  total: number;
  success: number;
  failed: number;
}

export interface EmotionResultsResponse extends EmotionAnalyzeResponse {}

export interface AllEmotionResultsResponse {
  total: number;
  skip: number;
  limit: number;
  results: EmotionAnalyzeResponse[];
}

