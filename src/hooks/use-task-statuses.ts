"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalStorage } from "./use-local-storage";
import { TaskStatus } from "@/components/apify-crawler/types";

export interface TaskStatusData extends TaskStatus {
  updatedAt: number; // Timestamp of last update
  lastChecked?: number; // Timestamp of last check
}

const STORAGE_KEY = "apify-task-statuses";
const POLL_INTERVAL = 5000; // 5 seconds

/**
 * Hook untuk menyimpan dan auto-update status task di persistent storage
 */
export function useTaskStatuses() {
  const [taskStatuses, setTaskStatuses] = useLocalStorage<Record<string, TaskStatusData>>(
    STORAGE_KEY,
    {}
  );
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check task status from API
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

  // Update task status
  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus | null) => {
    if (!status) return;

    setTaskStatuses((prev) => {
      const now = Date.now();
      const existing = prev[taskId];
      
      // Only update if status changed or it's been more than 30 seconds since last check
      if (
        existing?.status !== status.status ||
        existing?.error !== status.error ||
        !existing?.lastChecked ||
        now - existing.lastChecked > 30000
      ) {
        return {
          ...prev,
          [taskId]: {
            ...status,
            updatedAt: now,
            lastChecked: now,
          },
        };
      }
      return prev;
    });
  }, [setTaskStatuses]);

  // Add task to track
  const addTask = useCallback((taskId: string) => {
    setTaskStatuses((prev) => {
      if (prev[taskId]) {
        return prev; // Already tracking
      }
      return {
        ...prev,
        [taskId]: {
          task_id: taskId,
          status: "pending",
          updatedAt: Date.now(),
        },
      };
    });
  }, [setTaskStatuses]);

  // Add multiple tasks
  const addTasks = useCallback((taskIds: string[]) => {
    taskIds.forEach((taskId) => addTask(taskId));
  }, [addTask]);

  // Remove task from tracking
  const removeTask = useCallback((taskId: string) => {
    setTaskStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[taskId];
      return newStatuses;
    });
  }, [setTaskStatuses]);

  // Get task status
  const getTaskStatus = useCallback(
    (taskId: string): TaskStatusData | null => {
      return taskStatuses[taskId] || null;
    },
    [taskStatuses]
  );

  // Get multiple task statuses
  const getTaskStatuses = useCallback(
    (taskIds: string[]): Record<string, TaskStatusData> => {
      const result: Record<string, TaskStatusData> = {};
      taskIds.forEach((taskId) => {
        if (taskStatuses[taskId]) {
          result[taskId] = taskStatuses[taskId];
        }
      });
      return result;
    },
    [taskStatuses]
  );

  // Poll active tasks (tasks that are not completed or failed)
  useEffect(() => {
    // Clear existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Get active tasks from localStorage
    const activeTasks = Object.values(taskStatuses).filter(
      (task) => task.status !== "completed" && task.status !== "failed"
    );

    if (activeTasks.length === 0) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Helper function to poll tasks
    const pollTasks = async () => {
      try {
        // Get current tasks from localStorage
        const storedStatuses = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "{}"
        ) as Record<string, TaskStatusData>;

        const currentActiveTasks = Object.values(storedStatuses).filter(
          (task) => task.status !== "completed" && task.status !== "failed"
        );

        if (currentActiveTasks.length === 0) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Poll each active task with rate limiting (max 5 concurrent requests)
        const BATCH_SIZE = 5;
        for (let i = 0; i < currentActiveTasks.length; i += BATCH_SIZE) {
          const batch = currentActiveTasks.slice(i, i + BATCH_SIZE);
          const pollPromises = batch.map(async (task) => {
            // Skip if checked recently (within last 3 seconds)
            const now = Date.now();
            if (task.lastChecked && now - task.lastChecked < 3000) {
              return;
            }
            const status = await checkTaskStatus(task.task_id);
            if (status) {
              updateTaskStatus(task.task_id, status);
            }
          });
          await Promise.all(pollPromises);
          // Small delay between batches to avoid overwhelming the API
          if (i + BATCH_SIZE < currentActiveTasks.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.error("Error polling tasks:", error);
      }
    };

    // Poll immediately
    pollTasks();

    // Set up interval for polling
    intervalRef.current = setInterval(pollTasks, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [taskStatuses, checkTaskStatus, updateTaskStatus]);

  // Cleanup old completed tasks (older than 1 hour) - keep failed tasks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - 3600000; // 1 hour

      setTaskStatuses((prev) => {
        const filtered: Record<string, TaskStatusData> = {};
        let hasChanges = false;

        Object.entries(prev).forEach(([taskId, task]) => {
          // Keep if:
          // - Not completed/failed (still active)
          // - Failed (never remove failed tasks)
          // - Completed but updated recently (less than 1 hour)
          if (
            (task.status !== "completed" && task.status !== "failed") ||
            task.status === "failed" ||
            (task.status === "completed" && task.updatedAt > oneHourAgo)
          ) {
            filtered[taskId] = task;
          } else {
            hasChanges = true;
          }
        });

        return hasChanges ? filtered : prev;
      });
    }, 60000); // Run cleanup every minute

    return () => clearInterval(cleanupInterval);
  }, [setTaskStatuses]);

  return {
    taskStatuses,
    isPolling,
    addTask,
    addTasks,
    removeTask,
    getTaskStatus,
    getTaskStatuses,
    updateTaskStatus,
    checkTaskStatus,
  };
}

