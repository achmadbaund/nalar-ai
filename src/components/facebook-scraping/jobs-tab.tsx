"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getJobs,
  type CrawlJob,
  type PaginatedResponse,
} from "@/utils/api/facebookApi";
import { toast } from "sonner";

export default function JobsTab() {
  const [data, setData] = useState<PaginatedResponse<CrawlJob> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastToastRef = useRef<string | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [filters, setFilters] = useState({
    account: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeJobIds, setActiveJobIds] = useState<Set<number>>(new Set());

  const fetchJobs = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (filters.account) {
        params.account = parseInt(filters.account);
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await getJobs(params);
      setData(response);
      
      // Update activeJobIds berdasarkan status dari response
      setActiveJobIds((prev) => {
        const newActiveJobIds = new Set<number>();
        response.results.forEach((job) => {
          if (job.status === "running" || job.status === "pending") {
            newActiveJobIds.add(job.id);
          } else {
            // Hapus dari activeJobIds jika sudah tidak active
            prev.delete(job.id);
          }
        });
        return newActiveJobIds;
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch jobs";
      setError(errorMessage);
      
      if (!silent) {
        // Prevent duplicate toast within 2 seconds
        const now = Date.now();
        if (lastToastRef.current !== errorMessage || now - lastToastTimeRef.current > 2000) {
          toast.error(errorMessage);
          lastToastRef.current = errorMessage;
          lastToastTimeRef.current = now;
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, pageSize, filters.account, filters.status]);

  // Auto-refresh jika ada job yang sedang berjalan
  useEffect(() => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Jika ada job yang sedang running atau pending, mulai polling setiap 3 detik
    if (activeJobIds.size > 0) {
      const interval = setInterval(() => {
        fetchJobs(true); // Silent refresh untuk polling
      }, 3000); // Refresh setiap 3 detik
      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else {
      setPollingInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJobIds.size]);

  const jobs = data?.results || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Account ID</label>
            <input
              type="number"
              value={filters.account}
              onChange={(e) => {
                setFilters({ ...filters, account: e.target.value });
                setPage(1);
              }}
              placeholder="Filter by account ID..."
              className="h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="rounded-md border border-border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Account</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Posts Crawled</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Started At</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Completed At</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No jobs found
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{job.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {job.account_username || `Account #${job.account}`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={job.status} type="job_status" />
                      </td>
                      <td className="px-4 py-3 text-sm">{job.posts_crawled || 0}</td>
                      <td className="px-4 py-3 text-sm">
                        {job.started_at
                          ? new Date(job.started_at).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.error_message ? (
                          <span className="text-destructive text-xs">{job.error_message}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.count > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((data.page - 1) * data.page_size) + 1} to {Math.min(data.page * data.page_size, data.count)} of{" "}
                {data.count} jobs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.previous}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {data.page} of {data.total_pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
