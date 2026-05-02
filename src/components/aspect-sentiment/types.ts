export interface AspectSentimentResult {
  aspect: string;
  sentiment_label: "positive" | "negative" | "neutral";
  sentiment_score: number;
  mention_count: number;
  context_sentences: string[];
}

export interface AspectAnalyzeRequest {
  content_id: number;
  text?: string;
  content_type?: string;
}

export interface AspectAnalyzeResponse {
  content_id: number;
  aspects_analyzed: number;
  results: AspectSentimentResult[];
}

export interface AspectResultResponse {
  content_id: number;
  results: AspectSentimentResult[];
  created_at?: string;
}

export interface AllAspectResultItem {
  content_id: number;
  aspect: string;
  sentiment_label: string;
  sentiment_score: number;
  mention_count: number;
  context_sentences: string[];
  created_at?: string;
}

export interface AllAspectResultsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: AllAspectResultItem[];
}
