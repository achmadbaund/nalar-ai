"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Facebook, Instagram, Music, Twitter, Youtube, Filter, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { LucideIcon } from "lucide-react";

interface Post {
  id: number;
  platform: string;
  source?: string;
  post_id?: string;
  account_username?: string;
  content?: string;
  media_urls?: string[];
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    [key: string]: any;
  };
  posted_at?: string;
  crawled_at?: string;
  raw_data?: any;
  created_at?: string;
  updated_at?: string;
  // Analyzed posts fields
  sentiment_score?: number;
  sentiment_label?: string;
  topic?: string;
}

interface PostsResponse {
  data: Post[];
  pagination: {
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

interface PostsListFilters {
  platform: string;
  username: string;
  postedStartDate: string;
  postedEndDate: string;
  createdStartDate: string;
  createdEndDate: string;
  currentPage: number;
  analyzedOnly: boolean;
}

const STORAGE_KEY = "apify-posts-list-filters";

function PostsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [postsData, setPostsData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(20);

  // Read query parameters for initial filters
  const platformFromQuery = searchParams.get("platform") || "";
  const postedStartDateFromQuery = searchParams.get("posted_start_date") || "";
  const postedEndDateFromQuery = searchParams.get("posted_end_date") || "";
  const analyzedFromQuery = searchParams.get("analyzed") === "true";

  // Use localStorage untuk persist filters, with query params as initial values
  const [filters, setFilters] = useLocalStorage<PostsListFilters>(STORAGE_KEY, {
    platform: platformFromQuery,
    username: "",
    postedStartDate: postedStartDateFromQuery,
    postedEndDate: postedEndDateFromQuery,
    createdStartDate: "",
    createdEndDate: "",
    currentPage: 1,
    analyzedOnly: analyzedFromQuery,
  });

  // Apply query parameters on mount if they exist
  useEffect(() => {
    if (platformFromQuery || postedStartDateFromQuery || postedEndDateFromQuery || analyzedFromQuery) {
      setFilters((prev) => ({
        ...prev,
        platform: platformFromQuery || prev.platform,
        postedStartDate: postedStartDateFromQuery || prev.postedStartDate,
        postedEndDate: postedEndDateFromQuery || prev.postedEndDate,
        analyzedOnly: analyzedFromQuery,
        currentPage: 1,
      }));
    }
  }, [platformFromQuery, postedStartDateFromQuery, postedEndDateFromQuery, analyzedFromQuery]);

  const {
    platform,
    username,
    postedStartDate,
    postedEndDate,
    createdStartDate,
    createdEndDate,
    currentPage,
    analyzedOnly,
  } = filters;

  // Helper functions untuk update filters
  const setPlatform = (value: string) => {
    setFilters((prev) => ({ ...prev, platform: value, currentPage: 1 }));
  };

  const setUsername = (value: string) => {
    setFilters((prev) => ({ ...prev, username: value, currentPage: 1 }));
  };

  const setPostedStartDate = (value: string) => {
    setFilters((prev) => ({ ...prev, postedStartDate: value, currentPage: 1 }));
  };

  const setPostedEndDate = (value: string) => {
    setFilters((prev) => ({ ...prev, postedEndDate: value, currentPage: 1 }));
  };

  const setCreatedStartDate = (value: string) => {
    setFilters((prev) => ({ ...prev, createdStartDate: value, currentPage: 1 }));
  };

  const setCreatedEndDate = (value: string) => {
    setFilters((prev) => ({ ...prev, createdEndDate: value, currentPage: 1 }));
  };

  const setCurrentPage = (value: number | ((prev: number) => number)) => {
    setFilters((prev) => ({
      ...prev,
      currentPage: typeof value === "function" ? value(prev.currentPage) : value,
    }));
  };

  const setAnalyzedOnly = (value: boolean) => {
    setFilters((prev) => ({ ...prev, analyzedOnly: value, currentPage: 1 }));
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());

      // Choose endpoint based on analyzedOnly flag
      let endpoint = "/api/posts";

      if (analyzedOnly) {
        // Use analyzed posts endpoint (requires posted dates)
        endpoint = "/api/posts/analyzed";

        if (!postedStartDate || !postedEndDate) {
          setError("Analyzed posts require Posted Date range to be set");
          setPostsData(null);
          setLoading(false);
          return;
        }

        const postedStartDateFormatted = postedStartDate.split("T")[0];
        const postedEndDateFormatted = postedEndDate.split("T")[0];
        params.set("posted_start_date", postedStartDateFormatted);
        params.set("posted_end_date", postedEndDateFormatted);

        if (platform) params.set("platform", platform);
      } else {
        // Use regular posts endpoint
        if (platform) params.set("platform", platform);
        if (username) params.set("username", username);

        // Posted date filters (posted_at) - Tanggal posting asli
        if (postedStartDate) {
          const postedStartDateFormatted = postedStartDate.split("T")[0];
          params.set("posted_start_date", postedStartDateFormatted);
        }
        if (postedEndDate) {
          const postedEndDateFormatted = postedEndDate.split("T")[0];
          params.set("posted_end_date", postedEndDateFormatted);
        }

        // Created date filters (created_at) - Tanggal dibuat di database
        if (createdStartDate) {
          const createdStartDateFormatted = createdStartDate.split("T")[0];
          params.set("created_start_date", createdStartDateFormatted);
        }
        if (createdEndDate) {
          const createdEndDateFormatted = createdEndDate.split("T")[0];
          params.set("created_end_date", createdEndDateFormatted);
        }
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data: PostsResponse = await response.json();
      setPostsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPostsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, platform, username, postedStartDate, postedEndDate, createdStartDate, createdEndDate, analyzedOnly]);

  const handleFilterReset = () => {
    setFilters({
      platform: "",
      username: "",
      postedStartDate: "",
      postedEndDate: "",
      createdStartDate: "",
      createdEndDate: "",
      currentPage: 1,
      analyzedOnly: false,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
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

  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleViewDetail = (postId: number) => {
    router.push(`/apify-crawler/posts/${postId}`);
  };

  const getPlatformIcon = (platform: string): LucideIcon => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes("facebook")) return Facebook;
    if (platformLower.includes("instagram")) return Instagram;
    if (platformLower.includes("tiktok")) return Music;
    if (platformLower.includes("twitter")) return Twitter;
    if (platformLower.includes("youtube")) return Youtube;
    return Facebook; // Default fallback
  };

  if (loading && !postsData) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h3>
          {(platform || username || postedStartDate || postedEndDate || createdStartDate || createdEndDate || analyzedOnly) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFilterReset}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Analyzed Posts Toggle */}
        <div className="mb-4 p-3 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={analyzedOnly}
              onChange={(e) => setAnalyzedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Show Analyzed Posts Only
              </span>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Display only posts that have been processed by sentiment analysis
                {analyzedOnly && " (Posted Date range required)"}
              </p>
            </div>
          </label>
        </div>

        <div className="flex flex-col gap-4 laptop:flex-row laptop:items-end laptop:gap-4">
          {/* Platform Filter */}
          <div className="flex-1 laptop:flex-initial laptop:min-w-[180px]">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Platforms</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          
          {/* Posted Date Filters */}
          <div className="flex-1 laptop:flex-initial">
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Posted Date
              <span className="text-xs text-muted-foreground font-normal">(Tanggal Posting Asli)</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Start</label>
                <input
                  type="date"
                  value={postedStartDate}
                  onChange={(e) => setPostedStartDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">End</label>
                <input
                  type="date"
                  value={postedEndDate}
                  onChange={(e) => setPostedEndDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>
          </div>
          
          {/* Created Date Filters */}
          <div className="flex-1 laptop:flex-initial">
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Created Date
              <span className="text-xs text-muted-foreground font-normal">(Tanggal Dibuat di Database)</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Start</label>
                <input
                  type="date"
                  value={createdStartDate}
                  onChange={(e) => setCreatedStartDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">End</label>
                <input
                  type="date"
                  value={createdEndDate}
                  onChange={(e) => setCreatedEndDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* No Data Message */}
      {!loading && (!postsData || !postsData.data || postsData.data.length === 0) && (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-card p-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Tidak ada data posts</p>
            {(platform || username || postedStartDate || postedEndDate || createdStartDate || createdEndDate) && (
              <p className="text-xs text-muted-foreground mb-4">
                Coba reset filter untuk melihat semua posts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {postsData && postsData.pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Menampilkan {postsData.pagination.offset + 1} -{" "}
            {Math.min(
              postsData.pagination.offset + postsData.pagination.count,
              postsData.pagination.total,
            )}{" "}
            dari {postsData.pagination.total} posts
          </div>
          <div>
            Halaman {postsData.pagination.current_page} dari{" "}
            {postsData.pagination.total_pages}
          </div>
        </div>
      )}

      {/* Posts List */}
      {postsData && postsData.data && postsData.data.length > 0 && (
      <div className="space-y-4">
        {postsData.data.map((post) => (
          <div
            key={post.id}
            className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = getPlatformIcon(post.platform);
                    return <IconComponent className="h-4 w-4" />;
                  })()}
                  <span className="text-sm font-medium capitalize">
                    {post.platform}
                  </span>
                  {post.account_username && (
                    <span className="text-sm text-muted-foreground">
                      @{post.account_username}
                    </span>
                  )}
                </div>

                {/* Content */}
                {post.content && post.content.trim() && (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {truncateText(post.content)}
                  </p>
                )}

                {/* Sentiment Info (for analyzed posts) */}
                {analyzedOnly && post.sentiment_score !== undefined && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted border border-border">
                      <span className="text-xs font-medium text-muted-foreground">Sentiment:</span>
                      <span className={`text-xs font-semibold ${
                        post.sentiment_score > 0.6 ? "text-green-600 dark:text-green-400" :
                        post.sentiment_score < 0.4 ? "text-red-600 dark:text-red-400" :
                        "text-yellow-600 dark:text-yellow-400"
                      }`}>
                        {post.sentiment_label || "N/A"} ({post.sentiment_score.toFixed(3)})
                      </span>
                    </div>
                    {post.topic && post.topic !== "Uncategorized" && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Topic: {post.topic}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Media Preview */}
                {post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {post.media_urls.slice(0, 3).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Media ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded border border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ))}
                    {post.media_urls.length > 3 && (
                      <div className="h-20 w-20 rounded border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        +{post.media_urls.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Engagement Stats */}
                {post.engagement && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {post.engagement.likes !== undefined && (
                      <span>👍 {post.engagement.likes}</span>
                    )}
                    {post.engagement.comments !== undefined && (
                      <span>💬 {post.engagement.comments}</span>
                    )}
                    {post.engagement.shares !== undefined && (
                      <span>🔄 {post.engagement.shares}</span>
                    )}
                    {post.engagement.views !== undefined && (
                      <span>👁️ {post.engagement.views}</span>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {post.posted_at && (
                    <span>Posted: {formatDate(post.posted_at)}</span>
                  )}
                  {post.crawled_at && (
                    <span>Crawled: {formatDate(post.crawled_at)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">ID: {post.id}</span>
                {post.post_id && (
                  <span className="text-xs text-muted-foreground">
                    Post ID: {post.post_id.substring(0, 20)}...
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetail(post.id)}
                  className="mt-2"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Detail
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Pagination Controls */}
      {postsData && postsData.pagination && postsData.pagination.total_pages > 0 && (
      <div className="flex flex-col gap-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={!postsData.pagination.has_prev || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {Array.from({ length: Math.min(5, postsData.pagination.total_pages) }, (_, i) => {
              let pageNum: number;
              if (postsData.pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= postsData.pagination.total_pages - 2) {
                pageNum = postsData.pagination.total_pages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={loading}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(postsData.pagination.total_pages, prev + 1),
              )
            }
            disabled={!postsData.pagination.has_next || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Page Number Input */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Go to page:</span>
          <input
            type="number"
            min="1"
            max={postsData.pagination.total_pages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= postsData.pagination.total_pages) {
                setCurrentPage(page);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const page = parseInt((e.target as HTMLInputElement).value);
                if (page >= 1 && page <= postsData.pagination.total_pages) {
                  setCurrentPage(page);
                }
              }
            }}
            className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-center"
          />
          <span className="text-sm text-muted-foreground">
            of {postsData.pagination.total_pages}
          </span>
        </div>
      </div>
      )}
    </div>
  );
}

export default function PostsList() {
  return (
    <Suspense fallback={
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat posts...</span>
        </div>
      </div>
    }>
      <PostsListContent />
    </Suspense>
  );
}
