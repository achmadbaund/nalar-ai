"use client";

import { useState, useEffect } from "react";
import { GitBranch, Loader2, XCircle, Calendar } from "lucide-react";
import type { ModelVersions } from "./types";

export default function ModelVersions() {
  const [modelName, setModelName] = useState("");
  const [versions, setVersions] = useState<ModelVersions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/model-management/models");
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();
        // API returns array directly, not wrapped in { models: [] }
        const models = Array.isArray(data) ? data : [];
        const uniqueNames = [...new Set(models.map((m: any) => m.model_name))] as string[];
        setAvailableModels(uniqueNames);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      }
    };
    fetchModels();
  }, []);

  const fetchVersions = async () => {
    if (!modelName) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/model-management/models/${encodeURIComponent(modelName)}/versions`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch versions");
      }

      const data: ModelVersions = await response.json();
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setVersions(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Model Version History</h3>
            <p className="text-sm text-muted-foreground">View all versions of a model</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Select Model</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a model...</option>
              {availableModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchVersions}
              disabled={!modelName || loading}
              className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "View Versions"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Versions List */}
      {!loading && !error && versions && (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h4 className="text-lg font-semibold">{versions.model_name}</h4>
            <p className="text-sm text-muted-foreground">Total Versions: {versions.total}</p>
          </div>

          <div className="divide-y divide-border">
            {versions.versions.map((version, index) => (
              <div key={index} className="p-6 hover:bg-muted/20">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{version.version}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        version.format === "pytorch"
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          : version.format === "onnx"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      }`}>
                        {version.format}
                      </span>
                      {version.is_active && (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500 border border-green-500/20">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(version.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {versions.versions.length === 0 && (
            <div className="p-12 text-center">
              <GitBranch className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No versions found for this model</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !versions && !modelName && (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <div className="text-center">
            <GitBranch className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Select a model to view its version history</p>
          </div>
        </div>
      )}
    </div>
  );
}
