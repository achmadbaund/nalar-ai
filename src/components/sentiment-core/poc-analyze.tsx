"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { AnalyzePocRequest, AnalyzePocResponse } from "./types";
import ContentSelector, { SelectedContent } from "./content-selector";

export default function PocAnalyze() {
  const [text, setText] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [sourceType, setSourceType] = useState("social");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzePocResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);

  const handleContentSelect = (content: SelectedContent) => {
    setSelectedContent(content);
    setText(content.text);
    setSourceId(content.content_id.toString());

    // Map content types to backend expectation
    if (content.type === "social_media") {
      setSourceType("social");
      // Extract platform if available in meta
      if (content.meta?.platform) {
        setPlatform(content.meta.platform.toLowerCase());
      }
    } else if (content.type === "news") {
      setSourceType("online-media");
      setPlatform("online-media");
    } else if (content.type === "print") {
      setSourceType("print");
      setPlatform("print-media");
    } else if (content.type === "broadcast") {
      setSourceType("broadcast");
      setPlatform("broadcast-media");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: AnalyzePocRequest = {
        text: text.trim(),
        platform: sourceType === "social" ? platform : undefined,
        source_type: sourceType,
      };

      if (sourceId.trim()) {
        payload.source_id = parseInt(sourceId.trim());
      }

      const response = await fetch("/api/sentiment-core/analyze/poc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Failed to analyze sentiment");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze sentiment");
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
    <div className="space-y-6">
      {/* Content Selector */}
      <ContentSelector
        onSelect={handleContentSelect}
        selectedContent={selectedContent}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Text
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // Clear selection if manually changed extensively? keeping it simple
            }}
            placeholder="Masukkan text untuk dianalisis sentiment..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Minimal 10 karakter setelah preprocessing
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Platform / Source
            </label>
            <select
              value={sourceType === "social" ? platform : sourceType}
              onChange={(e) => {
                const val = e.target.value;
                if (["tiktok", "instagram", "facebook", "twitter", "youtube"].includes(val)) {
                  setPlatform(val);
                  setSourceType("social");
                } else if (val === "online-media") {
                  setPlatform("online-media");
                  setSourceType("online-media");
                } else if (val === "print") {
                  setPlatform("print-media");
                  setSourceType("print");
                } else if (val === "broadcast") {
                  setPlatform("broadcast-media");
                  setSourceType("broadcast");
                }
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <optgroup label="Social Media">
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter</option>
                <option value="youtube">YouTube</option>
              </optgroup>
              <optgroup label="Other Sources">
                <option value="online-media">Media Online</option>
                <option value="print">Media Cetak</option>
                <option value="broadcast">Broadcast (TV/Radio)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Source ID (Optional)
            </label>
            <input
              type="number"
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
              }}
              placeholder="12345"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            "Analyze Sentiment"
          )}
        </Button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg border p-4 ${getSentimentBgColor(result.sentiment)}`}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold">Analysis Result</h3>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium">Sentiment: </span>
              <span className={`text-sm font-semibold capitalize ${getSentimentColor(result.sentiment)}`}>
                {result.sentiment}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Score: </span>
                <span className="font-medium">{(result.score * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence: </span>
                <span className="font-medium">{(result.confidence * 100).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Processing Time: </span>
                <span className="font-medium">{result.processing_time ? result.processing_time.toFixed(3) + 's' : 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Text Length: </span>
                <span className="font-medium">{result.text_length} chars</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-2">Score Breakdown:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">Positive:</span>
                  <span className="font-medium">{(result.positive_score * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600 dark:text-red-400">Negative:</span>
                  <span className="font-medium">{(result.negative_score * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Neutral:</span>
                  <span className="font-medium">{(result.neutral_score * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

