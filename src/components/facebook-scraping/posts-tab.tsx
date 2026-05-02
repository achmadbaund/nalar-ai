"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreVertical,
  Eye,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import {
  getPosts,
  getTrendingPosts,
  getPost,
  type FacebookPost,
  type PaginatedResponse,
} from "@/utils/api/facebookApi";
import { toast } from "sonner";
import ViewPostModal from "./view-post-modal";

export default function PostsTab() {
  const [data, setData] = useState<PaginatedResponse<FacebookPost> | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<PaginatedResponse<FacebookPost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    account: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FacebookPost | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "trending">("all");

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (filters.account) {
        params.account = parseInt(filters.account);
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await getPosts(params);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch posts";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingPosts = async () => {
    setLoadingTrending(true);
    try {
      const response = await getTrendingPosts(24, {
        page: 1,
        page_size: 20,
      });
      setTrendingPosts(response);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch trending posts");
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    if (viewMode === "all") {
      fetchPosts();
    } else {
      fetchTrendingPosts();
    }
  }, [page, pageSize, filters.account, viewMode]);

  useEffect(() => {
    if (viewMode === "trending") {
      fetchTrendingPosts();
    }
  }, [viewMode]);

  const handleView = async (post: FacebookPost) => {
    try {
      const fullPost = await getPost(post.id);
      setSelectedPost(fullPost);
      setShowViewModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch post details");
    }
  };

  const posts = viewMode === "all" ? (data?.results || []) : (trendingPosts?.results || []);
  const pagination = viewMode === "all" ? data : trendingPosts;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setViewMode("all");
                setPage(1);
              }}
            >
              All Posts
            </Button>
            <Button
              variant={viewMode === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("trending")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </Button>
          </div>
          {viewMode === "all" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Account ID</label>
                <input
                  type="number"
                  value={filters.account}
                  onChange={(e) => {
                    setFilters({ ...filters, account: e.target.value });
                    setPage(1);
                  }}
                  placeholder="Filter by account ID..."
                  className="h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPage(1);
                  }}
                  placeholder="Search posts..."
                  className="h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {(loading || loadingTrending) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!loading && !loadingTrending && !error && (
        <>
          <div className="rounded-md border border-border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Account</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Content</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Likes</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Comments</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Shares</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Posted At</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No posts found
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{post.id}</td>
                      <td className="px-4 py-3 text-sm">
                        {post.account_username || `Account #${post.account}`}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-md truncate">{post.content || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{post.likes_count || 0}</td>
                      <td className="px-4 py-3 text-sm">{post.comments_count || 0}</td>
                      <td className="px-4 py-3 text-sm">{post.shares_count || 0}</td>
                      <td className="px-4 py-3 text-sm">
                        {post.posted_at
                          ? new Date(post.posted_at).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(post)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {post.url && (
                              <DropdownMenuItem
                                onClick={() => window.open(post.url, "_blank")}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open in Facebook
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.count > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.count)} of{" "}
                {pagination.count} posts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.previous}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      {showViewModal && selectedPost && (
        <ViewPostModal
          open={showViewModal}
          post={selectedPost}
          onClose={() => {
            setShowViewModal(false);
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
}
