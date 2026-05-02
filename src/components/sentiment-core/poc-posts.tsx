"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Facebook, Instagram, Music, Twitter, Youtube, Newspaper, Radio, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PocPostsResponse, PocPost } from "./types";
import type { LucideIcon } from "lucide-react";

export default function PocPosts() {
  const [postsData, setPostsData] = useState<PocPostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [platform, setPlatform] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [orderBy, setOrderBy] = useState("created_at");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      if (platform) params.set("platform", platform);
      if (sentiment) params.set("sentiment", sentiment);
      if (orderBy) params.set("order_by", orderBy);
      if (orderDir) params.set("order_dir", orderDir);

      const response = await fetch(`/api/sentiment-core/posts?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Failed to fetch posts");
      }

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
  }, [currentPage, limit, platform, sentiment, orderBy, orderDir]);

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

  const getPlatformIcon = (platform: string | null | undefined): LucideIcon => {
    if (!platform) return Facebook;
    const platformLower = platform.toLowerCase();
    if (platformLower.includes("facebook")) return Facebook;
    if (platformLower.includes("instagram")) return Instagram;
    if (platformLower.includes("tiktok")) return Music;
    if (platformLower.includes("twitter")) return Twitter;
    if (platformLower.includes("youtube")) return Youtube;
    if (platformLower.includes("online-media")) return Newspaper;
    if (platformLower.includes("print")) return Newspaper;
    if (platformLower.includes("broadcast")) return Radio;
    return Facebook;
  };

  const getPlatformLabel = (platform: string | null | undefined): string => {
    if (!platform) return "Unknown";
    const platformLower = platform.toLowerCase();

    // Map internal codes to display names
    if (platformLower === "online-media") return "Online News";
    if (platformLower === "print") return "Print Media";
    if (platformLower === "broadcast-media") return "Broadcast";
    if (platformLower === "social") return "Social Media";

    // Default: capitalize
    return platform;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950";
      case "negative":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      case "neutral":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950";
      default:
        return "text-muted-foreground bg-muted";
    }
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!postsData || !postsData.posts || postsData.posts.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Tidak ada data posts</p>
      </div>
    );
  }

  const totalPages = Math.ceil(postsData.total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 laptop:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Sources</option>
              <optgroup label="Social Media">
                <option value="social">All Social Media</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter</option>
                <option value="youtube">YouTube</option>
              </optgroup>
              <optgroup label="Other Media">
                <option value="online-media">Online News</option>
                <option value="print">Print Media</option>
                <option value="broadcast-media">Broadcast</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sentiment</label>
            <select
              value={sentiment}
              onChange={(e) => {
                setSentiment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Order By</label>
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="created_at">Created At</option>
              <option value="confidence">Confidence</option>
              <option value="processing_time">Processing Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Order Direction</label>
            <select
              value={orderDir}
              onChange={(e) => setOrderDir(e.target.value as "asc" | "desc")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Menampilkan {postsData.offset + 1} -{" "}
          {Math.min(postsData.offset + postsData.posts.length, postsData.total)} dari{" "}
          {postsData.total} posts
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {postsData.posts.map((post) => {
          const IconComponent = getPlatformIcon(post.platform);
          return (
            <div
              key={post.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">
                      {getPlatformLabel(post.platform)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getSentimentColor(post.sentiment_label)}`}
                    >
                      {post.sentiment_label}
                    </span>
                  </div>

                  {/* Text Preview */}
                  {post.text_preview && (
                    <p className="text-sm text-foreground">{post.text_preview}</p>
                  )}

                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Score: </span>
                      <span className="font-medium">
                        {(post.sentiment_score * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence: </span>
                      <span className="font-medium">
                        {(post.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Processing Time: </span>
                      <span className="font-medium">{post.processing_time ? post.processing_time.toFixed(3) + 's' : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Text Length: </span>
                      <span className="font-medium">{post.text_length} chars</span>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="pt-2 border-t border-border">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-green-600 dark:text-green-400">Positive: </span>
                        <span className="font-medium">
                          {(post.positive_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-red-600 dark:text-red-400">Negative: </span>
                        <span className="font-medium">
                          {(post.negative_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Neutral: </span>
                        <span className="font-medium">
                          {(post.neutral_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-muted-foreground">
                    Created: {formatDate(post.created_at)}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span>ID: {post.id}</span>
                  <span>Raw Post ID: {post.raw_social_post_id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
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
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || loading}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

