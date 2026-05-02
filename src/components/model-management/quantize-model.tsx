"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2, CheckCircle2, TrendingDown } from "lucide-react";
import type { Model, QuantizeRequest } from "./types";

export default function QuantizeModel() {
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");
  const [quantizationType, setQuantizationType] = useState<"dynamic" | "static">("dynamic");
  const [availableModels, setAvailableModels] = useState<Array<{ name: string; version: string }>>([]);
  const [quantizing, setQuantizing] = useState(false);
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
      setQuantizing(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      const request: QuantizeRequest = {
        model_name: modelName,
        version,
        quantization_type: quantizationType,
      };

      const response = await fetch("/api/model-management/models/quantize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to quantize model");
      }

      const data = await response.json();
      setSuccess(true);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to quantize model");
      setSuccess(false);
    } finally {
      setQuantizing(false);
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
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quantize Model</h3>
            <p className="text-sm text-muted-foreground">Reduce model size with quantization</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-500">What is Quantization?</p>
            <p className="mt-1 text-sm text-blue-500/80">
              Quantization reduces model size by converting weights from 32-bit floating point to 8-bit integers.
              This typically reduces model size by ~75% with minimal accuracy loss.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="font-medium text-green-500">Model quantized successfully!</p>
          </div>
          {result && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Quantized model: {result.quantized_path || "Generated"}</p>
              {result.original_size_mb && result.quantized_size_mb && (
                <p className="text-green-500">
                  Size reduced from {result.original_size_mb.toFixed(2)} MB to {result.quantized_size_mb.toFixed(2)} MB
                </p>
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
          <h4 className="font-semibold mb-4">Select Model</h4>
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
              <label className="mb-2 block text-sm font-medium">Version</label>
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

        {/* Quantization Type */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Quantization Type</h4>
          <div className="space-y-4">
            <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              quantizationType === "dynamic"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/20"
            }`}>
              <input
                type="radio"
                name="quantizationType"
                value="dynamic"
                checked={quantizationType === "dynamic"}
                onChange={(e) => setQuantizationType(e.target.value as "dynamic")}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="font-medium">Dynamic Quantization</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quantizes weights dynamically during inference. Faster to apply, good for RNNs/LSTMs.
                  No calibration data needed.
                </p>
              </div>
            </label>
            <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              quantizationType === "static"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/20"
            }`}>
              <input
                type="radio"
                name="quantizationType"
                value="static"
                checked={quantizationType === "static"}
                onChange={(e) => setQuantizationType(e.target.value as "static")}
                className="mt-1 h-4 w-4"
              />
              <div>
                <p className="font-medium">Static Quantization</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quantizes both weights and activations using calibration data. Best accuracy,
                  requires representative dataset for calibration.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={quantizing || !modelName || !version}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {quantizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Quantizing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Quantize Model
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
