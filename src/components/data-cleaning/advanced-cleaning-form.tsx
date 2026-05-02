"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Info, Save, History, RefreshCw, Copy, Check, ChevronUp, ChevronDown, Play, FileText, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { UncleanedRecord } from "@/types/data-cleaning";

interface Operation {
  value: string;
  label: string;
  description: string;
}

interface AdvancedCleaningFormProps {
  componentId: string;
  componentName: string;
  operations: Operation[];
  selectedItems?: UncleanedRecord[];
  onClearSelection?: () => void;
}

interface SelectedOperation {
  operation: string;
  sequence: number;
  label: string;
}

interface SourceOption {
  name: string;
  count: number;
}

interface SampleData {
  id: number;
  title: string;
  content: string;
  source: string;
  content_type: string;
}

interface CleaningMetrics {
  total_chars_before: number;
  total_chars_after: number;
  total_chars_removed: number;
  percentage_reduced: number;
  operations_count: number;
  processing_time_ms: number;
}

interface OperationDetail {
  operation: string;
  sequence: number;
  chars_before: number;
  chars_after: number;
  chars_removed: number;
  percentage_removed: number;
}

export default function AdvancedCleaningForm({
  componentId,
  componentName,
  operations,
  selectedItems = [],
  onClearSelection,
}: AdvancedCleaningFormProps) {
  // Content type options
  const contentTypeOptions = [
    { value: "news", label: "News Articles", description: "Online news articles and blogs" },
    { value: "social", label: "Social Media", description: "Facebook, Instagram, TikTok, Twitter, YouTube" },
    { value: "print", label: "Print Media", description: "Newspapers and magazines (OCR)" },
    { value: "broadcast", label: "Broadcast", description: "TV and radio transcripts" }
  ];

  const [selectedContentType, setSelectedContentType] = useState<string>("news");
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [sampleData, setSampleData] = useState<SampleData[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>("manual");
  const [inputText, setInputText] = useState<string>("");
  const [outputText, setOutputText] = useState<string>("");
  const [selectedOperations, setSelectedOperations] = useState<SelectedOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<CleaningMetrics | null>(null);
  const [operationDetails, setOperationDetails] = useState<OperationDetail[]>([]);

  const actionTerm = componentId === "2.2" ? "Processing" : "Cleaning";
  const runActionTerm = componentId === "2.2" ? "Run Processing" : "Run Cleaning";

  // Batch Processing State
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [batchResults, setBatchResults] = useState<{ id: string | number, success: boolean, error?: string }[]>([]);

  // Load sources with useCallback to avoid dependency issues
  const loadSources = useCallback(async () => {
    setLoadingSources(true);
    try {
      const response = await fetch(`/api/cleaning/sample-sources?content_type=${selectedContentType}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.sources && Array.isArray(data.sources)) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error("Failed to load sources:", err);
      setSources([]); // Clear sources on error
    } finally {
      setLoadingSources(false);
    }
  }, [selectedContentType]);

  // Load sources on mount and when content type changes
  useEffect(() => {
    if (selectedItems.length === 0) {
      loadSources();
    }
  }, [loadSources, selectedItems.length]);

  // Load sample data when source changes
  useEffect(() => {
    if (selectedSource && selectedItems.length === 0) {
      loadSampleData();
    }
  }, [selectedSource, selectedItems.length]);

  // Pre-select default operations for Core Cleaning Engine (2.1)
  useEffect(() => {
    if (componentId === "2.1" && selectedOperations.length === 0 && operations.length > 0) {
      const defaults = ["text-cleaner", "html-cleaner", "metadata-cleaner"];
      const defaultOps = operations
        .filter(op => defaults.includes(op.value))
        .map((op, idx) => ({
          operation: op.value,
          sequence: idx + 1,
          label: op.label
        }));

      if (defaultOps.length > 0) {
        setSelectedOperations(defaultOps);
      }
    }
  }, [componentId, operations]);

  const loadSampleData = async () => {
    setLoadingSamples(true);
    try {
      // Build query with content_type and source filter
      const params = new URLSearchParams({
        content_type: selectedContentType,
        limit: "20"
      });
      if (selectedSource) {
        params.append("source", selectedSource);
      }

      const response = await fetch(`/api/cleaning/sample-data?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setSampleData(data);
      } else {
        console.error("Sample data is not an array:", data);
        setSampleData([]);
        setError("Failed to load sample data: Invalid response format");
      }
    } catch (err) {
      console.error("Failed to load samples:", err);
      setSampleData([]);
      setError(err instanceof Error ? err.message : "Failed to connect to API. Please check if the API server is running.");
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleSampleSelect = async (sampleId: string) => {
    setSelectedSample(sampleId);
    if (!sampleId || sampleId === "manual") {
      setInputText("");
      return;
    }
    await loadSampleContent(sampleId);
  };

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setSelectedSample("manual"); // Reset sample selection when source changes
    setInputText(""); // Clear input text
    setSampleData([]); // Clear sample data
  };

  const handleContentTypeChange = (contentType: string) => {
    setSelectedContentType(contentType);
    setSelectedSource(""); // Reset source when content type changes
    setSelectedSample("manual"); // Reset sample selection
    setInputText(""); // Clear input text
    setSampleData([]); // Clear sample data
  };

  const loadSampleContent = async (sampleId: string) => {
    try {
      const response = await fetch(`/api/cleaning/sample-data/${sampleId}?content_type=${selectedContentType}`);
      const data = await response.json();
      setInputText(data.content);
    } catch (err) {
      setError("Failed to load sample content");
    }
  };

  const toggleOperation = (op: Operation) => {
    const exists = selectedOperations.find(o => o.operation === op.value);

    // For 2.5 Celery Orchestration - Single select only (mutually exclusive)
    if (componentId === "2.5") {
      if (exists) {
        // Deselect if clicking the same one
        setSelectedOperations([]);
      } else {
        // Select only this one, replace others
        setSelectedOperations([{
          operation: op.value,
          sequence: 1,
          label: op.label
        }]);
      }
      return;
    }

    // For 2.1-2.4 - Multi-select with sequence
    if (exists) {
      setSelectedOperations(selectedOperations.filter(o => o.operation !== op.value));
    } else {
      setSelectedOperations([
        ...selectedOperations,
        {
          operation: op.value,
          sequence: selectedOperations.length + 1,
          label: op.label
        }
      ]);
    }
  };

  const moveOperation = (index: number, direction: 'up' | 'down') => {
    const newOps = [...selectedOperations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOps.length) return;

    [newOps[index], newOps[targetIndex]] = [newOps[targetIndex], newOps[index]];

    // Update sequences
    newOps.forEach((op, idx) => {
      op.sequence = idx + 1;
    });

    setSelectedOperations(newOps);
  };

  const handleRunCleaning = async () => {
    // If we have selected items, use batch processing
    if (selectedItems.length > 0) {
      await runBatchCleaning();
      return;
    }

    // Otherwise standard single item cleaning
    if (!inputText.trim()) {
      setError("Please provide input text or select a sample");
      return;
    }

    if (selectedOperations.length === 0) {
      setError("Please select at least one cleaning operation");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setOutputText("");
    setMetrics(null);
    setOperationDetails([]);

    try {
      const payload = {
        sample_id: selectedSample !== "manual" ? parseInt(selectedSample) : null,
        input_text: selectedSample === "manual" ? inputText : null,
        operations: selectedOperations.map(op => ({
          operation: op.operation,
          sequence: op.sequence
        })),
        component_id: componentId,
        content_type: selectedContentType
      };

      const response = await fetch(`/api/cleaning/run-cleaning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to run cleaning");
      }

      setResult(data);
      setOutputText(data.result.after);
      setMetrics(data.result.metrics);
      setOperationDetails(data.result.operations_applied);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run cleaning");
    } finally {
      setLoading(false);
    }
  };

  const runBatchCleaning = async () => {
    if (selectedOperations.length === 0) {
      setError("Please select at least one cleaning operation");
      return;
    }

    setBatchStatus('running');
    setBatchProgress(0);
    setBatchResults([]);
    setError(null);

    const results = [];
    let completed = 0;

    for (const item of selectedItems) {
      try {
        // Map source_type to backend content_type
        let contentType = "news";
        switch (item.source_type) {
          case "online-media": contentType = "news"; break;
          case "social-media": contentType = "social"; break;
          case "print-media": contentType = "print"; break;
          case "broadcast-media": contentType = "broadcast"; break;
          default: contentType = selectedContentType; // Fallback
        }

        const payload = {
          sample_id: null, // Force use of input_text for batch cleaning
          input_text: item.content || "",
          operations: selectedOperations.map(op => ({
            operation: op.operation,
            sequence: op.sequence
          })),
          component_id: componentId,
          content_type: contentType
        };

        const response = await fetch(`/api/cleaning/run-cleaning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.detail || `API Error: ${response.status}`);
        }

        // Optionally save result automatically for batch
        const resultData = await response.json();

        // Auto-save cleaned data
        // Auto-save cleaned data
        const saveResponse = await fetch(`/api/cleaning/save-cleaning`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sample_id: item.id,
            component_id: componentId,
            input_text: item.content,
            output_text: resultData.result.after,
            operations: selectedOperations,
            metrics: resultData.result.metrics,
            results: resultData.result.results, // Pass results to backend
            // Metadata for import-on-save
            title: item.title || "No Title",
            source_type: item.source_type,
            source_name: (item as any).source || item.source_type,
            external_id: String(item.id)
          })
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json().catch(() => ({}));
          throw new Error(`Save Error: ${errorData.error || errorData.detail || saveResponse.status}`);
        }

        results.push({ id: item.id, success: true });

      } catch (err) {
        results.push({ id: item.id, success: false, error: err instanceof Error ? err.message : "Unknown error" });
      }

      completed++;
      setBatchProgress(Math.round((completed / selectedItems.length) * 100));
      setBatchResults([...results]);
    }

    setBatchStatus('completed');
  };

  const handleSaveResult = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const payload = {
        sample_id: selectedSample !== "manual" ? parseInt(selectedSample) : null,
        component_id: componentId,
        input_text: inputText,
        output_text: outputText,
        operations: selectedOperations,
        metrics: metrics,
        results: result.result.results // Pass results from single run result
      };

      const response = await fetch(`/api/cleaning/save-cleaning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save");
      }

      alert(`${actionTerm} result saved successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/cleaning/cleaning-history?component_id=${componentId}&limit=10`);
      const data = await response.json();
      setHistory(data);
      setShowHistory(true);
    } catch (err) {
      setError("Failed to load history");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    if (selectedItems.length > 0 && onClearSelection) {
      onClearSelection();
    }
    setSelectedSample("manual");
    setInputText("");
    setOutputText("");
    setSelectedOperations([]);
    setResult(null);
    setError(null);
    setMetrics(null);
    setOperationDetails([]);
    setBatchStatus('idle');
    setBatchResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">How to use:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {selectedItems.length > 0 ? (
                <>
                  <li>You have selected {selectedItems.length} items for cleaning</li>
                  <li>Choose {actionTerm.toLowerCase()} operations below to apply to ALL selected items</li>
                  <li>Click {runActionTerm} to process them in batch</li>
                </>
              ) : (
                <>
                  <li>Select sample data from database OR paste your own text</li>
                  <li>Choose multiple cleaning operations (order matters!)</li>
                  <li>View before/after comparison with detailed metrics</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Input Section - Hide if items selected */}
      {selectedItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">1. Input Data</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedContentType("news");
                loadSources();
                setSelectedSource("");
                setSelectedSample("manual");
                setInputText("");
                setSampleData([]);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* ... (Existing Input UI kept same) ... */}
          {/* Step 0: Select Content Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Content Type
            </label>
            <Select value={selectedContentType} onValueChange={handleContentTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose content type..." />
              </SelectTrigger>
              <SelectContent>
                {contentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContentType && (
              <p className="text-xs text-muted-foreground mt-1">
                {contentTypeOptions.find(o => o.value === selectedContentType)?.description}
              </p>
            )}
          </div>

          {/* Step 1: Select Source */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select {selectedContentType === "news" ? "News Source" :
                selectedContentType === "social" ? "Platform" :
                  selectedContentType === "print" ? "Newspaper" : "Channel"}
            </label>
            <Select value={selectedSource} onValueChange={handleSourceChange} disabled={!selectedContentType || loadingSources}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingSources ? "Loading sources..." : "Choose a source first..."} />
              </SelectTrigger>
              <SelectContent>
                {sources.length > 0 ? (
                  sources.map((source) => (
                    <SelectItem key={source.name} value={source.name}>
                      {source.name} ({source.count} {selectedContentType === "social" ? "posts" : "articles"})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    {loadingSources ? "Loading sources..." : "No sources available"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedSource && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {selectedSource}
              </p>
            )}
          </div>

          {/* Step 2: Select Sample from Source */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Sample from Database
            </label>
            {!selectedSource ? (
              <div className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Please select a source first
              </div>
            ) : (
              <Select value={selectedSample} onValueChange={handleSampleSelect} disabled={!selectedSource}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a sample..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">-- Manual Input --</SelectItem>
                  {Array.isArray(sampleData) && sampleData.length > 0 ? (
                    sampleData.map((sample) => (
                      <SelectItem key={sample.id} value={sample.id.toString()}>
                        {sample.title.substring(0, 60)}...
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      {loadingSamples ? "Loading..." : "No sample data available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Or Paste Your Text
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your text here for cleaning..."
              disabled={selectedSample !== "manual"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {inputText.length} characters
            </p>
          </div>
        </div>
      ) : (
        /* Selected Items Summary */
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Selected for Batch {actionTerm}
            </h3>
            <span className="text-xs font-medium bg-background px-2 py-1 rounded border">
              {selectedItems.length} items
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
            {selectedItems.map((item) => (
              <div key={item.id} className="text-xs flex items-center gap-2 p-1.5 bg-background rounded border">
                <span className="text-muted-foreground w-12 truncate flex-shrink-0">ID: {item.id}</span>
                <span className="truncate flex-1 font-medium">{item.title || item.content?.substring(0, 50)}</span>
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{item.source_type}</span>
              </div>
            ))}
          </div>

          {/* Batch Progress Bar */}
          {batchStatus !== 'idle' && (
            <div className="space-y-2 mt-4 pt-4 border-t border-primary/10">
              <div className="flex justify-between text-xs mb-1">
                <span>{actionTerm} Progress</span>
                <span>{batchProgress}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
              {batchStatus === 'completed' && (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {batchResults.filter(r => r.success).length} Successful
                    </span>
                    {batchResults.filter(r => !r.success).length > 0 && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {batchResults.filter(r => !r.success).length} Failed
                      </span>
                    )}
                  </div>
                  {/* Error Details */}
                  {batchResults.filter(r => !r.success).length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 rounded p-2 text-xs space-y-1 max-h-32 overflow-y-auto border border-red-100 dark:border-red-800">
                      <p className="font-semibold text-red-700 dark:text-red-400">Error Details:</p>
                      {batchResults.filter(r => !r.success).map((res, idx) => (
                        <div key={idx} className="text-red-600 dark:text-red-400 flex gap-2">
                          <span className="font-mono">ID {res.id}:</span>
                          <span>{res.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Operations Selection */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        {/* ... (Existing Operations UI - unchanged apart from title number) ... */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {selectedItems.length > 0 ? "1." : "2."} {componentId === "2.5" ? "Select Pipeline Preset" : `Select ${actionTerm} Operations`}
            {componentId === "2.5" && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">(Single select - mutually exclusive)</span>
            )}
          </h3>
          {/* Show Select All button only for components 2.1-2.4 */}
          {componentId !== "2.5" && (
            <div className="flex gap-2">
              {selectedOperations.length === operations.length ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOperations([])}
                >
                  Clear All
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allOps = operations.map((op, idx) => ({
                      operation: op.value,
                      sequence: idx + 1,
                      label: op.label
                    }));
                    setSelectedOperations(allOps);
                  }}
                >
                  Select All
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {operations.map((op) => {
            const isSelected = selectedOperations.find(o => o.operation === op.value);
            return (
              <div
                key={op.value}
                className={cn(
                  "rounded-md border p-3 cursor-pointer transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleOperation(op)}
              >
                <div className="flex items-start gap-3">
                  {/* Radio button for 2.5, Checkbox for 2.1-2.4 */}
                  {componentId === "2.5" ? (
                    <div className="mt-1">
                      {isSelected ? (
                        <div className="h-4 w-4 rounded-full border-4 border-primary bg-background" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  ) : (
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => { }}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{op.label}</p>
                      {isSelected && componentId !== "2.5" && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          #{isSelected.sequence}
                        </span>
                      )}
                      {isSelected && componentId === "2.5" && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{op.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleRunCleaning}
          // Enable if batch processing (selectedItems > 0) OR (single processing with text)
          // AND operation selected
          disabled={
            (batchStatus === 'running' || loading) ||
            (selectedItems.length === 0 && !inputText) ||
            selectedOperations.length === 0
          }
          className="flex-1"
        >
          {loading || batchStatus === 'running' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {batchStatus === 'running' ? `Processing ${selectedItems.length} items...` : "Processing..."}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {selectedItems.length > 0 ? `Run Batch ${actionTerm} (${selectedItems.length})` : runActionTerm}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={resetForm}
          disabled={loading || batchStatus === 'running'}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button
          variant="outline"
          onClick={loadHistory}
        >
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results - Single Item Mode Only */}
      {result && selectedItems.length === 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-semibold">Cleaning Completed</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveResult}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Result
              </Button>
            </div>
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Chars Before</p>
                <p className="text-lg font-semibold">{metrics.total_chars_before.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Chars After</p>
                <p className="text-lg font-semibold">{metrics.total_chars_after.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Reduced</p>
                <p className="text-lg font-semibold text-green-600">{metrics.percentage_reduced}%</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Processing Time</p>
                <p className="text-lg font-semibold">{metrics.processing_time_ms}ms</p>
              </div>
            </div>
          )}

          {/* Operation Details */}
          {operationDetails.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold mb-3">Operation Details</h4>
              <div className="space-y-2">
                {operationDetails.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-xs bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                      {detail.sequence}
                    </span>
                    <span className="flex-1">{detail.operation}</span>
                    <span className="text-xs text-muted-foreground">
                      -{detail.chars_removed} chars ({detail.percentage_removed}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before/After Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                <h4 className="text-sm font-semibold">BEFORE</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(inputText)}
                  className="h-7"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
                  {inputText}
                </pre>
              </div>
            </div>

            <div className="rounded-lg border border-green-200 bg-card overflow-hidden dark:border-green-900">
              <div className="bg-green-50 dark:bg-green-950 px-4 py-2 border-b border-green-200 dark:border-green-900 flex items-center justify-between">
                <h4 className="text-sm font-semibold">AFTER</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(outputText)}
                  className="h-7"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
                  {outputText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
