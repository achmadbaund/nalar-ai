/**
 * Print Media OCR API Client
 * Semua pemanggilan melalui API route Next.js (server-side)
 * Base URL: /api/print-media-ocr
 */

const API_BASE_URL = "/api/print-media-ocr";

// Helper untuk build query params
function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

// Types
export interface ProcessingLog {
  id: number;
  source: number;
  level: "info" | "warning" | "error";
  message: string;
  details: Record<string, any>;
  created_at: string;
}

export interface ProcessingLogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
  page_size_options: number[];
  results: ProcessingLog[];
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
  sentiment_analysis?: string;
  validated: boolean;
  created_at: string;
  content?: string;
  source?: number;
  avatar_explanation?: string;
  avatar_model?: string;
}

export interface ArticlesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
  page_size_options: number[];
  results: Article[];
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

export interface SourcesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
  page_size_options: number[];
  results: Source[];
}

// Helper untuk handle error response dan extract error message
async function handleErrorResponse(response: Response): Promise<never> {
  if (response.status === 401) {
    try {
      const errorData = await response.json();
      const errorMsg = String(errorData.error || errorData.detail || "").toLowerCase();
      
      // Check for Authorization error
      if (errorMsg.includes("authorization") || errorMsg.includes("missing or invalid")) {
        throw new Error("Backend memerlukan Authorization header. Silakan cek konfigurasi backend atau hubungi administrator.");
      }
      
      // Use detail or error message if available
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      if (errorData.error) {
        throw new Error(errorData.error);
      }
    } catch (jsonError: any) {
      // If we already threw an error with message, re-throw it
      if (jsonError.message && jsonError.message.includes("Authorization")) {
        throw jsonError;
      }
      // If response is not JSON or other error, use default message
    }
    throw new Error("Container di server terputus. Silakan cek container backend Print Media OCR apakah sudah berjalan.");
  }
  
  // Handle 400 Bad Request with detailed error messages
  if (response.status === 400) {
    try {
      const errorData = await response.json();
      
      // Handle Django REST Framework error format
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      
      // Handle field-specific errors
      if (typeof errorData === 'object') {
        const fieldErrors = Object.entries(errorData)
          .map(([field, errors]: [string, any]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            return `${field}: ${errors}`;
          })
          .join('; ');
        if (fieldErrors) {
          throw new Error(fieldErrors);
        }
      }
    } catch (jsonError: any) {
      // If we already threw an error with message, re-throw it
      if (jsonError.message) {
        throw jsonError;
      }
    }
  }
  
  throw new Error(`Request failed: ${response.statusText}`);
}

// Helper untuk handle network errors
function handleApiError(error: any, defaultMessage: string): never {
  // Deteksi network errors (fetch failed, connection refused, dll)
  const errorMessage = error?.message || "";
  const errorString = String(error).toLowerCase();
  
  if (
    error instanceof TypeError ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("Network request failed") ||
    errorMessage.includes("ERR_CONNECTION_REFUSED") ||
    errorMessage.includes("connection refused") ||
    errorString.includes("connection refused") ||
    errorString.includes("err_connection_refused")
  ) {
    throw new Error("Container di server terputus. Silakan cek container backend Print Media OCR apakah sudah berjalan.");
  }
  // Jika error sudah punya message, gunakan message tersebut
  if (error.message) {
    throw error;
  }
  // Default message
  throw new Error(defaultMessage);
}

// OCR Processing Logs
export async function getProcessingLogs(params?: {
  source?: number;
  level?: "info" | "warning" | "error";
  ordering?: string;
  page?: number;
  page_size?: 25 | 50 | 100;
}): Promise<ProcessingLogsResponse> {
  try {
    const query = buildQueryParams(params || {});
    const response = await fetch(`${API_BASE_URL}/logs?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to fetch processing logs");
  }
}

// Delete Processing Log
export async function deleteProcessingLog(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
  } catch (error: any) {
    handleApiError(error, "Failed to delete processing log");
  }
}

// Print Media Articles
export async function getArticles(params?: {
  source?: number;
  validated?: boolean;
  publication_date?: string;
  newspaper_name?: string;
  category?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: 25 | 50 | 100;
}): Promise<ArticlesResponse> {
  try {
    const query = buildQueryParams(params || {});
    const response = await fetch(`${API_BASE_URL}/articles?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to fetch articles");
  }
}

export async function getArticleDetail(id: number): Promise<Article> {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to fetch article detail");
  }
}

export async function validateArticle(id: number): Promise<Article> {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${id}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to validate article");
  }
}

export async function createArticle(data: {
  source: number;
  title: string;
  content: string;
  author?: string;
  category?: string;
  page_number?: number;
  publication_date: string;
  newspaper_name: string;
  confidence_score?: number;
}): Promise<Article> {
  try {
    // Pastikan source adalah integer
    const requestData = {
      ...data,
      source: typeof data.source === 'number' ? data.source : parseInt(String(data.source)),
    };

    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to create article");
  }
}

export async function deleteArticle(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
  } catch (error: any) {
    handleApiError(error, "Failed to delete article");
  }
}

// Print Media Sources
export async function getSources(params?: {
  ocr_status?: "pending" | "processing" | "completed" | "failed";
  newspaper_name?: string;
  publication_date?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: 25 | 50 | 100;
}): Promise<SourcesResponse> {
  try {
    const query = buildQueryParams(params || {});
    const response = await fetch(`${API_BASE_URL}/sources?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to fetch sources");
  }
}

export async function uploadSource(data: FormData): Promise<Source> {
  try {
    const response = await fetch(`${API_BASE_URL}/sources`, {
      method: "POST",
      body: data,
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to upload source");
  }
}

export async function batchUploadSources(data: FormData): Promise<{
  success: number;
  failed: number;
  results: Source[];
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/sources/batch-upload`, {
      method: "POST",
      body: data,
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to batch upload sources");
  }
}

export async function processOCR(sourceId: number, forceReprocess = false): Promise<Source> {
  try {
    const response = await fetch(`${API_BASE_URL}/sources/${sourceId}/process-ocr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ force_reprocess: forceReprocess }),
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
    return response.json();
  } catch (error: any) {
    handleApiError(error, "Failed to process OCR");
  }
}

export async function deleteSource(sourceId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/sources/${sourceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      await handleErrorResponse(response);
    }
  } catch (error: any) {
    handleApiError(error, "Failed to delete source");
  }
}

