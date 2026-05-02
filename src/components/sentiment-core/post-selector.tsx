"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Music,
  Twitter,
  Youtube,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

// Helper function to extract error message from API response
function getErrorMessage(data: any, fallback: string): string {
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  return fallback;
}

interface Post {
  id: number;
  platform: string;
  source: string;
  post_id: string;
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

interface PostSelectorProps {
  selectedPostIds: number[];
  onSelectionChange: (postIds: number[]) => void;
  maxSelections?: number;
  onSelectAll?: () => void;
  isSelectAllMode?: boolean;
}

export default function PostSelector({
  selectedPostIds,
  onSelectionChange,
  maxSelections,
  onSelectAll,
  isSelectAllMode,
}: PostSelectorProps) {
  const [postsData, setPostsData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());
      if (platform) params.set("platform", platform);
      if (username) params.set("username", username);

      const response = await fetch(`/api/posts?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to fetch posts"));
      }

      setPostsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPostsData(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, platform, username]);

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen, fetchPosts]);

  const handleTogglePost = (postId: number) => {
    setError(null); // Clear any previous errors
    if (selectedPostIds.includes(postId)) {
      // Uncheck if already selected
      onSelectionChange(selectedPostIds.filter((id) => id !== postId));
    } else {
      // For single selection mode (maxSelections === 1), replace the previous selection
      if (maxSelections === 1) {
        onSelectionChange([postId]);
      } else {
        // For multiple selection mode, check if limit reached
        if (maxSelections && selectedPostIds.length >= maxSelections) {
          setError(`Maksimal ${maxSelections} post dapat dipilih`);
          setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
          return;
        }
        onSelectionChange([...selectedPostIds, postId]);
      }
    }
  };

  const handleSelectAll = () => {
    setError(null); // Clear any previous errors
    if (!postsData) return;
    const currentPageIds = postsData.data.map((post) => post.id);
    const newSelected = [...new Set([...selectedPostIds, ...currentPageIds])];
    if (maxSelections && newSelected.length > maxSelections) {
      setError(`Maksimal ${maxSelections} post dapat dipilih`);
      setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
      return;
    }
    onSelectionChange(newSelected);
  };

  const handleDeselectAll = () => {
    if (!postsData) return;
    const currentPageIds = postsData.data.map((post) => post.id);
    onSelectionChange(
      selectedPostIds.filter((id) => !currentPageIds.includes(id))
    );
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getPlatformIcon = (platform: string | null | undefined): LucideIcon => {
    if (!platform) return Facebook;
    const platformLower = platform.toLowerCase();
    if (platformLower.includes("facebook")) return Facebook;
    if (platformLower.includes("instagram")) return Instagram;
    if (platformLower.includes("tiktok")) return Music;
    if (platformLower.includes("twitter")) return Twitter;
    if (platformLower.includes("youtube")) return Youtube;
    return Facebook;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
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

  const filteredPosts =
    postsData?.data.filter((post) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        post.id.toString().includes(query) ||
        post.content?.toLowerCase().includes(query) ||
        post.account_username?.toLowerCase().includes(query) ||
        post.platform?.toLowerCase().includes(query)
      );
    }) || [];

  const totalPages = postsData
    ? Math.ceil(postsData.pagination.total / limit)
    : 0;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Sembunyikan" : "Pilih dari List Post"}
          </Button>
          {isSelectAllMode ? (
            <span className='text-sm font-medium text-primary'>
              Semua Post Akan Diproses
            </span>
          ) : selectedPostIds.length > 0 ? (
            <span className='text-sm text-muted-foreground'>
              {selectedPostIds.length} post dipilih
            </span>
          ) : null}
        </div>
        <div className='flex items-center gap-2'>
          {onSelectAll &&
            maxSelections &&
            maxSelections > 1 &&
            !isSelectAllMode && (
              <Button
                type='button'
                variant='default'
                size='sm'
                onClick={onSelectAll}
              >
                Pilih Semua Post
              </Button>
            )}
          {selectedPostIds.length > 0 && !isSelectAllMode && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleClearAll}
            >
              <X className='h-4 w-4 mr-1' />
              Hapus Semua
            </Button>
          )}
          {isSelectAllMode && onSelectAll && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => {
                onSelectionChange([]);
                onSelectAll();
              }}
            >
              <X className='h-4 w-4 mr-1' />
              Batalkan Pilih Semua
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
          {/* Filters */}
          <div className='grid grid-cols-1 gap-4 laptop:grid-cols-3'>
            <div>
              <label className='block text-sm font-medium mb-2'>Platform</label>
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setCurrentPage(1);
                }}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              >
                <option value=''>Semua Platform</option>
                <option value='tiktok'>TikTok</option>
                <option value='instagram'>Instagram</option>
                <option value='facebook'>Facebook</option>
                <option value='twitter'>Twitter</option>
                <option value='youtube'>YouTube</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>Username</label>
              <input
                type='text'
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder='Filter by username'
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>Cari</label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Cari ID, content, atau username...'
                  className='w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm'
                />
              </div>
            </div>
          </div>

          {/* Selection Controls - Only show for batch (maxSelections > 1) */}
          {postsData && postsData.data.length > 0 && maxSelections !== 1 && (
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleSelectAll}
              >
                Pilih Semua di Halaman Ini
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleDeselectAll}
              >
                Hapus Semua di Halaman Ini
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950'>
              <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && !postsData && (
            <div className='flex min-h-64 items-center justify-center'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Memuat posts...</span>
              </div>
            </div>
          )}

          {/* Posts List */}
          {!loading && postsData && (
            <>
              <div className='text-sm text-muted-foreground'>
                Menampilkan {postsData.pagination.offset + 1} -{" "}
                {Math.min(
                  postsData.pagination.offset + postsData.data.length,
                  postsData.pagination.total
                )}{" "}
                dari {postsData.pagination.total} posts
              </div>

              <div className='space-y-2 max-h-[400px] overflow-y-auto'>
                {filteredPosts.length === 0 ? (
                  <div className='flex min-h-32 items-center justify-center'>
                    <p className='text-sm text-muted-foreground'>
                      Tidak ada post ditemukan
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post) => {
                    const IconComponent = getPlatformIcon(post.platform);
                    const isSelected = selectedPostIds.includes(post.id);
                    return (
                      <div
                        key={post.id}
                        className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted/50"
                        }`}
                        onClick={() => handleTogglePost(post.id)}
                      >
                        <div className='flex items-start gap-3'>
                          <input
                            type='checkbox'
                            checked={isSelected}
                            onChange={() => handleTogglePost(post.id)}
                            onClick={(e) => e.stopPropagation()}
                            className='mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                          />
                          <div className='flex-1 space-y-2'>
                            <div className='flex items-center gap-2'>
                              <IconComponent className='h-4 w-4' />
                              <span className='text-sm font-medium capitalize'>
                                {post.platform || "Unknown"}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                ID: {post.id}
                              </span>
                              {post.account_username && (
                                <span className='text-xs text-muted-foreground'>
                                  @{post.account_username}
                                </span>
                              )}
                            </div>
                            {post.content && (
                              <p className='text-sm text-foreground line-clamp-2'>
                                {post.content}
                              </p>
                            )}
                            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                              {post.posted_at && (
                                <span>
                                  Posted: {formatDate(post.posted_at)}
                                </span>
                              )}
                              {post.engagement && (
                                <div className='flex items-center gap-2'>
                                  {post.engagement.likes !== undefined && (
                                    <span>👍 {post.engagement.likes}</span>
                                  )}
                                  {post.engagement.comments !== undefined && (
                                    <span>💬 {post.engagement.comments}</span>
                                  )}
                                  {post.engagement.shares !== undefined && (
                                    <span>🔁 {post.engagement.shares}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between pt-4 border-t border-border'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className='h-4 w-4 mr-1' />
                    Previous
                  </Button>

                  <div className='flex items-center gap-2'>
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
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size='sm'
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className='min-w-[40px]'
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                    <ChevronRight className='h-4 w-4 ml-1' />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
