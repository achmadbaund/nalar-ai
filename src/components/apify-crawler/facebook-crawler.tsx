"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CrawlerProps } from "./types";

type FacebookMode = "page" | "keyword";

export default function FacebookCrawler({ onResponse, onError, loading, setLoading }: CrawlerProps) {
  const [mode, setMode] = useState<FacebookMode>("page");
  const [startUrls, setStartUrls] = useState<string[]>([""]);
  const [resultsLimit, setResultsLimit] = useState<number>(5);
  const [captionText, setCaptionText] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([""]);
  const [locations, setLocations] = useState<string[]>([""]);
  const [keywordResultsLimit, setKeywordResultsLimit] = useState<number>(5);

  const addUrl = () => setStartUrls([...startUrls, ""]);
  const removeUrl = (index: number) => setStartUrls(startUrls.filter((_, i) => i !== index));
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...startUrls];
    newUrls[index] = value;
    setStartUrls(newUrls);
  };
  const addCategory = () => setCategories([...categories, ""]);
  const removeCategory = (index: number) => setCategories(categories.filter((_, i) => i !== index));
  const updateCategory = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };
  const addLocation = () => setLocations([...locations, ""]);
  const removeLocation = (index: number) => setLocations(locations.filter((_, i) => i !== index));
  const updateLocation = (index: number, value: string) => {
    const newLocations = [...locations];
    newLocations[index] = value;
    setLocations(newLocations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);

    try {
      let payload: any = {};

      if (mode === "page") {
        const validUrls = startUrls.filter((url) => url.trim() !== "");
        if (validUrls.length === 0) {
          onError("At least one Facebook page URL is required");
          setLoading(false);
          return;
        }
        payload = {
          startUrls: validUrls.map((url) => ({ url: url.trim() })),
          resultsLimit,
          captionText,
        };
      } else {
        const validCategories = categories.filter((cat) => cat.trim() !== "");
        if (validCategories.length === 0) {
          onError("At least one category/keyword is required");
          setLoading(false);
          return;
        }
        payload = {
          categories: validCategories.map((cat) => cat.trim()),
          resultsLimit: keywordResultsLimit,
        };
        const validLocations = locations.filter((loc) => loc.trim() !== "");
        if (validLocations.length > 0) {
          payload.locations = validLocations.map((loc) => loc.trim());
        }
      }

      const res = await fetch("/api/crawl/facebook", {
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
            onClick={() => setMode("page")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "page"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Page-based Mode
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
      {mode === "page" ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Facebook Page URLs *</label>
            <div className="space-y-2">
              {startUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder="https://www.facebook.com/pagename/"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {startUrls.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeUrl(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addUrl}>
                Add URL
              </Button>
            </div>
          </div>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="captionText"
              checked={captionText}
              onChange={(e) => setCaptionText(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="captionText" className="text-sm">
              Include Caption Text
            </label>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Categories / Keywords *</label>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => updateCategory(index, e.target.value)}
                    placeholder="e.g., restaurant, cafe"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {categories.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCategory(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                Add Category
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Locations (Optional)</label>
            <div className="space-y-2">
              {locations.map((location, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => updateLocation(index, e.target.value)}
                    placeholder="e.g., Indonesia, Jakarta"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {locations.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeLocation(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                Add Location
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Results Limit</label>
            <input
              type="number"
              value={keywordResultsLimit || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "0") {
                  setKeywordResultsLimit(0);
                } else {
                  const numVal = Number(val);
                  if (!isNaN(numVal) && numVal >= 1) {
                    setKeywordResultsLimit(numVal);
                  }
                }
              }}
              onBlur={(e) => {
                const val = Number(e.target.value);
                if (!val || val < 1 || isNaN(val)) {
                  setKeywordResultsLimit(5);
                }
              }}
              min="1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
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
          "Start Facebook Crawl"
        )}
      </Button>
    </form>
  );
}

