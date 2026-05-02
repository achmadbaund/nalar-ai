"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, RefreshCw } from "lucide-react";
import { getAccountStatistics, type FacebookAccount, type CrawlJob } from "@/utils/api/facebookApi";
import { toast } from "sonner";

interface ViewAccountModalProps {
  open: boolean;
  account: FacebookAccount;
  onClose: () => void;
}

export default function ViewAccountModal({ open, account, onClose }: ViewAccountModalProps) {
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (open && account) {
      loadStatistics();
    }
  }, [open, account]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const loadStatistics = async () => {
    setLoadingStats(true);
    try {
      const stats = await getAccountStatistics(account.id);
      setStatistics(stats);
    } catch (err: any) {
      toast.error(err.message || "Failed to load statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Account Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="text-sm">{account.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <p className="text-sm font-medium">{account.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <p className="text-sm">{account.name || account.display_name || "-"}</p>
            </div>
            {account.crawler_type && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Crawler Type</label>
                <p className="text-sm">
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {account.crawler_type}
                  </span>
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="text-sm">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    account.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : account.status === "error"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {account.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Post Count</label>
              <p className="text-sm">{account.post_count || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Crawl</label>
              <p className="text-sm">
                {account.last_crawled_at
                  ? new Date(account.last_crawled_at).toLocaleString("id-ID")
                  : account.last_successful_crawl_at
                    ? new Date(account.last_successful_crawl_at).toLocaleString("id-ID")
                    : "Never"}
              </p>
            </div>
            {account.last_successful_crawl_at && account.last_successful_crawl_at !== account.last_crawled_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Successful Crawl</label>
                <p className="text-sm">
                  {new Date(account.last_successful_crawl_at).toLocaleString("id-ID")}
                </p>
              </div>
            )}
            {account.profile_url && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Profile URL</label>
                <div className="flex items-center gap-2">
                  <a
                    href={account.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {account.profile_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p className="text-sm">{new Date(account.created_at).toLocaleString("id-ID")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Updated At</label>
              <p className="text-sm">{new Date(account.updated_at).toLocaleString("id-ID")}</p>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Statistics</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={loadStatistics}
                disabled={loadingStats}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 ${loadingStats ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {loadingStats ? (
              <p className="text-sm text-muted-foreground">Loading statistics...</p>
            ) : statistics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Posts</label>
                    <p className="text-sm font-semibold">{statistics.post_statistics?.total_posts || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Recent Posts (7d)</label>
                    <p className="text-sm font-semibold">{statistics.post_statistics?.recent_posts_7d || 0}</p>
                  </div>
                  {statistics.post_statistics?.average_success_rate !== null && statistics.post_statistics?.average_success_rate !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Success Rate</label>
                      <p className="text-sm font-semibold">{statistics.post_statistics.average_success_rate.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
                {statistics.post_statistics?.engagement && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Engagement</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Avg Likes</label>
                        <p className="text-sm">{statistics.post_statistics.engagement.avg_likes?.toFixed(0) || 0}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Avg Comments</label>
                        <p className="text-sm">{statistics.post_statistics.engagement.avg_comments?.toFixed(0) || 0}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Avg Shares</label>
                        <p className="text-sm">{statistics.post_statistics.engagement.avg_shares?.toFixed(0) || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
                {statistics.recent_crawl_jobs && statistics.recent_crawl_jobs.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Recent Crawl Jobs</h4>
                    <div className="space-y-2">
                      {statistics.recent_crawl_jobs.slice(0, 5).map((job: CrawlJob) => (
                        <div key={job.id} className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-1 rounded ${
                            job.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            job.status === "failed" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            job.status === "running" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}>
                            {job.status}
                          </span>
                          <span className="text-muted-foreground">
                            {job.posts_crawled || 0} posts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No statistics available</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
