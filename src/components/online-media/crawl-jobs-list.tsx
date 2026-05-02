"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CrawlJob, PaginatedResponse } from "@/types/online-media";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CrawlJobsListProps {
  sourceFilter?: number;
}

const STATUS_ICONS = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const STATUS_COLORS = {
  pending: "text-yellow-600 dark:text-yellow-400",
  processing: "text-blue-600 dark:text-blue-400",
  completed: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
};

export default function CrawlJobsList({ sourceFilter }: CrawlJobsListProps) {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("");

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("page_size", pageSize.toString());
      params.append("ordering", "-started_at");

      if (sourceFilter) params.append("source", sourceFilter.toString());
      if (statusFilter) params.append("status", statusFilter);
      if (triggerTypeFilter) params.append("trigger_type", triggerTypeFilter);

      const response = await fetch(`/api/online-media/jobs?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      
      const data: PaginatedResponse<CrawlJob> = await response.json();

      setJobs(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      toast.error("Failed to fetch crawl jobs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sourceFilter, statusFilter, triggerTypeFilter]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      // We don't want to show loading spinner on auto-refresh
      const fetchWithoutLoading = async () => {
        try {
          const params = new URLSearchParams();
          params.append("page", currentPage.toString());
          params.append("page_size", pageSize.toString());
          params.append("ordering", "-started_at");

          if (sourceFilter) params.append("source", sourceFilter.toString());
          if (statusFilter) params.append("status", statusFilter);
          if (triggerTypeFilter) params.append("trigger_type", triggerTypeFilter);

          const response = await fetch(`/api/online-media/jobs?${params.toString()}`);
          if (response.ok) {
            const data: PaginatedResponse<CrawlJob> = await response.json();
            setJobs(data.results);
            setTotalCount(data.count);
          }
        } catch (err) {
          console.error("Auto-refresh failed", err);
        }
      };
      fetchWithoutLoading();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, [autoRefresh, currentPage, pageSize, sourceFilter, statusFilter, triggerTypeFilter]);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "Running...";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Crawl Jobs</h2>
        <div className="flex gap-2">
           <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "bg-muted")}
          >
            <Clock className={cn("h-4 w-4 mr-2", autoRefresh && "text-green-600")} />
            {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trigger Type</label>
          <select
            value={triggerTypeFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setTriggerTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Types</option>
            <option value="manual">Manual</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Jobs Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading jobs...
                  </div>
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No crawl jobs found.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const StatusIcon = STATUS_ICONS[job.status] || AlertCircle;
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("h-4 w-4", STATUS_COLORS[job.status])} />
                        <span className="capitalize">{job.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{job.source_name}</TableCell>
                    <TableCell>
                      <Badge variant={job.trigger_type === "manual" ? "secondary" : "outline"}>
                        {job.trigger_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(job.started_at)}</TableCell>
                    <TableCell>{calculateDuration(job.started_at, job.completed_at)}</TableCell>
                    <TableCell>
                      {job.status === "completed" ? (
                        <span className="font-medium">{job.items_crawled} articles</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={job.error_message || ""}>
                      {job.error_message || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const pageNum = startPage + i;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
