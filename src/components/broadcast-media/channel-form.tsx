"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Tv, Radio, Podcast } from "lucide-react";
import {
  BroadcastChannel,
  BroadcastChannelFormData,
  ChannelType,
} from "@/types/broadcast-media";

interface ChannelFormProps {
  channel?: BroadcastChannel;
  onSubmit: (data: BroadcastChannelFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ChannelForm({
  channel,
  onSubmit,
  onCancel,
  loading = false,
}: ChannelFormProps) {
  const [formData, setFormData] = useState<BroadcastChannelFormData>({
    channel_name: channel?.channel_name || "",
    channel_type: channel?.channel_type || "tv",
    description: channel?.description || "",
    stream_url: channel?.stream_url || "",
    active: channel?.active ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.channel_name.trim()) {
      newErrors.channel_name = "Channel name is required";
    }

    if (formData.stream_url && !isValidUrl(formData.stream_url)) {
      newErrors.stream_url = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const channelTypes: { value: ChannelType; label: string; icon: typeof Tv }[] =
    [
      { value: "tv", label: "Television", icon: Tv },
      { value: "radio", label: "Radio", icon: Radio },
      { value: "podcast", label: "Podcast", icon: Podcast },
    ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={onCancel}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>
            {channel ? "Edit Channel" : "Add New Channel"}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {channel
              ? "Update the channel information below"
              : "Fill in the details to create a new broadcast channel"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='space-y-6 max-w-2xl'>
        {/* Channel Name */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Channel Name <span className='text-destructive'>*</span>
          </label>
          <input
            type='text'
            value={formData.channel_name}
            onChange={(e) =>
              setFormData({ ...formData, channel_name: e.target.value })
            }
            placeholder='e.g., Metro TV, Radio Elshinta'
            className={`w-full px-4 py-2 text-sm border rounded-md bg-background ${
              errors.channel_name ? "border-destructive" : ""
            }`}
          />
          {errors.channel_name && (
            <p className='text-xs text-destructive'>{errors.channel_name}</p>
          )}
        </div>

        {/* Channel Type */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Channel Type <span className='text-destructive'>*</span>
          </label>
          <div className='grid grid-cols-3 gap-3'>
            {channelTypes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type='button'
                onClick={() =>
                  setFormData({ ...formData, channel_type: value })
                }
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                  formData.channel_type === value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${
                    formData.channel_type === value
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.channel_type === value
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder='Enter a description for this channel...'
            rows={3}
            className='w-full px-4 py-2 text-sm border rounded-md bg-background resize-none'
          />
        </div>

        {/* Stream URL */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Stream URL
          </label>
          <input
            type='text'
            value={formData.stream_url}
            onChange={(e) =>
              setFormData({ ...formData, stream_url: e.target.value })
            }
            placeholder='e.g., rtmp://stream.example.com/live'
            className={`w-full px-4 py-2 text-sm border rounded-md bg-background ${
              errors.stream_url ? "border-destructive" : ""
            }`}
          />
          {errors.stream_url && (
            <p className='text-xs text-destructive'>{errors.stream_url}</p>
          )}
          <p className='text-xs text-muted-foreground'>
            Optional RTMP/HLS stream URL for live monitoring
          </p>
        </div>

        {/* Active Status */}
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() =>
              setFormData({ ...formData, active: !formData.active })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.active ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <label className='text-sm font-medium text-foreground'>
            Active
            <span className='ml-2 text-muted-foreground font-normal'>
              (
              {formData.active
                ? "Channel is active and will be processed"
                : "Channel is inactive"}
              )
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-3 pt-4 border-t'>
          <Button type='submit' disabled={loading}>
            {loading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
            {channel ? "Update Channel" : "Create Channel"}
          </Button>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
