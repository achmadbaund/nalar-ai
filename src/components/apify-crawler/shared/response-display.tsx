"use client";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CrawlResponse, TaskStatus } from "../types";

interface ResponseDisplayProps {
  error: string | null;
  response: CrawlResponse | null;
  taskStatus: TaskStatus | null;
  checkingTask: boolean;
  onCheckTask: () => void;
}

export default function ResponseDisplay({
  error,
  response,
  taskStatus,
  checkingTask,
  onCheckTask,
}: ResponseDisplayProps) {
  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Success Response */}
      {response && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Crawl Started Successfully!
            </p>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <p>
              <span className="font-medium">Task ID:</span> {response.task_id}
            </p>
            <p>
              <span className="font-medium">Status:</span> {response.status}
            </p>
            <p>
              <span className="font-medium">Mode:</span> {response.mode}
            </p>
          </div>
          <Button
            onClick={onCheckTask}
            disabled={checkingTask}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            {checkingTask ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Task Status"
            )}
          </Button>
        </div>
      )}

      {/* Task Status */}
      {taskStatus && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Task Status</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Task ID:</span> {taskStatus.task_id}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={cn(
                  "font-medium",
                  taskStatus.status === "completed"
                    ? "text-green-600"
                    : taskStatus.status === "failed"
                      ? "text-red-600"
                      : "text-yellow-600",
                )}
              >
                {taskStatus.status}
              </span>
            </p>
            {taskStatus.error && (
              <p className="text-red-600">
                <span className="font-medium">Error:</span> {taskStatus.error}
              </p>
            )}
            {taskStatus.result && (
              <div className="mt-2">
                <p className="font-medium mb-1">Result:</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(taskStatus.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

