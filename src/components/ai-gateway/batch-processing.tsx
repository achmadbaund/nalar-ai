"use client";

import { useState, useEffect } from "react";
import { Layers, Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import type { BatchServiceType, BatchSubmitRequest, BatchSubmitResponse, BatchStatusResponse } from "./types";
import PostSelector from "../sentiment-core/post-selector";

interface BatchItem {
  id: string;
  text: string;
  language: string;
  content_id?: number;
}

export default function BatchProcessing() {
  const [serviceType, setServiceType] = useState<BatchServiceType>("sentiment");
  const [items, setItems] = useState<BatchItem[]>([{ id: "1", text: "", language: "id" }]);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [jobResponse, setJobResponse] = useState<BatchSubmitResponse | null>(null);
  const [jobStatus, setJobStatus] = useState<BatchStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);

  // Fetch posts content when posts are selected
  useEffect(() => {
    if (selectedPostIds.length > 0) {
      // Fetch all selected posts
      Promise.all(
        selectedPostIds.map((postId) =>
          fetch(`/api/posts/${postId}`)
            .then((res) => res.json())
            .catch(() => null)
        )
      ).then((postsData) => {
        const newItems: BatchItem[] = postsData
          .filter((post) => post && post.content)
          .map((post, index) => ({
            id: (index + 1).toString(),
            text: post.content,
            language: "id",
            content_id: post.id,
          }));

        if (newItems.length > 0) {
          setItems(newItems);
        }
      });
    }
  }, [selectedPostIds]);

  const addItem = () => {
    const newId = (items.length + 1).toString();
    setItems([...items, { id: newId, text: "", language: "id" }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BatchItem, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async () => {
    const validItems = items.filter((item) => item.text.trim());

    if (validItems.length === 0) {
      setError("Please add at least one item with text");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setJobResponse(null);
      setJobStatus(null);

      const request: BatchSubmitRequest = {
        service: serviceType,
        items: validItems.map((item) => ({
          id: item.id,
          text: item.text,
          language: item.language,
          content_id: item.content_id || Math.floor(Math.random() * 1000000),
        })),
      };

      const response = await fetch("/api/ai-gateway/batch/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit batch job");
      }

      const data: BatchSubmitResponse = await response.json();
      setJobResponse(data);

      // Auto-check status
      setTimeout(() => checkStatus(data.job_id), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setJobResponse(null);
    } finally {
      setSubmitting(false);
    }
  };

  const checkStatus = async (jobId?: string) => {
    const id = jobId || jobResponse?.job_id;
    if (!id) return;

    try {
      setChecking(true);
      setError(null);

      const response = await fetch(`/api/ai-gateway/batch/status/${id}`);
      if (!response.ok) {
        throw new Error("Failed to check status");
      }

      const data: BatchStatusResponse = await response.json();
      setJobStatus(data);

      // Continue polling if not completed
      if (data.status === "pending" || data.status === "processing") {
        setTimeout(() => checkStatus(id), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Batch Processing</h3>
            <p className="text-sm text-muted-foreground">Process multiple texts in batch</p>
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
          setSelectedPostIds(ids);
        }}
        maxSelections={10}
      />

      {/* Job Response */}
      {jobResponse && (
        <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            <p className="font-medium text-blue-500">Job Submitted Successfully!</p>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Job ID: {jobResponse.job_id}</p>
            <p>Total Items: {jobResponse.total_items}</p>
            <p>Estimated Time: {jobResponse.estimated_time_seconds}s</p>
          </div>
          <button
            onClick={() => checkStatus()}
            className="mt-3 rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
          >
            Check Status
          </button>
        </div>
      )}

      {/* Job Status */}
      {jobStatus && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="mb-4 font-semibold">Job Status</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                jobStatus.status === "completed" ? "bg-green-500/10 text-green-500" :
                jobStatus.status === "processing" ? "bg-blue-500/10 text-blue-500" :
                "bg-gray-500/10 text-gray-500"
              }`}>
                {jobStatus.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{jobStatus.processed_items}/{jobStatus.total_items}</span>
            </div>
            {jobStatus.status === "completed" && jobStatus.results.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="text-sm font-medium">Results</h5>
                {jobStatus.results.map((result, index) => (
                  <div key={index} className="rounded-lg bg-muted/20 p-3 text-sm">
                    <p className="font-medium">Item: {result.id}</p>
                    <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(result.result, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as BatchServiceType)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="sentiment">Sentiment Analysis</option>
              <option value="aspect">Aspect Analysis</option>
              <option value="entity">Entity Extraction</option>
              <option value="emotion">Emotion Detection</option>
              <option value="topic">Topic Classification</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Items</h4>
              <button
                onClick={addItem}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Item {item.id}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={item.text}
                  onChange={(e) => updateItem(item.id, "text", e.target.value)}
                  placeholder={`Enter text for item ${item.id}...`}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={item.language}
                    onChange={(e) => updateItem(item.id, "language", e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-1 text-xs"
                  >
                    <option value="id">Indonesian</option>
                    <option value="en">English</option>
                  </select>
                  <input
                    type="number"
                    value={item.content_id || ""}
                    onChange={(e) => updateItem(item.id, "content_id", e.target.value)}
                    placeholder="Content ID (optional)"
                    className="rounded-md border border-border bg-background px-3 py-1 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || items.filter((i) => i.text.trim()).length === 0}
              className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Submit Batch
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
