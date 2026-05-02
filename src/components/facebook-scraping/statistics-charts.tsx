"use client";

import { VChart } from "@visactor/react-vchart";
import type { ILineChartSpec, IBarChartSpec } from "@visactor/vchart";
import { useMemo } from "react";
import { addThousandsSeparator } from "@/lib/utils";

interface PostsPerDay {
  date: string;
  count: number;
}

interface JobsPerDay {
  date: string;
  completed: number;
  failed: number;
  total: number;
}

interface SuccessRateOverTime {
  date: string;
  success_rate: number;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
}

interface PostsPerWeek {
  week_start: string;
  week_end: string;
  count: number;
}

interface PostsPerMonth {
  month: string;
  month_name: string;
  count: number;
}

interface TopAccount {
  id: number;
  username: string;
  post_count: number;
}

interface JobCompletionTimeline {
  job_id: string;
  account_username: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number;
  posts_found: number;
  posts_saved: number;
  errors_count: number;
}

interface StatisticsChartsProps {
  postsPerDay?: PostsPerDay[];
  postsPerWeek?: PostsPerWeek[];
  postsPerMonth?: PostsPerMonth[];
  jobsPerDay?: JobsPerDay[];
  successRateOverTime?: SuccessRateOverTime[];
  topAccounts?: TopAccount[];
  jobCompletionTimeline?: JobCompletionTimeline[];
  successRate?: number;
}

