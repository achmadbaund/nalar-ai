"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, XCircle, CheckCircle2, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchJobDetail, BatchJob } from "./types";

export default function JobMonitor() {
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<BatchJobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [allJobs, setAllJobs] = useState<BatchJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch all jobs for dropdown
  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        setLoadingJobs(true);
        const params = new URLSearchParams();
        params.set("limit", "100");
        params.set("offset", "0");

        const response = await fetch(`/api/batch-processor/jobs?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Handle both array response and object with jobs property
          const jobsArray = Array.isArray(data) ? data : (data.jobs || data.results || []);
          setAllJobs(jobsArray);
        }
      } catch (err) {
        // Silent fail - dropdown will just be empty
        console.error("Failed to fetch all jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchAllJobs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleJobSelect = (selectedJobId: string) => {
    setJobId(selectedJobId);
    setShowDropdown(false);
    setJob(null);
    setError(null);
    // Auto fetch job when selected
    fetchJob(selectedJobId);
  };

  const fetchJob = async (id: string) => {
    if (!id.trim()) {
      setError("Job ID tidak boleh kosong");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/batch-processor/jobs/${id.trim()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Job tidak ditemukan");
      }

      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil job");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchJob(jobId);
  };

  const startMonitoring = () => {
    if (!jobId.trim()) {
      setError("Job ID tidak boleh kosong");
      return;
    }

    setMonitoring(true);
    fetchJob(jobId);

    const id = setInterval(() => {
      fetchJob(jobId);
    }, 5000);

    setIntervalId(id);
  };

  const stopMonitoring = () => {
    setMonitoring(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  useEffect(() => {
    if (job && (job.status === "completed" || job.status === "failed")) {
      stopMonitoring();
    }
  }, [job]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 text-green-800 dark:text-green-200";
      case "failed":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200";
      case "processing":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200";
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200";
      default:
        return "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-900 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Job ID Dropdown */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Pilih dari Jobs List
        </label>
        <div className="relative dropdown-container">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent"
            disabled={loadingJobs}
          >
            <span className={jobId ? "text-foreground" : "text-muted-foreground"}>
              {jobId
                ? `Job ID: ${jobId}${allJobs.find((j) => j.job_id === jobId) ? ` (${allJobs.find((j) => j.job_id === jobId)?.status})` : ""}`
                : "Pilih Job ID dari list..."}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
          </button>
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {loadingJobs ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Memuat jobs...
                </div>
              ) : allJobs && allJobs.length > 0 ? (
                <div className="p-1">
                  {allJobs.map((jobItem) => (
                    <button
                      key={jobItem.id}
                      type="button"
                      onClick={() => handleJobSelect(jobItem.job_id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Job ID: {jobItem.job_id}</div>
                          <div className="text-xs text-muted-foreground">
                            Status: {jobItem.status} • Progress: {jobItem.progress_percentage != null ? jobItem.progress_percentage.toFixed(1) : "0.0"}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Tidak ada jobs ditemukan
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={jobId}
          onChange={(e) => {
            setJobId(e.target.value);
          }}
          placeholder="Masukkan Job ID"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !jobId.trim()}
        >
          <Search className="h-4 w-4 mr-1" />
          Cari
        </Button>
        {monitoring ? (
          <Button
            variant="destructive"
            onClick={stopMonitoring}
          >
            Stop Monitor
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={startMonitoring}
            disabled={!jobId.trim()}
          >
            Start Monitor
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading && !job && (
        <div className="flex min-h-32 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat job...</span>
          </div>
        </div>
      )}

      {job && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(job.status)}
              <div>
                <h3 className="text-lg font-semibold font-mono">{job.job_id}</h3>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium capitalize mt-1 ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
            </div>
            {monitoring && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Monitoring aktif...</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {job.progress_percentage != null ? job.progress_percentage.toFixed(1) : "0.0"}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${job.progress_percentage != null ? job.progress_percentage : 0}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Items</div>
              <div className="text-lg font-semibold">{job.total_items ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Processed</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">{job.processed_items ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Failed</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{job.failed_items ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Progress</div>
              <div className="text-lg font-semibold">
                {job.progress_percentage != null ? job.progress_percentage.toFixed(1) : "0.0"}%
              </div>
            </div>
          </div>

          {/* Error Message */}
          {job.error_message && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error Message</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{job.error_message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Created At</div>
              <div className="text-sm font-medium">{formatDate(job.created_at)}</div>
            </div>
            {job.started_at && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Started At</div>
                <div className="text-sm font-medium">{formatDate(job.started_at)}</div>
              </div>
            )}
            {job.completed_at && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Completed At</div>
                <div className="text-sm font-medium">{formatDate(job.completed_at)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

