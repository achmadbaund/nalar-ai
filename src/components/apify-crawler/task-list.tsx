"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Facebook, Instagram, Music, Twitter, Youtube, Calendar, Eye, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { useHydration } from "@/hooks/use-hydration";
import { Platform } from "./types";
import { cn } from "@/lib/utils";

interface Task {
  task_id: string;
  platform: Platform;
  status: "pending" | "processing" | "completed" | "failed";
  created_at?: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
  result?: any;
}

interface TasksResponse {
  data: Task[];
  pagination?: {
    count: number;
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
    limit: number;
    offset: number;
    total: number;
    total_pages: number;
  };
}

interface TaskListFilters {
  platform: string;
  status: string;
  startDate: string;
  endDate: string;
  currentPage: number;
}

const STORAGE_KEY = "apify-task-list-filters";

const PLATFORM_ICONS: Record<Platform, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  twitter: Twitter,
  youtube: Youtube,
};

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

const STATUS_ICONS = {
  completed: CheckCircle2,
  failed: XCircle,
  processing: Loader2,
  pending: Clock,
};

export default function TaskList() {
  const [tasksData, setTasksData] = useState<TasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(20);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Use task statuses hook only for reading status (no auto-update)
  const { taskStatuses, getTaskStatus } = useTaskStatuses();
  
  // Prevent hydration mismatch
  const hydrated = useHydration();

  const [filters, setFilters] = useLocalStorage<TaskListFilters>(STORAGE_KEY, {
    platform: "",
    status: "",
    startDate: "",
    endDate: "",
    currentPage: 1,
  });

  const { platform, status, startDate, endDate, currentPage } = filters;

  const setPlatform = (value: string) => {
    setFilters((prev) => ({ ...prev, platform: value, currentPage: 1 }));
  };

  const setStatus = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value, currentPage: 1 }));
  };

  const setStartDate = (value: string) => {
    setFilters((prev) => ({ ...prev, startDate: value, currentPage: 1 }));
  };

  const setEndDate = (value: string) => {
    setFilters((prev) => ({ ...prev, endDate: value, currentPage: 1 }));
  };

  const setCurrentPage = (page: number) => {
    setFilters((prev) => ({ ...prev, currentPage: page }));
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (platform) params.set("platform", platform);
      if (status) params.set("status", status);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tasks");
      }

      setTasksData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, status, startDate, endDate, currentPage]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("id-ID", {
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

  const getStatusIcon = (taskStatus: string) => {
    const Icon = STATUS_ICONS[taskStatus as keyof typeof STATUS_ICONS] || Clock;
    const isProcessing = taskStatus === "processing";
    return (
      <Icon
        className={cn(
          "h-4 w-4",
          isProcessing && "animate-spin",
        )}
      />
    );
  };

  const PlatformIcon = platform ? PLATFORM_ICONS[platform as Platform] : null;

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Task List Management</h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Task List Management</h2>
          {tasksData?.pagination && (
            <span className="text-sm text-muted-foreground">
              ({tasksData.pagination.total} total)
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTasks}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters Panel */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Platform Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Platforms</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(platform || status || startDate || endDate) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlatform("");
                  setStatus("");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tasks Table */}
      {!loading && !error && tasksData && (
        <>
          {tasksData.data && tasksData.data.length > 0 ? (
            <div className="rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold w-12"></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Task ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Platform</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Created At</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Started At</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Completed At</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasksData.data.map((task) => {
                      const PlatformIconComponent = PLATFORM_ICONS[task.platform];
                      const isExpanded = expandedTasks.has(task.task_id);
                      // Get status from persistent storage if available, otherwise use API status
                      const storedStatus = getTaskStatus(task.task_id);
                      const displayStatus = storedStatus?.status || task.status;
                      const displayError = storedStatus?.error || task.error;
                      return (
                        <React.Fragment key={task.task_id}>
                          <tr
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTaskExpansion(task.task_id)}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                  {task.task_id}
                                </code>
                                {displayError && (
                                  <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Error
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {PlatformIconComponent && (
                                  <PlatformIconComponent className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium capitalize">{task.platform}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(displayStatus)}
                                <span
                                  className={cn(
                                    "text-sm font-medium px-2 py-1 rounded capitalize",
                                    STATUS_COLORS[displayStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending,
                                  )}
                                >
                                  {displayStatus}
                                </span>
                                {storedStatus && storedStatus.status !== task.status && (
                                  <span className="text-xs text-muted-foreground" title="Updated from persistent storage">
                                    (updated)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{formatDate(task.created_at)}</span>
                                {task.updated_at && task.updated_at !== task.created_at && (
                                  <span className="text-xs text-muted-foreground/70">
                                    Updated: {formatDate(task.updated_at)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {task.started_at ? (
                                <span>{formatDate(task.started_at)}</span>
                              ) : (
                                <span className="text-muted-foreground/50">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {task.completed_at ? (
                                <span className="text-green-600 dark:text-green-400">
                                  {formatDate(task.completed_at)}
                                </span>
                              ) : task.status === "failed" ? (
                                <span className="text-red-600 dark:text-red-400">Failed</span>
                              ) : (
                                <span className="text-muted-foreground/50">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/apify-crawler/tasks/${task.task_id}/posts`, "_blank");
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  View Posts
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-muted/20">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="space-y-3">
                                  <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="flex-1 space-y-2">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium text-muted-foreground">Task ID:</span>
                                          <code className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
                                            {task.task_id}
                                          </code>
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">Platform:</span>
                                          <span className="ml-2 capitalize">{task.platform}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">Status:</span>
                                          <span className={cn(
                                            "ml-2 font-medium capitalize",
                                            displayStatus === "completed" && "text-green-600 dark:text-green-400",
                                            displayStatus === "failed" && "text-red-600 dark:text-red-400",
                                            displayStatus === "processing" && "text-blue-600 dark:text-blue-400",
                                            displayStatus === "pending" && "text-yellow-600 dark:text-yellow-400",
                                          )}>
                                            {displayStatus}
                                          </span>
                                          {storedStatus && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              (last updated: {new Date(storedStatus.updatedAt).toLocaleTimeString("id-ID")})
                                            </span>
                                          )}
                                        </div>
                                        {task.started_at && (
                                          <div>
                                            <span className="font-medium text-muted-foreground">Started:</span>
                                            <span className="ml-2">{formatDate(task.started_at)}</span>
                                          </div>
                                        )}
                                        {task.completed_at && (
                                          <div>
                                            <span className="font-medium text-muted-foreground">Completed:</span>
                                            <span className="ml-2 text-green-600 dark:text-green-400">
                                              {formatDate(task.completed_at)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {displayError && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                                          <div className="flex items-start gap-2">
                                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                                Error Message:
                                              </p>
                                              <p className="text-sm text-red-700 dark:text-red-300">
                                                {displayError}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {(storedStatus?.result || task.result) && (
                                        <details className="rounded-lg border border-border bg-card p-3">
                                          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                            View Result Data
                                          </summary>
                                          <pre className="mt-2 text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-48">
                                            {JSON.stringify(storedStatus?.result || task.result, null, 2)}
                                          </pre>
                                        </details>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          )}

          {/* Pagination */}
          {tasksData.pagination && tasksData.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {tasksData.pagination.offset + 1} to{" "}
                {Math.min(
                  tasksData.pagination.offset + tasksData.pagination.limit,
                  tasksData.pagination.total,
                )}{" "}
                of {tasksData.pagination.total} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!tasksData.pagination.has_prev || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {tasksData.pagination.current_page} of {tasksData.pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!tasksData.pagination.has_next || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

