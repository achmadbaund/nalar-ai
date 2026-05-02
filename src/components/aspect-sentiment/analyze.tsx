"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Info, Tag } from "lucide-react";
import { AspectAnalyzeRequest, AspectAnalyzeResponse } from "./types";
import ContentSelector, { SelectedContent } from "./content-selector";

// Helper function to extract error message from API response
function getErrorMessage(data: any, fallback: string): string {
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  return fallback;
}

export default function AspectAnalyze() {
  const [contentId, setContentId] = useState("");
  const [text, setText] = useState("");
  const [contentType, setContentType] = useState<string>("news");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AspectAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);

  const handleContentSelect = (content: SelectedContent) => {
    setSelectedContent(content);
    setContentId(content.content_id.toString());
    setText(content.text);
    setContentType(content.type);

    // Clear previous results when selection changes
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!contentId.trim()) {
        throw new Error("Content ID is required");
      }

      const payload: AspectAnalyzeRequest = {
        content_id: parseInt(contentId.trim()),
        content_type: contentType
      };

      if (text.trim()) {
        payload.text = text.trim();
      }

      const response = await fetch("/api/aspect-sentiment/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to analyze aspect sentiment")
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze aspect sentiment"
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

  const aspects = [
    "kebijakan",
    "ekonomi",
    "hukum",
    "korupsi",
    "sosial",
    "lingkungan",
    "infrastruktur",
    "kesehatan",
  ];

  return (
    <div className='space-y-6'>
      {/* Content Selector */}
      <ContentSelector
        onSelect={handleContentSelect}
        selectedContent={selectedContent}
      />

      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950'>
        <div className='flex items-start gap-2'>
          <Info className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5' />
          <div className='text-sm text-blue-800 dark:text-blue-200'>
            <p className='font-medium mb-1'>Informasi:</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>
                Pilih konten dari daftar di atas atau masukkan ID dan Text secara manual.
              </li>
              <li>8 aspek yang dianalisis: {aspects.join(", ")}</li>
              <li>Minimal 1 karakter untuk text</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className='block text-sm font-medium mb-2'>
              Content ID <span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              value={contentId}
              onChange={(e) => {
                setContentId(e.target.value);
                // Allow manual override without clearing everything, but maybe clear selection match
              }}
              placeholder='12345'
              required
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
          </div>

          <div>
            <label htmlFor="contentType" className="block text-sm font-medium mb-2">
              Content Type
            </label>
            <select
              id="contentType"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
            >
              <option value="news">Online News</option>
              <option value="social_media">Social Media</option>
              <option value="print">Print Media</option>
              <option value="broadcast">Broadcast</option>
            </select>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium mb-2'>
            Text (Optional)
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            placeholder='Masukkan text untuk dianalisis aspect sentiment... (kosongkan jika ingin mengambil dari database)'
            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]'
          />
          <p className='text-xs text-muted-foreground mt-1'>
            Kosongkan untuk mengambil text dari database berdasarkan content_id
          </p>
        </div>

        <Button type='submit' disabled={loading} className='w-full'>
          {loading ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              Analyzing...
            </>
          ) : (
            "Analyze Aspect Sentiment"
          )}
        </Button>
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
          <div className='rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950'>
            <div className='flex items-center gap-2 mb-2'>
              <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
              <h3 className='text-sm font-semibold'>Analysis Result</h3>
            </div>
            <div className='text-sm'>
              <span className='text-muted-foreground'>Content ID: </span>
              <span className='font-medium'>{result.content_id}</span>
            </div>
            <div className='text-sm'>
              <span className='text-muted-foreground'>Aspects Analyzed: </span>
              <span className='font-medium'>{result.aspects_analyzed}</span>
            </div>
          </div>

          <div className='space-y-3'>
            {result.results.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No aspects detected in the text.
              </div>
            ) : (
              result.results.map((aspectResult, index) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
