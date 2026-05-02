"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchJob, BatchJobsResponse } from "./types";

export default function JobsList() {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [total, setTotal] = useState(0);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", pageSize.toString());
      params.set("offset", ((currentPage - 1) * pageSize).toString());

      const response = await fetch(`/api/batch-processor/jobs?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Gagal mengambil jobs");
      }

      // Handle both array response and object with jobs property
      const jobsArray = Array.isArray(data) ? data : (data.jobs || data.results || []);
      setJobs(jobsArray);
      setTotal(jobsArray.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [currentPage, pageSize, statusFilter]);

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
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
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

  const totalPages = Math.ceil(total / pageSize);

  if (loading && jobs.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat jobs...</span>
        </div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Page Size:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchJobs}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">Tidak ada jobs ditemukan</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-medium font-mono">{job.job_id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Total Items: </span>
                        <span className="font-medium">{job.total_items ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processed: </span>
                        <span className="font-medium">{job.processed_items ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed: </span>
                        <span className="font-medium">{job.failed_items ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Progress: </span>
                        <span className="font-medium">
                          {job.progress_percentage != null ? job.progress_percentage.toFixed(1) : "0.0"}%
                        </span>
                      </div>
                    </div>

                    {job.error_message && (
                      <div className="rounded border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          <strong>Error:</strong> {job.error_message}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Created: </span>
                        <span>{formatDate(job.created_at)}</span>
                      </div>
                      {job.started_at && (
                        <div>
                          <span>Started: </span>
                          <span>{formatDate(job.started_at)}</span>
                        </div>
                      )}
                      {job.completed_at && (
                        <div>
                          <span>Completed: </span>
                          <span>{formatDate(job.completed_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

