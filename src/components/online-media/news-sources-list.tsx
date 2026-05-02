"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Loader2,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  Play,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  NewsSource,
  PaginatedResponse,
  TIER_COLORS,
  TIER_LABELS,
  NewsSourceFormData,
} from "@/types/online-media";
import { cn } from "@/lib/utils";
import NewsSourceForm from "./news-source-form";

interface NewsSourcesListProps {
  onSourceSelect?: (source: NewsSource) => void;
}

export default function NewsSourcesList({
  onSourceSelect,
}: NewsSourcesListProps) {
  const [sources, setSources] = useState<NewsSource[]>([]);
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
  const [tierFilter, setTierFilter] = useState<number | "">("");
  const [activeFilter, setActiveFilter] = useState<boolean | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Actions state
  const [crawlingSourceId, setCrawlingSourceId] = useState<number | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<number | null>(null);

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("page_size", pageSize.toString());

      if (search) params.set("search", search);
      if (tierFilter !== "") params.set("tier", tierFilter.toString());
      if (activeFilter !== "") params.set("active", activeFilter.toString());
      if (categoryFilter) params.set("category", categoryFilter);

      const response = await fetch(
        `/api/online-media/sources?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sources");
      }

      // Handle paginated response
      if (data.results) {
        setSources(data.results);
        setTotalCount(data.count);
        setNext(data.next);
        setPrevious(data.previous);
      } else {
        // Handle non-paginated response (array)
        setSources(Array.isArray(data) ? data : []);
        setTotalCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sources");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, tierFilter, activeFilter, categoryFilter]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSources();
  };

  const handleCreateSource = async (data: NewsSourceFormData) => {
    setFormLoading(true);
    try {
      const response = await fetch("/api/online-media/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create source");
      }

      setShowForm(false);
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create source");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSource = async (data: NewsSourceFormData) => {
    if (!editingSource) return;
    setFormLoading(true);
    try {
      const response = await fetch(
        `/api/online-media/sources/${editingSource.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update source");
      }

      setEditingSource(null);
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update source");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSource = async (source: NewsSource) => {
    if (!confirm(`Are you sure you want to delete "${source.name}"?`)) return;
    setDeletingSourceId(source.id);
    try {
      const response = await fetch(`/api/online-media/sources/${source.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete source");
      }

      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete source");
    } finally {
      setDeletingSourceId(null);
    }
  };

  const handleTriggerCrawl = async (source: NewsSource) => {
    setCrawlingSourceId(source.id);
    try {
      const response = await fetch(
        `/api/online-media/sources/${source.id}/crawl`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger crawl");
      }

      // Show success notification (you can replace with toast)
      alert(`Crawl task queued for ${source.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger crawl");
    } finally {
      setCrawlingSourceId(null);
    }
  };

  const handleToggleActive = async (source: NewsSource) => {
    try {
      const response = await fetch(`/api/online-media/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !source.active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update source");
      }

      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update source");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    const cleaned = url.replace(/^https?:\/\/(www\.)?/, "");
    return cleaned.length > maxLength
      ? cleaned.substring(0, maxLength) + "..."
      : cleaned;
  };

  return (
    <div className='space-y-4'>
      {/* Header Actions */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-lg font-semibold'>News Sources</h2>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchSources}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button size='sm' onClick={() => setShowForm(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Add Source
          </Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showForm || editingSource) && (
        <div className='border rounded-lg p-4 bg-muted/50'>
          <h3 className='text-md font-medium mb-4'>
            {editingSource ? "Edit News Source" : "Add New News Source"}
          </h3>
          <NewsSourceForm
            initialData={
              editingSource
                ? {
                    ...editingSource,
                    category: editingSource.category || "",
                  }
                : undefined
            }
            onSubmit={editingSource ? handleUpdateSource : handleCreateSource}
            onCancel={() => {
              setShowForm(false);
              setEditingSource(null);
            }}
            loading={formLoading}
            isEdit={!!editingSource}
          />
        </div>
      )}

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
              placeholder='Search by name or URL...'
              className='w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm'
            />
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Tier</label>
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(
                e.target.value === "" ? "" : Number(e.target.value)
              );
              setCurrentPage(1);
            }}
            className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
          >
            <option value=''>All Tiers</option>
            <option value='1'>Tier 1</option>
            <option value='2'>Tier 2</option>
            <option value='3'>Tier 3</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Status</label>
          <select
            value={activeFilter === "" ? "" : activeFilter.toString()}
            onChange={(e) => {
              setActiveFilter(
                e.target.value === "" ? "" : e.target.value === "true"
              );
              setCurrentPage(1);
            }}
            className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
          >
            <option value=''>All Status</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>
        <Button type='submit' variant='secondary'>
          <Search className='h-4 w-4 mr-2' />
          Search
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <div className='bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm'>
          {error}
          <button className='ml-2 underline' onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : sources.length === 0 ? (
        <div className='text-center py-12 text-muted-foreground'>
          No news sources found. Add one to get started!
        </div>
      ) : (
        <div className='border rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/50'>
                <tr>
                  <th className='px-4 py-3 text-left font-medium'>Name</th>
                  <th className='px-4 py-3 text-left font-medium'>URL</th>
                  <th className='px-4 py-3 text-left font-medium'>Tier</th>
                  <th className='px-4 py-3 text-left font-medium'>Category</th>
                  <th className='px-4 py-3 text-left font-medium'>Status</th>
                  <th className='px-4 py-3 text-left font-medium'>
                    Success Rate
                  </th>
                  <th className='px-4 py-3 text-left font-medium'>
                    Last Crawled
                  </th>
                  <th className='px-4 py-3 text-right font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {sources.map((source) => (
                  <>
                    <tr
                      key={source.id}
                      className='hover:bg-muted/30 cursor-pointer'
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === source.id ? null : source.id
                        )
                      }
                    >
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2'>
                          {expandedRow === source.id ? (
                            <ChevronUp className='h-4 w-4 text-muted-foreground' />
                          ) : (
                            <ChevronDown className='h-4 w-4 text-muted-foreground' />
                          )}
                          <span className='font-medium'>{source.name}</span>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <a
                          href={source.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1'
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncateUrl(source.url)}
                          <ExternalLink className='h-3 w-3' />
                        </a>
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            TIER_COLORS[source.tier]
                          )}
                        >
                          Tier {source.tier}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-muted-foreground'>
                        {source.category || "-"}
                      </td>
                      <td className='px-4 py-3'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(source);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                            source.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200"
                          )}
                        >
                          {source.active ? (
                            <>
                              <Check className='h-3 w-3' /> Active
                            </>
                          ) : (
                            <>
                              <X className='h-3 w-3' /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={cn(
                            "font-medium",
                            Number(source.success_rate) >= 80
                              ? "text-green-600 dark:text-green-400"
                              : Number(source.success_rate) >= 50
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {Number(source.success_rate).toFixed(1)}%
                        </span>
                      </td>
                      <td className='px-4 py-3 text-muted-foreground text-xs'>
                        {formatDate(source.last_crawled_at)}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerCrawl(source);
                            }}
                            disabled={crawlingSourceId === source.id}
                            title='Trigger Crawl'
                          >
                            {crawlingSourceId === source.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <Play className='h-4 w-4' />
                            )}
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSource(source);
                            }}
                            title='Edit'
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-red-600 hover:text-red-700'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSource(source);
                            }}
                            disabled={deletingSourceId === source.id}
                            title='Delete'
                          >
                            {deletingSourceId === source.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <Trash2 className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Details */}
                    {expandedRow === source.id && (
                      <tr key={`${source.id}-details`}>
                        <td colSpan={8} className='px-4 py-4 bg-muted/20'>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                            <div>
                              <span className='text-muted-foreground'>
                                Extraction Strategy:
                              </span>
                              <p className='font-medium capitalize'>
                                {source.extraction_strategy}
                              </p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>
                                LLM Fallback:
                              </span>
                              <p className='font-medium'>
                                {source.use_llm_fallback
                                  ? "Enabled"
                                  : "Disabled"}
                              </p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>
                                Created:
                              </span>
                              <p className='font-medium text-xs'>
                                {formatDate(source.created_at)}
                              </p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>
                                Updated:
                              </span>
                              <p className='font-medium text-xs'>
                                {formatDate(source.updated_at)}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
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
