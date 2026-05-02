"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Loader2,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
  Newspaper,
} from "lucide-react";
import { RawArticle, PaginatedResponse } from "@/types/online-media";
import { cn } from "@/lib/utils";

interface RawArticlesListProps {
  sourceFilter?: number;
  onArticleSelect?: (article: RawArticle) => void;
}

export default function RawArticlesList({
  sourceFilter,
  onArticleSelect,
}: RawArticlesListProps) {
  const [articles, setArticles] = useState<RawArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<number | "">(
    sourceFilter || ""
  );

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("page_size", pageSize.toString());

      if (search) params.set("search", search);
      if (selectedSourceId !== "")
        params.set("source", selectedSourceId.toString());

      const response = await fetch(
        `/api/online-media/articles?${params.toString()}`
      );
      const data = await response.json();

      // Always set articles from results (even if empty array on error)
      if (data.results !== undefined) {
        setArticles(data.results);
        setTotalCount(data.count || 0);
        setNext(data.next || null);
        setPrevious(data.previous || null);
      } else if (Array.isArray(data)) {
        // Handle non-paginated response (array)
        setArticles(data);
        setTotalCount(data.length);
      } else {
        setArticles([]);
        setTotalCount(0);
      }

      // Show error message if present
      if (data.error) {
        setError(data.error);
      } else if (!response.ok) {
        setError(`Failed to fetch articles: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch articles");
      setArticles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, selectedSourceId]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    if (sourceFilter !== undefined) {
      setSelectedSourceId(sourceFilter);
      setCurrentPage(1);
    }
  }, [sourceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return "-";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className='space-y-4'>
      {/* Header Actions */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-lg font-semibold'>Raw Articles</h2>
        <Button
          variant='outline'
          size='sm'
          onClick={fetchArticles}
          disabled={loading}
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className='flex flex-col gap-3 sm:flex-row sm:items-end'
      >
        <div className='flex-1'>
          <label className='block text-sm font-medium mb-1'>Search</label>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search by title, content, or author...'
              className='w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm'
            />
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Source ID</label>
          <input
            type='number'
            value={selectedSourceId}
            onChange={(e) => {
              setSelectedSourceId(
                e.target.value === "" ? "" : Number(e.target.value)
              );
              setCurrentPage(1);
            }}
            placeholder='Filter by source'
            className='h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm'
          />
        </div>
        <Button type='submit' variant='secondary'>
          <Search className='h-4 w-4 mr-2' />
          Search
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <div className='bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md text-sm border border-yellow-200 dark:border-yellow-800'>
          <div className='flex items-start gap-2'>
            <span className='font-medium'>⚠️ Note:</span>
            <div className='flex-1'>
              <p>{error}</p>
              <p className='text-xs mt-1 opacity-80'>
                The backend articles endpoint might be experiencing issues.
                Please check that the Django server is running properly.
              </p>
            </div>
          </div>
          <button
            className='mt-2 text-xs underline'
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Articles List */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : articles.length === 0 && !error ? (
        <div className='text-center py-12 text-muted-foreground'>
          No articles found. Articles will appear here after crawling news
          sources.
        </div>
      ) : articles.length === 0 && error ? (
        <div className='text-center py-12 text-muted-foreground'>
          <p>Unable to load articles from the backend.</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={fetchArticles}
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Try Again
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {articles.map((article) => (
            <div
              key={article.id}
              className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                expandedRow === article.id
                  ? "border-primary"
                  : "hover:border-muted-foreground/50"
              )}
            >
              {/* Article Header */}
              <div
                className='flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/30'
                onClick={() =>
                  setExpandedRow(expandedRow === article.id ? null : article.id)
                }
              >
                <div className='flex-shrink-0 pt-1'>
                  {expandedRow === article.id ? (
                    <ChevronUp className='h-5 w-5 text-muted-foreground' />
                  ) : (
                    <ChevronDown className='h-5 w-5 text-muted-foreground' />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-medium text-base leading-tight mb-1'>
                    {article.title || "Untitled Article"}
                  </h3>
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                    <span className='flex items-center gap-1'>
                      <Newspaper className='h-3 w-3' />
                      {article.source_name || `Source #${article.source}`}
                    </span>
                    {article.author && (
                      <span className='flex items-center gap-1'>
                        <User className='h-3 w-3' />
                        {article.author}
                      </span>
                    )}
                    <span className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      {formatDate(article.crawled_at)}
                    </span>
                  </div>
                </div>
                <div className='flex-shrink-0'>
                  <a
                    href={article.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className='h-4 w-4' />
                  </a>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedRow === article.id && (
                <div className='border-t p-4 bg-muted/20 space-y-4'>
                  {/* Article Info */}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>Article ID:</span>
                      <p className='font-medium'>{article.id}</p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Source:</span>
                      <p className='font-medium'>
                        {article.source_name || "-"}
                      </p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Published:</span>
                      <p className='font-medium text-xs'>
                        {formatDate(article.published_at)}
                      </p>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Crawled:</span>
                      <p className='font-medium text-xs'>
                        {formatDate(article.crawled_at)}
                      </p>
                    </div>
                  </div>

                  {/* URL */}
                  <div>
                    <span className='text-sm text-muted-foreground'>URL:</span>
                    <p className='text-sm break-all'>
                      <a
                        href={article.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 dark:text-blue-400 hover:underline'
                      >
                        {article.url}
                      </a>
                    </p>
                  </div>

                  {/* Content Preview */}
                  {article.content && (
                    <div>
                      <span className='text-sm text-muted-foreground flex items-center gap-1'>
                        <FileText className='h-4 w-4' />
                        Content Preview:
                      </span>
                      <div className='mt-1 p-3 bg-background rounded-md text-sm max-h-60 overflow-y-auto whitespace-pre-wrap'>
                        {article.content.substring(0, 1500)}
                        {article.content.length > 1500 && (
                          <span className='text-muted-foreground'>
                            ... [{article.content.length - 1500} more
                            characters]
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Hash */}
                  <div>
                    <span className='text-sm text-muted-foreground'>
                      Content Hash:
                    </span>
                    <p className='font-mono text-xs text-muted-foreground break-all'>
                      {article.content_hash}
                    </p>
                  </div>

                  {/* Metadata */}
                  {article.metadata &&
                    Object.keys(article.metadata).length > 0 && (
                      <div>
                        <span className='text-sm text-muted-foreground'>
                          Metadata:
                        </span>
                        <pre className='mt-1 p-3 bg-background rounded-md text-xs overflow-x-auto'>
                          {JSON.stringify(article.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          count={totalCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          next={next}
          previous={previous}
        />
      )}
    </div>
  );
}
