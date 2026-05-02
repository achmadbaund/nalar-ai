"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CrawlerProps } from "./types";

type YouTubeMode = "channel" | "keyword";

export default function YouTubeCrawler({ onResponse, onError, loading, setLoading }: CrawlerProps) {
  const [mode, setMode] = useState<YouTubeMode>("channel");
  const [startUrls, setStartUrls] = useState<string[]>([""]);
  const [profiles, setProfiles] = useState<string[]>([""]);
  const [maxResults, setMaxResults] = useState<number>(5);
  const [searchQueries, setSearchQueries] = useState<string[]>([""]);
  const [sortingOrder, setSortingOrder] = useState<string>("relevance");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [lengthFilter, setLengthFilter] = useState<string>("");

  const addStartUrl = () => setStartUrls([...startUrls, ""]);
  const removeStartUrl = (index: number) => setStartUrls(startUrls.filter((_, i) => i !== index));
  const updateStartUrl = (index: number, value: string) => {
    const newUrls = [...startUrls];
    newUrls[index] = value;
    setStartUrls(newUrls);
  };
  const addProfile = () => setProfiles([...profiles, ""]);
  const removeProfile = (index: number) => setProfiles(profiles.filter((_, i) => i !== index));
  const updateProfile = (index: number, value: string) => {
    const newProfiles = [...profiles];
    newProfiles[index] = value;
    setProfiles(newProfiles);
  };
  const addSearchQuery = () => setSearchQueries([...searchQueries, ""]);
  const removeSearchQuery = (index: number) => setSearchQueries(searchQueries.filter((_, i) => i !== index));
  const updateSearchQuery = (index: number, value: string) => {
    const newQueries = [...searchQueries];
    newQueries[index] = value;
    setSearchQueries(newQueries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);

    try {
      let payload: any = {};

      if (mode === "channel") {
        const validStartUrls = startUrls.filter((url) => url.trim() !== "");
        const validProfiles = profiles.filter((prof) => prof.trim() !== "");

        if (validStartUrls.length === 0 && validProfiles.length === 0) {
          onError("At least one start URL or profile is required");
          setLoading(false);
          return;
        }

        payload = {
          maxResults,
        };

        if (validStartUrls.length > 0) {
          payload.startUrls = validStartUrls.map((url) => url.trim());
        }
        if (validProfiles.length > 0) {
          payload.profiles = validProfiles.map((prof) => prof.trim().replace(/^@/, ""));
        }
      } else {
        const validSearchQueries = searchQueries.filter((q) => q.trim() !== "");

        if (validSearchQueries.length === 0) {
          onError("At least one search query is required");
          setLoading(false);
          return;
        }

        payload = {
          searchQueries: validSearchQueries.map((q) => q.trim()),
          maxResults,
          sortingOrder,
        };

        if (dateFilter.trim()) {
          payload.dateFilter = dateFilter.trim();
        }
        if (lengthFilter.trim()) {
          payload.lengthFilter = lengthFilter.trim();
        }
      }

      const res = await fetch("/api/crawl/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start crawl");
      }

      onResponse(data, payload);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to start crawl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Selection */}
      <div className="border-b border-border pb-4">
        <div className="flex gap-1 p-2">
          <button
            type="button"
            onClick={() => setMode("channel")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "channel"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Channel-based Mode
          </button>
          <button
            type="button"
            onClick={() => setMode("keyword")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "keyword"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Keyword-based Mode
          </button>
        </div>
      </div>

      {/* Form Content */}
      {mode === "channel" ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Start URLs (Optional)</label>
            <div className="space-y-2">
              {startUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateStartUrl(index, e.target.value)}
                    placeholder="https://www.youtube.com/@channelname"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {startUrls.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeStartUrl(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStartUrl}>
                Add URL
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Profiles / Usernames *</label>
            <div className="space-y-2">
              {profiles.map((profile, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={profile}
                    onChange={(e) => updateProfile(index, e.target.value)}
                    placeholder="channelname or @channelname"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {profiles.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeProfile(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addProfile}>
                Add Profile
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Results</label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                if (val === "" || isNaN(val as number)) {
                  setMaxResults(5);
                } else {
                  setMaxResults(Math.max(1, val as number));
                }
              }}
              onBlur={(e) => {
                const val = Number(e.target.value);
                if (!val || val < 1) {
                  setMaxResults(5);
                }
              }}
              min="1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Search Queries *</label>
            <div className="space-y-2">
              {searchQueries.map((query, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => updateSearchQuery(index, e.target.value)}
                    placeholder="keyword1, keyword2"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {searchQueries.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeSearchQuery(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSearchQuery}>
                Add Search Query
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Results</label>
              <input
                type="number"
                value={maxResults || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === "0") {
                    setMaxResults(0);
                  } else {
                    const numVal = Number(val);
                    if (!isNaN(numVal) && numVal >= 1) {
                      setMaxResults(numVal);
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (!val || val < 1 || isNaN(val)) {
                    setMaxResults(5);
                  }
                }}
                min="1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sorting Order</label>
              <select
                value={sortingOrder}
                onChange={(e) => setSortingOrder(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="upload_date">Upload Date</option>
                <option value="view_count">View Count</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date Filter (Optional)</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                <option value="hour">Hour</option>
                <option value="today">Today</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Length Filter (Optional)</label>
              <select
                value={lengthFilter}
                onChange={(e) => setLengthFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
          </div>
        </>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting Crawl...
          </>
        ) : (
          "Start YouTube Crawl"
        )}
      </Button>
    </form>
  );
}

