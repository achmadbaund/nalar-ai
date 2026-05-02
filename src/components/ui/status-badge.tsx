"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from "lucide-react";

export type StatusBadgeType = "ocr_status" | "validation_status" | "log_level" | "confidence" | "account_status" | "job_status";

interface StatusBadgeProps {
  status: string | boolean | number;
  type: StatusBadgeType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  if (type === "ocr_status") {
    const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: {
        label: "Pending",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        icon: <Clock className="h-3 w-3" />,
      },
      processing: {
        label: "Processing",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      },
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      failed: {
        label: "Failed",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = statusMap[status as string] || statusMap.pending;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          config.className,
          className,
        )}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  if (type === "validation_status") {
    const isValidated = status === true || status === "true";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          isValidated
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          className,
        )}
      >
        {isValidated ? (
          <>
            <CheckCircle2 className="h-3 w-3" />
            Valid
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" />
            Pending
          </>
        )}
      </span>
    );
  }

  if (type === "log_level") {
    const levelMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      info: {
        label: "Info",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      warning: {
        label: "Warning",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      error: {
        label: "Error",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = levelMap[status as string] || levelMap.info;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          config.className,
          className,
        )}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  if (type === "confidence") {
    const score = typeof status === "number" ? status : parseFloat(String(status));
    // API returns 0.88 for 88%, so multiply by 100 for display
    const percentage = Math.round(score * 100);
    let config: { label: string; className: string };

    if (percentage < 70) {
      config = {
        label: `${percentage}%`,
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      };
    } else if (percentage < 90) {
      config = {
        label: `${percentage}%`,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      };
    } else {
      config = {
        label: `${percentage}%`,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      };
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          config.className,
          className,
        )}
      >
        {config.label}
      </span>
    );
  }

  if (type === "account_status") {
    const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      active: {
        label: "Active",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      inactive: {
        label: "Inactive",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        icon: <Clock className="h-3 w-3" />,
      },
      error: {
        label: "Error",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: <XCircle className="h-3 w-3" />,
      },
      crawling: {
        label: "Crawling",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      },
    };

    const config = statusMap[status as string] || statusMap.inactive;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          config.className,
          className,
        )}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  if (type === "job_status") {
    const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: {
        label: "Pending",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        icon: <Clock className="h-3 w-3" />,
      },
      running: {
        label: "Running",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      },
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      failed: {
        label: "Failed",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = statusMap[status as string] || statusMap.pending;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          config.className,
          className,
        )}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  return null;
}



