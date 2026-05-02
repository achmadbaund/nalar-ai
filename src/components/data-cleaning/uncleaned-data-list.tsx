"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
    Loader2,
    Search,
    RefreshCw,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Filter,
    Trash2,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataSourceType, UncleanedRecord } from "@/types/data-cleaning";
import { RawArticle } from "@/types/online-media";

interface UncleanedDataListProps {
    onCleanSelected: (selectedItems: UncleanedRecord[]) => void;
}

export default function UncleanedDataList({
    onCleanSelected,
}: UncleanedDataListProps) {
    const [activeSource, setActiveSource] =
        useState<DataSourceType>("online-media");
    const [data, setData] = useState<UncleanedRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
        new Set()
    );
    const [expandedRow, setExpandedRow] = useState<string | number | null>(null);

    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setData([]);
        setSelectedIds(new Set());

        try {
            const params = new URLSearchParams();
            params.set("page", currentPage.toString());
            params.set("page_size", pageSize.toString());

            let url = "";

            switch (activeSource) {
                case "online-media":
                    url = `/api/online-media/articles?${params.toString()}`;
                    break;
                case "social-media":
                    url = `/api/posts?limit=${pageSize}&offset=${(currentPage - 1) * pageSize}`;
                    break;
                case "print-media":
                    url = `/api/print-media-ocr/articles?${params.toString()}`;
                    break;
                case "broadcast-media":
                    url = `/api/broadcast-media/transcripts?${params.toString()}`;
                    break;
            }

            console.log(`Fetching from: ${url}`);
            const response = await fetch(url);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch data");
            }

            let normalizedData: UncleanedRecord[] = [];
            let count = 0;

            if (activeSource === "online-media") {
                const results = result.results || [];
                count = result.count || 0;
                setNext(result.next);
                setPrevious(result.previous);

                normalizedData = results.map((item: RawArticle) => ({
                    id: item.id,
                    source_type: "online-media",
                    source_name: item.source_name || `Source #${item.source}`,
                    title: item.title,
                    content: item.content,
                    url: item.url,
                    published_at: item.published_at,
                    crawled_at: item.crawled_at,
                    original_data: item,
                }));
            } else if (activeSource === "social-media") {
                const results = Array.isArray(result) ? result : result.items || [];
                count = result.total || result.count || results.length;
                setNext(results.length === pageSize ? "true" : null);
                setPrevious(currentPage > 1 ? "true" : null);

                normalizedData = results.map((item: any) => ({
                    id: item.id || item._id || Math.random(),
                    source_type: "social-media",
                    source_name: item.platform || item.source || "Social Media",
                    title: null,
                    content: item.text || item.caption || item.full_text,
                    url: item.url || item.permalink,
                    published_at: item.posted_at || item.created_at,
                    crawled_at: item.timestamp || new Date().toISOString(),
                    original_data: item,
                }));
            } else if (activeSource === "print-media") {
                const results = result.results || [];
                count = result.count || 0;
                setNext(result.next);
                setPrevious(result.previous);

                normalizedData = results.map((item: any) => ({
                    id: item.id,
                    source_type: "print-media",
                    source_name: item.publication_name || "Print Media",
                    title: item.title,
                    content: item.ocr_text || item.content,
                    url: null,
                    published_at: item.published_date,
                    crawled_at: item.created_at,
                    original_data: item,
                }));
            } else if (activeSource === "broadcast-media") {
                const results = result.results || [];
                count = result.count || 0;
                setNext(result.next);
                setPrevious(result.previous);

                normalizedData = results.map((item: any) => ({
                    id: item.id,
                    source_type: "broadcast-media",
                    source_name: item.channel_name || "Broadcast Channel",
                    title: item.program_name || `Transcript #${item.id}`,
                    content: item.transcript_text || item.content,
                    url: item.audio_url || item.video_url,
                    published_at: item.broadcast_date,
                    crawled_at: item.created_at,
                    original_data: item,
                }));
            }

            // Filter out cleaned items
            if (normalizedData.length > 0) {
                try {
                    const ids = normalizedData.map(r => String(r.id));
                    const statusRes = await fetch('/api/cleaning/check-cleaned-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids, source_type: activeSource })
                    });

                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        const cleanedIds = new Set(statusData.cleaned_ids || []);

                        // Mark or filter? User request says "should not show again"
                        normalizedData = normalizedData.filter(r => !cleanedIds.has(String(r.id)));

                        // Adjust count if necessary (this is approximate since we only filter current page)
                        // If we aggressively filter, the page size might shrink. 
                        // Ideal solution would be backend filtering, but for now this client-side filter is what was planned.
                        if (normalizedData.length < result.results?.length) {
                            // count might need adjustment if count was based on fetching everything
                        }
                    }
                } catch (statusError) {
                    console.error("Failed to check cleaned status", statusError);
                }
            }

            setData(normalizedData);
            setTotalCount(count);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [activeSource, currentPage, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle source change
    const handleSourceChange = (source: DataSourceType) => {
        setActiveSource(source);
        setCurrentPage(1);
        setSelectedIds(new Set());
    };

    // Selection Logic
    const toggleSelection = (id: string | number) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const toggleAll = () => {
        if (selectedIds.size === data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.map((item) => item.id)));
        }
    };

    const handleCleanSelected = () => {
        const selectedItems = data.filter((item) => selectedIds.has(item.id));
        onCleanSelected(selectedItems);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className='space-y-4'>
            {/* Controls Header */}
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-muted/20 p-4 rounded-lg border'>
                <div className='flex gap-2 overflow-x-auto pb-1 sm:pb-0'>
                    <Button
                        variant={activeSource === "online-media" ? "default" : "outline"}
                        size='sm'
                        onClick={() => handleSourceChange("online-media")}
                    >
                        Online News
                    </Button>
                    <Button
                        variant={activeSource === "social-media" ? "default" : "outline"}
                        size='sm'
                        onClick={() => handleSourceChange("social-media")}
                    >
                        Social Media
                    </Button>
                    <Button
                        variant={activeSource === "print-media" ? "default" : "outline"}
                        size='sm'
                        onClick={() => handleSourceChange("print-media")}
                    >
                        Print Media
                    </Button>
                    <Button
                        variant={activeSource === "broadcast-media" ? "default" : "outline"}
                        size='sm'
                        onClick={() => handleSourceChange("broadcast-media")}
                    >
                        Broadcast
                    </Button>
                </div>

                <div className='flex gap-2 items-center'>
                    <Button
                        variant='outline'
                        size='icon'
                        onClick={fetchData}
                        title='Refresh'
                        disabled={loading}
                    >
                        <RefreshCw
                            className={cn("h-4 w-4", loading && "animate-spin")}
                        />
                    </Button>
                </div>
            </div>

            {/* Action Bar */}
            {selectedIds.size > 0 && (
                <div className='flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-lg animate-in fade-in slide-in-from-top-2'>
                    <div className='text-sm font-medium text-primary'>
                        {selectedIds.size} items selected
                    </div>
                    <Button onClick={handleCleanSelected} size='sm' className='gap-2'>
                        <Sparkles className='h-4 w-4' />
                        Clean Selected
                    </Button>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className='bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-red-500' />
                    <p className='text-sm'>{error}</p>
                </div>
            )}

            {/* Table Content */}
            {loading ? (
                <div className='flex flex-col items-center justify-center py-20 gap-3'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                    <p className='text-sm text-muted-foreground'>Fetching data...</p>
                </div>
            ) : data.length === 0 ? (
                <div className='text-center py-20 border rounded-lg border-dashed text-muted-foreground'>
                    No uncleaned data found for this source.
                </div>
            ) : (
                <div className='border rounded-lg overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead className='bg-muted/50'>
                                <tr>
                                    <th className='w-12 px-4 py-3'>
                                        <input
                                            type='checkbox'
                                            checked={selectedIds.size === data.length && data.length > 0}
                                            onChange={toggleAll}
                                            className='rounded border-gray-300'
                                        />
                                    </th>
                                    <th className='px-4 py-3 text-left font-medium'>Title / Content</th>
                                    <th className='px-4 py-3 text-left font-medium'>Source</th>
                                    <th className='px-4 py-3 text-left font-medium'>Date</th>
                                    <th className='w-12 px-4 py-3'></th>
                                </tr>
                            </thead>
                            <tbody className='divide-y'>
                                {data.map((item) => (
                                    <React.Fragment key={item.id}>
                                        <tr
                                            className={cn(
                                                "group hover:bg-muted/30 transition-colors cursor-pointer",
                                                selectedIds.has(item.id) && "bg-muted/30"
                                            )}
                                            onClick={() => toggleSelection(item.id)}
                                        >
                                            <td className='px-4 py-3'>
                                                <input
                                                    type='checkbox'
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelection(item.id)}
                                                    className='rounded border-gray-300'
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            <td className='px-4 py-3'>
                                                <div className='flex flex-col gap-1 max-w-xl'>
                                                    <span className='font-medium line-clamp-1'>
                                                        {item.title || "No Title"}
                                                    </span>
                                                    <span className='text-xs text-muted-foreground line-clamp-2'>
                                                        {item.content || "No content preview available"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='px-4 py-3'>
                                                <span className='inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap'>
                                                    {item.source_name}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 whitespace-nowrap text-muted-foreground'>
                                                {formatDate(item.published_at || item.crawled_at)}
                                            </td>
                                            <td className='px-4 py-3'>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-8 w-8'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedRow(
                                                            expandedRow === item.id ? null : item.id
                                                        );
                                                    }}
                                                >
                                                    {expandedRow === item.id ? (
                                                        <ChevronUp className='h-4 w-4' />
                                                    ) : (
                                                        <ChevronDown className='h-4 w-4' />
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                        {expandedRow === item.id && (
                                            <tr className='bg-muted/10'>
                                                <td colSpan={5} className='p-4'>
                                                    <div className='space-y-4'>
                                                        <div className='grid grid-cols-2 gap-4 text-xs text-muted-foreground'>
                                                            <div>
                                                                <span className='font-semibold'>ID:</span> {item.id}
                                                            </div>
                                                            <div>
                                                                <span className='font-semibold'>Crawled:</span>{" "}
                                                                {formatDate(item.crawled_at)}
                                                            </div>
                                                            {item.url && (
                                                                <div className='col-span-2'>
                                                                    <span className='font-semibold'>URL:</span>{" "}
                                                                    <a
                                                                        href={item.url}
                                                                        target='_blank'
                                                                        rel='noreferrer'
                                                                        className='text-blue-600 hover:underline'
                                                                    >
                                                                        {item.url}
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className='bg-background border rounded-md p-3 text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap text-muted-foreground'>
                                                            {JSON.stringify(item.original_data, null, 2)}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
