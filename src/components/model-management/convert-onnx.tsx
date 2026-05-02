"use client";

import { useState, useEffect } from "react";
import { Cpu, Loader2, CheckCircle2, Settings } from "lucide-react";
import type { Model, ConvertOnnxRequest } from "./types";

interface ConversionConfig {
  input_shape?: number[];
  input_names?: string[];
  output_names?: string[];
}

export default function ConvertOnnx() {
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");
  const [inputShape, setInputShape] = useState("");
  const [inputNames, setInputNames] = useState("");
  const [outputNames, setOutputNames] = useState("");
  const [availableModels, setAvailableModels] = useState<Array<{ name: string; version: string }>>([]);
  const [converting, setConverting] = useState(false);
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

        // Only show PyTorch models that can be converted
        const pytorchModels = models
          .filter((m: Model) => m.format === "pytorch")
          .map((m: Model) => ({ name: m.model_name, version: m.version }));

        setAvailableModels(pytorchModels);
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
      setConverting(true);
      setError(null);
      setSuccess(false);
      setResult(null);

      const config: ConversionConfig = {};
      if (inputShape.trim()) {
        config.input_shape = inputShape.split(",").map((s) => parseInt(s.trim()));
      }
      if (inputNames.trim()) {
        config.input_names = inputNames.split(",").map((s) => s.trim());
      }
      if (outputNames.trim()) {
        config.output_names = outputNames.split(",").map((s) => s.trim());
      }

      const request: ConvertOnnxRequest = {
        model_name: modelName,
        version,
        ...config,
      };

      const response = await fetch("/api/model-management/models/convert-onnx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to convert model");
      }

      const data = await response.json();
      setSuccess(true);
      setResult(data);

      // Reset form
      setInputShape("");
      setInputNames("");
      setOutputNames("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert model");
      setSuccess(false);
    } finally {
      setConverting(false);
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
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Convert to ONNX</h3>
            <p className="text-sm text-muted-foreground">Convert PyTorch models to ONNX format</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="font-medium text-green-500">Model converted successfully!</p>
          </div>
          {result && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>ONNX file: {result.onnx_path || "Generated"}</p>
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

        {/* Conversion Options */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h4 className="font-semibold">Conversion Options</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Input Shape <span className="text-muted-foreground">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={inputShape}
                onChange={(e) => setInputShape(e.target.value)}
                placeholder="e.g., 1,3,224,224"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional: Specify the input tensor shape (e.g., batch, channels, height, width)
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Input Names <span className="text-muted-foreground">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={inputNames}
                onChange={(e) => setInputNames(e.target.value)}
                placeholder="e.g., input"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional: Names for input tensors
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Output Names <span className="text-muted-foreground">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={outputNames}
                onChange={(e) => setOutputNames(e.target.value)}
                placeholder="e.g., output"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional: Names for output tensors
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={converting || !modelName || !version}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {converting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                Convert to ONNX
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
