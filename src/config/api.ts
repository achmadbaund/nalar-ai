/**
 * API Configuration
 * All API base URLs are loaded from environment variables
 */

declare const process: { env: Record<string, string | undefined> };

export const API_CONFIG = {
  sentimentCore: {
    baseUrl: process.env.SENTIMENT_CORE_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  apifySocial: {
    baseUrl: process.env.APIFY_SOCIAL_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  aspectSentiment: {
    baseUrl: process.env.ASPECT_SENTIMENT_SERVICE_URL || process.env.ASPECT_SENTIMENT_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  emotionDetection: {
    baseUrl: process.env.EMOTION_DETECTION_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  entitySentiment: {
    baseUrl: process.env.ENTITY_SENTIMENT_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  topicAnalyzer: {
    baseUrl: process.env.TOPIC_ANALYZER_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  trendAnalyzer: {
    baseUrl: process.env.TREND_ANALYZER_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  modelManagement: {
    baseUrl: process.env.MODEL_MANAGEMENT_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  aiGateway: {
    baseUrl: process.env.AI_GATEWAY_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  batchProcessor: {
    baseUrl: process.env.BATCH_PROCESSOR_URL || "",
    get url() {
      return this.baseUrl;
    },
  },
  printMediaOcr: {
    baseUrl: process.env.PRINT_MEDIA_OCR_URL || process.env.PRINT_MEDIA_SERVICE_URL || "",
    // baseUrl untuk health endpoint (tanpa /api/v1)
    get baseUrlOnly() {
      return this.baseUrl.replace(/\/api\/v1\/?$/, "");
    },
    // url untuk endpoint lain (dengan /api/v1)
    get url() {
      // Jika baseUrl sudah include /api/v1, return langsung
      if (this.baseUrl.includes("/api/v1")) {
        return this.baseUrl;
      }
      // Jika baseUrl hanya base URL tanpa path, tambahkan /api/v1
      return `${this.baseUrl}/api/v1`;
    },
  },
  onlineMedia: {
    baseUrl: process.env.ONLINE_MEDIA_URL || "http://localhost:8000",
    get url() {
      return `${this.baseUrl}/api/v1`;
    },
  },
  broadcastMedia: {
    baseUrl: process.env.BROADCAST_MEDIA_URL || "",
    get url() {
      return `${this.baseUrl}/api/v1`;
    },
  },
  facebookService: {
    baseUrl: process.env.FACEBOOK_SERVICE_URL || "",
    // baseUrl untuk health endpoint (tanpa /api/v1)
    get baseUrlOnly() {
      return this.baseUrl.replace(/\/api\/v1\/?$/, "");
    },
    // url untuk endpoint lain (dengan /api/v1)
    get url() {
      // Jika baseUrl sudah include /api/v1, return langsung
      if (this.baseUrl.includes("/api/v1")) {
        return this.baseUrl;
      }
      // Jika baseUrl hanya base URL tanpa path, tambahkan /api/v1
      return `${this.baseUrl}/api/v1`;
    },
  },
  // Data Cleaning API (cleaned-data, sample-sources, cleaning-history, etc)
  // Same backend as celery-task-orchestration
  cleaningBackend: {
    baseUrl: process.env.CELERY_TASK_ORCHESTRATION_URL || "http://celery-task-orchestration:9009",
    get url() {
      if (!this.baseUrl) return "";
      if (this.baseUrl.includes("/api/v1")) return this.baseUrl;
      return `${this.baseUrl}/api/v1`;
    },
  },
  celeryTaskOrchestration: {
    baseUrl: process.env.CELERY_TASK_ORCHESTRATION_URL || "http://celery-task-orchestration:9009",
    // baseUrl untuk health endpoint (tanpa /api/v1)
    get baseUrlOnly() {
      if (!this.baseUrl) return "";
      return this.baseUrl.replace(/\/api\/v1\/?$/, "");
    },
    // url untuk endpoint lain (dengan /api/v1)
    get url() {
      if (!this.baseUrl) return "";
      // Jika baseUrl sudah include /api/v1, return langsung
      if (this.baseUrl.includes("/api/v1")) {
        return this.baseUrl;
      }
      // Jika baseUrl hanya base URL tanpa path, tambahkan /api/v1
      return `${this.baseUrl}/api/v1`;
    },
  },
} as const;
