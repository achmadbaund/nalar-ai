export interface ProcessingLog {
  id: number;
  source: number;
  level: "info" | "warning" | "error";
  message: string;
  details: Record<string, any>;
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  author: string | null;
  category: string | null;
  page_number: number | null;
  publication_date: string;
  newspaper_name: string;
  confidence_score: number;
  validated: boolean;
  created_at: string;
  content?: string;
  source?: number;
}

export interface Source {
  id: number;
  newspaper_name: string;
  publication_date: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  ocr_status: "pending" | "processing" | "completed" | "failed";
  ocr_started_at: string | null;
  ocr_completed_at: string | null;
  ocr_error_message: string | null;
  page_count: number | null;
  article_count: number | null;
  file_url: string | null;
  processing_duration: number | null;
  uploaded_at: string;
}



