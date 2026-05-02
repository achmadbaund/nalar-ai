import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BATCH_PROCESSOR_URL = API_CONFIG.batchProcessor.url;
const POSTS_URL = `${API_CONFIG.apifySocial.url}/api/v1/posts`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If process_all is true, fetch all posts first
    if (body.process_all) {
      console.log("Processing all posts - fetching from database...");
      
      // Fetch all posts with pagination
      let allPostIds: number[] = [];
      let offset = 0;
      const limit = 100; // Fetch in batches
      let hasMore = true;

      while (hasMore) {
        const postsResponse = await fetch(`${POSTS_URL}?limit=${limit}&offset=${offset}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!postsResponse.ok) {
          throw new Error("Failed to fetch posts from database");
        }

        const postsData = await postsResponse.json();
        
        if (postsData.data && postsData.data.length > 0) {
          const postIds = postsData.data.map((post: any) => post.id);
          allPostIds = [...allPostIds, ...postIds];
          
          // Check if there are more posts
          if (postsData.pagination && postsData.pagination.has_next) {
            offset += limit;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Fetched ${allPostIds.length} posts from database`);

      // Create batch request with all post IDs
      body.items = allPostIds.map((postId: number) => ({
        content_id: postId,
      }));
      delete body.process_all; // Remove process_all flag before sending to batch processor API
    }
    
    // Log the payload being sent for debugging
    console.log("Batch request payload:", JSON.stringify(body, null, 2));

    const response = await fetch(`${BATCH_PROCESSOR_URL}/api/v1/batch/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to process batch: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error processing batch:", error);
    
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: `Cannot connect to batch processor service at ${BATCH_PROCESSOR_URL}. Please ensure the service is running.`,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process batch",
      },
      { status: 500 },
    );
  }
}

