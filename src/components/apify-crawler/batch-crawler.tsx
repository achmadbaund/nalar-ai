"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, Info, HelpCircle } from "lucide-react";
import { CrawlerProps, Platform, BatchCrawlResponse } from "./types";

interface BatchCrawlerProps extends CrawlerProps {
  onBatchResponse?: (response: BatchCrawlResponse, payload?: any) => void;
}

const PLATFORMS: Platform[] = ["tiktok", "instagram", "facebook", "twitter", "youtube"];

export default function BatchCrawler({ onResponse, onError, loading, setLoading, onBatchResponse }: BatchCrawlerProps) {
  // Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["tiktok"]);

  // Common keyword parameters
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [keywordId, setKeywordId] = useState<string>("");
  const [resultsLimit, setResultsLimit] = useState<number>(5);

  // Platform-specific keywords
  const [searchQueries, setSearchQueries] = useState<string[]>([""]); // TikTok, YouTube
  const [hashtags, setHashtags] = useState<string[]>([""]); // TikTok, Instagram
  const [search, setSearch] = useState<string>(""); // Instagram
  const [categories, setCategories] = useState<string[]>([""]); // Facebook
  const [searchTerms, setSearchTerms] = useState<string[]>([""]); // Twitter

  // Platform-specific limits
  const [resultsPerPage, setResultsPerPage] = useState<number>(5); // TikTok
  const [maxItems, setMaxItems] = useState<number>(5); // Twitter
  const [maxResults, setMaxResults] = useState<number>(5); // YouTube

  // TikTok specific
  const [searchSection, setSearchSection] = useState<string>("top");
  const [excludePinnedPosts, setExcludePinnedPosts] = useState<boolean>(false);
  const [proxyCountryCode, setProxyCountryCode] = useState<string>("");

  // Instagram specific
  const [searchType, setSearchType] = useState<string>("user");
  const [resultsType, setResultsType] = useState<string>("posts");
  const [addParentData, setAddParentData] = useState<boolean>(true); // Default true per documentation

  // Facebook specific
  const [locations, setLocations] = useState<string[]>([""]);

  // Twitter specific
  const [tweetLanguage, setTweetLanguage] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [sort, setSort] = useState<string>("Latest");

  // YouTube specific
  const [sortingOrder, setSortingOrder] = useState<string>("relevance");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [lengthFilter, setLengthFilter] = useState<string>("");

  // Helper functions for array inputs
  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => {
    setter((prev) => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);

    try {
      // Validate platforms
      if (selectedPlatforms.length === 0) {
        onError("Pilih minimal satu platform");
        setLoading(false);
        return;
      }

      // Build payload
      const payload: any = {
        platforms: selectedPlatforms,
      };

      // Add at least one keyword parameter
      const validKeywords = keywords.filter((k) => k.trim() !== "");
      const validSearchQueries = searchQueries.filter((q) => q.trim() !== "");
      const validHashtags = hashtags.filter((h) => h.trim() !== "");
      const validCategories = categories.filter((c) => c.trim() !== "");
      const validSearchTerms = searchTerms.filter((t) => t.trim() !== "");

      if (validKeywords.length > 0) payload.keywords = validKeywords;
      if (validSearchQueries.length > 0) payload.searchQueries = validSearchQueries;
      if (validHashtags.length > 0) payload.hashtags = validHashtags;
      if (search.trim()) payload.search = search.trim();
      if (validCategories.length > 0) payload.categories = validCategories;
      if (validSearchTerms.length > 0) payload.searchTerms = validSearchTerms;

      // Validate at least one keyword is provided
      if (
        validKeywords.length === 0 &&
        validSearchQueries.length === 0 &&
        validHashtags.length === 0 &&
        !search.trim() &&
        validCategories.length === 0 &&
        validSearchTerms.length === 0
      ) {
        onError("Minimal satu parameter keyword harus diisi");
        setLoading(false);
        return;
      }

      // Optional common parameters
      if (keywordId.trim()) payload.keywordId = parseInt(keywordId.trim());
      if (resultsLimit) payload.resultsLimit = resultsLimit;
      if (resultsPerPage) payload.resultsPerPage = resultsPerPage;
      if (maxItems) payload.maxItems = maxItems;
      if (maxResults) payload.maxResults = maxResults;

      // TikTok specific
      if (selectedPlatforms.includes("tiktok")) {
        if (searchSection) payload.searchSection = searchSection;
        if (excludePinnedPosts) payload.excludePinnedPosts = excludePinnedPosts;
        if (proxyCountryCode.trim()) payload.proxyCountryCode = proxyCountryCode.trim();
      }

      // Instagram specific
      if (selectedPlatforms.includes("instagram")) {
        if (searchType) payload.searchType = searchType;
        if (resultsType) payload.resultsType = resultsType;
        if (addParentData) payload.addParentData = addParentData;
      }

      // Facebook specific
      if (selectedPlatforms.includes("facebook")) {
        const validLocations = locations.filter((l) => l.trim() !== "");
        if (validLocations.length > 0) payload.locations = validLocations;
      }

      // Twitter specific
      if (selectedPlatforms.includes("twitter")) {
        if (tweetLanguage.trim()) payload.tweetLanguage = tweetLanguage.trim();
        if (start.trim()) payload.start = start.trim();
        if (end.trim()) payload.end = end.trim();
        if (sort) payload.sort = sort;
      }

      // YouTube specific
      if (selectedPlatforms.includes("youtube")) {
        if (sortingOrder) payload.sortingOrder = sortingOrder;
        if (dateFilter.trim()) payload.dateFilter = dateFilter.trim();
        if (lengthFilter.trim()) payload.lengthFilter = lengthFilter.trim();
      }

      const res = await fetch("/api/crawl/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: BatchCrawlResponse = await res.json();

      if (!res.ok) {
        const errorMessage = data.errors && data.errors.length > 0 
          ? data.errors.map(e => `${e.platform}: ${e.error}`).join(", ")
          : "Failed to start batch crawl";
        throw new Error(errorMessage);
      }

      // Call batch response handler if available
      if (onBatchResponse) {
        onBatchResponse(data, payload);
      }

      // Convert batch response to single response format for compatibility
      onResponse({
        task_id: data.tasks.map((t) => t.task_id).join(","),
        status: data.status,
        mode: "batch",
      }, payload);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to start batch crawl");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Platform Selection */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <label className="text-base font-semibold">Platforms *</label>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Pilih minimal 1 platform (maksimal 5)</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`px-4 py-2.5 rounded-md text-sm font-medium transition-all capitalize ${
                selectedPlatforms.includes(platform)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
        {selectedPlatforms.length === 0 && (
          <p className="text-xs text-destructive mt-2">Pilih minimal satu platform</p>
        )}
        {selectedPlatforms.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {selectedPlatforms.length} platform dipilih: {selectedPlatforms.join(", ")}
          </p>
        )}
      </div>

      {/* Common Keywords */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-base font-semibold">Common Keywords *</label>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>Digunakan untuk semua platform yang dipilih</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Keywords ini akan otomatis dikonversi sesuai kebutuhan platform:
          <br />
          • TikTok/YouTube: sebagai searchQueries
          <br />
          • Instagram: sebagai search (user search)
          <br />
          • Facebook: sebagai searchKeywords
          <br />
          • Twitter: sebagai searchTerms
        </p>
        <div className="space-y-2">
          {keywords.map((keyword, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => updateItem(setKeywords, index, e.target.value)}
                placeholder="Enter keyword (e.g., technology, AI)"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {keywords.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(setKeywords, index)}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addItem(setKeywords)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Keyword
          </Button>
        </div>
      </div>

      {/* Platform-specific Keywords */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Platform-Specific Keywords</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Parameter khusus untuk platform tertentu. Jika tidak diisi, akan menggunakan Common Keywords.
        </p>
        
        {(selectedPlatforms.includes("tiktok") || selectedPlatforms.includes("youtube")) && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              Search Queries
              <span className="text-xs text-muted-foreground font-normal">
                (TikTok, YouTube)
              </span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Query pencarian khusus untuk TikTok dan YouTube. Jika tidak diisi, akan menggunakan Common Keywords.
            </p>
            <div className="space-y-2">
              {searchQueries.map((query, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => updateItem(setSearchQueries, index, e.target.value)}
                    placeholder="Enter search query (e.g., AI technology)"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  {searchQueries.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(setSearchQueries, index)}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(setSearchQueries)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Query
              </Button>
            </div>
          </div>
        )}

        {(selectedPlatforms.includes("tiktok") || selectedPlatforms.includes("instagram")) && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              Hashtags
              <span className="text-xs text-muted-foreground font-normal">
                (TikTok, Instagram)
              </span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Untuk Instagram: jika hashtags disediakan, akan digunakan untuk hashtag search. Prefix # akan otomatis dihapus.
            </p>
            <div className="space-y-2">
              {hashtags.map((hashtag, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={hashtag}
                    onChange={(e) => updateItem(setHashtags, index, e.target.value)}
                    placeholder="Enter hashtag (e.g., viral, fyp) - # akan otomatis dihapus"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  {hashtags.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(setHashtags, index)}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(setHashtags)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Hashtag
              </Button>
            </div>
          </div>
        )}

        {selectedPlatforms.includes("instagram") && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Search (Instagram)</label>
            <p className="text-xs text-muted-foreground mb-2">
              Keyword pencarian khusus untuk Instagram user search. Jika tidak diisi, akan menggunakan Common Keywords.
            </p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter search keyword for Instagram"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        )}

        {selectedPlatforms.includes("facebook") && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Categories (Facebook)</label>
            <p className="text-xs text-muted-foreground mb-2">
              Kategori/keyword untuk Facebook. Jika tidak diisi, akan menggunakan Common Keywords.
            </p>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => updateItem(setCategories, index, e.target.value)}
                    placeholder="Enter category/keyword (e.g., Technology, News)"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  {categories.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(setCategories, index)}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(setCategories)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </div>
          </div>
        )}

        {selectedPlatforms.includes("twitter") && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Search Terms (Twitter)</label>
            <p className="text-xs text-muted-foreground mb-2">
              Keyword pencarian untuk Twitter. Mendukung operator OR dan #hashtag. Jika tidak diisi, akan menggunakan Common Keywords.
            </p>
            <div className="space-y-2">
              {searchTerms.map((term, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => updateItem(setSearchTerms, index, e.target.value)}
                    placeholder="Enter search term (e.g., technology OR AI, #viral)"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  {searchTerms.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(setSearchTerms, index)}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(setSearchTerms)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Term
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Common Optional Parameters */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-semibold">Common Parameters</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>Parameter umum untuk semua platform</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 laptop:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Keyword ID
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                (Auto-generate if empty)
              </span>
            </label>
            <input
              type="number"
              value={keywordId}
              onChange={(e) => setKeywordId(e.target.value)}
              placeholder="Auto-generate if empty"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          {(selectedPlatforms.includes("instagram") || selectedPlatforms.includes("facebook")) && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Results Limit
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (Instagram, Facebook)
                </span>
              </label>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          )}
          {selectedPlatforms.includes("tiktok") && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Results Per Page
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (TikTok)
                </span>
              </label>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          )}
          {selectedPlatforms.includes("twitter") && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Max Items
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (Twitter)
                </span>
              </label>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          )}
          {selectedPlatforms.includes("youtube") && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Max Results
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (YouTube)
                </span>
              </label>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Platform-Specific Configuration */}
      {(selectedPlatforms.includes("tiktok") || 
        selectedPlatforms.includes("instagram") || 
        selectedPlatforms.includes("facebook") || 
        selectedPlatforms.includes("twitter") || 
        selectedPlatforms.includes("youtube")) && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Platform-Specific Configuration</h3>
          
          {/* TikTok Specific */}
          {selectedPlatforms.includes("tiktok") && (
            <div className="mb-6 pb-6 border-b border-border last:border-0 last:mb-0 last:pb-0">
              <h4 className="text-sm font-semibold mb-3 capitalize">TikTok</h4>
              <div className="grid grid-cols-1 gap-4 laptop:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Search Section
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (default: top)
                    </span>
                  </label>
                  <select
                    value={searchSection}
                    onChange={(e) => setSearchSection(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="top">Top</option>
                    <option value="users">Users</option>
                    <option value="videos">Videos</option>
                    <option value="sounds">Sounds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Proxy Country Code
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={proxyCountryCode}
                    onChange={(e) => setProxyCountryCode(e.target.value)}
                    placeholder="e.g., US, ID"
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                <div className="flex items-center gap-2 laptop:col-span-2">
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
              </div>
            </div>
          )}

          {/* Instagram Specific */}
          {selectedPlatforms.includes("instagram") && (
            <div className="mb-6 pb-6 border-b border-border last:border-0 last:mb-0 last:pb-0">
              <h4 className="text-sm font-semibold mb-3 capitalize">Instagram</h4>
              <p className="text-xs text-muted-foreground mb-4">
                <strong>Note:</strong> Jika hashtags disediakan, akan digunakan untuk hashtag search. Jika hanya keywords/search, akan digunakan untuk user search.
              </p>
              <div className="grid grid-cols-1 gap-4 laptop:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Search Type
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (auto: hashtag/user)
                    </span>
                  </label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="user">User</option>
                    <option value="hashtag">Hashtag</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Results Type</label>
                  <select
                    value={resultsType}
                    onChange={(e) => setResultsType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="posts">Posts</option>
                    <option value="reels">Reels</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 laptop:col-span-2">
                  <input
                    type="checkbox"
                    id="addParentData"
                    checked={addParentData}
                    onChange={(e) => setAddParentData(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="addParentData" className="text-sm">
                    Add Parent Data (Recommended: ON untuk mendapatkan individual posts)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Facebook Specific */}
          {selectedPlatforms.includes("facebook") && (
            <div className="mb-6 pb-6 border-b border-border last:border-0 last:mb-0 last:pb-0">
              <h4 className="text-sm font-semibold mb-3 capitalize">Facebook</h4>
              <div>
                <label className="block text-sm font-medium mb-2">Locations (Optional)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Daftar lokasi untuk filter pencarian. Jika tidak diisi, akan mencari di semua lokasi.
                </p>
                <div className="space-y-2">
                  {locations.map((location, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => updateItem(setLocations, index, e.target.value)}
                        placeholder="e.g., Indonesia, Jakarta"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      {locations.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(setLocations, index)}
                          className="px-3"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(setLocations)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Location
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Twitter Specific */}
          {selectedPlatforms.includes("twitter") && (
            <div className="mb-6 pb-6 border-b border-border last:border-0 last:mb-0 last:pb-0">
              <h4 className="text-sm font-semibold mb-3 capitalize">Twitter</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Search Terms mendukung operator OR dan #hashtag. Contoh: "technology OR AI", "#viral"
              </p>
              <div className="grid grid-cols-1 gap-4 laptop:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Tweet Language (ISO 639-1)
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={tweetLanguage}
                    onChange={(e) => setTweetLanguage(e.target.value)}
                    placeholder="e.g., id, en"
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Sort
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (default: Latest)
                    </span>
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="Latest">Latest</option>
                    <option value="Oldest">Oldest</option>
                    <option value="MostLiked">Most Liked</option>
                    <option value="MostRetweeted">Most Retweeted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Start Date (YYYY-MM-DD)
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    End Date (YYYY-MM-DD)
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* YouTube Specific */}
          {selectedPlatforms.includes("youtube") && (
            <div className="mb-6 pb-6 border-b border-border last:border-0 last:mb-0 last:pb-0">
              <h4 className="text-sm font-semibold mb-3 capitalize">YouTube</h4>
              <div className="grid grid-cols-1 gap-4 laptop:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Sorting Order
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (default: relevance)
                    </span>
                  </label>
                  <select
                    value={sortingOrder}
                    onChange={(e) => setSortingOrder(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating</option>
                    <option value="upload_date">Upload Date</option>
                    <option value="view_count">View Count</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Date Filter
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                  <label className="block text-sm font-medium mb-1.5">
                    Length Filter
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <select
                    value={lengthFilter}
                    onChange={(e) => setLengthFilter(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">None</option>
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex flex-col gap-4 pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          {selectedPlatforms.length > 0 ? (
            <p>
              Akan membuat <strong>{selectedPlatforms.length}</strong> task untuk platform:{" "}
              <strong className="capitalize">{selectedPlatforms.join(", ")}</strong>
            </p>
          ) : (
            <p className="text-destructive">Pilih minimal satu platform untuk memulai batch crawl</p>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={loading || selectedPlatforms.length === 0} 
          className="w-full laptop:w-auto laptop:ml-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Starting Batch Crawl...
            </>
          ) : (
            <>
              Start Batch Crawl ({selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""})
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

