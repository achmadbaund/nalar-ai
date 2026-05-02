"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Tv,
  Radio,
  Podcast,
  FileAudio,
  FileVideo,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { BroadcastChannel, ChannelStatistics } from "@/types/broadcast-media";
import { cn } from "@/lib/utils";

interface OverviewStats {
  totalChannels: number;
  activeChannels: number;
  totalTranscripts: number;
  pendingTranscripts: number;
  processingTranscripts: number;
  completedTranscripts: number;
  failedTranscripts: number;
  averageSuccessRate: number;
  channelsByType: {
    tv: number;
    radio: number;
    podcast: number;
  };
}

export default function StatisticsPanel() {
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/broadcast-media/channels?page_size=100"
      );
      const data = await response.json();

      let channelList: BroadcastChannel[] = [];
      if (data.results) {
        channelList = data.results;
      } else if (Array.isArray(data)) {
        channelList = data;
      }

      setChannels(channelList);

      // Calculate overview stats
      const overview: OverviewStats = {
        totalChannels: channelList.length,
        activeChannels: channelList.filter((c) => c.active).length,
        totalTranscripts: channelList.reduce(
          (sum, c) => sum + c.transcript_count,
          0
        ),
        pendingTranscripts: 0,
        processingTranscripts: 0,
        completedTranscripts: 0,
        failedTranscripts: 0,
        averageSuccessRate:
          channelList.length > 0
            ? channelList.reduce((sum, c) => sum + c.success_rate, 0) /
              channelList.length
            : 0,
        channelsByType: {
          tv: channelList.filter((c) => c.channel_type === "tv").length,
          radio: channelList.filter((c) => c.channel_type === "radio").length,
          podcast: channelList.filter((c) => c.channel_type === "podcast")
            .length,
        },
      };

      setStats(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getChannelIcon = (type: string) => {
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

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-destructive/10 text-destructive rounded-lg p-4'>
        <p className='text-sm'>{error}</p>
        <Button variant='ghost' size='sm' className='mt-2' onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>Statistics</h2>
          <p className='text-sm text-muted-foreground'>
            Overview of broadcast media processing
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={fetchData}>
          <RefreshCw className='h-4 w-4 mr-1' />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-card border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Total Channels</p>
              <p className='text-2xl font-bold'>{stats?.totalChannels || 0}</p>
            </div>
            <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
              <Tv className='h-6 w-6 text-blue-600' />
            </div>
          </div>
          <p className='text-xs text-muted-foreground mt-2'>
            {stats?.activeChannels || 0} active
          </p>
        </div>

        <div className='bg-card border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Total Transcripts</p>
              <p className='text-2xl font-bold'>
                {stats?.totalTranscripts || 0}
              </p>
            </div>
            <div className='h-12 w-12 rounded-full bg-green-100 flex items-center justify-center'>
              <FileAudio className='h-6 w-6 text-green-600' />
            </div>
          </div>
          <p className='text-xs text-muted-foreground mt-2'>
            Across all channels
          </p>
        </div>

        <div className='bg-card border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Success Rate</p>
              <p className='text-2xl font-bold'>
                {stats?.averageSuccessRate.toFixed(1) || 0}%
              </p>
            </div>
            <div className='h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center'>
              <TrendingUp className='h-6 w-6 text-purple-600' />
            </div>
          </div>
          <p className='text-xs text-muted-foreground mt-2'>
            Average across channels
          </p>
        </div>

        <div className='bg-card border rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted-foreground'>Channel Types</p>
              <div className='flex items-center gap-2 mt-1'>
                <div className='flex items-center gap-1'>
                  <Tv className='h-4 w-4 text-blue-500' />
                  <span className='text-sm font-medium'>
                    {stats?.channelsByType.tv || 0}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <Radio className='h-4 w-4 text-green-500' />
                  <span className='text-sm font-medium'>
                    {stats?.channelsByType.radio || 0}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <Podcast className='h-4 w-4 text-purple-500' />
                  <span className='text-sm font-medium'>
                    {stats?.channelsByType.podcast || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className='h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center'>
              <BarChart3 className='h-6 w-6 text-orange-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Channel Statistics Table */}
      <div className='border rounded-lg overflow-hidden'>
        <div className='bg-muted/50 px-4 py-3 border-b'>
          <h3 className='font-medium'>Channel Statistics</h3>
        </div>
        <table className='w-full'>
          <thead className='bg-muted/30'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Channel
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Type
              </th>
              <th className='px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Transcripts
              </th>
              <th className='px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Success Rate
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Status
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Last Processed
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {channels.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className='px-4 py-8 text-center text-muted-foreground'
                >
                  No channels found
                </td>
              </tr>
            ) : (
              channels.map((channel) => {
                const Icon = getChannelIcon(channel.channel_type);
                return (
                  <tr key={channel.id} className='hover:bg-muted/20'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4 text-muted-foreground' />
                        <span className='font-medium text-sm'>
                          {channel.channel_name}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-sm capitalize'>
                        {channel.channel_type}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <span className='text-sm font-medium'>
                        {channel.transcript_count}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-center gap-2'>
                        <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[80px]'>
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
                        <span className='text-xs text-muted-foreground w-12'>
                          {channel.success_rate}%
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          channel.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {channel.active ? (
                          <CheckCircle className='h-3 w-3' />
                        ) : (
                          <XCircle className='h-3 w-3' />
                        )}
                        {channel.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-muted-foreground'>
                      {channel.last_processed_at
                        ? new Date(channel.last_processed_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