export function PostsPerDayChart({ postsPerDay = [] }: { postsPerDay?: PostsPerDay[] }) {
  const chartData = useMemo(() => {
    if (!postsPerDay || postsPerDay.length === 0) {
      return [];
    }
    return postsPerDay
      .filter((item) => item && item.date && typeof item.count === 'number')
      .map((item) => ({
        date: item.date, // Keep original date for sorting
        dateLabel: new Date(item.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
        count: Number(item.count) || 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending
  }, [postsPerDay]);

  const spec: ILineChartSpec = useMemo(
    () => ({
      type: "line",
      data: [
        {
          id: "postsData",
          values: chartData,
        },
      ],
      xField: "dateLabel",
      yField: "count",
      point: {
        visible: true,
        style: {
          fill: "#3b82f6",
          stroke: "#ffffff",
          lineWidth: 2,
        },
      },
      line: {
        style: {
          stroke: "#3b82f6",
          lineWidth: 2,
        },
      },
      area: {
        visible: true,
        style: {
          fill: {
            gradient: "linear",
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 1,
            stops: [
              {
                offset: 0,
                color: "rgba(59, 130, 246, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(59, 130, 246, 0.05)",
              },
            ],
          },
        },
      },
      tooltip: {
        trigger: ["hover"],
        mark: {
          content: [
            {
              key: "Date",
              value: (datum: any) => datum?.dateLabel || datum?.date,
            },
            {
              key: "Posts",
              value: (datum: any) => `${datum?.count} posts`,
            },
          ],
        },
      },
      axes: [
        {
          orient: "bottom",
          type: "band",
          domainLine: { visible: false },
          grid: { visible: false },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
          },
        },
        {
          orient: "left",
          type: "linear",
          domainLine: { visible: true },
          tick: { visible: true },
          grid: {
            visible: true,
            style: {
              stroke: "#e5e7eb",
              lineDash: [4, 4],
            },
          },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
            formatMethod: (value: string | string[] | number) => {
              let numValue: number;
              if (typeof value === 'number') {
                numValue = value;
              } else if (Array.isArray(value)) {
                const val = value[0];
                numValue = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : 0);
              } else if (typeof value === 'string') {
                numValue = parseFloat(value);
              } else {
                numValue = 0;
              }
              if (isNaN(numValue)) return '0';
              return addThousandsSeparator(Math.round(numValue));
            },
          },
        },
      ],
    }),
    [chartData],
  );

  if (!postsPerDay || postsPerDay.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return <VChart spec={spec} style={{ height: "300px" }} />;
}

export function SuccessRateChart({ successRateOverTime = [] }: { successRateOverTime?: SuccessRateOverTime[] }) {
  const chartData = useMemo(() => {
    if (!successRateOverTime || successRateOverTime.length === 0) {
      return [];
    }
    return successRateOverTime
      .filter((item) => item && item.date)
      .map((item) => ({
        date: item.date, // Keep original date for sorting
        dateLabel: new Date(item.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
        successRate: Number(item.success_rate) || 0,
        completed: Number(item.completed_jobs) || 0,
        failed: Number(item.failed_jobs) || 0,
        total: Number(item.total_jobs) || 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending
  }, [successRateOverTime]);

  const spec: ILineChartSpec = useMemo(
    () => ({
      type: "line",
      data: [
        {
          id: "successRateData",
          values: chartData,
        },
      ],
      xField: "dateLabel",
      yField: "successRate",
      point: {
        visible: true,
        style: {
          fill: "#10b981",
          stroke: "#ffffff",
          lineWidth: 2,
        },
      },
      line: {
        style: {
          stroke: "#10b981",
          lineWidth: 2,
        },
      },
      area: {
        visible: true,
        style: {
          fill: {
            gradient: "linear",
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 1,
            stops: [
              {
                offset: 0,
                color: "rgba(16, 185, 129, 0.3)",
              },
              {
                offset: 1,
                color: "rgba(16, 185, 129, 0.05)",
              },
            ],
          },
        },
      },
      tooltip: {
        trigger: ["hover"],
        mark: {
          content: [
            {
              key: "Date",
              value: (datum: any) => datum?.dateLabel || datum?.date,
            },
            {
              key: "Success Rate",
              value: (datum: any) => `${datum?.successRate}%`,
            },
            {
              key: "Completed",
              value: (datum: any) => `${datum?.completed} jobs`,
            },
            {
              key: "Failed",
              value: (datum: any) => `${datum?.failed} jobs`,
            },
          ],
        },
      },
      axes: [
        {
          orient: "bottom",
          type: "band",
          domainLine: { visible: false },
          grid: { visible: false },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
          },
        },
        {
          orient: "left",
          type: "linear",
          domainLine: { visible: true },
          tick: { visible: true },
          grid: {
            visible: true,
            style: {
              stroke: "#e5e7eb",
              lineDash: [4, 4],
            },
          },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
            formatMethod: (value: string | string[] | number) => {
              let numValue: number;
              if (typeof value === 'number') {
                numValue = value;
              } else if (Array.isArray(value)) {
                const val = value[0];
                numValue = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : 0);
              } else if (typeof value === 'string') {
                numValue = parseFloat(value);
              } else {
                numValue = 0;
              }
              if (isNaN(numValue)) return '0%';
              return `${Math.round(numValue)}%`;
            },
          },
          min: 0,
          max: 100,
        },
      ],
    }),
    [chartData],
  );

  if (!successRateOverTime || successRateOverTime.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return <VChart spec={spec} style={{ height: "300px" }} />;
}

export function PostsPerWeekChart({ postsPerWeek = [] }: { postsPerWeek?: PostsPerWeek[] }) {
  const chartData = useMemo(() => {
    if (!postsPerWeek || postsPerWeek.length === 0) {
      return [];
    }
    return postsPerWeek
      .filter((item) => item && item.week_start)
      .map((item) => {
        const weekStart = new Date(item.week_start);
        const weekEnd = new Date(item.week_end);
        const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
        return {
          weekStart: item.week_start, // Keep original date for sorting
          week: weekLabel,
          count: Number(item.count) || 0,
        };
      })
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()); // Sort by week_start ascending
  }, [postsPerWeek]);

  const spec: IBarChartSpec = useMemo(
    () => ({
      type: "bar",
      data: [
        {
          id: "postsPerWeekData",
          values: chartData,
        },
      ],
      xField: "week",
      yField: "count",
      bar: {
        style: {
          fill: "#8b5cf6",
          cornerRadius: [4, 4, 0, 0],
        },
        state: {
          hover: {
            fill: "#7c3aed",
          },
        },
      },
      tooltip: {
        trigger: ["hover"],
        mark: {
          content: [
            {
              key: "Week",
              value: (datum: any) => datum?.week,
            },
            {
              key: "Posts",
              value: (datum: any) => `${addThousandsSeparator(datum?.count)} posts`,
            },
          ],
        },
      },
      axes: [
        {
          orient: "bottom",
          type: "band",
          domainLine: { visible: true },
          tick: { visible: true },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
          },
        },
        {
          orient: "left",
          type: "linear",
          domainLine: { visible: true },
          tick: { visible: true },
          grid: {
            visible: true,
            style: {
              stroke: "#e5e7eb",
              lineDash: [4, 4],
            },
          },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
            formatMethod: (value: string | string[] | number) => {
              let numValue: number;
              if (typeof value === 'number') {
                numValue = value;
              } else if (Array.isArray(value)) {
                const val = value[0];
                numValue = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : 0);
              } else if (typeof value === 'string') {
                numValue = parseFloat(value);
              } else {
                numValue = 0;
              }
              if (isNaN(numValue)) return '0';
              return addThousandsSeparator(Math.round(numValue));
            },
          },
        },
      ],
    }),
    [chartData],
  );

  if (!postsPerWeek || postsPerWeek.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return <VChart spec={spec} style={{ height: "300px" }} />;
}

export function PostsPerMonthChart({ postsPerMonth = [] }: { postsPerMonth?: PostsPerMonth[] }) {
  const chartData = useMemo(() => {
    if (!postsPerMonth || postsPerMonth.length === 0) {
      return [];
    }
    return postsPerMonth
      .filter((item) => item && item.month)
      .map((item) => ({
        monthKey: item.month, // Keep original month key for sorting
        month: item.month_name || item.month,
        count: Number(item.count) || 0,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)); // Sort by month key ascending
  }, [postsPerMonth]);

  const spec: IBarChartSpec = useMemo(
    () => ({
      type: "bar",
      data: [
        {
          id: "postsPerMonthData",
          values: chartData,
        },
      ],
      xField: "month",
      yField: "count",
      bar: {
        style: {
          fill: "#6366f1",
          cornerRadius: [4, 4, 0, 0],
        },
        state: {
          hover: {
            fill: "#4f46e5",
          },
        },
      },
      tooltip: {
        trigger: ["hover"],
        mark: {
          content: [
            {
              key: "Month",
              value: (datum: any) => datum?.month,
            },
            {
              key: "Posts",
              value: (datum: any) => `${addThousandsSeparator(datum?.count)} posts`,
            },
          ],
        },
      },
      axes: [
        {
          orient: "bottom",
          type: "band",
          domainLine: { visible: true },
          tick: { visible: true },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
          },
        },
        {
          orient: "left",
          type: "linear",
          domainLine: { visible: true },
          tick: { visible: true },
          grid: {
            visible: true,
            style: {
              stroke: "#e5e7eb",
              lineDash: [4, 4],
            },
          },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
            formatMethod: (value: string | string[] | number) => {
              let numValue: number;
              if (typeof value === 'number') {
                numValue = value;
              } else if (Array.isArray(value)) {
                const val = value[0];
                numValue = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : 0);
              } else if (typeof value === 'string') {
                numValue = parseFloat(value);
              } else {
                numValue = 0;
              }
              if (isNaN(numValue)) return '0';
              return addThousandsSeparator(Math.round(numValue));
            },
          },
        },
      ],
    }),
    [chartData],
  );

  if (!postsPerMonth || postsPerMonth.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return <VChart spec={spec} style={{ height: "300px" }} />;
}

