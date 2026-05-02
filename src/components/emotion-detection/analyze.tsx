"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { EmotionAnalyzeRequest, EmotionAnalyzeResponse } from "./types";
import ContentSelector, { SelectedContent } from "@/components/topic-analyzer/content-selector";

export default function EmotionAnalyze() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmotionAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);

  // Manual input state (only used if no content selected or for overriding)
  const [manualContentId, setManualContentId] = useState("");
  const [manualText, setManualText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Determine content ID and Text
      // Priority: Selected Content > Manual Input
      let idToSubmit: number;
      let textToSubmit: string | undefined = undefined;
      let typeToSubmit: string = "social_media";

      if (selectedContent) {
        idToSubmit = selectedContent.content_id;
        textToSubmit = selectedContent.text;
        typeToSubmit = selectedContent.type;
      } else {
        if (!manualContentId.trim()) {
          throw new Error("Content ID is required");
        }
        idToSubmit = parseInt(manualContentId.trim());
        if (manualText.trim()) {
          textToSubmit = manualText.trim();
        }
        // Default to social_media for manual input, or maybe add a selector?
        // For simplicity, manual input defaults to social_media as per legacy behavior
      }

      const payload: EmotionAnalyzeRequest & { content_type?: string } = {
        content_id: idToSubmit,
        content_type: typeToSubmit
      };

      if (textToSubmit) {
        payload.text = textToSubmit;
      }

      const response = await fetch("/api/emotion-detection/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Failed to analyze emotion");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze emotion");
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case "joy":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900";
      case "anger":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900";
      case "sadness":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900";
      case "fear":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900";
      case "surprise":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900";
      default:
        return "text-muted-foreground bg-card border-border";
    }
  };

  const emotions = [
    { name: "anger", label: "Anger" },
    { name: "joy", label: "Joy" },
    { name: "sadness", label: "Sadness" },
    { name: "fear", label: "Fear" },
    { name: "surprise", label: "Surprise" },
  ];

  return (
    <div className="space-y-6">
      {/* Content Selector */}
      <ContentSelector
        selectedContent={selectedContent}
        onSelect={setSelectedContent}
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Information:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Select content from the tabs above or enter ID manually below.</li>
              <li>Detects 5 emotions: Anger, Joy, Sadness, Fear, Surprise.</li>
              <li>Supports Social Media, Online News, Print Media, and Broadcast data.</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium">Manual Override (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Content ID
            </label>
            <input
              type="number"
              value={selectedContent ? selectedContent.content_id : manualContentId}
              onChange={(e) => {
                setManualContentId(e.target.value);
                setSelectedContent(null); // Clear selection if typing manually
              }}
              placeholder="123"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              disabled={!!selectedContent}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Content Type
            </label>
            <div className="px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground">
              {selectedContent ? selectedContent.type : "social_media (default)"}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Text Content
          </label>
          <textarea
            value={selectedContent ? selectedContent.text : manualText}
            onChange={(e) => {
              setManualText(e.target.value);
              setSelectedContent(null);
            }}
            placeholder="Text to analyze..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] disabled:opacity-50"
            disabled={!!selectedContent}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            "Analyze Emotion"
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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`rounded-lg border p-4 ${getEmotionColor(result.dominant_emotion)}`}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold">Analysis Result</h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Content ID: </span>
                <span className="text-sm">{result.content_id}</span>
              </div>

              <div>
                <span className="text-sm font-medium">Dominant Emotion: </span>
                <span className="text-sm font-semibold capitalize">{result.dominant_emotion}</span>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-sm font-medium mb-3">Emotion Scores:</p>
                <div className="space-y-2">
                  {emotions.map((emotion) => {
                    const score = result[`${emotion.name}_score` as keyof EmotionAnalyzeResponse] as number;
                    const isDominant = result.dominant_emotion === emotion.name;
                    return (
                      <div key={emotion.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize">{emotion.label}</span>
                          {isDominant && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                              Dominant
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500 ease-out"
                              style={{ width: `${score * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {(score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                <div>ID: {result.id}</div>
                <div>Created At: {result.created_at ? new Date(result.created_at).toLocaleString("id-ID") : "Just now"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

