"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, Search } from "lucide-react";
import { AspectResultResponse } from "./types";

export default function AspectResults() {
  const [contentId, setContentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AspectResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!contentId.trim()) {
        throw new Error("Content ID is required");
      }

      const response = await fetch(
        `/api/aspect-sentiment/results/${contentId.trim()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ||
            data.detail ||
            JSON.stringify(data.error) ||
            "Failed to get aspect results";
        throw new Error(errorMessage);
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get aspect results"
      );
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900";
      case "negative":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900";
      case "neutral":
        return "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-900";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-2'>
            Content ID <span className='text-red-500'>*</span>
          </label>
          <div className='flex gap-2'>
            <input
              type='number'
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              placeholder='12345'
              required
              className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
            <Button type='submit' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Loading...
                </>
              ) : (
                <>
                  <Search className='h-4 w-4 mr-2' />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950'>
          <div className='flex items-center gap-2'>
            <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className='space-y-4'>
          <div className='rounded-lg border border-border bg-card p-4'>
            <div className='text-sm space-y-1'>
              <div>
                <span className='text-muted-foreground'>Content ID: </span>
                <span className='font-medium'>{result.content_id}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Created At: </span>
                <span className='font-medium'>
                  {new Date(result.created_at || "").toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Total Aspects: </span>
                <span className='font-medium'>{result.results.length}</span>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            {result.results.map((aspectResult, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${getSentimentBgColor(
                  aspectResult.sentiment_label
                )}`}
              >
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-sm font-semibold capitalize'>
                    {aspectResult.aspect}
                  </h4>
                  <span
                    className={`text-xs font-semibold capitalize px-2 py-1 rounded ${getSentimentColor(
                      aspectResult.sentiment_label
                    )}`}
                  >
                    {aspectResult.sentiment_label}
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-4 text-sm mb-3'>
                  <div>
                    <span className='text-muted-foreground'>Score: </span>
                    <span className='font-medium'>
                      {(aspectResult.sentiment_score * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>
                      Mention Count:{" "}
                    </span>
                    <span className='font-medium'>
                      {aspectResult.mention_count}
                    </span>
                  </div>
                </div>

                {aspectResult.context_sentences.length > 0 && (
                  <div className='pt-3 border-t border-border'>
                    <p className='text-xs font-medium mb-2 text-muted-foreground'>
                      Context Sentences:
                    </p>
                    <ul className='space-y-1'>
                      {aspectResult.context_sentences.map((sentence, idx) => (
                        <li key={idx} className='text-xs text-muted-foreground'>
                          • {sentence}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
