"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import type { AspectResponse } from "./types";
import PostSelector from "../sentiment-core/post-selector";

export default function AspectAnalyze() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("id");
  const [contentId, setContentId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);

  // Fetch post content when a post is selected
  useEffect(() => {
    if (selectedPostIds.length > 0) {
      const postId = selectedPostIds[0];
      setContentId(postId.toString());

      fetch(`/api/posts/${postId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.content) {
            setText(data.content);
          }
        })
        .catch(() => {});
    } else {
      setText("");
      setContentId("");
    }
  }, [selectedPostIds]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    // Content ID is REQUIRED - must exist in database
    if (!contentId) {
      setError("Content ID is required. Please provide a valid content_id from the database (e.g., 1616, 1617, 1618)");
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      const response = await fetch("/api/ai-gateway/aspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language,
          content_id: parseInt(contentId),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze aspects");
      }

      const data: AspectResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const getAspectBadge = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "bg-green-500/10 text-green-500 border-green-500/20",
      negative: "bg-red-500/10 text-red-500 border-red-500/20",
      neutral: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[sentiment] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Aspect-Based Sentiment Analysis</h3>
            <p className="text-sm text-muted-foreground">Extract aspects and their sentiments</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Post Selector */}
      <PostSelector
        selectedPostIds={selectedPostIds}
        onSelectionChange={(ids) => {
          setSelectedPostIds(ids.slice(0, 1));
        }}
        maxSelections={1}
      />

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Text {selectedPostIds.length > 0 && <span className="text-xs text-muted-foreground">(Dari post yang dipilih)</span>}
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (selectedPostIds.length > 0) {
                  setSelectedPostIds([]);
                }
              }}
              placeholder="Masukkan teks untuk dianalisis atau pilih dari list post di atas..."
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="id">Indonesian</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Content ID (Required)* {selectedPostIds.length > 0 && <span className="text-xs text-muted-foreground">(Dari post yang dipilih)</span>}
              </label>
              <input
                type="number"
                value={contentId}
                onChange={(e) => {
                  setContentId(e.target.value);
                  if (selectedPostIds.length > 0) {
                    setSelectedPostIds([]);
                  }
                }}
                placeholder="e.g., 1616, 1617, 1618"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Must be a valid content_id from raw_social_posts table
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
              className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {result && result.content_id && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="mb-4 font-semibold">Analysis Results</h4>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Aspects Analyzed: {result.aspects_analyzed || 0}</p>
              <p>Content ID: {result.content_id}</p>
            </div>

            {result.results && result.results.length > 0 ? (
              <div className="space-y-3">
                {result.results.map((item, index) => (
                  <div key={index} className="rounded-lg bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.aspect || "Unknown"}</p>
                        <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-medium ${getAspectBadge(item.sentiment || "neutral")}`}>
                          {(item.sentiment || "neutral").charAt(0).toUpperCase() + (item.sentiment || "neutral").slice(1)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="font-medium">{((item.confidence || 0) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/20 p-8 text-center">
                <p className="text-muted-foreground">No aspects detected in the text</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
