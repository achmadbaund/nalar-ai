"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CrawlerProps } from "./types";

type TikTokMode = "profile" | "keyword";

export default function TikTokCrawler({ onResponse, onError, loading, setLoading }: CrawlerProps) {
  const [mode, setMode] = useState<TikTokMode>("profile");
  const [profiles, setProfiles] = useState<string[]>([""]);
  const [resultsPerPage, setResultsPerPage] = useState<number>(5);
  const [excludePinnedPosts, setExcludePinnedPosts] = useState<boolean>(false);
  const [scrapeRelatedVideos, setScrapeRelatedVideos] = useState<boolean>(false);
  const [searchQueries, setSearchQueries] = useState<string[]>([""]);
  const [hashtags, setHashtags] = useState<string[]>([""]);
  const [searchSection, setSearchSection] = useState<string>("top");

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
  const addHashtag = () => setHashtags([...hashtags, ""]);
  const removeHashtag = (index: number) => setHashtags(hashtags.filter((_, i) => i !== index));
  const updateHashtag = (index: number, value: string) => {
    const newHashtags = [...hashtags];
    newHashtags[index] = value;
    setHashtags(newHashtags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);

    try {
      let payload: any = {};

      if (mode === "profile") {
        const validProfiles = profiles.filter((prof) => prof.trim() !== "");
        if (validProfiles.length === 0) {
          onError("At least one TikTok profile is required");
          setLoading(false);
          return;
        }

        payload = {
          profiles: validProfiles.map((prof) => prof.trim().replace(/^@/, "")),
          resultsPerPage,
          excludePinnedPosts,
          scrapeRelatedVideos,
        };
      } else {
        const validSearchQueries = searchQueries.filter((q) => q.trim() !== "");
        const validHashtags = hashtags.filter((tag) => tag.trim() !== "");

        if (validSearchQueries.length === 0 && validHashtags.length === 0) {
          onError("At least one search query or hashtag is required");
          setLoading(false);
          return;
        }

        payload = {
          searchSection,
          resultsPerPage,
          excludePinnedPosts,
          scrapeRelatedVideos,
        };

        if (validSearchQueries.length > 0) {
          payload.searchQueries = validSearchQueries.map((q) => q.trim());
        }
        if (validHashtags.length > 0) {
          payload.hashtags = validHashtags.map((tag) => tag.trim().replace(/^#/, ""));
        }
      }

      const res = await fetch("/api/crawl/tiktok", {
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
            <label className="block text-sm font-medium mb-2">TikTok Profiles / Usernames *</label>
            <div className="space-y-2">
              {profiles.map((profile, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={profile}
                    onChange={(e) => updateProfile(index, e.target.value)}
                    placeholder="username or @username"
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
            <label className="block text-sm font-medium mb-2">Results Per Page</label>
            <input
              type="number"
              value={resultsPerPage}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                if (val === "" || isNaN(val as number)) {
                  setResultsPerPage(5);
                } else {
                  setResultsPerPage(Math.max(1, val as number));
                }
              }}
              onBlur={(e) => {
                const val = Number(e.target.value);
                if (!val || val < 1) {
                  setResultsPerPage(5);
                }
              }}
              min="1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="excludePinnedPosts"
                checked={excludePinnedPosts}
                onChange={(e) => setExcludePinnedPosts(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="excludePinnedPosts" className="text-sm">
                Exclude Pinned Posts
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scrapeRelatedVideos"
                checked={scrapeRelatedVideos}
                onChange={(e) => setScrapeRelatedVideos(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="scrapeRelatedVideos" className="text-sm">
                Scrape Related Videos
              </label>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Search Queries (Optional)</label>
            <div className="space-y-2">
              {searchQueries.map((query, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => updateSearchQuery(index, e.target.value)}
                    placeholder="Search keyword"
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

          <div>
            <label className="block text-sm font-medium mb-2">Hashtags (Optional)</label>
            <div className="space-y-2">
              {hashtags.map((hashtag, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={hashtag}
                    onChange={(e) => updateHashtag(index, e.target.value)}
                    placeholder="hashtag1 or #hashtag1"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {hashtags.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeHashtag(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addHashtag}>
                Add Hashtag
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Results Per Page</label>
              <input
                type="number"
                value={resultsPerPage || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === "0") {
                    setResultsPerPage(0);
                  } else {
                    const numVal = Number(val);
                    if (!isNaN(numVal) && numVal >= 1) {
                      setResultsPerPage(numVal);
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (!val || val < 1 || isNaN(val)) {
                    setResultsPerPage(5);
                  }
                }}
                min="1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Search Section</label>
              <select
                value={searchSection}
                onChange={(e) => setSearchSection(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="top">Top</option>
                <option value="users">Users</option>
                <option value="videos">Videos</option>
                <option value="sounds">Sounds</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="excludePinnedPostsKeyword"
                checked={excludePinnedPosts}
                onChange={(e) => setExcludePinnedPosts(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="excludePinnedPostsKeyword" className="text-sm">
                Exclude Pinned Posts
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scrapeRelatedVideosKeyword"
                checked={scrapeRelatedVideos}
                onChange={(e) => setScrapeRelatedVideos(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="scrapeRelatedVideosKeyword" className="text-sm">
                Scrape Related Videos
              </label>
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
          "Start TikTok Crawl"
        )}
      </Button>
    </form>
  );
}

