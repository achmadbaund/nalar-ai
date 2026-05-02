import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const ASPECT_SENTIMENT_URL = API_CONFIG.aspectSentiment.url;
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
      delete body.process_all; // Remove process_all flag before sending to aspect sentiment API
    }
    
    // Log the payload being sent for debugging
    console.log("Batch request payload:", JSON.stringify(body, null, 2));

    const response = await fetch(`${ASPECT_SENTIMENT_URL}/api/v1/aspect/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || response.statusText };
      }
      
      console.error("Batch API error:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      
      return NextResponse.json(
        { 
          error: errorData.detail || errorData.message || errorData.error || `Failed to analyze batch: ${response.statusText}`,
          details: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error analyzing batch:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze batch",
      },
      { status: 500 },
    );
  }
}


