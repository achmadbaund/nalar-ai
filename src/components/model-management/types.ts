// Model Management Type Definitions

// Service Info & Health Check
export interface ServiceInfo {
  service: string;
  version: string;
  status: string;
  module: string;
}

export interface HealthCheck {
  status: string;
}

// Model Registry
export type ModelType = "sentiment" | "emotion" | "topic" | "aspect" | "entity";
export type ModelFormat = "pytorch" | "onnx" | "pickle";

export interface Model {
  id: number;
  model_name: string;
  model_type: ModelType;
  version: string;
  format: ModelFormat;
  file_path: string;
  file_size_mb: number;
  accuracy_score: number;
  is_active: boolean;
  model_metadata: Record<string, any>;
  created_at: string;
}

export interface ModelsResponse {
  models: Model[];
  total: number;
}

export interface ModelsQuery {
  model_type?: ModelType;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// Model Versions
export interface ModelVersion {
  version: string;
  format: ModelFormat;
  is_active: boolean;
  created_at: string;
}

export interface ModelVersions {
  model_name: string;
  versions: ModelVersion[];
  total: number;
}

export interface ActiveModel {
  id: number;
  model_name: string;
  version: string;
  format: ModelFormat;
  is_active: boolean;
  file_path: string;
  file_size_mb: number;
  accuracy_score: number;
  created_at: string;
}

// Model Comparison
export interface CompareRequest {
  model_name: string;
  version1: string;
  version2: string;
}

export interface ModelVersionInfo {
  version: string;
  format: ModelFormat;
  file_size_mb: number;
  accuracy_score: number;
  created_at: string;
}

export interface Comparison {
  size_diff_mb: number;
  size_diff_percent: number;
  accuracy_diff: number;
  accuracy_improvement: boolean;
}

export interface CompareResponse {
  model_name: string;
  version1: ModelVersionInfo;
  version2: ModelVersionInfo;
  comparison: Comparison;
}

// Register Model
export interface RegisterRequest {
  file: File;
  model_name: string;
  model_type: ModelType;
  version: string;
  format: ModelFormat;
  accuracy_score?: number;
  is_active?: boolean;
  model_metadata?: string;
}

export interface RegisterResponse {
  id: number;
  model_name: string;
  model_type: ModelType;
  version: string;
  format: ModelFormat;
  file_path: string;
  file_size_mb: number;
  accuracy_score: number;
  is_active: boolean;
  created_at: string;
}

// ONNX Conversion
export interface ConvertOnnxRequest {
  model_name: string;
  version: string;
  input_shape?: number[];
  input_names?: string[];
  output_names?: string[];
}

export interface ConvertOnnxResponse {
  success: boolean;
  message: string;
  converted_model_path?: string;
  new_version?: string;
  conversion_time?: number;
}

// Quantization
export type QuantizationType = "dynamic" | "static";

export interface QuantizeRequest {
  model_name: string;
  version: string;
  quantization_type: QuantizationType;
}

export interface QuantizeResponse {
  success: boolean;
  message: string;
  quantized_model_path?: string;
  new_version?: string;
  original_size_mb?: number;
  quantized_size_mb?: number;
  size_reduction_percent?: number;
  quantization_time?: number;
}

// Hot-Swap
export interface HotSwapRequest {
  model_name: string;
  version: string;
  rollback_on_failure?: boolean;
}

export interface HotSwapResponse {
  success: boolean;
  message: string;
  previous_version?: string;
  new_active_version?: string;
  affected_services?: string[];
  rollback_performed?: boolean;
}

// Statistics Summary
export interface ModelStatisticsSummary {
  total_models: number;
  active_models: number;
  total_storage_mb: number;
  models_by_type: {
    sentiment: number;
    emotion: number;
    topic: number;
    aspect: number;
    entity: number;
  };
}
