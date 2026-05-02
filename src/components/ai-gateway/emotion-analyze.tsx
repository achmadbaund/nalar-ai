"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import type { EmotionResponse } from "./types";
import PostSelector from "../sentiment-core/post-selector";

export default function EmotionAnalyze() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("id");
  const [contentId, setContentId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<EmotionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);

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

      const response = await fetch("/api/ai-gateway/emotion", {
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
        throw new Error(errorData.error || "Failed to detect emotions");
      }

      const data: EmotionResponse = await response.json();

      // Validate response has required fields
      if (!data.dominant_emotion) {
        throw new Error("Invalid response: missing dominant_emotion");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const emotions = [
    { key: "joy_score", label: "Joy", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    { key: "anger_score", label: "Anger", color: "bg-red-500/10 text-red-500 border-red-500/20" },
    { key: "sadness_score", label: "Sadness", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { key: "fear_score", label: "Fear", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { key: "surprise_score", label: "Surprise", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Emotion Detection</h3>
            <p className="text-sm text-muted-foreground">Detect emotions in text</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

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
                  Detecting...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  Detect Emotions
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {result && result.dominant_emotion && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="mb-4 font-semibold">Emotion Analysis Results</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">Dominant Emotion:</span>
              <span className="rounded-full border px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 border-red-500/20">
                {result.dominant_emotion.charAt(0).toUpperCase() + result.dominant_emotion.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 phone:grid-cols-2">
              {emotions.map((emotion) => {
                const score = (result[emotion.key as keyof EmotionResponse] as number) || 0;
                return (
                  <div key={emotion.key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{emotion.label}</span>
                      <span className="font-medium">{(score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${score * 100}%`,
                          backgroundColor: emotion.color.split(" ")[0].replace("bg-", "#").replace("/10", ""),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-muted/20 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Content ID</span>
                <span className="font-medium">{result.content_id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
