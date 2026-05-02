"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Plus, Trash2, Info } from "lucide-react";
import { BatchProcessRequest, BatchProcessResponse, BatchProcessItem } from "./types";
import PostSelector from "@/components/sentiment-core/post-selector";

export default function SubmitBatch() {
  const [items, setItems] = useState<BatchProcessItem[]>([
    { content_id: 0, text: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [source, setSource] = useState<string>("social_media");

  // Sync selected posts to batch items (only if not in select all mode)
  useEffect(() => {
    if (isSelectAllMode) {
      return; // Don't sync items when in select all mode
    }

    if (selectedPostIds.length > 0) {
      setItems((currentItems) => {
        // Get existing items with content_id > 0 that are not in selectedPostIds
        const existingItems = currentItems.filter(
          (item) => item.content_id > 0 && !selectedPostIds.includes(item.content_id)
        );

        // Create items from selected post IDs
        const newItems: BatchProcessItem[] = selectedPostIds.map((postId) => {
          // Check if this postId already exists in items
          const existingItem = currentItems.find((item) => item.content_id === postId);
          if (existingItem) {
            return existingItem; // Keep existing item with its text
          }
          return {
            content_id: postId,
            text: "", // Text will be fetched by backend if empty
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
        const currentIds = currentItems
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
          return limitedItems.length > 0 ? limitedItems : [{ content_id: 0, text: "" }];
        }
        return currentItems;
      });
    } else {
      setItems((currentItems) => {
        // If no selections and items is empty or only has empty item, keep empty item
        if (currentItems.length === 0 || (currentItems.length === 1 && currentItems[0].content_id === 0)) {
          return currentItems.length === 0 ? [{ content_id: 0, text: "" }] : currentItems;
        }
        return currentItems;
      });
    }
  }, [selectedPostIds, isSelectAllMode]);

  const addItem = () => {
    if (items.length >= 32) {
      setError("Maksimal 32 item per batch");
      return;
    }
    setItems([...items, { content_id: 0, text: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      setError("Minimal satu item diperlukan");
      return;
    }
    const itemToRemove = items[index];
    setItems(items.filter((_, i) => i !== index));

    // Remove from selectedPostIds if it was selected
    if (itemToRemove.content_id > 0) {
      setSelectedPostIds(selectedPostIds.filter((id) => id !== itemToRemove.content_id));
    }
  };

  const updateItem = (index: number, field: keyof BatchProcessItem, value: string | number) => {
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
      let payload: BatchProcessRequest;

      if (isSelectAllMode) {
        // Process all posts mode - backend will fetch all posts
        payload = {
          items: [],
          process_all: true,
        };
      } else {
        // Normal mode - validate items
        const validItems = items.filter((item) => {
          const contentId = typeof item.content_id === "number" ? item.content_id : parseInt(String(item.content_id));
          return !isNaN(contentId) && contentId > 0;
        });

        if (validItems.length === 0) {
          throw new Error("Minimal satu item dengan content_id yang valid diperlukan");
        }

        if (validItems.length > 32) {
          throw new Error("Maksimal 32 item per batch");
        }

        payload = {
          items: validItems.map((item) => {
            const contentId = typeof item.content_id === "number" ? item.content_id : parseInt(String(item.content_id));

            const payloadItem: BatchProcessItem = {
              content_id: contentId,
              source: source,
            };

            if (item.text && item.text.trim().length > 0) {
              payloadItem.text = item.text.trim();
            }

            return payloadItem;
          }),
        };
      }

      const response = await fetch("/api/batch-processor/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Gagal memproses batch");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Informasi:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Pilih sumber data (Source) sebelum memasukkan ID.</li>
              <li>Content ID wajib diisi (harus berupa angka positif).</li>
              <li>Text bersifat opsional - jika dikosongkan, sistem akan mengambil text dari database berdasarkan content_id dan source.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Source</label>
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            // Reset items and selection when source changes
            setItems([{ content_id: 0, text: "" }]);
            setSelectedPostIds([]);
            setIsSelectAllMode(false);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="social_media">Social Media</option>
          <option value="news">Online News</option>
          <option value="print">Print Media</option>
          <option value="broadcast">Broadcast</option>
        </select>
      </div>

      {/* Post Selector - Only for Social Media */}
      {source === "social_media" && (
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

      {source !== "social_media" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Untuk source <strong>{source}</strong>, silakan masukkan Content ID secara manual di bawah ini.
              Pastikan Content ID valid dan ada di database sumber {source}.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSelectAllMode ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Mode: <span className="font-semibold">Proses Semua Post</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Semua post akan diambil dari database dan diproses untuk batch processing. Proses ini mungkin memakan waktu lebih lama tergantung jumlah post.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Batch Items
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={items.length >= 32}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Item
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
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Content ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.content_id || ""}
                      onChange={(e) => updateItem(index, "content_id", parseInt(e.target.value) || 0)}
                      placeholder="12345"
                      required
                      min="1"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Text (Optional)
                    </label>
                    <textarea
                      value={item.text || ""}
                      onChange={(e) => updateItem(index, "text", e.target.value)}
                      placeholder="Kosongkan untuk mengambil text dari database berdasarkan content_id"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Kosongkan untuk mengambil text dari database
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Memproses...
            </>
          ) : (
            "Submit Batch Processing"
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
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold">Batch Processing Dimulai</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Job ID: </span>
              <span className="font-medium font-mono">{result.job_id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Task ID: </span>
              <span className="font-medium font-mono">{result.task_id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-medium capitalize">{result.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Message: </span>
              <span className="font-medium">{result.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