export function TopAccountsChart({ topAccounts = [] }: { topAccounts?: TopAccount[] }) {
  const chartData = useMemo(() => {
    if (!topAccounts || topAccounts.length === 0) {
      return [];
    }
    // Sort by post_count descending and take top 10
    const sorted = topAccounts
      .sort((a, b) => b.post_count - a.post_count)
      .slice(0, 10);
    
    const maxCount = sorted[0]?.post_count || 1;
    
    return sorted.map((account, index) => ({
      username: account.username,
      count: account.post_count,
      percentage: maxCount > 0 ? (account.post_count / maxCount) * 100 : 0,
      rank: index + 1,
    }));
  }, [topAccounts]);

  if (!topAccounts || topAccounts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chartData.map((item, index) => {
        const colors = [
          "from-purple-500 to-purple-600",
          "from-blue-500 to-blue-600",
          "from-indigo-500 to-indigo-600",
          "from-pink-500 to-pink-600",
          "from-violet-500 to-violet-600",
        ];
        const colorClass = colors[index % colors.length];
        
        return (
          <div key={item.username} className="group relative">
            <div className="flex items-center gap-4">
              {/* Rank Badge */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-xs font-bold text-purple-700 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-300">
                {item.rank}
              </div>
              
              {/* Username */}
              <div className="min-w-[120px] shrink-0">
                <p className="text-sm font-medium text-foreground">{item.username}</p>
              </div>
              
              {/* Progress Bar */}
              <div className="relative flex-1">
                <div className="h-8 overflow-hidden rounded-lg bg-muted">
                  <div
                    className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500 ease-out group-hover:opacity-90`}
                    style={{ width: `${item.percentage}%` }}
                  >
                    <div className="flex h-full items-center justify-end pr-2">
                      <span className="text-xs font-semibold text-white drop-shadow-sm">
                        {addThousandsSeparator(item.count)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Value Label */}
              <div className="min-w-[60px] shrink-0 text-right">
                <p className="text-sm font-semibold text-foreground">
                  {addThousandsSeparator(item.count)}
                </p>
                <p className="text-xs text-muted-foreground">posts</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function JobTimelineChart({ jobCompletionTimeline = [], jobsPerDay }: { jobCompletionTimeline?: JobCompletionTimeline[]; jobsPerDay?: JobsPerDay[] }) {
  // Jika jobCompletionTimeline tersedia, gunakan itu. Jika tidak, fallback ke jobsPerDay
  const transformedData = useMemo(() => {
    if (jobCompletionTimeline && jobCompletionTimeline.length > 0) {
      // Group by date untuk timeline
      const groupedByDate = new Map<string, { completed: number; failed: number; dateLabel: string }>();
      
      jobCompletionTimeline.forEach((job) => {
        if (!job.started_at) return;
        const dateKey = job.started_at.split('T')[0]; // Keep original date for sorting
        const dateLabel = new Date(job.started_at).toLocaleDateString("id-ID", { month: "short", day: "numeric" });
        if (!groupedByDate.has(dateKey)) {
          groupedByDate.set(dateKey, { completed: 0, failed: 0, dateLabel });
        }
        const dayData = groupedByDate.get(dateKey)!;
        if (job.status === "completed") {
          dayData.completed += 1;
        } else if (job.status === "failed") {
          dayData.failed += 1;
        }
      });

      return Array.from(groupedByDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date key ascending
        .flatMap(([dateKey, data]) => [
          { date: data.dateLabel, type: "Completed", value: data.completed },
          { date: data.dateLabel, type: "Failed", value: data.failed },
        ]);
    } else if (jobsPerDay && jobsPerDay.length > 0) {
      // Fallback ke jobsPerDay
        return jobsPerDay
        .filter((item) => item && item.date)
        .map((item) => ({
          dateKey: item.date, // Keep original date for sorting
          dateLabel: new Date(item.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
          completed: Number(item.completed) || 0,
          failed: Number(item.failed) || 0,
        }))
        .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()) // Sort by date ascending
        .flatMap((item) => [
          {
            date: item.dateLabel,
            type: "Completed",
            value: item.completed,
          },
          {
            date: item.dateLabel,
            type: "Failed",
            value: item.failed,
          },
        ]);
    }
    return [];
  }, [jobCompletionTimeline, jobsPerDay]);

  const spec: IBarChartSpec = useMemo(
    () => ({
      type: "bar",
      data: [
        {
          id: "jobTimelineData",
          values: transformedData,
        },
      ],
      xField: "date",
      yField: "value",
      seriesField: "type",
      stack: true,
      bar: {
        style: {
          cornerRadius: [4, 4, 0, 0],
        },
      },
      legends: {
        visible: true,
        orient: "top",
        position: "start",
        item: {
          spaceCol: 12,
        },
      },
      tooltip: {
        trigger: ["hover"],
        mark: {
          content: [
            {
              key: "Date",
              value: (datum: any) => datum?.dateLabel || datum?.date,
            },
            {
              key: "Type",
              value: (datum: any) => datum?.type,
            },
            {
              key: "Count",
              value: (datum: any) => `${datum?.value || 0} jobs`,
            },
          ],
        },
      },
      axes: [
        {
          orient: "bottom",
          type: "band",
          domainLine: { visible: false },
          grid: { visible: false },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
          },
        },
        {
          orient: "left",
          type: "linear",
          domainLine: { visible: true },
          tick: { visible: true },
          grid: {
            visible: true,
            style: {
              stroke: "#e5e7eb",
              lineDash: [4, 4],
            },
          },
          label: {
            style: {
              fontSize: 12,
              fill: "#6b7280",
            },
            formatMethod: (value: string | string[] | number) => {
              let numValue: number;
              if (typeof value === 'number') {
                numValue = value;
              } else if (Array.isArray(value)) {
                const val = value[0];
                numValue = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : 0);
              } else if (typeof value === 'string') {
                numValue = parseFloat(value);
              } else {
                numValue = 0;
              }
              if (isNaN(numValue)) return '0';
              return addThousandsSeparator(Math.round(numValue));
            },
          },
        },
      ],
    }),
    [transformedData],
  );

  if (transformedData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return <VChart spec={spec} style={{ height: "300px" }} />;
}
