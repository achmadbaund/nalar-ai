"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Link2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { CrawlResponse } from "@/types/online-media";
import { cn } from "@/lib/utils";

export default function ManualCrawler() {
  const [url, setUrl] = useState("");
  const [sourceId, setSourceId] = useState<string>("");
  const [useLlmFallback, setUseLlmFallback] = useState(true);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CrawlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const payload: any = {
        url: url.trim(),
        use_llm_fallback: useLlmFallback,
      };

      if (sourceId.trim()) {
        payload.source_id = Number(sourceId);
      }

      const res = await fetch("/api/online-media/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok && !data.status) {
        throw new Error(data.error || "Failed to crawl URL");
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to crawl URL");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case "duplicate":
        return <AlertCircle className='h-5 w-5 text-yellow-500' />;
      case "error":
        return <XCircle className='h-5 w-5 text-red-500' />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case "duplicate":
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
      case "error":
        return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800";
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-semibold mb-2'>Manual URL Crawler</h2>
        <p className='text-sm text-muted-foreground'>
          Crawl a single URL manually. The article will be extracted, checked
          for duplicates, and saved to the database.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* URL Input */}
        <div>
          <label className='block text-sm font-medium mb-1'>
            URL to Crawl *
          </label>
          <div className='relative'>
            <Link2 className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <input
              type='url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='https://example.com/article'
              className='w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm'
              required
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Source ID */}
          <div>
            <label className='block text-sm font-medium mb-1'>
              Source ID (Optional)
            </label>
            <input
              type='number'
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder='Leave empty for auto-detect'
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
            <p className='text-xs text-muted-foreground mt-1'>
              If not provided, will try to match by URL domain
            </p>
          </div>

          {/* LLM Fallback */}
          <div className='flex items-center gap-2 pt-6'>
            <input
              type='checkbox'
              id='useLlmFallback'
              checked={useLlmFallback}
              onChange={(e) => setUseLlmFallback(e.target.checked)}
              className='h-4 w-4'
            />
            <label htmlFor='useLlmFallback' className='text-sm'>
              Use LLM Fallback if extraction fails
            </label>
          </div>
        </div>

        <Button type='submit' disabled={loading}>
          {loading ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              Crawling...
            </>
          ) : (
            "Start Crawl"
          )}
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <div className='bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center gap-2'>
          <XCircle className='h-5 w-5 flex-shrink-0' />
          <span>{error}</span>
        </div>
      )}

      {/* Response */}
      {response && (
        <div
          className={cn(
            "border rounded-lg p-4",
            getStatusColor(response.status)
          )}
        >
          <div className='flex items-start gap-3'>
            {getStatusIcon(response.status)}
            <div className='flex-1'>
              <h3 className='font-medium capitalize'>{response.status}</h3>
              <p className='text-sm mt-1'>{response.message}</p>

              {response.url && (
                <div className='mt-3 text-sm'>
                  <span className='text-muted-foreground'>URL: </span>
                  <a
                    href={response.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 dark:text-blue-400 hover:underline break-all'
                  >
                    {response.url}
                  </a>
                </div>
              )}

              {response.title && (
                <div className='mt-2 text-sm'>
                  <span className='text-muted-foreground'>Title: </span>
                  <span className='font-medium'>{response.title}</span>
                </div>
              )}

              {response.article_id && (
                <div className='mt-2 text-sm'>
                  <span className='text-muted-foreground'>Article ID: </span>
                  <span className='font-medium'>{response.article_id}</span>
                </div>
              )}

              {response.existing_article_id && (
                <div className='mt-2 text-sm'>
                  <span className='text-muted-foreground'>
                    Existing Article ID:{" "}
                  </span>
                  <span className='font-medium'>
                    {response.existing_article_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
