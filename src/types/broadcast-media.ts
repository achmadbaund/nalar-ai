/**
 * Broadcast Media Types
 * TypeScript types for Broadcast Media API
 */

// Channel Types
export type ChannelType = "tv" | "radio" | "podcast";

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  tv: "Television",
  radio: "Radio",
  podcast: "Podcast",
};

export const CHANNEL_TYPE_COLORS: Record<ChannelType, string> = {
  tv: "bg-blue-100 text-blue-800",
  radio: "bg-green-100 text-green-800",
  podcast: "bg-purple-100 text-purple-800",
};

// STT Status
export type SttStatus = "pending" | "processing" | "completed" | "failed";

export const STT_STATUS_LABELS: Record<SttStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export const STT_STATUS_COLORS: Record<SttStatus, string> = {
  pending: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

// File Type
export type FileType = "audio" | "video";

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  audio: "Audio",
  video: "Video",
};

// Extraction Method
export type ExtractionMethod = "interval" | "keyframe" | "manual";

export const EXTRACTION_METHOD_LABELS: Record<ExtractionMethod, string> = {
  interval: "Fixed Interval",
  keyframe: "Keyframe Detection",
  manual: "Manual Selection",
};

// Models
export interface BroadcastChannel {
  id: number;
  channel_name: string;
  channel_type: ChannelType;
  description: string | null;
  stream_url: string | null;
  active: boolean;
  last_processed_at: string | null;
  transcript_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface BroadcastChannelFormData {
  channel_name: string;
  channel_type: ChannelType;
  description?: string;
  stream_url?: string;
  active: boolean;
}

export interface BroadcastTranscript {
  id: number;
  channel: number;
  channel_name: string;
  broadcast_date: string;
  file_path: string;
  file_url: string | null;
  file_type: FileType;
  file_size: number | null;
  stt_status: SttStatus;
  transcript_text: string | null;
  transcript_with_timestamps: TranscriptSegment[] | null;
  corrected_text: string | null;
  corrections_applied: Correction[] | null;
  duration: number | null;
  confidence_score: number | null;
  word_error_rate: number | null;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Correction {
  original: string;
  corrected: string;
  position: number;
}

export interface VideoFrame {
  id: number;
  transcript: number;
  frame_number: number;
  timestamp: number;
  extraction_method: ExtractionMethod;
  file_path: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  format: string;
  is_keyframe: boolean;
  quality_score: number | null;
  blur_score: number | null;
  extracted_at: string;
  download_url?: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ChannelStatistics {
  channel_id: number;
  channel_name: string;
  total_transcripts: number;
  completed: number;
  processing: number;
  pending: number;
  failed: number;
  success_rate: number;
  average_confidence: number;
  last_processed_at: string | null;
}

export interface FrameStatistics {
  transcript_id: number;
  total_frames: number;
  keyframes: number;
  average_quality: number | null;
  average_blur: number | null;
  frames_by_method: Record<string, number>;
}

export interface UploadResponse {
  status: string;
  transcript_id: number;
  file_path: string;
  task_id?: string;
}

export interface BatchUploadResponse {
  status: string;
  total_files: number;
  transcripts: {
    transcript_id: number;
    file_path: string;
  }[];
}

export interface ProcessSttResponse {
  status: string;
  transcript_id: number;
  task_id: string;
}

export interface ExtractFramesResponse {
  status: string;
  transcript_id: number;
  frames_extracted: number;
  task_id?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  minio: string;
  celery?: string;
  timestamp: string;
}

// Helper function to format duration
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Helper function to format file size
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Helper function to format confidence score
export function formatConfidence(score: number | null): string {
  if (score === null || score === undefined) return "-";
  return `${(score * 100).toFixed(1)}%`;
}
