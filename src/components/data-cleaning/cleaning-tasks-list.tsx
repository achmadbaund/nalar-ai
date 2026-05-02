"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
    Loader2,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CleaningTask } from "@/types/data-cleaning";

export default function CleaningTasksList() {
    const [tasks, setTasks] = useState<CleaningTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set("limit", pageSize.toString());
            // API might use offset or page, assuming limit/offset from previous analysis
            // But looking at cleaning-history route.ts, it calls public/cleaning/cleaning-history
            // Let's stick to simple fetch first

            const response = await fetch(
                `/api/cleaning/cleaning-history?${params.toString()}`
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch tasks");
            }

            setTasks(result || []);
            // If result is array, manual total count
            if (Array.isArray(result)) {
                setTotalCount(result.length);
            } else {
                setTasks(result.results || []);
                setTotalCount(result.count || 0);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this task record?")) return;

        try {
            const response = await fetch(
                `/api/cleaning/cleaning-history?id=${id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete task");
            }

            fetchData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete task");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className='h-4 w-4 text-green-500' />;
            case "failed":
                return <XCircle className='h-4 w-4 text-red-500' />;
            case "processing":
                return <Loader2 className='h-4 w-4 animate-spin text-blue-500' />;
            default:
                return <Clock className='h-4 w-4 text-muted-foreground' />;
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium'>Cleaning Tasks History</h3>
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

            {error && (
                <div className='bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg'>
                    {error}
                </div>
            )}

            {loading ? (
                <div className='flex items-center justify-center py-20'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
            ) : tasks.length === 0 ? (
                <div className='text-center py-20 border rounded-lg border-dashed text-muted-foreground'>
                    No cleaning tasks found.
                </div>
            ) : (
                <div className='border rounded-lg overflow-hidden'>
                    <table className='w-full text-sm'>
                        <thead className='bg-muted/50'>
                            <tr>
                                <th className='px-4 py-3 text-left font-medium'>Task ID</th>
                                <th className='px-4 py-3 text-left font-medium'>Status</th>
                                <th className='px-4 py-3 text-left font-medium'>Created At</th>
                                <th className='px-4 py-3 text-left font-medium'>Items</th>
                                <th className='px-4 py-3 text-left font-medium'>Success/Fail</th>
                                <th className='px-4 py-3 w-12'></th>
                            </tr>
                        </thead>
                        <tbody className='divide-y'>
                            {tasks.map((task) => (
                                <tr key={task.id} className='hover:bg-muted/30'>
                                    <td className='px-4 py-3 font-mono text-xs'>{task.id}</td>
                                    <td className='px-4 py-3'>
                                        <div className='flex items-center gap-2 capitalize'>
                                            {getStatusIcon(task.status)}
                                            {task.status}
                                        </div>
                                    </td>
                                    <td className='px-4 py-3 text-muted-foreground'>
                                        {formatDate(task.created_at)}
                                    </td>
                                    <td className='px-4 py-3'>{task.total_items}</td>
                                    <td className='px-4 py-3'>
                                        <span className='text-green-600'>{task.success_count}</span>
                                        {" / "}
                                        <span className='text-red-600'>{task.failed_count}</span>
                                    </td>
                                    <td className='px-4 py-3'>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50'
                                            onClick={() => handleDelete(task.id)}
                                        >
                                            <Trash2 className='h-4 w-4' />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
