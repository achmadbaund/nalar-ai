import { RawArticle, NewsSource } from "./online-media";

export type TabType = "uncleaned" | "cleaned" | "tasks" | "statistics" | "engine";
export type DataSourceType = "online-media" | "social-media" | "print-media" | "broadcast-media";

export interface UncleanedRecord {
    id: number | string;
    source_type: DataSourceType;
    source_name: string;
    title: string | null;
    content: string | null; // Preview text
    url: string | null;
    published_at: string | null;
    crawled_at: string;
    original_data: any; // Store full object here
}

export interface CleaningTask {
    id: string;
    component_id: string;
    component_name: string;
    status: "pending" | "processing" | "completed" | "failed";
    created_at: string;
    completed_at: string | null;
    total_items: number;
    success_count: number;
    failed_count: number;
    error_message: string | null;
}

export interface CleanedDataRecord {
    id: string;
    original_id: string | number;
    title: string;
    source_type: DataSourceType;
    cleaned_content: string;
    cleaning_pipeline_id: string;
    cleaned_at: string;
    quality_score: number | null;
    metadata: Record<string, any>;
}

export interface CleaningOperation {
    value: string;
    label: string;
    description: string;
}
