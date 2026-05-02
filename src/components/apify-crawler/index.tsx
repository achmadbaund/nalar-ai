"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Facebook, Instagram, Music, Twitter, Youtube, List, DollarSign, Layers, Loader2, X, Clock, CheckCircle2, XCircle, AlertCircle, ClipboardList, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useCrawlJobs } from "@/hooks/use-crawl-jobs";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { useHydration } from "@/hooks/use-hydration";
import { Platform, CrawlResponse, TaskStatus, BatchCrawlResponse } from "./types";

const PLATFORM_ICONS: Record<Platform, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  twitter: Twitter,
  youtube: Youtube,
};
import FacebookCrawler from "./facebook-crawler";
import InstagramCrawler from "./instagram-crawler";
import TikTokCrawler from "./tiktok-crawler";
import TwitterCrawler from "./twitter-crawler";
import YouTubeCrawler from "./youtube-crawler";
import BatchCrawler from "./batch-crawler";
import ResponseDisplay from "./shared/response-display";
import PostsList from "./posts-list";
import CostsTracking from "./costs-tracking";
import TaskList from "./task-list";

interface ApifyCrawlerProps {
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

type TabType = Platform | "posts" | "costs" | "batch" | "tasks";

const STORAGE_KEY_TAB = "apify-crawler-active-tab";

function ApifyCrawlerContent({ platform, onPlatformChange }: ApifyCrawlerProps) {
  const searchParams = useSearchParams();

  // Read tab from query params if exists
  const tabFromQuery = searchParams.get("tab") as TabType | null;

  // Persist activeTab to localStorage
  const [activeTab, setActiveTab] = useLocalStorage<TabType>(STORAGE_KEY_TAB, tabFromQuery || "facebook");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CrawlResponse | null>(null);
  const [batchResponse, setBatchResponse] = useState<BatchCrawlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [checkingTask, setCheckingTask] = useState(false);
  const [checkingBatchTasks, setCheckingBatchTasks] = useState(false);

  // Crawl jobs management
  const { jobs, activeJobs, addJob, removeJob, clearAllJobs, isPolling } = useCrawlJobs();

  // Task statuses management with persistent storage
  const { taskStatuses, isPolling: isPollingTasks, addTasks, getTaskStatuses } = useTaskStatuses();

  // Prevent hydration mismatch
  const hydrated = useHydration();

  // Ref for scrolling to top when crawl starts
  const topRef = useRef<HTMLDivElement>(null);
  const activeJobsRef = useRef<HTMLDivElement>(null);

  // Apply tab from query parameter if it exists
  useEffect(() => {
    if (tabFromQuery && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  // Sync platform state with activeTab when component mounts or activeTab changes
  useEffect(() => {
    if (activeTab !== "posts" && activeTab !== "costs" && activeTab !== "batch" && activeTab !== "tasks") {
      onPlatformChange(activeTab as Platform);
    }
  }, [activeTab, onPlatformChange]);

  // Auto-scroll to top when crawl starts (response, batchResponse, or activeJobs changes)
  useEffect(() => {
    if (response || batchResponse || activeJobs.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Try to scroll to active jobs section first, otherwise scroll to top
        if (activeJobsRef.current && activeJobs.length > 0) {
          activeJobsRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        } else if (topRef.current) {
          topRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        } else {
          // Fallback: scroll window to top
          window.scrollTo({ 
            top: 0, 
            behavior: "smooth" 
          });
        }
      }, 100);
    }
  }, [response, batchResponse, activeJobs.length]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab !== "posts" && tab !== "costs" && tab !== "batch" && tab !== "tasks") {
      onPlatformChange(tab as Platform);
    }
    // Clear responses when switching tabs
    if (tab !== "batch") {
      setBatchResponse(null);
    }
  };

  const handleResponse = (resp: CrawlResponse, payload?: any) => {
    setResponse(resp);
    setError(null);
    // Save to crawl jobs with payload
    addJob(resp, payload);
    // Add task to persistent storage for auto-update
    const taskIds = resp.task_id.split(",").filter(Boolean);
    addTasks(taskIds);
  };

  const handleBatchResponse = (resp: BatchCrawlResponse, payload?: any) => {
    setBatchResponse(resp);
    setError(null);
    // Convert to CrawlResponse for compatibility
    const crawlResp: CrawlResponse = {
      task_id: resp.tasks.map((t) => t.task_id).join(","),
      status: resp.status,
      mode: "batch",
    };
    setResponse(crawlResp);
    // Save to crawl jobs with payload
    addJob(resp, payload);
    // Add all tasks to persistent storage for auto-update
    const taskIds = resp.tasks.map((t) => t.task_id);
    addTasks(taskIds);
  };

  const handleError = (err: string | null) => {
    setError(err);
    if (!err) {
      setResponse(null);
      setBatchResponse(null);
    }
  };

  const checkTaskStatus = async () => {
    setCheckingTask(true);
    try {
      // For batch crawl, check all task statuses
      if (batchResponse && batchResponse.tasks.length > 0) {
        setCheckingBatchTasks(true);
        // Status akan di-update otomatis oleh useTaskStatuses hook
        // Kita hanya perlu trigger manual check jika diperlukan
        setCheckingBatchTasks(false);
      } else if (response?.task_id) {
        // For single task, check the task status
        const res = await fetch(`/api/tasks/${response.task_id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch task status");
        }

        setTaskStatus(data);
      }
    } catch (err) {
      handleError(err instanceof Error ? err.message : "Failed to fetch task status");
    } finally {
      setCheckingTask(false);
    }
  };

  const crawlerProps = {
    onResponse: handleResponse,
    onError: handleError,
    loading,
    setLoading,
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  // Use default tab during SSR to prevent hydration mismatch
  const displayTab = hydrated ? activeTab : "facebook";

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Top anchor for scrolling */}
      <div ref={topRef} className="scroll-mt-4" />
      
      {/* Crawl Jobs Info Header - Notification Style */}
      {hydrated && activeJobs.length > 0 && (
        <div ref={activeJobsRef} className="border-b border-border bg-blue-50 dark:bg-blue-950/20 p-4 scroll-mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                Active Crawl Jobs ({activeJobs.length})
              </h3>
              {isPolling && (
                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Polling aktif (5s)</span>
                </span>
              )}
            </div>
            {activeJobs.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllJobs}
                className="h-7 text-xs text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {activeJobs.map((job) => {
              // Get task statuses for this job
              const taskStatusesForJob = getTaskStatuses(job.taskIds);
              const taskStatusCounts = {
                completed: 0,
                failed: 0,
                processing: 0,
                pending: 0,
              };
              
              job.taskIds.forEach((taskId) => {
                const status = taskStatusesForJob[taskId]?.status || "pending";
                if (status === "completed") taskStatusCounts.completed++;
                else if (status === "failed") taskStatusCounts.failed++;
                else if (status === "processing") taskStatusCounts.processing++;
                else taskStatusCounts.pending++;
              });

              const totalTasks = job.taskIds.length;
              const completedTasks = taskStatusCounts.completed + taskStatusCounts.failed;
              const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={job.id}
                  className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(job.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium capitalize">
                            {job.mode === "batch" ? "Batch Crawl" : job.platform || "Crawl"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {job.taskIds.length} task{job.taskIds.length > 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {formatTimeAgo(job.createdAt)}
                          </span>
                        </div>
                        {job.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                            {job.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJob(job.id)}
                      className="h-6 w-6 p-0 ml-2 hover:bg-red-100 dark:hover:bg-red-900"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Task Status Breakdown */}
                  {totalTasks > 0 && (
                    <div className="mt-3 space-y-2">
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                          {progressPercentage}%
                        </span>
                      </div>

                      {/* Status Counts */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {taskStatusCounts.completed > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle2 className="h-3 w-3" />
                            {taskStatusCounts.completed} completed
                          </span>
                        )}
                        {taskStatusCounts.processing > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {taskStatusCounts.processing} processing
                          </span>
                        )}
                        {taskStatusCounts.pending > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                            <Clock className="h-3 w-3" />
                            {taskStatusCounts.pending} pending
                          </span>
                        )}
                        {taskStatusCounts.failed > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                            <XCircle className="h-3 w-3" />
                            {taskStatusCounts.failed} failed
                          </span>
                        )}
                      </div>

                      {/* Individual Task Statuses (expandable) */}
                      {job.taskIds.length > 1 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <span>View Task Statuses ({job.taskIds.length} tasks)</span>
                          </summary>
                          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                            {job.taskIds.map((taskId) => {
                              const taskStatus = taskStatusesForJob[taskId];
                              const status = taskStatus?.status || "pending";
                              const PlatformIcon = job.platform ? PLATFORM_ICONS[job.platform as Platform] : null;
                              
                              return (
                                <div
                                  key={taskId}
                                  className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {getStatusIcon(status)}
                                    {PlatformIcon && (
                                      <PlatformIcon className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    <code className="text-xs font-mono text-muted-foreground truncate">
                                      {taskId.slice(0, 12)}...
                                    </code>
                                  </div>
                                  <span
                                    className={cn(
                                      "text-xs font-medium px-2 py-0.5 rounded capitalize",
                                      status === "completed"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                        : status === "failed"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                          : status === "processing"
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                    )}
                                  >
                                    {status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {job.payload && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <span>View Payload</span>
                      </summary>
                      <div className="mt-2 p-2 rounded bg-muted/50 border border-border">
                        <pre className="text-xs font-mono overflow-auto max-h-40 text-[10px]">
                          {JSON.stringify(job.payload, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Crawl Status - Notification Style */}
      {batchResponse && (
        <div className="border-b border-border bg-green-50 dark:bg-green-950/20 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
                Batch Crawl Active
              </h3>
              <span className="text-xs text-green-600 dark:text-green-500">
                ({batchResponse.total} task{batchResponse.total > 1 ? "s" : ""})
              </span>
              {isPollingTasks && (
                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Auto-updating (5s)</span>
                </span>
              )}
            </div>
            <Button
              onClick={checkTaskStatus}
              disabled={checkingTask || checkingBatchTasks}
              variant="outline"
              size="sm"
              className="h-7 text-xs border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
            >
              {checkingTask || checkingBatchTasks ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Checking...
                </>
              ) : (
                "Check Status"
              )}
            </Button>
          </div>
          <div className="space-y-2">
            {batchResponse.tasks.map((task, idx) => {
              // Get status from persistent storage
              const storedStatus = taskStatuses[task.task_id];
              const status = storedStatus?.status || task.status || "pending";
              const PlatformIconComponent = PLATFORM_ICONS[task.platform];
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {PlatformIconComponent && (
                        <PlatformIconComponent className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium capitalize">{task.platform}</span>
                          <code className="text-xs font-mono text-muted-foreground">
                            {task.task_id.slice(0, 12)}...
                          </code>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded capitalize",
                          status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : status === "processing"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                        )}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                  {storedStatus?.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Error: {storedStatus.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Status Info Header */}
      {(response || taskStatus || error) && !batchResponse && (
        <div className="border-b border-border bg-muted/30 p-4">
          <div className="space-y-3">

            {/* Single Task Response Status */}
            {response && !batchResponse && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Crawl Started
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {response.task_id.length > 30 ? `${response.task_id.slice(0, 30)}...` : response.task_id}
                  </span>
                </div>
                <Button
                  onClick={checkTaskStatus}
                  disabled={checkingTask}
                  variant="outline"
                  size="sm"
                >
                  {checkingTask ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Checking...
                    </>
                  ) : (
                    "Check Status"
                  )}
                </Button>
              </div>
            )}

            {/* Task Status Display */}
            {taskStatus && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span
                    className={cn(
                      "text-sm font-semibold px-2 py-0.5 rounded",
                      taskStatus.status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : taskStatus.status === "failed"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                    )}
                  >
                    {taskStatus.status}
                  </span>
                  {taskStatus.error && (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      • {taskStatus.error}
                    </span>
                  )}
                </div>
                {taskStatus.result && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Result Details
                    </summary>
                    <pre className="mt-2 bg-muted p-2 rounded overflow-auto max-h-32 text-[10px]">
                      {JSON.stringify(taskStatus.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 p-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleTabChange("facebook")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "facebook"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("instagram")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "instagram"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("tiktok")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "tiktok"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Music className="h-4 w-4" />
            TikTok
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("twitter")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "twitter"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("youtube")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "youtube"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Youtube className="h-4 w-4" />
            YouTube
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("posts")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "posts"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <List className="h-4 w-4" />
            List Posts
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("costs")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "costs"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <DollarSign className="h-4 w-4" />
            Cost Tracking
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("batch")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "batch"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Layers className="h-4 w-4" />
            Batch Crawl
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("tasks")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              displayTab === "tasks"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <ClipboardList className="h-4 w-4" />
            Task List
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {displayTab === "posts" ? (
          <PostsList />
        ) : displayTab === "costs" ? (
          <CostsTracking />
        ) : displayTab === "batch" ? (
          <>
            <BatchCrawler {...crawlerProps} onBatchResponse={handleBatchResponse} />
            {/* Detailed Batch Response (if needed) */}
            {batchResponse && batchResponse.errors && batchResponse.errors.length > 0 && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="font-medium text-red-600 dark:text-red-400 mb-2">Errors:</p>
                <div className="space-y-1">
                  {batchResponse.errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-red-600 dark:text-red-400">
                      <span className="font-medium capitalize">{err.platform}:</span> {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : displayTab === "tasks" ? (
          <TaskList />
        ) : (
          <>
            {displayTab === "facebook" && <FacebookCrawler {...crawlerProps} />}
            {displayTab === "instagram" && <InstagramCrawler {...crawlerProps} />}
            {displayTab === "tiktok" && <TikTokCrawler {...crawlerProps} />}
            {displayTab === "twitter" && <TwitterCrawler {...crawlerProps} />}
            {displayTab === "youtube" && <YouTubeCrawler {...crawlerProps} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function ApifyCrawler({ platform, onPlatformChange }: ApifyCrawlerProps) {
  return (
    <Suspense fallback={
      <div className="rounded-lg border border-border bg-card shadow-sm p-6">
        <div className="flex min-h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat...</span>
          </div>
        </div>
      </div>
    }>
      <ApifyCrawlerContent platform={platform} onPlatformChange={onPlatformChange} />
    </Suspense>
  );
}
