"use client";

import { useState, useEffect } from "react";
import { Scale, Loader2, ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CompareRequest, CompareResponse, Model } from "./types";

export default function ModelCompare() {
  const [modelName, setModelName] = useState("");
  const [version1, setVersion1] = useState("");
  const [version2, setVersion2] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelVersions, setModelVersions] = useState<Record<string, string[]>>({});
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/model-management/models");
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();
        // API returns array directly, not wrapped in { models: [] }
        const models = Array.isArray(data) ? data : [];

        // Group by model name
        const versionsByModel: Record<string, string[]> = {};
        models.forEach((m: Model) => {
          if (!versionsByModel[m.model_name]) {
            versionsByModel[m.model_name] = [];
          }
          if (!versionsByModel[m.model_name].includes(m.version)) {
            versionsByModel[m.model_name].push(m.version);
          }
        });

        setAvailableModels(Object.keys(versionsByModel));
        setModelVersions(versionsByModel);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      }
    };
    fetchModels();
  }, []);

  // Update versions when model changes
  useEffect(() => {
    setVersion1("");
    setVersion2("");
  }, [modelName]);

  const compareVersions = async () => {
    if (!modelName || !version1 || !version2) return;

    try {
      setComparing(true);
      setError(null);

      const request: CompareRequest = {
        model_name: modelName,
        version1,
        version2,
      };

      const response = await fetch("/api/model-management/models/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to compare versions");
      }

      const data: CompareResponse = await response.json();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare");
      setComparison(null);
    } finally {
      setComparing(false);
    }
  };

  const versions = modelName ? modelVersions[modelName] || [] : [];

  return (
    <div className="space-y-6">
      {/* Selection */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Compare Model Versions</h3>
            <p className="text-sm text-muted-foreground">Side-by-side comparison of two versions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 phone:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Model Name</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select model...</option>
              {availableModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Version 1</label>
            <select
              value={version1}
              onChange={(e) => setVersion1(e.target.value)}
              disabled={!modelName}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Select version...</option>
              {versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Version 2</label>
            <select
              value={version2}
              onChange={(e) => setVersion2(e.target.value)}
              disabled={!modelName}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Select version...</option>
              {versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={compareVersions}
            disabled={!modelName || !version1 || !version2 || comparing}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {comparing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <ArrowLeftRight className="h-4 w-4" />
                Compare
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {comparing && (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && !comparing && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Comparison Result */}
      {!comparing && !error && comparison && (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h4 className="text-lg font-semibold">{comparison.model_name}</h4>
            <p className="text-sm text-muted-foreground">Version Comparison</p>
          </div>

          <div className="p-6">
            {/* Side by Side */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Version 1 */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h5 className="font-semibold mb-4">{comparison.version1.version}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium">{comparison.version1.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{comparison.version1.file_size_mb.toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-medium">
                      {comparison.version1.accuracy_score ? `${comparison.version1.accuracy_score.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(comparison.version1.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Version 2 */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h5 className="font-semibold mb-4">{comparison.version2.version}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium">{comparison.version2.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{comparison.version2.file_size_mb.toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-medium">
                      {comparison.version2.accuracy_score ? `${comparison.version2.accuracy_score.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(comparison.version2.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Summary */}
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h5 className="font-semibold mb-4">Comparison Summary</h5>
              <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Size Difference</span>
                  <div className="flex items-center gap-2">
                    {comparison.comparison.size_diff_mb > 0 ? (
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    ) : comparison.comparison.size_diff_mb < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium">
                      {comparison.comparison.size_diff_mb > 0 ? "+" : ""}
                      {comparison.comparison.size_diff_mb.toFixed(2)} MB ({comparison.comparison.size_diff_percent > 0 ? "+" : ""}
                      {comparison.comparison.size_diff_percent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accuracy Difference</span>
                  <div className="flex items-center gap-2">
                    {comparison.comparison.accuracy_improvement ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : comparison.comparison.accuracy_diff < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium">
                      {comparison.comparison.accuracy_diff > 0 ? "+" : ""}
                      {comparison.comparison.accuracy_diff.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
