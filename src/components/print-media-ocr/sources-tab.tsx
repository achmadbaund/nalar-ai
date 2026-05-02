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
import {
  Loader2,
  MoreVertical,
  Eye,
  Play,
  RotateCw,
  Download,
  Trash2,
  X,
} from "lucide-react";
import {
  getSources,
  processOCR,
  deleteSource,
  type SourcesResponse,
  type Source,
} from "@/utils/api/printMediaApi";
import { toast } from "sonner";

export default function SourcesTab() {
  const [data, setData] = useState<SourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastToastRef = useRef<string | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({
    ocr_status: "",
    publication_date: "",
    search: "",
    ordering: "-uploaded_at",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewingSource, setViewingSource] = useState<Source | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchSources = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
        ordering: filters.ordering,
      };

      if (filters.ocr_status) {
        params.ocr_status = filters.ocr_status;
      }
      if (filters.publication_date) {
        params.publication_date = filters.publication_date;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await getSources(params);
      setData(response);
      
      // Update processingIds berdasarkan status dari response
      // Dan clear error message untuk sources yang sudah completed
      setProcessingIds((prev) => {
        const newProcessingIds = new Set<number>();
        response.results.forEach((source) => {
          if (source.ocr_status === "processing") {
            newProcessingIds.add(source.id);
          } else {
            // Hapus dari processingIds jika sudah tidak processing
            prev.delete(source.id);
          }
        });
        return newProcessingIds;
      });
      
      // Clear error message di response data untuk sources yang sudah completed
      // Backend sudah auto-clear, tapi kita juga clear di UI untuk konsistensi
      const cleanedResults = response.results.map((source) => {
        if (source.ocr_status === "completed" && source.ocr_error_message) {
          return { ...source, ocr_error_message: null };
        }
        return source;
      });
      
      // Update data dengan cleaned results
      setData({
        ...response,
        results: cleanedResults,
      });
      
      // Update viewingSource jika sedang dibuka dan status sudah completed
      if (viewingSource) {
        const updatedSource = cleanedResults.find((s) => s.id === viewingSource.id);
        if (updatedSource) {
          setViewingSource(updatedSource);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch sources";
      setError(errorMessage);
      
      if (!silent) {
        // Prevent duplicate toast within 2 seconds
        const now = Date.now();
        if (lastToastRef.current !== errorMessage || now - lastToastTimeRef.current > 2000) {
          toast.error(errorMessage);
          lastToastRef.current = errorMessage;
          lastToastTimeRef.current = now;
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSources();
  }, [page, pageSize, filters.ordering, filters.ocr_status, filters.publication_date, filters.search]);

  // Listen for upload success event to refresh list
  useEffect(() => {
    const handleUploadSuccess = () => {
      fetchSources(true); // Silent refresh
    };

    window.addEventListener("source-upload-success", handleUploadSuccess);
    return () => {
      window.removeEventListener("source-upload-success", handleUploadSuccess);
    };
  }, []);

  // Auto-refresh jika ada source yang sedang diproses
  useEffect(() => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Jika ada source yang sedang diproses, mulai polling setiap 3 detik
    if (processingIds.size > 0) {
      const interval = setInterval(() => {
        fetchSources(true); // Silent refresh untuk polling
      }, 3000); // Refresh setiap 3 detik
      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else {
      setPollingInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingIds.size]);

  // Handle ESC key to close View Source Modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewingSource) {
        setViewingSource(null);
      }
    };

    if (viewingSource) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [viewingSource]);

  const handleResetFilters = () => {
    setFilters({
      ocr_status: "",
      publication_date: "",
      search: "",
      ordering: "-uploaded_at",
    });
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedIds(new Set(data.results.map((s) => s.id)));
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

  const handleProcessOCR = async (id: number, forceReprocess = false) => {
    try {
      // Tambahkan ke processingIds untuk tracking SEBELUM trigger OCR
      // Ini akan langsung memulai polling dan menampilkan status "processing"
      setProcessingIds((prev) => new Set(prev).add(id));
      
      // Optimistically update status di UI menjadi "processing" untuk source ini
      if (data) {
        setData({
          ...data,
          results: data.results.map((source) =>
            source.id === id
              ? { ...source, ocr_status: "processing" as const, ocr_error_message: null }
              : source
          ),
        });
      }
      
      await processOCR(id, forceReprocess);
      
      // Pesan success berbeda untuk reprocess vs process biasa
      if (forceReprocess) {
        toast.success("OCR reprocessing started. Error message cleared.");
      } else {
        toast.success("OCR processing started");
      }
      
      // Refresh data langsung setelah trigger OCR untuk mendapatkan status terbaru dari backend
      await fetchSources(true); // Refresh langsung (silent)
      
      // Refresh lagi setelah delay kecil untuk memastikan backend sudah update status
      setTimeout(() => {
        fetchSources(true); // Silent refresh setelah 500ms
      }, 500);
      
      setTimeout(() => {
        fetchSources(true); // Silent refresh setelah 1.5 detik
      }, 1500);
      
      // Polling sudah otomatis dimulai karena processingIds sudah diupdate di awal
      // Polling akan terus berjalan setiap 3 detik sampai status bukan "processing"
    } catch (err: any) {
      // Hapus dari processingIds jika error
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Revert optimistic update jika error - refresh untuk mendapatkan status yang benar
      fetchSources();
      
      toast.error(err.message || "Failed to process OCR");
    }
  };

  const handleBulkProcessOCR = async () => {
    if (selectedIds.size === 0) return;

    try {
      // Tambahkan semua ke processingIds
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        selectedIds.forEach((id) => newSet.add(id));
        return newSet;
      });

      const promises = Array.from(selectedIds).map((id) => processOCR(id, false));
      await Promise.all(promises);
      toast.success(`${selectedIds.size} OCR processes started`);
      setSelectedIds(new Set());
      
      // Refresh data setelah trigger OCR
      await fetchSources();
      
      // Polling akan otomatis dimulai karena processingIds sudah diupdate
    } catch (err: any) {
      // Hapus yang error dari processingIds
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        selectedIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
      toast.error("Failed to process some sources");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this source?")) return;

    try {
      await deleteSource(id);
      toast.success("Source deleted successfully");
      fetchSources();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete source");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} sources?`)) return;

    try {
      const promises = Array.from(selectedIds).map((id) => deleteSource(id));
      await Promise.all(promises);
      toast.success(`${selectedIds.size} sources deleted successfully`);
      setSelectedIds(new Set());
      fetchSources();
    } catch (err: any) {
      toast.error("Failed to delete some sources");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
        <Button onClick={() => fetchSources()} className="mt-4" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sources</h3>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({selectedIds.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleBulkProcessOCR}>
                  <Play className="mr-2 h-4 w-4" />
                  Process OCR Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">OCR Status</label>
          <select
            value={filters.ocr_status}
            onChange={(e) => setFilters({ ...filters, ocr_status: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Publication Date</label>
          <input
            type="date"
            value={filters.publication_date}
            onChange={(e) => setFilters({ ...filters, publication_date: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search filename, newspaper"
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
              <th className="px-4 py-3 text-left text-sm font-medium">Filename</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Newspaper</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">File Size</th>
              <th className="px-4 py-3 text-left text-sm font-medium">OCR Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Pages</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Articles</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Uploaded</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.results.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No sources found
                </td>
              </tr>
            ) : (
              data?.results.map((source) => (
                <tr key={source.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(source.id)}
                      onChange={(e) => handleSelectOne(source.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewingSource(source)}
                      className="text-left text-sm font-medium hover:underline"
                    >
                      {source.original_filename}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">{source.newspaper_name}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(source.publication_date)}</td>
                  <td className="px-4 py-3 text-sm">{formatFileSize(source.file_size)}</td>
                  <td className="px-4 py-3">
                    {processingIds.has(source.id) && source.ocr_status !== "processing" ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status="processing" type="ocr_status" />
                        <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>
                      </div>
                    ) : (
                      <StatusBadge status={source.ocr_status} type="ocr_status" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{source.page_count || "-"}</td>
                  <td className="px-4 py-3 text-sm">{source.article_count || "-"}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(source.uploaded_at)}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingSource(source)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Detail
                        </DropdownMenuItem>
                        {source.ocr_status === "pending" && (
                          <DropdownMenuItem onClick={() => handleProcessOCR(source.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Process OCR
                          </DropdownMenuItem>
                        )}
                        {(source.ocr_status === "failed" || source.ocr_status === "completed") && (
                          <DropdownMenuItem onClick={() => handleProcessOCR(source.id, true)}>
                            <RotateCw className="mr-2 h-4 w-4" />
                            Reprocess OCR
                          </DropdownMenuItem>
                        )}
                        {source.file_url && (
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                const fileUrl = source.file_url!;
                                
                                // Build full download URL
                                let downloadUrl: string;
                                
                                if (fileUrl.startsWith('/')) {
                                  // Relative path dari API (contoh: "/api/v1/sources/1/download/")
                                  // Extract source ID dari path atau gunakan source.id
                                  const sourceId = fileUrl.match(/\/sources\/(\d+)\//)?.[1] || source.id;
                                  downloadUrl = `/api/print-media-ocr/sources/${sourceId}/download`;
                                } else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                                  // Absolute URL (presigned URL), langsung gunakan
                                  downloadUrl = fileUrl;
                                } else {
                                  // Fallback: gunakan API route Next.js
                                  downloadUrl = `/api/print-media-ocr/sources/${source.id}/download`;
                                }
                                
                                // Optional: Check file exists dengan HEAD request
                                try {
                                  const headResponse = await fetch(downloadUrl, { 
                                    method: 'HEAD',
                                    credentials: 'omit',
                                    mode: 'cors',
                                  });
                                  
                                  if (!headResponse.ok) {
                                    if (headResponse.status === 404) {
                                      toast.error("File tidak ditemukan. Silakan hubungi administrator.");
                                      return;
                                    }
                                    toast.error(`Gagal mengakses file: ${headResponse.statusText}`);
                                    return;
                                  }
                                } catch (headError) {
                                  // Jika HEAD request gagal, tetap coba download (mungkin CORS issue)
                                  console.warn("HEAD request failed, proceeding with download:", headError);
                                }
                                
                                // Download file dengan membuka di tab baru
                                window.open(downloadUrl, '_blank', 'noopener,noreferrer');
                              } catch (err: any) {
                                console.error("Error downloading file:", err);
                                toast.error("Failed to download file. Silakan coba lagi atau hubungi administrator.");
                              }
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download File
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(source.id)} className="text-destructive">
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

      {/* View Source Modal */}
      {viewingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-3xl rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{viewingSource.original_filename}</h2>
              <Button variant="ghost" size="icon" onClick={() => setViewingSource(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Newspaper</p>
                  <p className="text-sm">{viewingSource.newspaper_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Publication Date</p>
                  <p className="text-sm">{formatDate(viewingSource.publication_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">File Size</p>
                  <p className="text-sm">{formatFileSize(viewingSource.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">File Type</p>
                  <p className="text-sm">{viewingSource.file_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">OCR Status</p>
                  <StatusBadge status={viewingSource.ocr_status} type="ocr_status" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pages</p>
                  <p className="text-sm">{viewingSource.page_count || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Articles</p>
                  <p className="text-sm">{viewingSource.article_count || "-"}</p>
                </div>
                {viewingSource.processing_duration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processing Duration</p>
                    <p className="text-sm">{viewingSource.processing_duration.toFixed(2)}s</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uploaded At</p>
                  <p className="text-sm">{formatDate(viewingSource.uploaded_at)}</p>
                </div>
                {viewingSource.ocr_started_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">OCR Started</p>
                    <p className="text-sm">{formatDate(viewingSource.ocr_started_at)}</p>
                  </div>
                )}
                {viewingSource.ocr_completed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">OCR Completed</p>
                    <p className="text-sm">{formatDate(viewingSource.ocr_completed_at)}</p>
                  </div>
                )}
              </div>
              {/* Hanya tampilkan error message jika status failed, bukan completed */}
              {viewingSource.ocr_error_message && viewingSource.ocr_status === "failed" && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Error Message</p>
                  <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    {viewingSource.ocr_error_message}
                  </div>
                </div>
              )}
              {viewingSource.file_url && (
                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      try {
                        const fileUrl = viewingSource.file_url!;
                        
                        // Build full download URL
                        let downloadUrl: string;
                        
                        if (fileUrl.startsWith('/')) {
                          // Relative path dari API (contoh: "/api/v1/sources/1/download/")
                          // Extract source ID dari path atau gunakan viewingSource.id
                          const sourceId = fileUrl.match(/\/sources\/(\d+)\//)?.[1] || viewingSource.id;
                          downloadUrl = `/api/print-media-ocr/sources/${sourceId}/download`;
                        } else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                          // Absolute URL (presigned URL), langsung gunakan
                          downloadUrl = fileUrl;
                        } else {
                          // Fallback: gunakan API route Next.js
                          downloadUrl = `/api/print-media-ocr/sources/${viewingSource.id}/download`;
                        }
                        
                        // Optional: Check file exists dengan HEAD request
                        try {
                          const headResponse = await fetch(downloadUrl, { 
                            method: 'HEAD',
                            credentials: 'omit',
                            mode: 'cors',
                          });
                          
                          if (!headResponse.ok) {
                            if (headResponse.status === 404) {
                              toast.error("File tidak ditemukan. Silakan hubungi administrator.");
                              return;
                            }
                            toast.error(`Gagal mengakses file: ${headResponse.statusText}`);
                            return;
                          }
                        } catch (headError) {
                          // Jika HEAD request gagal, tetap coba download (mungkin CORS issue)
                          console.warn("HEAD request failed, proceeding with download:", headError);
                        }
                        
                        // Download file dengan membuka di tab baru
                        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
                      } catch (err: any) {
                        console.error("Error downloading file:", err);
                        toast.error("Failed to download file. Silakan coba lagi atau hubungi administrator.");
                      }
                    }}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

