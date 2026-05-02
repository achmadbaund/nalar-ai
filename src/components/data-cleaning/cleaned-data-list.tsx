"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    FileText,
    CheckCircle,
    Sparkles,
    Tag,
    Globe,
    Copy,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CleanedDataRecord, UncleanedRecord } from "@/types/data-cleaning";

interface CleanedDataListProps {
    onCleanSelected?: (selectedItems: UncleanedRecord[]) => void;
    componentId?: string;
}

export default function CleanedDataList({ onCleanSelected, componentId }: CleanedDataListProps) {
    const [data, setData] = useState<CleanedDataRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Expanded row
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        // Clear selection on page change or refresh to avoid issues
        setSelectedIds(new Set());

        try {
            const params = new URLSearchParams();
            params.set("page", currentPage.toString());
            params.set("limit", pageSize.toString());
            params.set("offset", ((currentPage - 1) * pageSize).toString());

            if (componentId) {
                params.set("component_id", componentId);
            }

            const response = await fetch(
                `/api/cleaning/cleaned-data?${params.toString()}`
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch cleaned data");
            }

            // Handle response structure (it matches the one we saw earlier)
            const rawResults = result.data || [];

            // Map API response to CleanedDataRecord
            const mappedResults: CleanedDataRecord[] = rawResults.map((item: any) => ({
                id: item.cleaned_id ? String(item.cleaned_id) : String(item.id),
                original_id: item.id,
                title: item.title || "No Title",
                source_type: item.content_type || item.source_type || 'unknown',
                cleaned_content: item.content || "",
                cleaning_pipeline_id: "default",
                cleaned_at: item.date || new Date().toISOString(),
                quality_score: item.cleaning_metadata?.metrics?.percentage_reduced
                    ? (item.cleaning_metadata.metrics.percentage_reduced / 100)
                    : null,
                metadata: item.cleaning_metadata || {}
            }));

            setData(mappedResults);
            setTotalCount(result.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, componentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    // Selection Logic
    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const toggleAll = () => {
        if (selectedIds.size === data.length && data.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.map((item) => item.id)));
        }
    };

    const handleProcessSelected = () => {
        if (!onCleanSelected) return;

        const selectedItems = data
            .filter((item) => selectedIds.has(item.id))
            .map(item => ({
                // Map CleanedDataRecord to UncleanedRecord for the processor
                id: item.id,
                source_type: item.source_type,
                title: item.title,
                content: item.cleaned_content, // Use cleaned_content as the content to process
                original_data: item
            } as UncleanedRecord));

        onCleanSelected(selectedItems);
    };

    const handleDelete = async (ids: string[]) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} items?`)) return;

        try {
            const response = await fetch('/api/cleaning/cleaned-data/delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Server error: ${response.status}`);
            }

            // Refresh data
            fetchData();
            // Clear selection
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Delete error:", err);
            alert(err instanceof Error ? err.message : 'Error deleting items');
        }
    };

    // ... later in the file ...
    <th className='w-[100px] px-4 py-3 text-left font-medium'>Actions</th>

    // Helper to render processor results based on metadata
    const renderProcessResult = (item: CleanedDataRecord) => {
        const metadata = item.metadata;
        const metrics = metadata?.metrics || {};

        // Detect operation type from metrics or metadata keys
        if (metadata?.results?.language || metrics?.language_code) {
            const lang = metadata?.results?.language || metrics?.language_code;
            const conf = metadata?.results?.confidence || metrics?.confidence;
            return (
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="font-mono text-xs">{lang?.toUpperCase()}</span>
                    {conf && <span className="text-xs text-muted-foreground">({(conf * 100).toFixed(0)}%)</span>}
                </div>
            );
        }

        if (metadata?.results?.entities || metrics?.entities) {
            const entities = metadata?.results?.entities || metrics?.entities || {};
            const entityCount = Object.values(entities).flat().length;
            const topEntity = Object.values(entities).flat()[0] as string;

            return (
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-500" />
                    <span className="text-xs">{entityCount} Entities</span>
                    {topEntity && <span className="text-xs text-muted-foreground truncate max-w-[100px]">- {topEntity}</span>}
                </div>
            );
        }

        if (metadata?.results?.keywords) {
            return (
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-500" />
                    <span className="text-xs">{metadata.results.keywords.length} Keywords</span>
                </div>
            );
        }

        // Default or Translation (content is the result)
        if (item.cleaned_content && componentId === '2.2') {
            return (
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs truncate max-w-[200px]">{item.cleaned_content.substring(0, 50)}...</span>
                </div>
            );
        }

        // Fallback for Component 2.1 (Quality Score)
        if (item.quality_score !== null) {
            return (
                <div className='flex items-center gap-1'>
                    <div className='h-2 w-16 bg-muted rounded-full overflow-hidden'>
                        <div
                            className={cn(
                                "h-full rounded-full",
                                item.quality_score > 0.8
                                    ? "bg-green-500"
                                    : item.quality_score > 0.5
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                            )}
                            style={{ width: `${item.quality_score * 100}%` }}
                        />
                    </div>
                    <span className='text-xs'>
                        {(item.quality_score * 100).toFixed(0)}%
                    </span>
                </div>
            );
        }

        return <span className='text-muted-foreground'>-</span>;
    };

    return (
        <div className='space-y-4'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium'>
                    {componentId === '2.2' ? 'Processed Results' : 'Cleaned Data Repository'}
                </h3>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={fetchData}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Action Bar */}
            {selectedIds.size > 0 && onCleanSelected && (
                <div className='flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-lg animate-in fade-in slide-in-from-top-2'>
                    <div className='text-sm font-medium text-primary'>
                        {selectedIds.size} items selected
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleDelete(Array.from(selectedIds))}
                            size='sm'
                            variant="destructive"
                            className='gap-2'
                        >
                            <Trash2 className='h-4 w-4' />
                            Delete
                        </Button>
                        <Button onClick={handleProcessSelected} size='sm' className='gap-2'>
                            <Sparkles className='h-4 w-4' />
                            Process Selected
                        </Button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className='bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg'>
                    {error}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className='flex items-center justify-center py-20'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : data.length === 0 ? (
                <div className='text-center py-20 border rounded-lg border-dashed text-muted-foreground'>
                    No data found.
                </div>
            ) : (
                <div className='border rounded-lg overflow-hidden'>
                    <table className='w-full text-sm table-fixed'>
                        <thead className='bg-muted/50'>
                            <tr>
                                {onCleanSelected && (
                                    <th className='w-12 px-4 py-3'>
                                        <input
                                            type='checkbox'
                                            checked={selectedIds.size === data.length && data.length > 0}
                                            onChange={toggleAll}
                                            className='rounded border-gray-300'
                                        />
                                    </th>
                                )}
                                <th className='w-24 px-4 py-3 text-left font-medium'>Original ID</th>
                                <th className='w-1/4 px-4 py-3 text-left font-medium'>Title</th>
                                <th className='w-32 px-4 py-3 text-left font-medium'>Source Type</th>
                                <th className='w-32 px-4 py-3 text-left font-medium'>Date</th>
                                <th className='px-4 py-3 text-left font-medium'>
                                    {componentId === '2.2' ? 'Process Result' : 'Quality'}
                                </th>
                                <th className='w-[100px] px-4 py-3 text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y'>
                            {data.map((item) => (
                                <Fragment key={item.id}>
                                    <tr
                                        className={cn(
                                            "group hover:bg-muted/30 transition-colors cursor-pointer",
                                            selectedIds.has(item.id) && "bg-muted/30"
                                        )}
                                        onClick={() => onCleanSelected && toggleSelection(item.id)}
                                    >
                                        {onCleanSelected && (
                                            <td className='px-4 py-3'>
                                                <input
                                                    type='checkbox'
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelection(item.id)}
                                                    className='rounded border-gray-300'
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                        )}
                                        <td className='px-4 py-3 font-mono text-xs truncate'>
                                            {item.original_id}
                                        </td>
                                        <td className='px-4 py-3 font-medium truncate' title={item.title}>
                                            {item.title}
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'>
                                                {item.source_type}
                                            </span>
                                        </td>

                                        <td className='px-4 py-3 text-muted-foreground truncate'>
                                            {formatDate(item.cleaned_at)}
                                        </td>
                                        <td className='px-4 py-3'>
                                            {renderProcessResult(item)}
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete([item.id]);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-8 w-8'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedRow(expandedRow === item.id ? null : item.id);
                                                    }}
                                                >
                                                    {expandedRow === item.id ? (
                                                        <ChevronUp className='h-4 w-4' />
                                                    ) : (
                                                        <ChevronDown className='h-4 w-4' />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRow === item.id && (
                                        <tr className='bg-muted/10'>
                                            <td colSpan={onCleanSelected ? 7 : 6} className='p-4'>
                                                <div className='space-y-4'>
                                                    {componentId === '2.2' ? (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                                                    Input Text
                                                                </span>
                                                                <div className='mt-2 p-3 bg-background border rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto'>
                                                                    {item.title}
                                                                    {/* Note: Input text isn't strictly saved in CleanedArticle, usually original raw article has it. 
                                                                        CleanedArticle.cleaned_text is the Output. 
                                                                        We'll show Title or maybe fetch raw? For now Title + Raw Content if available.*/}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                                                    Process Output
                                                                </span>
                                                                <div className='mt-2 p-3 bg-background border rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto'>
                                                                    {item.cleaned_content}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                                                Cleaned Content
                                                            </span>
                                                            <div className='mt-2 p-3 bg-background border rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto'>
                                                                {item.cleaned_content}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                                                        <div>
                                                            <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                                                Metadata / Results
                                                            </span>
                                                            <pre className='mt-2 p-3 bg-background border rounded-md text-xs overflow-x-auto'>
                                                                {JSON.stringify(item.metadata, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
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
                />
            )}
        </div>
    );
}
