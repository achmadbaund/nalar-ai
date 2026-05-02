"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Loader2,
  Search,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  FileAudio,
  FileVideo,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  BroadcastTranscript,
  BroadcastChannel,
  PaginatedResponse,
  STT_STATUS_COLORS,
  STT_STATUS_LABELS,
  FILE_TYPE_LABELS,
  SttStatus,
  formatDuration,
  formatFileSize,
  formatConfidence,
} from "@/types/broadcast-media";
import { cn } from "@/lib/utils";

interface TranscriptsListProps {
  onTranscriptSelect?: (transcript: BroadcastTranscript) => void;
}

export default function TranscriptsList({
  onTranscriptSelect,
}: TranscriptsListProps) {
  const [transcripts, setTranscripts] = useState<BroadcastTranscript[]>([]);
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SttStatus | "">("");
  const [channelFilter, setChannelFilter] = useState<number | "">("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");

  // Actions state
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // View transcript modal
  const [viewingTranscript, setViewingTranscript] =
    useState<BroadcastTranscript | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/broadcast-media/channels?page_size=100"
      );
      const data = await response.json();
      if (data.results) {
        setChannels(data.results);
      } else if (Array.isArray(data)) {
        setChannels(data);
      }
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    }
  }, []);

  const fetchTranscripts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("page_size", pageSize.toString());

      if (search) params.set("search", search);
      if (statusFilter) params.set("stt_status", statusFilter);
      if (channelFilter !== "") params.set("channel", channelFilter.toString());
      if (fileTypeFilter) params.set("file_type", fileTypeFilter);

      const response = await fetch(
        `/api/broadcast-media/transcripts?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transcripts");
      }

      if (data.results) {
        setTranscripts(data.results);
        setTotalCount(data.count);
      } else {
        setTranscripts(Array.isArray(data) ? data : []);
        setTotalCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transcripts"
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    search,
    statusFilter,
    channelFilter,
    fileTypeFilter,
  ]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTranscripts();
  };

  const handleProcessStt = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch(
        `/api/broadcast-media/transcripts/${id}/process-stt`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger STT processing");
      }

      fetchTranscripts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to trigger STT processing"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transcript?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/broadcast-media/transcripts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete transcript");
      }

      fetchTranscripts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transcript"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: SttStatus) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "processing":
        return Loader2;
      case "failed":
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setChannelFilter("");
    setFileTypeFilter("");
    setCurrentPage(1);
  };

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>Transcripts</h2>
          <p className='text-sm text-muted-foreground'>
            Manage broadcast transcripts and STT processing
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={fetchTranscripts}>
          <RefreshCw className='h-4 w-4 mr-1' />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className='bg-muted/50 rounded-lg p-4'>
        <form onSubmit={handleSearch} className='flex flex-wrap gap-3'>
          <div className='flex-1 min-w-[200px]'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search transcripts...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background'
              />
            </div>
          </div>

          <select
            value={channelFilter}
            onChange={(e) =>
              setChannelFilter(e.target.value ? Number(e.target.value) : "")
            }
            className='px-3 py-2 text-sm border rounded-md bg-background'
          >
            <option value=''>All Channels</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.channel_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SttStatus | "")}
            className='px-3 py-2 text-sm border rounded-md bg-background'
          >
            <option value=''>All Status</option>
            <option value='pending'>Pending</option>
            <option value='processing'>Processing</option>
            <option value='completed'>Completed</option>
            <option value='failed'>Failed</option>
          </select>

          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className='px-3 py-2 text-sm border rounded-md bg-background'
          >
            <option value=''>All Types</option>
            <option value='audio'>Audio</option>
            <option value='video'>Video</option>
          </select>

          <Button type='submit' size='sm'>
            Search
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={resetFilters}
          >
            Reset
          </Button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className='bg-destructive/10 text-destructive rounded-lg p-4'>
          <p className='text-sm'>{error}</p>
          <Button
            variant='ghost'
            size='sm'
            className='mt-2'
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : transcripts.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>No transcripts found</p>
        </div>
      ) : (
        <>
          {/* Transcripts Table */}
          <div className='border rounded-lg overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-muted/50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Broadcast
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Channel
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Duration
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Confidence
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {transcripts.map((transcript) => {
                  const StatusIcon = getStatusIcon(transcript.stt_status);
                  const isExpanded = expandedRow === transcript.id;

                  return (
                    <React.Fragment key={transcript.id}>
                      <tr
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
                          isExpanded && "bg-muted/20"
                        )}
                      >
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-3'>
                            <button
                              onClick={() =>
                                setExpandedRow(
                                  isExpanded ? null : transcript.id
                                )
                              }
                              className='p-1 hover:bg-muted rounded'
                            >
                              {isExpanded ? (
                                <ChevronUp className='h-4 w-4' />
                              ) : (
                                <ChevronDown className='h-4 w-4' />
                              )}
                            </button>
                            <div>
                              <p className='font-medium text-sm'>
                                {new Date(
                                  transcript.broadcast_date
                                ).toLocaleDateString()}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                {new Date(
                                  transcript.broadcast_date
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          {transcript.channel_name}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-1'>
                            {transcript.file_type === "video" ? (
                              <FileVideo className='h-4 w-4 text-muted-foreground' />
                            ) : (
                              <FileAudio className='h-4 w-4 text-muted-foreground' />
                            )}
                            <span className='text-sm'>
                              {FILE_TYPE_LABELS[transcript.file_type]}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                              STT_STATUS_COLORS[transcript.stt_status]
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "h-3 w-3",
                                transcript.stt_status === "processing" &&
                                  "animate-spin"
                              )}
                            />
                            {STT_STATUS_LABELS[transcript.stt_status]}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                            {formatDuration(transcript.duration)}
                          </div>
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          {formatConfidence(transcript.confidence_score)}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center justify-end gap-1'>
                            {transcript.stt_status === "completed" &&
                              transcript.transcript_text && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8'
                                  onClick={() =>
                                    setViewingTranscript(transcript)
                                  }
                                >
                                  <Eye className='h-4 w-4' />
                                </Button>
                              )}
                            {(transcript.stt_status === "pending" ||
                              transcript.stt_status === "failed") && (
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => handleProcessStt(transcript.id)}
                                disabled={processingId === transcript.id}
                              >
                                {processingId === transcript.id ? (
                                  <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                  <Play className='h-4 w-4' />
                                )}
                              </Button>
                            )}
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-destructive hover:text-destructive'
                              onClick={() => handleDelete(transcript.id)}
                              disabled={deletingId === transcript.id}
                            >
                              {deletingId === transcript.id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Trash2 className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className='px-4 py-4 bg-muted/10'>
                            <div className='space-y-4'>
                              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                                <div>
                                  <p className='text-xs text-muted-foreground'>
                                    File Size
                                  </p>
                                  <p className='text-sm font-medium'>
                                    {formatFileSize(transcript.file_size)}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-xs text-muted-foreground'>
                                    Word Error Rate
                                  </p>
                                  <p className='text-sm font-medium'>
                                    {transcript.word_error_rate
                                      ? `${(
                                          transcript.word_error_rate * 100
                                        ).toFixed(1)}%`
                                      : "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-xs text-muted-foreground'>
                                    Uploaded
                                  </p>
                                  <p className='text-sm font-medium'>
                                    {new Date(
                                      transcript.uploaded_at
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-xs text-muted-foreground'>
                                    Processed
                                  </p>
                                  <p className='text-sm font-medium'>
                                    {transcript.processed_at
                                      ? new Date(
                                          transcript.processed_at
                                        ).toLocaleString()
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                              {transcript.error_message && (
                                <div className='p-3 bg-destructive/10 rounded-md'>
                                  <p className='text-xs text-destructive font-medium'>
                                    Error Message
                                  </p>
                                  <p className='text-sm text-destructive'>
                                    {transcript.error_message}
                                  </p>
                                </div>
                              )}
                              {transcript.corrected_text && (
                                <div>
                                  <p className='text-xs text-muted-foreground mb-1'>
                                    Corrected Text (Preview)
                                  </p>
                                  <p className='text-sm bg-background p-3 rounded-md border max-h-32 overflow-y-auto'>
                                    {transcript.corrected_text.substring(
                                      0,
                                      500
                                    )}
                                    {transcript.corrected_text.length > 500 &&
                                      "..."}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              count={totalCount}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}

      {/* View Transcript Modal */}
      {viewingTranscript && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-background rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-hidden'>
            <div className='p-4 border-b flex items-center justify-between'>
              <div>
                <h3 className='font-semibold'>Transcript</h3>
                <p className='text-sm text-muted-foreground'>
                  {viewingTranscript.channel_name} -{" "}
                  {new Date(viewingTranscript.broadcast_date).toLocaleString()}
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setViewingTranscript(null)}
              >
                Close
              </Button>
            </div>
            <div className='p-4 overflow-y-auto max-h-[60vh]'>
              <div className='space-y-4'>
                {viewingTranscript.corrected_text && (
                  <div>
                    <h4 className='font-medium text-sm mb-2'>Corrected Text</h4>
                    <p className='text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md'>
                      {viewingTranscript.corrected_text}
                    </p>
                  </div>
                )}
                {viewingTranscript.transcript_text && (
                  <div>
                    <h4 className='font-medium text-sm mb-2'>
                      Original Transcript
                    </h4>
                    <p className='text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md'>
                      {viewingTranscript.transcript_text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
