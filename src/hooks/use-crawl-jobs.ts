"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { CrawlResponse, BatchCrawlResponse, TaskStatus } from "@/components/apify-crawler/types";

export interface CrawlJob {
  id: string; // Unique job ID
  taskIds: string[]; // Array of task IDs (for batch, multiple tasks)
  platform?: string; // Platform name
  mode: "single" | "batch";
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: number; // Timestamp
  updatedAt: number; // Last update timestamp
  completedAt?: number; // When job completed/failed
  error?: string;
  result?: any;
  payload?: any; // Request payload sent when crawl started
}

const STORAGE_KEY = "apify-crawl-jobs";
const POLL_INTERVAL = 5000; // 5 seconds
const CLEANUP_DELAY = 3600000; // 1 hour in milliseconds

export function useCrawlJobs() {
  const [jobs, setJobs] = useLocalStorage<CrawlJob[]>(STORAGE_KEY, []);
  const [isPolling, setIsPolling] = useState(false);
  
  // Use refs to store stable references to avoid dependency issues
  const checkTaskStatusRef = useRef<(taskId: string) => Promise<TaskStatus | null>>(undefined);
  const updateJobStatusRef = useRef<(jobId: string, status: CrawlJob["status"], error?: string, result?: any) => void>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add new job
  const addJob = useCallback((response: CrawlResponse | BatchCrawlResponse, payload?: any) => {
    const now = Date.now();
    let newJob: CrawlJob;

    if ("tasks" in response) {
      // Batch response
      newJob = {
        id: `batch-${now}`,
        taskIds: response.tasks.map((t) => t.task_id),
        mode: "batch",
        status: "queued",
        createdAt: now,
        updatedAt: now,
        payload,
      };
    } else {
      // Single response
      const taskIds = response.task_id.split(",").filter(Boolean);
      newJob = {
        id: `single-${now}`,
        taskIds,
        platform: response.mode !== "batch" ? response.mode : undefined,
        mode: "single",
        status: "queued",
        createdAt: now,
        updatedAt: now,
        payload,
      };
    }

    setJobs((prev) => [...prev, newJob]);
    return newJob.id;
  }, [setJobs]);

  // Check task status
  const checkTaskStatus = useCallback(async (taskId: string): Promise<TaskStatus | null> => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch (error) {
      console.error(`Error checking task ${taskId}:`, error);
      return null;
    }
  }, []);

  // Update job status
  const updateJobStatus = useCallback((jobId: string, status: CrawlJob["status"], error?: string, result?: any) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const now = Date.now();
          return {
            ...job,
            status,
            updatedAt: now,
            completedAt: status === "completed" || status === "failed" ? now : job.completedAt,
            error,
            result,
          };
        }
        return job;
      }),
    );
  }, [setJobs]);

  // Store refs
  checkTaskStatusRef.current = checkTaskStatus;
  updateJobStatusRef.current = updateJobStatus;



  // Poll all active jobs - use ref to prevent multiple intervals
  useEffect(() => {
    // Clear existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const activeJobs = jobs.filter((job) => job.status !== "completed" && job.status !== "failed");

    if (activeJobs.length === 0) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Helper function to poll jobs (defined inside to avoid dependency issues)
    const pollJobs = async () => {
      try {
        const storedJobs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as CrawlJob[];
        const currentActiveJobs = storedJobs.filter((job) => job.status !== "completed" && job.status !== "failed");
        
        if (currentActiveJobs.length === 0) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Poll each active job with rate limiting
        const BATCH_SIZE = 3; // Process max 3 jobs at a time
        for (let i = 0; i < currentActiveJobs.length; i += BATCH_SIZE) {
          const batch = currentActiveJobs.slice(i, i + BATCH_SIZE);
          const jobPromises = batch.map(async (job) => {
            if (checkTaskStatusRef.current && updateJobStatusRef.current) {
              // Check all tasks for this job with rate limiting
              const taskStatusPromises = job.taskIds.map((taskId) => 
                checkTaskStatusRef.current!(taskId)
              );
              
              // Process tasks in smaller batches
              const TASK_BATCH_SIZE = 5;
              const allStatuses: (TaskStatus | null)[] = [];
              for (let j = 0; j < taskStatusPromises.length; j += TASK_BATCH_SIZE) {
                const taskBatch = taskStatusPromises.slice(j, j + TASK_BATCH_SIZE);
                const batchStatuses = await Promise.all(taskBatch);
                allStatuses.push(...batchStatuses);
                // Small delay between task batches
                if (j + TASK_BATCH_SIZE < taskStatusPromises.length) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }
              
              const statuses = allStatuses;
              // Determine overall status
              const hasCompleted = statuses.some((s) => s?.status === "completed");
              const hasFailed = statuses.some((s) => s?.status === "failed");
              const hasProcessing = statuses.some((s) => s?.status === "processing");
              const allCompleted = statuses.every((s) => s?.status === "completed" || s?.status === "failed");

              let newStatus: CrawlJob["status"] = job.status;
              let error: string | undefined;
              let result: any;

              if (hasFailed && allCompleted) {
                newStatus = "failed";
                const failedStatus = statuses.find((s) => s?.status === "failed");
                error = failedStatus?.error || "Task failed";
              } else if (allCompleted && hasCompleted) {
                newStatus = "completed";
                result = statuses.map((s) => s?.result).filter(Boolean);
              } else if (hasProcessing || hasCompleted) {
                newStatus = "processing";
              }

              if (newStatus !== job.status && updateJobStatusRef.current) {
                updateJobStatusRef.current(job.id, newStatus, error, result);
              }
            }
          });
          
          await Promise.all(jobPromises);
          // Delay between job batches
          if (i + BATCH_SIZE < currentActiveJobs.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } catch (error) {
        console.error("Error polling jobs:", error);
      }
    };

    // Poll immediately
    pollJobs();

    // Set up interval for polling
    intervalRef.current = setInterval(pollJobs, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobs.length]); // Only depend on jobs.length - when jobs are added/removed

  // Cleanup old completed jobs (older than 1 hour) - keep failed jobs
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setJobs((prev) => {
        const filtered = prev.filter((job) => {
          // Keep failed jobs forever, only remove old completed jobs
          if (job.status === "failed") {
            return true; // Never remove failed jobs
          }
          if (job.completedAt && job.status === "completed" && now - job.completedAt > CLEANUP_DELAY) {
            return false; // Remove old completed jobs only
          }
          return true;
        });
        // Only update if something changed
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }, 60000); // Run cleanup every minute

    return () => clearInterval(cleanupInterval);
  }, [setJobs]);

  // Remove job
  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  }, [setJobs]);

  // Clear all jobs
  const clearAllJobs = useCallback(() => {
    setJobs([]);
  }, [setJobs]);

  return {
    jobs,
    activeJobs: jobs.filter((job) => job.status !== "completed" && job.status !== "failed"),
    addJob,
    removeJob,
    clearAllJobs,
    isPolling,
  };
}

