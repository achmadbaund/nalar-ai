"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  getProcessingLogs,
  deleteProcessingLog,
  type ProcessingLogsResponse,
} from "@/utils/api/printMediaApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProcessingLogsTab() {
  const [data, setData] = useState<ProcessingLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({
    created_at_from: "",
    created_at_to: "",
    level: "",
    ordering: "-created_at",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const lastToastRef = useRef<string | null>(null);
  const lastToastTimeRef = useRef<number>(0);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        ordering: filters.ordering,
      };

      if (filters.created_at_from) {
        // Filter logs created from this date
        params.created_at__gte = `${filters.created_at_from}T00:00:00Z`;
      }
      if (filters.created_at_to) {
        // Filter logs created until this date
        params.created_at__lte = `${filters.created_at_to}T23:59:59Z`;
      }
      if (filters.level) {
        params.level = filters.level;
      }

      const response = await getProcessingLogs(params);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch processing logs";
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
    fetchLogs();
  }, [page, pageSize, filters.ordering]);

  const handleApplyFilters = () => {
    // Validate date range
    if (filters.created_at_from && filters.created_at_to) {
      if (new Date(filters.created_at_from) > new Date(filters.created_at_to)) {
        toast.error("Tanggal 'Dari' tidak boleh lebih besar dari tanggal 'Sampai'");
        return;
      }
    }
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      created_at_from: "",
      created_at_to: "",
      level: "",
      ordering: "-created_at",
    });
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedIds(new Set(data.results.map((log) => log.id)));
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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this log?")) return;

    try {
      await deleteProcessingLog(id);
      toast.success("Log deleted successfully");
      fetchLogs();
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.message || "Failed to delete log");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} logs?`)) return;

    try {
      const promises = Array.from(selectedIds).map((id) => deleteProcessingLog(id));
      await Promise.all(promises);
      toast.success(`${selectedIds.size} logs deleted successfully`);
      setSelectedIds(new Set());
      fetchLogs();
    } catch (err: any) {
      toast.error("Failed to delete some logs");
    }
  };


  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Button onClick={fetchLogs} className="mt-4" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Bulk Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Processing Logs</h3>
        {selectedIds.size > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Bulk Actions ({selectedIds.size})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Dari Tanggal</label>
          <input
            type="date"
            value={filters.created_at_from}
            onChange={(e) => setFilters({ ...filters, created_at_from: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Sampai Tanggal</label>
          <input
            type="date"
            value={filters.created_at_to}
            onChange={(e) => setFilters({ ...filters, created_at_to: e.target.value })}
            min={filters.created_at_from || undefined}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Level</label>
          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleApplyFilters();
            }} 
            size="sm"
            disabled={loading}
            className="cursor-pointer"
          >
            Apply Filters
          </Button>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleResetFilters();
            }} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="cursor-pointer"
          >
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
              <th className="px-4 py-3 text-left text-sm font-medium">No</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Level</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Message</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created At</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.results.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No processing logs found
                </td>
              </tr>
            ) : (
              data?.results.map((log, index) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(log.id)}
                        onChange={(e) => handleSelectOne(log.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.level} type="log_level" />
                    </td>
                    <td className="px-4 py-3 text-sm">{log.message}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(log.id)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedRows.has(log.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(log.id) && (
                    <tr key={`${log.id}-details`}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="rounded-md bg-muted p-4">
                          <h4 className="mb-2 text-sm font-medium">Details</h4>
                          <pre className="overflow-x-auto text-xs">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
    </div>
  );
}

