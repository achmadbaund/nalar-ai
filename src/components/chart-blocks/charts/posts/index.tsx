"use client";

import { useEffect, useState, useMemo } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";
import MetricCard from "../average-tickets-created/components/metric-card";

interface Post {
  id: number;
  platform: string;
  source: string;
  engagement: {
    likes: number;
  };
  posted_at: string;
  crawled_at: string;
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

export default function Posts() {
  const [postsData, setPostsData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/posts?limit=50&offset=0", {
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

    fetchPosts();
    // Refresh setiap 60 detik
    const interval = setInterval(fetchPosts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!postsData || !postsData.data || postsData.data.length === 0) {
      return { totalCrawl: 0, avgCrawlPerDay: 0 };
    }

    const totalCrawl = postsData.data.length;
    
    // Group by date
    const dateMap = new Map<string, number>();
    postsData.data.forEach((post) => {
      const crawledDate = post.crawled_at
        ? new Date(post.crawled_at).toISOString().split("T")[0]
        : null;
      if (crawledDate) {
        dateMap.set(crawledDate, (dateMap.get(crawledDate) || 0) + 1);
      }
    });

    const uniqueDays = dateMap.size;
    const avgCrawlPerDay = uniqueDays > 0 ? Math.round(totalCrawl / uniqueDays) : 0;

    return { totalCrawl, avgCrawlPerDay };
  }, [postsData]);

  if (loading && !postsData) {
    return (
      <section className="flex h-full flex-col gap-2">
        <ChartTitle title="Total Crawl per Platform per Tanggal" icon={MessageSquare} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat data posts...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full flex-col gap-2">
        <ChartTitle title="Total Crawl per Platform per Tanggal" icon={MessageSquare} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!postsData || !postsData.data || postsData.data.length === 0) {
    return (
      <section className="flex h-full flex-col gap-2">
        <ChartTitle title="Total Crawl per Platform per Tanggal" icon={MessageSquare} />
        <div className="flex min-h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Tidak ada data posts</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ChartTitle title="Total Crawl per Platform per Tanggal" icon={MessageSquare} />
        {postsData.pagination && (
          <div className="text-xs text-muted-foreground">
            Total: {postsData.pagination.total} posts
          </div>
        )}
      </div>
      <div className="flex flex-wrap">
        <div className="my-4 flex w-52 shrink-0 flex-col justify-center gap-6">
          <MetricCard
            title="Total Crawl"
            value={metrics.totalCrawl}
            color="#60C2FB"
          />
          <MetricCard
            title="Avg. Crawl per Day"
            value={metrics.avgCrawlPerDay}
            color="#3161F8"
          />
        </div>
        <div className="relative h-96 min-w-[320px] flex-1">
          <Chart data={postsData.data} />
        </div>
      </div>
    </section>
  );
}

