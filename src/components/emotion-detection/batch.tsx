"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Plus, Trash2, Layers } from "lucide-react";
import { EmotionBatchRequest, EmotionBatchResponse, EmotionBatchItem } from "./types";
import PostSelector from "@/components/sentiment-core/post-selector";

export default function EmotionBatch() {
  const [items, setItems] = useState<EmotionBatchItem[]>([
    { content_id: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmotionBatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);

  // Sync selected posts to batch items (only if not in select all mode)
  useEffect(() => {
    if (isSelectAllMode) {
      return; // Don't sync items when in select all mode
    }
    
    if (selectedPostIds.length > 0) {
      // Get existing items with content_id > 0 that are not in selectedPostIds
      const existingItems = items.filter(
        (item) => item.content_id > 0 && !selectedPostIds.includes(item.content_id)
      );

      // Create items from selected post IDs
      const newItems: EmotionBatchItem[] = selectedPostIds.map((postId) => {
        // Check if this postId already exists in items
        const existingItem = items.find((item) => item.content_id === postId);
        if (existingItem) {
          return existingItem; // Keep existing item with its text
        }
        return {
          content_id: postId,
        };
      });

      // Merge existing items with new items
      const mergedItems = [...existingItems, ...newItems];

      // Remove duplicates based on content_id
      const uniqueItems = mergedItems.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.content_id === item.content_id)
      );

      // Limit to 32 items
      const limitedItems = uniqueItems.slice(0, 32);

      // Only update if there's a change
      const currentIds = items
        .filter((item) => item.content_id > 0)
        .map((item) => item.content_id)
        .sort()
        .join(",");
      const newIds = limitedItems
        .filter((item) => item.content_id > 0)
        .map((item) => item.content_id)
        .sort()
        .join(",");

      if (currentIds !== newIds) {
        setItems(limitedItems.length > 0 ? limitedItems : [{ content_id: 0 }]);
      }
    } else if (items.length === 0 || (items.length === 1 && items[0].content_id === 0)) {
      // If no selections and items is empty or only has empty item, keep empty item
      if (items.length === 0) {
        setItems([{ content_id: 0 }]);
      }
    }
  }, [selectedPostIds, isSelectAllMode]);

  const addItem = () => {
    if (items.length >= 32) {
      setError("Maximum 32 items per batch");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setItems([...items, { content_id: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      setError("At least one item is required");
      setTimeout(() => setError(null), 3000);
      return;
    }
    const itemToRemove = items[index];
    setItems(items.filter((_, i) => i !== index));
    
    // Remove from selectedPostIds if it was selected
    if (itemToRemove.content_id > 0) {
      setSelectedPostIds(selectedPostIds.filter((id) => id !== itemToRemove.content_id));
    }
    setError(null);
  };

  const updateItem = (index: number, field: keyof EmotionBatchItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let payload: any;

      if (isSelectAllMode) {
        // Process all posts mode - backend will fetch all posts
        payload = {
          items: [],
          process_all: true,
        };
      } else {
        // Normal mode - validate items
        const validItems = items.filter(
          (item) => {
            return item.content_id > 0;
          },
        );

        if (validItems.length === 0) {
          throw new Error("At least one valid item with content_id is required");
        }

        if (validItems.length > 32) {
          throw new Error("Maximum 32 items per batch");
        }

        payload = {
          items: validItems.map((item) => {
            // If text is provided and not empty, include both content_id and text
            // Otherwise, only send content_id (backend will fetch text from database)
            if (item.text && item.text.trim().length > 0) {
              return {
                content_id: item.content_id,
                text: item.text.trim(),
              };
            } else {
              // Only send content_id, don't include text property at all
              return {
                content_id: item.content_id,
              };
            }
          }),
        };
      }

      // Log payload for debugging
      console.log("Sending batch payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/emotion-detection/analyze/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Failed to analyze emotion batch");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze emotion batch");
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case "joy":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950";
      case "anger":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      case "sadness":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
      case "fear":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950";
      case "surprise":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Post Selector */}
      <PostSelector
        selectedPostIds={selectedPostIds}
        onSelectionChange={(ids) => {
          if (isSelectAllMode) {
            setIsSelectAllMode(false);
          }
          // Limit to 32 selections
          setSelectedPostIds(ids.slice(0, 32));
        }}
        maxSelections={32}
        onSelectAll={() => {
          setIsSelectAllMode(!isSelectAllMode);
          setSelectedPostIds([]);
        }}
        isSelectAllMode={isSelectAllMode}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSelectAllMode ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Mode: <span className="font-semibold">Proses Semua Post</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Semua post akan diambil dari database dan diproses untuk analisis emotion detection. Proses ini mungkin memakan waktu lebih lama tergantung jumlah post.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Batch Items (Max 32)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={items.length >= 32 || loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center justify-end mb-2">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Content ID</label>
                      <input
                        type="number"
                        value={item.content_id > 0 ? item.content_id : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newContentId = value === "" ? 0 : parseInt(value) || 0;
                          const oldContentId = item.content_id;
                          
                          updateItem(index, "content_id", newContentId);
                          
                          // Update selectedPostIds
                          if (newContentId > 0) {
                            if (!selectedPostIds.includes(newContentId)) {
                              setSelectedPostIds([...selectedPostIds, newContentId]);
                            }
                          }
                          // Remove old content_id from selectedPostIds if it was there
                          if (oldContentId > 0 && oldContentId !== newContentId) {
                            setSelectedPostIds(selectedPostIds.filter((id) => id !== oldContentId));
                          }
                        }}
                        placeholder="Enter content ID"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Text (Optional)</label>
                      <textarea
                        value={item.text || ""}
                        onChange={(e) => updateItem(index, "text", e.target.value)}
                        placeholder="Text content (optional - leave empty to fetch by content_id)..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Total items: {items.length} / 32
            </div>
          </>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing Batch...
            </>
          ) : (
            <>
              <Layers className="h-4 w-4 mr-2" />
              Analyze Batch
            </>
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
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold">Batch Analysis Result</h3>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-medium">{result.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Success: </span>
                <span className="font-medium text-green-600 dark:text-green-400">{result.success}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Failed: </span>
                <span className="font-medium text-red-600 dark:text-red-400">{result.failed}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {result.results.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${getEmotionColor(item.dominant_emotion)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold">Content ID: {item.content_id}</span>
                  </div>
                  <span className="text-xs font-semibold capitalize px-2 py-1 rounded bg-primary text-primary-foreground">
                    {item.dominant_emotion}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Anger:</span>
                    <span className="font-medium">{(item.anger_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Joy:</span>
                    <span className="font-medium">{(item.joy_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Sadness:</span>
                    <span className="font-medium">{(item.sadness_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Fear:</span>
                    <span className="font-medium">{(item.fear_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Surprise:</span>
                    <span className="font-medium">{(item.surprise_score * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-border text-xs text-muted-foreground">
                  Created: {new Date(item.created_at).toLocaleString("id-ID")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

