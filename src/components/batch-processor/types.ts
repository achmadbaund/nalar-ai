export interface BatchProcessItem {
  content_id: number;
  source?: string;
  text?: string;
}

export interface BatchProcessRequest {
  items: BatchProcessItem[];
  process_all?: boolean;
}

export interface BatchProcessResponse {
  job_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface BatchJob {
  id: number;
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_items: number | null;
  processed_items: number | null;
  failed_items: number | null;
  progress_percentage: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface BatchJobsResponse extends Array<BatchJob> { }

export interface BatchJobDetail extends BatchJob { }

