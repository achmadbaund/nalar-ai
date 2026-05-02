"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, Search, ChevronDown } from "lucide-react";
import { EmotionResultsResponse, AllEmotionResultsResponse } from "./types";

export default function EmotionResults() {
  const [contentId, setContentId] = useState("");
  const [resultId, setResultId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmotionResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allResults, setAllResults] =
    useState<AllEmotionResultsResponse | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // Fetch all results for dropdown
  useEffect(() => {
    const fetchAllResults = async () => {
      try {
        setLoadingResults(true);
        const params = new URLSearchParams();
        params.set("skip", "0");
        params.set("limit", "100");

        const response = await fetch(
          `/api/emotion-detection/results?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setAllResults(data);
        }
      } catch (err) {
        // Silent fail - dropdown will just be empty
        console.error("Failed to fetch all results:", err);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchAllResults();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleResultIdSelect = async (
    selectedResultId: string,
    selectedContentId: number
  ) => {
    setResultId(selectedResultId);
    setContentId(selectedContentId.toString());
    setShowDropdown(false);
    setResult(null);
    setError(null);
    setContent(null);

    // Auto fetch result and content when selected from dropdown
    try {
      setLoading(true);
      const response = await fetch(
        `/api/emotion-detection/results/${selectedContentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);

        // Fetch content from posts API
        if (data && data.content_id) {
          setLoadingContent(true);
          fetch(`/api/posts/${data.content_id}`)
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Failed to fetch post: ${res.statusText}`);
              }
              return res.json();
            })
            .then((postData) => {
              // Check for both 'content' and 'text' fields
              if (postData && (postData.content || postData.text)) {
                setContent(postData.content || postData.text);
              } else {
                console.warn(
                  "Post data does not contain content or text field:",
                  postData
                );
                setContent(null);
              }
            })
            .catch((err) => {
              console.error("Error fetching post content:", err);
              setContent(null);
            })
            .finally(() => {
              setLoadingContent(false);
            });
        }
      } else {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ||
              data.detail ||
              JSON.stringify(data.error) ||
              "Failed to get emotion results";
        setError(errorMessage);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get emotion results"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setContent(null);

    try {
      if (!contentId.trim()) {
        throw new Error("Content ID is required");
      }

      const response = await fetch(
        `/api/emotion-detection/results/${contentId.trim()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Failed to get emotion results"
        );
      }

      setResult(data);

      // Fetch content from posts API
      if (data && data.content_id) {
        setLoadingContent(true);
        fetch(`/api/posts/${data.content_id}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch post: ${res.statusText}`);
            }
            return res.json();
          })
          .then((postData) => {
            // Check for both 'content' and 'text' fields
            if (postData && (postData.content || postData.text)) {
              setContent(postData.content || postData.text);
            } else {
              console.warn(
                "Post data does not contain content or text field:",
                postData
              );
              setContent(null);
            }
          })
          .catch((err) => {
            console.error("Error fetching post content:", err);
            setContent(null);
          })
          .finally(() => {
            setLoadingContent(false);
          });
      } else {
        setContent(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get emotion results"
      );
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case "joy":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900";
      case "anger":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900";
      case "sadness":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900";
      case "fear":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900";
      case "surprise":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900";
      default:
        return "text-muted-foreground bg-card border-border";
    }
  };

  const emotions = [
    { name: "anger", label: "Anger" },
    { name: "joy", label: "Joy" },
    { name: "sadness", label: "Sadness" },
    { name: "fear", label: "Fear" },
    { name: "surprise", label: "Surprise" },
  ];

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Result ID Dropdown */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            Pilih dari All Results
          </label>
          <div className='relative dropdown-container'>
            <button
              type='button'
              onClick={() => setShowDropdown(!showDropdown)}
              className='w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent'
              disabled={loadingResults}
            >
              <span
                className={
                  resultId ? "text-foreground" : "text-muted-foreground"
                }
              >
                {resultId
                  ? `Result ID: ${resultId}${
                      allResults?.results.find(
                        (r) => r.id.toString() === resultId
                      )
                        ? ` (Content ID: ${
                            allResults.results.find(
                              (r) => r.id.toString() === resultId
                            )?.content_id
                          })`
                        : ""
                    }`
                  : "Pilih Result ID dari list..."}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>
            {showDropdown && (
              <div className='absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto'>
                {loadingResults ? (
                  <div className='p-4 text-center text-sm text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin mx-auto mb-2' />
                    Memuat results...
                  </div>
                ) : allResults && allResults.results.length > 0 ? (
                  <div className='p-1'>
                    {allResults.results.map((item) => (
                      <button
                        key={item.id}
                        type='button'
                        onClick={() =>
                          handleResultIdSelect(
                            item.id.toString(),
                            item.content_id
                          )
                        }
                        className='w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='font-medium'>
                              Result ID: {item.id}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              Content ID: {item.content_id} •{" "}
                              {item.dominant_emotion}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className='p-4 text-center text-sm text-muted-foreground'>
                    Tidak ada results ditemukan
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content ID Input */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            Content ID <span className='text-red-500'>*</span>
          </label>
          <div className='flex gap-2'>
            <input
              type='number'
              value={contentId}
              onChange={(e) => {
                setContentId(e.target.value);
                setResultId("");
              }}
              placeholder='123'
              required
              className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
            <Button type='submit' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Loading...
                </>
              ) : (
                <>
                  <Search className='h-4 w-4 mr-2' />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950'>
          <div className='flex items-center gap-2'>
            <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg border p-4 ${getEmotionColor(
            result.dominant_emotion
          )}`}
        >
          <div className='space-y-4'>
            <div>
              <span className='text-sm font-medium'>Content ID: </span>
              <span className='text-sm'>{result.content_id}</span>
            </div>

            {/* Content Display */}
            {loadingContent ? (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Memuat content...</span>
              </div>
            ) : content ? (
              <div className='pt-3 border-t border-border'>
                <p className='text-sm font-medium mb-2'>Content:</p>
                <div className='rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap break-words max-h-60 overflow-y-auto'>
                  {content}
                </div>
              </div>
            ) : result && !loadingContent ? (
              <div className='pt-3 border-t border-border'>
                <p className='text-xs text-muted-foreground italic'>
                  Content tidak tersedia untuk Content ID {result.content_id}
                </p>
              </div>
            ) : null}

            <div>
              <span className='text-sm font-medium'>Dominant Emotion: </span>
              <span className='text-sm font-semibold capitalize'>
                {result.dominant_emotion}
              </span>
            </div>

            <div className='pt-3 border-t border-border'>
              <p className='text-sm font-medium mb-3'>Emotion Scores:</p>
              <div className='space-y-2'>
                {emotions.map((emotion) => {
                  const score = result[
                    `${emotion.name}_score` as keyof EmotionResultsResponse
                  ] as number;
                  const isDominant = result.dominant_emotion === emotion.name;
                  return (
                    <div
                      key={emotion.name}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='text-sm capitalize'>
                          {emotion.label}
                        </span>
                        {isDominant && (
                          <span className='text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground'>
                            Dominant
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-32 h-2 bg-muted rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-primary transition-all'
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                        <span className='text-sm font-medium w-12 text-right'>
                          {(score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className='pt-3 border-t border-border text-xs text-muted-foreground'>
              <div>ID: {result.id}</div>
              <div>
                Created At:{" "}
                {new Date(result.created_at).toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
