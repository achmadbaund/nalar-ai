import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const SERVICE_URLS: Record<string, string> = {
  "apify-social": `${API_CONFIG.apifySocial.url}/health`,
  "sentiment-core": `${API_CONFIG.sentimentCore.url}/api/v1/sentiment/health`,
  "aspect-sentiment": `${API_CONFIG.aspectSentiment.url}/health`,
  "emotion-detection": `${API_CONFIG.emotionDetection.url}/health`,
  "entity-sentiment": `${API_CONFIG.entitySentiment.url}/health`,
  "topic-analyzer": `${API_CONFIG.topicAnalyzer.url}/health`,
  "trend-analyzer": `${API_CONFIG.trendAnalyzer.url}/health`,
  "model-management": `${API_CONFIG.modelManagement.url}/health`,
  "ai-gateway": `${API_CONFIG.aiGateway.url}/api/v1/health`,
  "print-media-ocr": `${API_CONFIG.printMediaOcr.baseUrlOnly}/health/`,
  "facebook-service": `${API_CONFIG.facebookService.baseUrlOnly}/health/`,
  "online-media": `${API_CONFIG.onlineMedia.baseUrl}/api/health/`,
  "broadcast-media": `${API_CONFIG.broadcastMedia.baseUrl}/api/v1/health/`,
  "celery-task-orchestration": `${API_CONFIG.celeryTaskOrchestration.baseUrlOnly}/health`,
  "core-cleaning-engine": `${API_CONFIG.celeryTaskOrchestration.baseUrlOnly}/health`,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  let serviceId: string = "unknown";
  try {
    const resolvedParams = await params;
    serviceId = resolvedParams.serviceId;

    const serviceUrl = SERVICE_URLS[serviceId];

    if (!serviceUrl) {
      console.error(`Service ${serviceId} not found in SERVICE_URLS`);
      return NextResponse.json(
        { error: `Service ${serviceId} not found` },
        { status: 404 }
      );
    }

    // Mock health check response for demo when URL is empty, localhost, or relative path
    if (!serviceUrl || serviceUrl.includes("localhost") || serviceUrl.includes("undefined") || serviceUrl.startsWith("/")) {
      return NextResponse.json({
        status: serviceId === "print-media-ocr" ? "healthy" : "unknown",
        service: serviceId,
        version: "1.0.0",
        message: serviceId === "print-media-ocr" ? "Mock service - backend not running" : "Service not configured",
      }, { status: 200 });
    }

    // Log untuk debugging di production
    console.log(`[Health Check] Checking ${serviceId} at ${serviceUrl}`);
    console.log(`[Health Check] Environment:`, {
      FACEBOOK_SERVICE_URL: process.env.FACEBOOK_SERVICE_URL,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Create AbortController untuk timeout (10 detik)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(serviceUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Disable cache untuk mendapatkan data terbaru
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle fetch error (network, timeout, dll)
      console.error(`Failed to fetch health from ${serviceUrl}:`, fetchError);

      // Check if it's an abort error (timeout)
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error("Health check timeout");
      }

      throw new Error(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to fetch health status"
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`Health check failed for ${serviceId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return NextResponse.json(
        {
          error: `Failed to fetch health status: ${response.statusText}`,
          status: response.status,
          service: serviceId,
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => {
      // Jika response bukan JSON, return default
      return {
        status: "unknown",
        service: serviceId,
        error: "Invalid JSON response",
      };
    });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    // Detailed error logging untuk debugging
    const errorDetails = {
      serviceId,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      serviceUrl: SERVICE_URLS[serviceId],
      env: {
        FACEBOOK_SERVICE_URL: process.env.FACEBOOK_SERVICE_URL,
      },
    };
    console.error(`[Health Check Error]`, errorDetails);

    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Health check timeout",
          service: serviceId,
          message: "Service did not respond within timeout period",
          serviceUrl: SERVICE_URLS[serviceId],
        },
        { status: 504 } // Gateway Timeout
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: "Failed to connect to service",
          service: serviceId,
          message: error.message,
          serviceUrl: SERVICE_URLS[serviceId],
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch service health status",
        service: serviceId,
        serviceUrl: SERVICE_URLS[serviceId],
        details:
          process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
