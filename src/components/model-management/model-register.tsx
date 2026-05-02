"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, File, X } from "lucide-react";
import type { ModelType, ModelFormat } from "./types";

const MODEL_TYPES: { value: ModelType; label: string }[] = [
  { value: "sentiment", label: "Sentiment Analysis" },
  { value: "emotion", label: "Emotion Detection" },
  { value: "topic", label: "Topic Modeling" },
  { value: "aspect", label: "Aspect-Based Sentiment" },
  { value: "entity", label: "Entity Recognition" },
];

const MODEL_FORMATS: { value: ModelFormat; label: string }[] = [
  { value: "pytorch", label: "PyTorch (.pth/.pt)" },
  { value: "onnx", label: "ONNX (.onnx)" },
  { value: "pickle", label: "Pickle (.pkl)" },
];

export default function ModelRegister() {
  const [modelName, setModelName] = useState("");
  const [modelType, setModelType] = useState<ModelType | "">("");
  const [version, setVersion] = useState("");
  const [format, setFormat] = useState<ModelFormat | "">("");
  const [accuracyScore, setAccuracyScore] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [metadata, setMetadata] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a model file");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("model_name", modelName);
      formData.append("model_type", modelType);
      formData.append("version", version);
      formData.append("format", format);
      if (accuracyScore) {
        formData.append("accuracy_score", accuracyScore);
      }
      formData.append("is_active", isActive.toString());
      if (metadata) {
        formData.append("model_metadata", metadata);
      }

      const response = await fetch("/api/model-management/models/register", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to register model");
      }

      const result = await response.json();
      setSuccess(true);

      // Reset form
      setModelName("");
      setModelType("");
      setVersion("");
      setFormat("");
      setAccuracyScore("");
      setIsActive(true);
      setMetadata("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register model");
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Register New Model</h3>
            <p className="text-sm text-muted-foreground">Upload and register a machine learning model</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="font-medium text-green-500">Model registered successfully!</p>
          </div>
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
        {/* File Upload */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Model File</h4>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            {!file ? (
              <div>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click to select or drag and drop a model file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pth,.pt,.onnx,.pkl"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Select File
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-muted/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="rounded-full p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Model Information */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Model Information</h4>
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Model Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., sentiment-analyzer-v1"
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Model Type <span className="text-destructive">*</span>
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value as ModelType | "")}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select type...</option>
                {MODEL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Version <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.0.0"
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Format <span className="text-destructive">*</span>
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ModelFormat | "")}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select format...</option>
                {MODEL_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Accuracy Score (0-1)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={accuracyScore}
                onChange={(e) => setAccuracyScore(e.target.value)}
                placeholder="e.g., 0.95"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted/20">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Set as active model</span>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium">Metadata (JSON)</label>
            <textarea
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"description": "...", "parameters": {...}}'
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !file}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Register Model
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
