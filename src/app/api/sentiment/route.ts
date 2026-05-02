import { NextRequest, NextResponse } from "next/server";
import { analyzeSentiment } from "@/utils/sentiment";

// External IndoBERT server URL (optional)
const SENTIMENT_URL = process.env.SENTIMENT_CORE_URL;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Truncate text if too long
    const truncatedText = text.slice(0, 512);

    // Try real IndoBERT server if configured and available
    if (SENTIMENT_URL) {
      try {
        const response = await fetch(`${SENTIMENT_URL}/api/v1/sentiment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: truncatedText }),
        });

        if (response.ok) {
          const result = await response.json();
          return NextResponse.json({
            text: truncatedText,
            sentiment: result.sentiment,
            confidence: result.confidence,
            model: "IndoBERT",
          });
        }
      } catch (e) {
        console.log("IndoBERT server unavailable, using mock...");
      }
    }

    // Use local mock sentiment analysis (default for demo)
    const result = analyzeSentiment(truncatedText);

    return NextResponse.json({
      text: truncatedText,
      sentiment: result.sentiment,
      confidence: result.confidence,
      model: result.model,
    });

  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
