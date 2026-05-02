"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { Model, HotSwapRequest } from "./types";

export default function HotSwap() {
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");
  const [rollbackOnFailure, setRollbackOnFailure] = useState(true);
  const [availableModels, setAvailableModels] = useState<Array<{ name: string; version: string }>>([]);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/model-management/models");
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();
        // API returns array directly, not wrapped in { models: [] }
        const models = Array.isArray(data) ? data : [];

        const allModels = models.map((m: Model) => ({
          name: m.model_name,
          version: m.version,
        }));

        setAvailableModels(allModels);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      }
    };
    fetchModels();
  }, []);

  // Update version when model changes
  useEffect(() => {
    const versions = availableModels
      .filter((m) => m.name === modelName)
      .map((m) => m.version);
    if (versions.length > 0 && !versions.includes(version)) {
      setVersion(versions[0]);
    }
  }, [modelName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName || !version) return;

    try {
      setSwapping(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      const request: HotSwapRequest = {
        model_name: modelName,
        version,
        rollback_on_failure: rollbackOnFailure,
      };

      const response = await fetch("/api/model-management/models/hot-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to hot-swap model");
      }

      const data = await response.json();
      setSuccess(true);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hot-swap model");
      setSuccess(false);
    } finally {
      setSwapping(false);
    }
  };

  const versions = availableModels
    .filter((m) => m.name === modelName)
    .map((m) => m.version);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Hot-Swap Model</h3>
            <p className="text-sm text-muted-foreground">Replace the active model without downtime</p>
          </div>
        </div>
      </div>

      {/* Warning Card */}
      <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <p className="font-medium text-orange-500">Important Warning</p>
            <p className="mt-1 text-sm text-orange-500/80">
              Hot-swapping will immediately replace the currently active model with the selected version.
              This will affect all services using this model. Make sure the new version is tested thoroughly.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-500">How Hot-Swap Works</p>
            <p className="mt-1 text-sm text-blue-500/80">
              The service will replace the active model in the registry. Downstream services will automatically
              start using the new model on their next inference request. If rollback is enabled and the swap fails,
              the previous version will be restored automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="font-medium text-green-500">Model hot-swapped successfully!</p>
          </div>
          {result && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Active model: {result.model_name} v{result.active_version}</p>
              {result.affected_services && (
                <p className="text-blue-500">Affected services: {result.affected_services.join(", ")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Model Selection */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Select Model to Activate</h4>
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Model Name</label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select model...</option>
                {[...new Set(availableModels.map((m) => m.name))].map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Version to Activate</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                disabled={!modelName}
                required
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
        </div>

        {/* Options */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Options</h4>
          <label className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/20">
            <input
              type="checkbox"
              checked={rollbackOnFailure}
              onChange={(e) => setRollbackOnFailure(e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <p className="font-medium">Rollback on Failure</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Automatically revert to the previous version if the hot-swap fails
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={swapping || !modelName || !version}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {swapping ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Hot-Swapping...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Hot-Swap Model
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
