"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Users, FileText, ClipboardList, TrendingUp, Activity, AlertCircle, BarChart3, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStatistics, getAccounts, getPosts, getJobs, type Statistics } from "@/utils/api/facebookApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PostsPerDayChart, PostsPerWeekChart, PostsPerMonthChart, SuccessRateChart, TopAccountsChart, JobTimelineChart } from "./statistics-charts";
import { DateRangePicker } from "./date-range-picker";
import { format } from "date-fns";

interface FallbackStats {
  total_accounts: number;
  active_accounts: number;
  total_posts: number;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  running_jobs: number;
}

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export default function StatisticsTab() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [fallbackStats, setFallbackStats] = useState<FallbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  
  // Date range untuk setiap chart (independent)
  const [postsPerDayRange, setPostsPerDayRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [postsPerWeekRange, setPostsPerWeekRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [postsPerMonthRange, setPostsPerMonthRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [successRateRange, setSuccessRateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [jobTimelineRange, setJobTimelineRange] = useState<DateRange>({ from: undefined, to: undefined });
  
  const [chartLoadings, setChartLoadings] = useState<Record<string, boolean>>({});

  const fetchFallbackStats = async () => {
    try {
      // Fetch dari endpoint yang tersedia untuk membuat statistics manual
      const [accountsRes, postsRes, jobsRes] = await Promise.all([
        getAccounts({ page_size: 1 }),
        getPosts({ page_size: 1 }),
        getJobs({ page_size: 100 }),
      ]);

      // Handle both PaginatedResponse and array return types
      const accounts = Array.isArray(accountsRes) ? accountsRes : (accountsRes.results || []);
      const accountsCount = Array.isArray(accountsRes) ? accountsRes.length : (accountsRes.count || accounts.length);
      const activeAccounts = accounts.filter((acc: any) => acc.status === "active").length;
      
      const jobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes.results || []);
      const jobsCount = Array.isArray(jobsRes) ? jobsRes.length : (jobsRes.count || jobs.length);
      const completedJobs = jobs.filter((job: any) => job.status === "completed").length;
      const failedJobs = jobs.filter((job: any) => job.status === "failed").length;
      const runningJobs = jobs.filter((job: any) => job.status === "running" || job.status === "pending").length;

      const postsCount = Array.isArray(postsRes) ? postsRes.length : (postsRes.count || 0);

      setFallbackStats({
        total_accounts: accountsCount,
        active_accounts: activeAccounts,
        total_posts: postsCount,
        total_jobs: jobsCount,
        completed_jobs: completedJobs,
        failed_jobs: failedJobs,
        running_jobs: runningJobs,
      });
    } catch (err) {
      console.error("Failed to fetch fallback stats:", err);
    }
  };

  const fetchStatistics = async (params?: {
    posts_per_day_start?: string;
    posts_per_day_end?: string;
    posts_per_week_start?: string;
    posts_per_week_end?: string;
    posts_per_month_start?: string;
    posts_per_month_end?: string;
    success_rate_start?: string;
    success_rate_end?: string;
    job_timeline_start?: string;
    job_timeline_end?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await getStatistics(params);
      setStatistics(stats);
      setUseFallback(false);
    } catch (err: any) {
      // Jika endpoint statistics error, gunakan fallback
      console.warn("Statistics endpoint error, using fallback:", err);
      setUseFallback(true);
      await fetchFallbackStats();
      setError("Statistics endpoint belum tersedia. Menampilkan data dari endpoint lain.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (chartKey: string, params: Record<string, string>) => {
    setChartLoadings((prev) => ({ ...prev, [chartKey]: true }));
    try {
      const stats = await getStatistics(params);
      setStatistics((prev) => ({
        ...prev,
        ...stats,
      }));
    } catch (err: any) {
      console.error(`Error fetching ${chartKey} data:`, err);
      toast.error(`Gagal memuat data untuk ${chartKey}`);
    } finally {
      setChartLoadings((prev) => ({ ...prev, [chartKey]: false }));
    }
  };

  const handleDateRangeChange = (chartKey: string, range: DateRange) => {
    const formatDate = (date: Date | undefined) => {
      return date ? format(date, "yyyy-MM-dd") : undefined;
    };

    // Update state untuk preview di UI (tidak hit API dulu)
    switch (chartKey) {
      case "posts_per_day":
        setPostsPerDayRange(range);
        break;
      case "posts_per_week":
        setPostsPerWeekRange(range);
        break;
      case "posts_per_month":
        setPostsPerMonthRange(range);
        break;
      case "success_rate":
        setSuccessRateRange(range);
        break;
      case "job_timeline":
        setJobTimelineRange(range);
        break;
    }

    // Hanya hit API jika KEDUA tanggal sudah dipilih (from DAN to)
    if (!range.from || !range.to) {
      return; // Jangan hit API jika belum lengkap
    }

    const params: Record<string, string> = {};
    
    switch (chartKey) {
      case "posts_per_day":
        params.posts_per_day_start = formatDate(range.from)!;
        params.posts_per_day_end = formatDate(range.to)!;
        break;
      case "posts_per_week":
        params.posts_per_week_start = formatDate(range.from)!;
        params.posts_per_week_end = formatDate(range.to)!;
        break;
      case "posts_per_month":
        params.posts_per_month_start = formatDate(range.from)!;
        params.posts_per_month_end = formatDate(range.to)!;
        break;
      case "success_rate":
        params.success_rate_start = formatDate(range.from)!;
        params.success_rate_end = formatDate(range.to)!;
        break;
      case "job_timeline":
        params.job_timeline_start = formatDate(range.from)!;
        params.job_timeline_end = formatDate(range.to)!;
        break;
    }

    // Hit API hanya setelah kedua tanggal dipilih
    fetchChartData(chartKey, params);
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleRefresh = async () => {
    await fetchStatistics();
    if (useFallback) {
      await fetchFallbackStats();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayStats = useFallback ? fallbackStats : statistics;
  const stats = displayStats as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Facebook Scraping Statistics</h3>
          {useFallback && (
            <p className="text-xs text-muted-foreground mt-1">
              <AlertCircle className="inline h-3 w-3 mr-1" />
              Menggunakan data dari endpoint alternatif
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && !useFallback && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Endpoint Statistics Belum Tersedia
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {error}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                Silakan hubungi tim backend untuk mengaktifkan endpoint <code className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 rounded">/api/v1/statistics/</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {stats?.total_accounts || 0}
              </p>
              {stats?.active_accounts !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.active_accounts} active
                </p>
              )}
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                {stats?.active_accounts || 0}
              </p>
              {stats?.total_accounts !== undefined && stats?.total_accounts > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round((stats.active_accounts / stats.total_accounts) * 100)}% of total
                </p>
              )}
            </div>
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Posts */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                {stats?.total_posts || 0}
              </p>
              {stats?.recent_posts_count !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.recent_posts_count} in last 24h
                </p>
              )}
            </div>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Jobs */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {stats?.total_jobs || 0}
              </p>
              {stats?.completed_jobs !== undefined && stats?.total_jobs > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.completed_jobs} completed
                </p>
              )}
            </div>
            <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-3">
              <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Job Status Breakdown */}
      {(stats?.completed_jobs !== undefined || stats?.failed_jobs !== undefined || stats?.running_jobs !== undefined) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Job Status Breakdown</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {stats.completed_jobs || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Failed</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {stats.failed_jobs || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Running</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.running_jobs || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Visualizations */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Charts & Visualizations</h4>
        </div>

        {/* Posts Per Day Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">Posts Per Day</h5>
            <DateRangePicker
              dateRange={postsPerDayRange}
              onDateRangeChange={(range) => handleDateRangeChange("posts_per_day", range)}
            />
          </div>
          {chartLoadings.posts_per_day ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats?.posts_per_day && stats.posts_per_day.length > 0 ? (
            <PostsPerDayChart postsPerDay={stats.posts_per_day} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
              <p className="text-sm text-muted-foreground">No data available. Backend perlu mengembalikan field `posts_per_day`.</p>
            </div>
          )}
        </div>

        {/* Success Rate Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">Crawl Success Rate Over Time</h5>
            <DateRangePicker
              dateRange={successRateRange}
              onDateRangeChange={(range) => handleDateRangeChange("success_rate", range)}
            />
          </div>
          {chartLoadings.success_rate ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats?.success_rate_over_time && stats.success_rate_over_time.length > 0 ? (
            <SuccessRateChart successRateOverTime={stats.success_rate_over_time} />
          ) : stats?.jobs_per_day && stats.jobs_per_day.length > 0 ? (
            <SuccessRateChart successRateOverTime={stats.jobs_per_day.map((item: { date: string; completed: number; failed: number; total: number }) => ({
              date: item.date,
              success_rate: item.total > 0 ? (item.completed / item.total) * 100 : 0,
              total_jobs: item.total,
              completed_jobs: item.completed,
              failed_jobs: item.failed,
            }))} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
              <p className="text-sm text-muted-foreground">No data available. Backend perlu mengembalikan field `success_rate_over_time` atau `jobs_per_day`.</p>
            </div>
          )}
        </div>

        {/* Posts Per Week Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">Posts Per Week</h5>
            <DateRangePicker
              dateRange={postsPerWeekRange}
              onDateRangeChange={(range) => handleDateRangeChange("posts_per_week", range)}
            />
          </div>
          {chartLoadings.posts_per_week ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats?.posts_per_week && stats.posts_per_week.length > 0 ? (
            <PostsPerWeekChart postsPerWeek={stats.posts_per_week} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
              <p className="text-sm text-muted-foreground">No data available. Backend perlu mengembalikan field `posts_per_week`.</p>
            </div>
          )}
        </div>

        {/* Posts Per Month Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">Posts Per Month</h5>
            <DateRangePicker
              dateRange={postsPerMonthRange}
              onDateRangeChange={(range) => handleDateRangeChange("posts_per_month", range)}
            />
          </div>
          {chartLoadings.posts_per_month ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats?.posts_per_month && stats.posts_per_month.length > 0 ? (
            <PostsPerMonthChart postsPerMonth={stats.posts_per_month} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
              <p className="text-sm text-muted-foreground">No data available. Backend perlu mengembalikan field `posts_per_month`.</p>
            </div>
          )}
        </div>

        {/* Top Accounts Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h5 className="mb-4 text-sm font-medium text-foreground">Top Accounts by Post Count</h5>
          {stats?.top_accounts && stats.top_accounts.length > 0 ? (
            <TopAccountsChart topAccounts={stats.top_accounts} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
              <p className="text-sm text-muted-foreground">No data available. Backend perlu mengembalikan field `top_accounts`.</p>
            </div>
          )}
        </div>

        {/* Job Timeline Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">Job Completion Timeline</h5>
            <DateRangePicker
              dateRange={jobTimelineRange}
              onDateRangeChange={(range) => handleDateRangeChange("job_timeline", range)}
            />
          </div>
          {chartLoadings.job_timeline ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats?.job_completion_timeline && stats.job_completion_timeline.length > 0 ? (
            <JobTimelineChart jobCompletionTimeline={stats.job_completion_timeline} />
          ) : stats?.jobs_per_day && stats.jobs_per_day.length > 0 ? (
            <JobTimelineChart jobsPerDay={stats.jobs_per_day} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30">
              <p className="text-sm text-muted-foreground">No data available. Backend perlu mengembalikan field `job_completion_timeline` atau `jobs_per_day`.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info untuk Backend Team */}
      {useFallback && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Rekomendasi untuk Tim Backend
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Untuk menampilkan statistics yang lebih lengkap, endpoint <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">GET /api/v1/statistics/</code> dapat mengembalikan:
              </p>
              <ul className="mt-2 text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Total accounts, active accounts, inactive accounts</li>
                <li>Total posts, posts per day/week/month</li>
                <li>Total jobs dengan breakdown status (completed, failed, running, pending)</li>
                <li>Success rate dan error rate</li>
                <li>Data untuk grafik time series (posts over time, jobs over time)</li>
                <li>Top accounts by post count</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
