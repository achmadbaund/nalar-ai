"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CrawlerProps } from "./types";

type TwitterMode = "profile" | "keyword";

export default function TwitterCrawler({ onResponse, onError, loading, setLoading }: CrawlerProps) {
  const [mode, setMode] = useState<TwitterMode>("profile");
  const [startUrls, setStartUrls] = useState<string[]>([""]);
  const [handles, setHandles] = useState<string[]>([""]);
  const [maxItems, setMaxItems] = useState<number>(5);
  const [sort, setSort] = useState<string>("Latest");
  const [searchTerms, setSearchTerms] = useState<string[]>([""]);
  const [tweetLanguage, setTweetLanguage] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const addStartUrl = () => setStartUrls([...startUrls, ""]);
  const removeStartUrl = (index: number) => setStartUrls(startUrls.filter((_, i) => i !== index));
  const updateStartUrl = (index: number, value: string) => {
    const newUrls = [...startUrls];
    newUrls[index] = value;
    setStartUrls(newUrls);
  };
  const addHandle = () => setHandles([...handles, ""]);
  const removeHandle = (index: number) => setHandles(handles.filter((_, i) => i !== index));
  const updateHandle = (index: number, value: string) => {
    const newHandles = [...handles];
    newHandles[index] = value;
    setHandles(newHandles);
  };
  const addSearchTerm = () => setSearchTerms([...searchTerms, ""]);
  const removeSearchTerm = (index: number) => setSearchTerms(searchTerms.filter((_, i) => i !== index));
  const updateSearchTerm = (index: number, value: string) => {
    const newTerms = [...searchTerms];
    newTerms[index] = value;
    setSearchTerms(newTerms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);

    try {
      let payload: any = {};

      if (mode === "profile") {
        const validStartUrls = startUrls.filter((url) => url.trim() !== "");
        const validHandles = handles.filter((handle) => handle.trim() !== "");

        if (validStartUrls.length === 0 && validHandles.length === 0) {
          onError("At least one start URL or handle is required");
          setLoading(false);
          return;
        }

        payload = {
          maxItems,
          sort,
        };

        if (validStartUrls.length > 0) {
          payload.startUrls = validStartUrls.map((url) => url.trim());
        }
        if (validHandles.length > 0) {
          payload.handles = validHandles.map((handle) => handle.trim().replace(/^@/, ""));
        }
      } else {
        const validSearchTerms = searchTerms.filter((term) => term.trim() !== "");

        if (validSearchTerms.length === 0) {
          onError("At least one search term is required");
          setLoading(false);
          return;
        }

        payload = {
          searchTerms: validSearchTerms.map((term) => term.trim()),
          maxItems,
          sort,
        };

        if (tweetLanguage.trim()) {
          payload.tweetLanguage = tweetLanguage.trim();
        }
        if (startDate.trim()) {
          payload.start = startDate.trim();
        }
        if (endDate.trim()) {
          payload.end = endDate.trim();
        }
      }

      const res = await fetch("/api/crawl/twitter", {
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
            onClick={() => setMode("profile")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "profile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Profile-based Mode
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
      {mode === "profile" ? (
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
                    placeholder="https://x.com/username"
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
            <label className="block text-sm font-medium mb-2">Handles / Usernames *</label>
            <div className="space-y-2">
              {handles.map((handle, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => updateHandle(index, e.target.value)}
                    placeholder="username or @username"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {handles.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeHandle(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addHandle}>
                Add Handle
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Items</label>
              <input
                type="number"
                value={maxItems || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === "0") {
                    setMaxItems(0);
                  } else {
                    const numVal = Number(val);
                    if (!isNaN(numVal) && numVal >= 1) {
                      setMaxItems(numVal);
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (!val || val < 1 || isNaN(val)) {
                    setMaxItems(5);
                  }
                }}
                min="1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Latest">Latest</option>
                <option value="Top">Top</option>
                <option value="People">People</option>
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Search Terms *</label>
            <div className="space-y-2">
              {searchTerms.map((term, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => updateSearchTerm(index, e.target.value)}
                    placeholder="keyword1, keyword2 OR keyword3, #hashtag"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {searchTerms.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeSearchTerm(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSearchTerm}>
                Add Search Term
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Items</label>
              <input
                type="number"
                value={maxItems || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === "0") {
                    setMaxItems(0);
                  } else {
                    const numVal = Number(val);
                    if (!isNaN(numVal) && numVal >= 1) {
                      setMaxItems(numVal);
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (!val || val < 1 || isNaN(val)) {
                    setMaxItems(5);
                  }
                }}
                min="1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Latest">Latest</option>
                <option value="Top">Top</option>
                <option value="People">People</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tweet Language (Optional)</label>
              <input
                type="text"
                value={tweetLanguage}
                onChange={(e) => setTweetLanguage(e.target.value)}
                placeholder="id, en"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date (Optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
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
          "Start Twitter Crawl"
        )}
      </Button>
    </form>
  );
}

