"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Upload,
  FileAudio,
  FileVideo,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { BroadcastChannel, FileType } from "@/types/broadcast-media";

export default function UploadTranscript() {
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedChannel, setSelectedChannel] = useState<number | "">("");
  const [broadcastDate, setBroadcastDate] = useState("");
  const [fileType, setFileType] = useState<FileType>("audio");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const response = await fetch(
        "/api/broadcast-media/channels?page_size=100&active=true"
      );
      const data = await response.json();
      if (data.results) {
        setChannels(data.results);
      } else if (Array.isArray(data)) {
        setChannels(data);
      }
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    // Set default broadcast date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setBroadcastDate(now.toISOString().slice(0, 16));
  }, [fetchChannels]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const audioTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/flac",
      "audio/mp3",
    ];
    const videoTypes = [
      "video/mp4",
      "video/webm",
      "video/avi",
      "video/mkv",
      "video/mov",
    ];

    if (
      audioTypes.includes(file.type) ||
      file.name.match(/\.(mp3|wav|ogg|flac)$/i)
    ) {
      setFileType("audio");
      setFile(file);
      setError(null);
    } else if (
      videoTypes.includes(file.type) ||
      file.name.match(/\.(mp4|webm|avi|mkv|mov)$/i)
    ) {
      setFileType("video");
      setFile(file);
      setError(null);
    } else {
      setError("Please upload an audio or video file");
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedChannel) {
      setError("Please select a channel");
      return;
    }

    if (!broadcastDate) {
      setError("Please select a broadcast date");
      return;
    }

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("channel", selectedChannel.toString());
      formData.append("broadcast_date", new Date(broadcastDate).toISOString());
      formData.append("file_type", fileType);
      formData.append("file", file);

      const response = await fetch("/api/broadcast-media/transcripts/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setSuccess(
        `File uploaded successfully! Transcript ID: ${data.transcript_id}`
      );
      setFile(null);
      // Reset form
      setSelectedChannel("");
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setBroadcastDate(now.toISOString().slice(0, 16));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-lg font-semibold text-foreground'>
          Upload Transcript
        </h2>
        <p className='text-sm text-muted-foreground'>
          Upload audio or video files for Speech-to-Text processing
        </p>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className='space-y-6 max-w-2xl'>
        {/* Channel Selection */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Channel <span className='text-destructive'>*</span>
          </label>
          {loadingChannels ? (
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span className='text-sm'>Loading channels...</span>
            </div>
          ) : (
            <select
              value={selectedChannel}
              onChange={(e) =>
                setSelectedChannel(e.target.value ? Number(e.target.value) : "")
              }
              className='w-full px-4 py-2 text-sm border rounded-md bg-background'
              required
            >
              <option value=''>Select a channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.channel_name} ({channel.channel_type})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Broadcast Date */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Broadcast Date & Time <span className='text-destructive'>*</span>
          </label>
          <input
            type='datetime-local'
            value={broadcastDate}
            onChange={(e) => setBroadcastDate(e.target.value)}
            className='w-full px-4 py-2 text-sm border rounded-md bg-background'
            required
          />
        </div>

        {/* File Upload */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-foreground'>
            Media File <span className='text-destructive'>*</span>
          </label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            {file ? (
              <div className='flex flex-col items-center gap-3'>
                {fileType === "video" ? (
                  <FileVideo className='h-12 w-12 text-blue-500' />
                ) : (
                  <FileAudio className='h-12 w-12 text-green-500' />
                )}
                <div>
                  <p className='font-medium'>{file.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    {formatFileSize(file.size)} • {fileType}
                  </p>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className='flex flex-col items-center gap-3'>
                <Upload className='h-12 w-12 text-muted-foreground' />
                <div>
                  <p className='font-medium'>
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Supports MP3, WAV, OGG, FLAC, MP4, WebM, AVI, MKV
                  </p>
                </div>
                <input
                  type='file'
                  onChange={handleFileChange}
                  accept='audio/*,video/*,.mp3,.wav,.ogg,.flac,.mp4,.webm,.avi,.mkv,.mov'
                  className='hidden'
                  id='file-upload'
                />
                <label htmlFor='file-upload'>
                  <Button type='button' variant='outline' asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg'>
            <AlertCircle className='h-5 w-5 flex-shrink-0' />
            <p className='text-sm'>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className='flex items-center gap-2 p-4 bg-green-100 text-green-800 rounded-lg'>
            <CheckCircle className='h-5 w-5 flex-shrink-0' />
            <p className='text-sm'>{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button type='submit' disabled={loading || !file || !selectedChannel}>
          {loading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
          Upload & Process
        </Button>
      </form>
    </div>
  );
}
