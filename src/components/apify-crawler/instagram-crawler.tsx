"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CrawlerProps } from "./types";

type InstagramMode = "profile" | "keyword";

export default function InstagramCrawler({ onResponse, onError, loading, setLoading }: CrawlerProps) {
  const [mode, setMode] = useState<InstagramMode>("profile");
  const [directUrls, setDirectUrls] = useState<string[]>([""]);
  const [profiles, setProfiles] = useState<string[]>([""]);
  const [resultsLimit, setResultsLimit] = useState<number>(5);
  const [resultsType, setResultsType] = useState<string>("posts");
  const [searchType, setSearchType] = useState<string>("user");
  const [addParentData, setAddParentData] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([""]);

  const addDirectUrl = () => setDirectUrls([...directUrls, ""]);
  const removeDirectUrl = (index: number) => setDirectUrls(directUrls.filter((_, i) => i !== index));
  const updateDirectUrl = (index: number, value: string) => {
    const newUrls = [...directUrls];
    newUrls[index] = value;
    setDirectUrls(newUrls);
  };
  const addProfile = () => setProfiles([...profiles, ""]);
  const removeProfile = (index: number) => setProfiles(profiles.filter((_, i) => i !== index));
  const updateProfile = (index: number, value: string) => {
    const newProfiles = [...profiles];
    newProfiles[index] = value;
    setProfiles(newProfiles);
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
        const validDirectUrls = directUrls.filter((url) => url.trim() !== "");
        const validProfiles = profiles.filter((prof) => prof.trim() !== "");

        if (validDirectUrls.length === 0 && validProfiles.length === 0) {
          onError("At least one direct URL or profile is required");
          setLoading(false);
          return;
        }

        payload = {
          resultsLimit,
          resultsType,
          searchType,
          addParentData,
        };

        if (validDirectUrls.length > 0) {
          payload.directUrls = validDirectUrls.map((url) => url.trim());
        }
        if (validProfiles.length > 0) {
          payload.profiles = validProfiles.map((prof) => prof.trim().replace(/^@/, ""));
        }
      } else {
        const validHashtags = hashtags.filter((tag) => tag.trim() !== "");

        if (!search.trim() && validHashtags.length === 0) {
          onError("At least one search keyword or hashtag is required");
          setLoading(false);
          return;
        }

        payload = {
          resultsLimit,
          resultsType,
          searchType: validHashtags.length > 0 ? "hashtag" : searchType,
          addParentData,
        };

        if (search.trim()) {
          payload.search = search.trim();
        }
        if (validHashtags.length > 0) {
          payload.hashtags = validHashtags.map((tag) => tag.trim().replace(/^#/, ""));
        }
      }

      const res = await fetch("/api/crawl/instagram", {
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
            <label className="block text-sm font-medium mb-2">Direct URLs (Optional)</label>
            <div className="space-y-2">
              {directUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateDirectUrl(index, e.target.value)}
                    placeholder="https://www.instagram.com/username/"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {directUrls.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeDirectUrl(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addDirectUrl}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Results Limit</label>
              <input
                type="number"
                value={resultsLimit || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === "0") {
                    setResultsLimit(0);
                  } else {
                    const numVal = Number(val);
                    if (!isNaN(numVal) && numVal >= 1) {
                      setResultsLimit(numVal);
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (!val || val < 1 || isNaN(val)) {
                    setResultsLimit(5);
                  }
                }}
                min="1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Results Type</label>
              <select
                value={resultsType}
                onChange={(e) => setResultsType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="posts">Posts</option>
                <option value="reels">Reels</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="addParentData"
              checked={addParentData}
              onChange={(e) => setAddParentData(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="addParentData" className="text-sm">
              Add Parent Data
            </label>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Search Keyword (Optional)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hashtags *</label>
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
              <label className="block text-sm font-medium mb-2">Results Limit</label>
              <input
                type="number"
                value={resultsLimit || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === "0") {
                    setResultsLimit(0);
                  } else {
                    const numVal = Number(val);
                    if (!isNaN(numVal) && numVal >= 1) {
                      setResultsLimit(numVal);
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (!val || val < 1 || isNaN(val)) {
                    setResultsLimit(5);
                  }
                }}
                min="1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Search Type</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="user">User</option>
                <option value="hashtag">Hashtag</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="addParentDataKeyword"
              checked={addParentData}
              onChange={(e) => setAddParentData(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="addParentDataKeyword" className="text-sm">
              Add Parent Data
            </label>
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
          "Start Instagram Crawl"
        )}
      </Button>
    </form>
  );
}

