"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import { BatchRequest, BatchResponse, BatchItem } from "./types";
import PostSelector from "./post-selector";

export default function ProductionBatch() {
  const [items, setItems] = useState<BatchItem[]>([
    { content_id: 0, content: "" },
  ]);
  const [sourceType, setSourceType] = useState("social");
  const [platform, setPlatform] = useState("tiktok");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResponse | null>(null);
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
      const newItems: BatchItem[] = selectedPostIds.map((postId) => {
        // Check if this postId already exists in items
        const existingItem = items.find((item) => item.content_id === postId);
        if (existingItem) {
          return existingItem; // Keep existing item with its content
        }
        return {
          content_id: postId,
          content: "", // Content will be fetched by backend if empty
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
        setItems(limitedItems.length > 0 ? limitedItems : [{ content_id: 0, content: "" }]);
      }
    } else if (items.length === 0 || (items.length === 1 && items[0].content_id === 0)) {
      // If no selections and items is empty or only has empty item, keep empty item
      if (items.length === 0) {
        setItems([{ content_id: 0, content: "" }]);
      }
    }
  }, [selectedPostIds, isSelectAllMode]);

  const addItem = () => {
    if (items.length >= 32) {
      setError("Maximum 32 items per batch");
      return;
    }
    setItems([...items, { content_id: 0, content: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      setError("At least one item is required");
      return;
    }
    const itemToRemove = items[index];
    setItems(items.filter((_, i) => i !== index));

    // Remove from selectedPostIds if it was selected
    if (itemToRemove.content_id > 0) {
      setSelectedPostIds(selectedPostIds.filter((id) => id !== itemToRemove.content_id));
    }
  };

  const updateItem = (index: number, field: keyof BatchItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let payload: BatchRequest;

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
            const contentId = typeof item.content_id === "number" ? item.content_id : parseInt(String(item.content_id));
            return !isNaN(contentId) && contentId > 0;
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
            const contentId = typeof item.content_id === "number" ? item.content_id : parseInt(String(item.content_id));

            // Construct base item
            const batchItem: any = {
              content_id: contentId,
              source_type: sourceType
            };

            // If content is provided and not empty, include content
            if (item.content && item.content.trim().length > 0) {
              batchItem.content = item.content.trim();
            }

            return batchItem;
          }),
        };
      }

      // Log payload for debugging
      console.log("Sending batch payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/sentiment-core/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Batch error response:", data);
        const errorMessage = data.error || data.detail || data.message || "Failed to analyze batch";
        throw new Error(errorMessage);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze batch");
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

  return (
    <div className="space-y-6">
      {/* Post Selector - Only for social media */}
      {sourceType === "social" && (
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
      )}

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <label className="block text-sm font-medium mb-2">
          Batch Source Type
        </label>
        <select
          value={sourceType === "social" ? platform : sourceType}
          onChange={(e) => {
            const val = e.target.value;
            if (["tiktok", "instagram", "facebook", "twitter", "youtube"].includes(val)) {
              setPlatform(val);
              setSourceType("social");
            } else if (val === "online-media") {
              setSourceType("online-media");
            } else if (val === "print") {
              setSourceType("print");
            } else if (val === "broadcast") {
              setSourceType("broadcast");
            }

            // Clear selections if manually changed
            if (selectedPostIds.length > 0) {
              setSelectedPostIds([]);
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
        <p className="text-xs text-muted-foreground mt-2">
          Note: All items in the batch will be processed as this source type.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSelectAllMode ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Mode: <span className="font-semibold">Proses Semua Post</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Semua post akan diambil dari database dan diproses untuk analisis sentiment. Proses ini mungkin memakan waktu lebih lama tergantung jumlah post.
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
                disabled={items.length >= 32}
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Content</label>
                      <textarea
                        value={item.content}
                        onChange={(e) => updateItem(index, "content", e.target.value)}
                        placeholder="Content text (optional - leave empty to fetch by content_id)..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
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
            "Analyze Batch"
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
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold">Batch Analysis Results</h3>
          </div>

          <div className="space-y-3 mb-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Items: </span>
              <span className="font-medium">{result.total_items}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Total Processing Time: </span>
              <span className="font-medium">{result.processing_time ? result.processing_time.toFixed(3) + 's' : 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {result.results.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted/50 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Content ID: {item.content_id}</span>
                  <span
                    className={`text-xs font-medium capitalize px-2 py-1 rounded ${getSentimentColor(item.sentiment_label)}`}
                  >
                    {item.sentiment_label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Score: </span>
                    <span className="font-medium">
                      {(item.sentiment_score * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className="font-medium">
                      {(item.confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

