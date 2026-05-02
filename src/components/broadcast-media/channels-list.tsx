"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Loader2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Tv,
  Radio,
  Podcast,
  BarChart3,
} from "lucide-react";
import {
  BroadcastChannel,
  PaginatedResponse,
  CHANNEL_TYPE_COLORS,
  CHANNEL_TYPE_LABELS,
  BroadcastChannelFormData,
  ChannelType,
} from "@/types/broadcast-media";
import { cn } from "@/lib/utils";
import ChannelForm from "./channel-form";

interface ChannelsListProps {
  onChannelSelect?: (channel: BroadcastChannel) => void;
}

export default function ChannelsList({ onChannelSelect }: ChannelsListProps) {
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
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
  const [channelTypeFilter, setChannelTypeFilter] = useState<ChannelType | "">(
    ""
  );
  const [activeFilter, setActiveFilter] = useState<boolean | "">("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<BroadcastChannel | null>(
    null
  );
  const [formLoading, setFormLoading] = useState(false);

  // Actions state
  const [togglingChannelId, setTogglingChannelId] = useState<number | null>(
    null
  );
  const [deletingChannelId, setDeletingChannelId] = useState<number | null>(
    null
  );

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("page_size", pageSize.toString());

      if (search) params.set("search", search);
      if (channelTypeFilter !== "")
        params.set("channel_type", channelTypeFilter);
      if (activeFilter !== "") params.set("active", activeFilter.toString());

      const response = await fetch(
        `/api/broadcast-media/channels?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch channels");
      }

      // Handle paginated response
      if (data.results) {
        setChannels(data.results);
        setTotalCount(data.count);
        setNext(data.next);
        setPrevious(data.previous);
      } else {
        // Handle non-paginated response (array)
        setChannels(Array.isArray(data) ? data : []);
        setTotalCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch channels");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, channelTypeFilter, activeFilter]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchChannels();
  };

  const handleCreateChannel = async (data: BroadcastChannelFormData) => {
    setFormLoading(true);
    try {
      const response = await fetch("/api/broadcast-media/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create channel");
      }

      setShowForm(false);
      fetchChannels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateChannel = async (data: BroadcastChannelFormData) => {
    if (!editingChannel) return;
    setFormLoading(true);
    try {
      const response = await fetch(
        `/api/broadcast-media/channels/${editingChannel.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update channel");
      }

      setEditingChannel(null);
      fetchChannels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update channel");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteChannel = async (id: number) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;

    setDeletingChannelId(id);
    try {
      const response = await fetch(`/api/broadcast-media/channels/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete channel");
      }

      fetchChannels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete channel");
    } finally {
      setDeletingChannelId(null);
    }
  };

  const handleToggleActive = async (channel: BroadcastChannel) => {
    setTogglingChannelId(channel.id);
    try {
      const action = channel.active ? "deactivate" : "activate";
      const response = await fetch(
        `/api/broadcast-media/channels/${channel.id}/${action}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} channel`);
      }

      fetchChannels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle channel");
    } finally {
      setTogglingChannelId(null);
    }
  };

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case "tv":
        return Tv;
      case "radio":
        return Radio;
      case "podcast":
        return Podcast;
      default:
        return Tv;
    }
  };

  const resetFilters = () => {
    setSearch("");
    setChannelTypeFilter("");
    setActiveFilter("");
    setCurrentPage(1);
  };

  if (showForm) {
    return (
      <ChannelForm
        onSubmit={handleCreateChannel}
        onCancel={() => setShowForm(false)}
        loading={formLoading}
      />
    );
  }

  if (editingChannel) {
    return (
      <ChannelForm
        channel={editingChannel}
        onSubmit={handleUpdateChannel}
        onCancel={() => setEditingChannel(null)}
        loading={formLoading}
      />
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>
            Broadcast Channels
          </h2>
          <p className='text-sm text-muted-foreground'>
            Manage TV, Radio, and Podcast channels
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={fetchChannels}>
            <RefreshCw className='h-4 w-4 mr-1' />
            Refresh
          </Button>
          <Button size='sm' onClick={() => setShowForm(true)}>
            <Plus className='h-4 w-4 mr-1' />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-muted/50 rounded-lg p-4'>
        <form onSubmit={handleSearch} className='flex flex-wrap gap-3'>
          <div className='flex-1 min-w-[200px]'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search channels...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background'
              />
            </div>
          </div>

          <select
            value={channelTypeFilter}
            onChange={(e) =>
              setChannelTypeFilter(e.target.value as ChannelType | "")
            }
            className='px-3 py-2 text-sm border rounded-md bg-background'
          >
            <option value=''>All Types</option>
            <option value='tv'>Television</option>
            <option value='radio'>Radio</option>
            <option value='podcast'>Podcast</option>
          </select>

          <select
            value={activeFilter === "" ? "" : activeFilter.toString()}
            onChange={(e) =>
              setActiveFilter(
                e.target.value === "" ? "" : e.target.value === "true"
              )
            }
            className='px-3 py-2 text-sm border rounded-md bg-background'
          >
            <option value=''>All Status</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
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
      ) : channels.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>No channels found</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={() => setShowForm(true)}
          >
            <Plus className='h-4 w-4 mr-1' />
            Add your first channel
          </Button>
        </div>
      ) : (
        <>
          {/* Channels Table */}
          <div className='border rounded-lg overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-muted/50'>
                <tr>
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
                    Transcripts
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Success Rate
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {channels.map((channel) => {
                  const Icon = getChannelIcon(channel.channel_type);
                  const isExpanded = expandedRow === channel.id;

                  return (
                    <React.Fragment key={channel.id}>
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
                                setExpandedRow(isExpanded ? null : channel.id)
                              }
                              className='p-1 hover:bg-muted rounded'
                            >
                              {isExpanded ? (
                                <ChevronUp className='h-4 w-4' />
                              ) : (
                                <ChevronDown className='h-4 w-4' />
                              )}
                            </button>
                            <Icon className='h-5 w-5 text-muted-foreground' />
                            <div>
                              <p className='font-medium text-sm'>
                                {channel.channel_name}
                              </p>
                              {channel.description && (
                                <p className='text-xs text-muted-foreground truncate max-w-[200px]'>
                                  {channel.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              CHANNEL_TYPE_COLORS[channel.channel_type]
                            )}
                          >
                            {CHANNEL_TYPE_LABELS[channel.channel_type]}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <button
                            onClick={() => handleToggleActive(channel)}
                            disabled={togglingChannelId === channel.id}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                              channel.active
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            )}
                          >
                            {togglingChannelId === channel.id ? (
                              <Loader2 className='h-3 w-3 animate-spin' />
                            ) : channel.active ? (
                              <Check className='h-3 w-3' />
                            ) : (
                              <X className='h-3 w-3' />
                            )}
                            {channel.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          {channel.transcript_count}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]'>
                              <div
                                className={cn(
                                  "h-full transition-all",
                                  channel.success_rate >= 80
                                    ? "bg-green-500"
                                    : channel.success_rate >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                )}
                                style={{ width: `${channel.success_rate}%` }}
                              />
                            </div>
                            <span className='text-xs text-muted-foreground'>
                              {channel.success_rate}%
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => setEditingChannel(channel)}
                            >
                              <Edit2 className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-destructive hover:text-destructive'
                              onClick={() => handleDeleteChannel(channel.id)}
                              disabled={deletingChannelId === channel.id}
                            >
                              {deletingChannelId === channel.id ? (
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
                          <td colSpan={6} className='px-4 py-4 bg-muted/10'>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                              <div>
                                <p className='text-xs text-muted-foreground'>
                                  Stream URL
                                </p>
                                <p className='text-sm font-medium truncate'>
                                  {channel.stream_url || "-"}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-muted-foreground'>
                                  Last Processed
                                </p>
                                <p className='text-sm font-medium'>
                                  {channel.last_processed_at
                                    ? new Date(
                                        channel.last_processed_at
                                      ).toLocaleString()
                                    : "-"}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-muted-foreground'>
                                  Created
                                </p>
                                <p className='text-sm font-medium'>
                                  {new Date(
                                    channel.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs text-muted-foreground'>
                                  Updated
                                </p>
                                <p className='text-sm font-medium'>
                                  {new Date(
                                    channel.updated_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
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
    </div>
  );
}
