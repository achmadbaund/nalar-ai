"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, MoreVertical, Eye, CheckCircle2, Trash2, X } from "lucide-react";
import {
  getArticles,
  getArticleDetail,
  validateArticle,
  deleteArticle,
  type ArticlesResponse,
  type Article,
} from "@/utils/api/printMediaApi";
import { toast } from "sonner";
import AddArticleModal from "./add-article-modal";

// Sentiment Badge Component
function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const colors: Record<string, string> = {
    positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const icons: Record<string, string> = {
    positive: "↑",
    neutral: "→",
    negative: "↓",
  };

  const colorClass = colors[sentiment.toLowerCase()] || colors.neutral;
  const icon = icons[sentiment.toLowerCase()] || "→";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}>
      <span>{icon}</span>
      <span className="capitalize">{sentiment}</span>
    </span>
  );
}

export default function ArticlesTab() {
  const [data, setData] = useState<ArticlesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastToastRef = useRef<string | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({
    validated: "",
    publication_date: "",
    search: "",
    ordering: "-publication_date",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [loadingArticleDetail, setLoadingArticleDetail] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        ordering: filters.ordering,
      };

      if (filters.validated !== "") {
        params.validated = filters.validated === "true";
      }
      if (filters.publication_date) {
        params.publication_date = filters.publication_date;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await getArticles(params);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch articles";
      setError(errorMessage);
      
      // Prevent duplicate toast within 2 seconds
      const now = Date.now();
      if (lastToastRef.current !== errorMessage || now - lastToastTimeRef.current > 2000) {
        toast.error(errorMessage);
        lastToastRef.current = errorMessage;
        lastToastTimeRef.current = now;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, pageSize, filters.ordering, filters.validated, filters.publication_date, filters.search]);

  // Poll for articles when sources are processing
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const lastArticlesCountRef = useRef<number>(0);

  useEffect(() => {
    // Check if articles have been updated by checking global flag
    const checkForUpdates = async () => {
      try {
        const response = await fetch("/api/print-media-ocr/articles?page_size=1");
        if (response.ok) {
          const data = await response.json();
          if (data.count !== lastArticlesCountRef.current && lastArticlesCountRef.current > 0) {
            fetchArticles();
          }
          lastArticlesCountRef.current = data.count;
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Poll every 5 seconds when tab is active
    const interval = setInterval(checkForUpdates, 5000);
    setPollInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle ESC key to close View Article Modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewingArticle && !loadingArticleDetail) {
        setViewingArticle(null);
      }
    };

    if (viewingArticle) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [viewingArticle, loadingArticleDetail]);

  const handleResetFilters = () => {
    setFilters({
      validated: "",
      publication_date: "",
      search: "",
      ordering: "-publication_date",
    });
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedIds(new Set(data.results.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleValidate = async (id: number) => {
    try {
      await validateArticle(id);
      toast.success("Article validated successfully");
      fetchArticles();
    } catch (err: any) {
      toast.error(err.message || "Failed to validate article");
    }
  };

  const handleBulkValidate = async () => {
    if (selectedIds.size === 0) return;

    try {
      const promises = Array.from(selectedIds).map((id) => validateArticle(id));
      await Promise.all(promises);
      toast.success(`${selectedIds.size} articles validated successfully`);
      setSelectedIds(new Set());
      fetchArticles();
    } catch (err: any) {
      toast.error("Failed to validate some articles");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      await deleteArticle(id);
      toast.success("Article deleted successfully");
      fetchArticles();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete article");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} articles?`)) return;

    try {
      const promises = Array.from(selectedIds).map((id) => deleteArticle(id));
      await Promise.all(promises);
      toast.success(`${selectedIds.size} articles deleted successfully`);
      setSelectedIds(new Set());
      fetchArticles();
    } catch (err: any) {
      toast.error("Failed to delete some articles");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchArticles} className="mt-4" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Articles</h3>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({selectedIds.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleBulkValidate}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Validate Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Add Article button - hidden for demo
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Article
          </Button>
          */}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Validation Status</label>
          <select
            value={filters.validated}
            onChange={(e) => {
              setFilters({ ...filters, validated: e.target.value });
              setPage(1);
            }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Validated</option>
            <option value="false">Pending</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Publication Date</label>
          <input
            type="date"
            value={filters.publication_date}
            onChange={(e) => {
              setFilters({ ...filters, publication_date: e.target.value });
              setPage(1);
            }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            placeholder="Search title, content, author"
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={handleResetFilters} variant="outline" size="sm">
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={data ? selectedIds.size === data.results.length && data.results.length > 0 : false}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Author</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Newspaper</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Confidence</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Sentimen</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.results.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No articles found
                </td>
              </tr>
            ) : (
              data?.results.map((article) => (
                <tr key={article.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={(e) => handleSelectOne(article.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <button
                        onClick={async () => {
                          setViewingArticle(article);
                          // Fetch article detail untuk mendapatkan content lengkap
                          try {
                            setLoadingArticleDetail(true);
                            const detail = await getArticleDetail(article.id);
                            setViewingArticle(detail);
                          } catch (err: any) {
                            toast.error(err.message || "Failed to fetch article detail");
                            setViewingArticle(null);
                          } finally {
                            setLoadingArticleDetail(false);
                          }
                        }}
                        className="text-left text-sm font-medium hover:underline"
                      >
                        {truncateText(article.title, 50)}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{article.author || "-"}</td>
                  <td className="px-4 py-3">
                    {article.category ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {article.category}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{article.newspaper_name}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(article.publication_date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={article.confidence_score} type="confidence" />
                  </td>
                  <td className="px-4 py-3">
                    <SentimentBadge sentiment={article.sentiment_analysis} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={article.validated} type="validation_status" />
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={async () => {
                            setViewingArticle(article);
                            // Fetch article detail untuk mendapatkan content lengkap
                            try {
                              setLoadingArticleDetail(true);
                              const detail = await getArticleDetail(article.id);
                              setViewingArticle(detail);
                            } catch (err: any) {
                              toast.error(err.message || "Failed to fetch article detail");
                            } finally {
                              setLoadingArticleDetail(false);
                            }
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Detail
                        </DropdownMenuItem>
                        {!article.validated && (
                          <DropdownMenuItem onClick={() => handleValidate(article.id)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Validate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(article.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
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
      {data && data.count > 0 && (
        <Pagination
          currentPage={data.current_page}
          totalPages={data.total_pages}
          pageSize={data.page_size}
          pageSizeOptions={data.page_size_options}
          count={data.count}
          next={data.next}
          previous={data.previous}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      {/* Add Article Modal */}
      <AddArticleModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchArticles}
      />

      {/* View Article Modal */}
      {viewingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-4xl rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-card pb-2 border-b">
              <h2 className="text-lg font-semibold">{viewingArticle.title}</h2>
              <Button variant="ghost" size="icon" onClick={() => setViewingArticle(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {loadingArticleDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Author</p>
                    <p className="text-sm">{viewingArticle.author || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-sm">{viewingArticle.category || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Newspaper</p>
                    <p className="text-sm">{viewingArticle.newspaper_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Publication Date</p>
                    <p className="text-sm">{formatDate(viewingArticle.publication_date)}</p>
                  </div>
                  {viewingArticle.page_number && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Page Number</p>
                      <p className="text-sm">{viewingArticle.page_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Confidence Score</p>
                    <StatusBadge status={viewingArticle.confidence_score} type="confidence" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sentimen (IndoBERT)</p>
                    <SentimentBadge sentiment={viewingArticle.sentiment_analysis} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <StatusBadge status={viewingArticle.validated} type="validation_status" />
                  </div>
                </div>

                {/* Nalar AI Explanation */}
                {viewingArticle.content && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">N</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Nalar AI</p>
                        <p className="text-xs text-blue-500 dark:text-blue-500">
                          {viewingArticle.avatar_model || "MiniMax-M2.2-highspeed"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {viewingArticle.avatar_explanation || "Analisis artikel sedang dimuat..."}
                    </p>
                  </div>
                )}

                {viewingArticle.content && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Content</p>
                    <div className="max-h-[400px] overflow-y-auto rounded-md border border-border bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                      {viewingArticle.content}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

