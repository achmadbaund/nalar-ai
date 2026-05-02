"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    Search,
    CheckCircle2,
    Newspaper,
    Tv,
    Printer,
    Share2,
    RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// --- Types ---

export type ContentType = "social_media" | "news" | "print" | "broadcast";

export interface SelectedContent {
    id: number;
    content_id: number; // Normalized ID (usually same as id)
    text: string;
    type: ContentType;
    title?: string;
    source?: string;
    date?: string;
    meta?: any;
}

interface ContentSelectorProps {
    onSelect: (content: SelectedContent) => void;
    selectedContent?: SelectedContent | null;
}

// --- API Response Types (Simplified) ---

interface SocialPost {
    id: number;
    platform: string;
    content: string;
    posted_at?: string;
    account_username?: string;
}

interface OnlineArticle {
    id: number;
    title: string;
    content: string;
    source?: { name: string };
    url?: string;
    crawled_at?: string;
}

interface PrintArticle {
    id: number;
    title: string;
    content_text: string;
    publication_date?: string;
    source?: { name: string };
}

interface BroadcastTranscript {
    id: number;
    transcript_text: string; // or 'content' depending on API
    program_name: string;
    air_date?: string;
    channel?: { name: string };
}

// --- Component ---

export default function ContentSelector({ onSelect, selectedContent }: ContentSelectorProps) {
    const [activeTab, setActiveTab] = useState<ContentType>("news");
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchContent = useCallback(async () => {
        setLoading(true);
        setError(null);
        setItems([]);

        try {
            const offset = (page - 1) * limit;
            let url = "";

            switch (activeTab) {
                case "social_media":
                    url = `/api/posts?limit=${limit}&offset=${offset}`;
                    break;
                case "news":
                    url = `/api/online-media/articles?limit=${limit}&offset=${offset}`;
                    break;
                case "print":
                    url = `/api/print-media-ocr/articles?limit=${limit}&offset=${offset}`;
                    break;
                case "broadcast":
                    url = `/api/broadcast-media/transcripts?limit=${limit}&offset=${offset}`;
                    break;
            }

            if (searchQuery) {
                // Adjust query param based on API support. Assuming 'search' or 'q' works for most.
                // If specific APIs use different params, we'd adjust here.
                // For simplicity, we filter client-side if API doesn't support search, 
                // but ideally API handles it. 
                // 'posts' uses query params like 'username'. content APIs might use 'search'.
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${activeTab} content`);

            const data = await res.json();

            // Normalize responses
            let fetchedItems: any[] = [];
            let total = 0;

            if (activeTab === "social_media") {
                fetchedItems = data.data || [];
                total = data.pagination?.total || 0;
            } else if (activeTab === "news") {
                // DRF generic response often has 'results' and 'count'
                fetchedItems = data.results || data || [];
                total = data.count || fetchedItems.length;
            } else if (activeTab === "print") {
                fetchedItems = data.results || data || [];
                total = data.count || fetchedItems.length;
            } else if (activeTab === "broadcast") {
                fetchedItems = data.results || data || [];
                total = data.count || fetchedItems.length;
            }

            setItems(fetchedItems);
            setTotalPages(Math.ceil(total / limit) || 1);

        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to load content. Please check if services are running.");
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, searchQuery]);

    useEffect(() => {
        setPage(1); // Reset page on tab/search change
        fetchContent();
    }, [activeTab, fetchContent]);

    // Trigger fetch when page changes
    useEffect(() => {
        fetchContent();
    }, [page]);


    // Search handled directly via onKeyDown and onClick

    const selectItem = (item: any) => {
        let selected: SelectedContent | null = null;

        if (activeTab === "social_media") {
            const p = item as SocialPost;
            selected = {
                id: p.id,
                content_id: p.id,
                text: p.content,
                type: "social_media",
                source: `${p.platform} (@${p.account_username})`,
                date: p.posted_at,
                meta: p
            };
        } else if (activeTab === "news") {
            const a = item as OnlineArticle;
            selected = {
                id: a.id,
                content_id: a.id,
                text: `${a.title}\n\n${a.content}`,
                type: "news",
                title: a.title,
                source: a.source?.name || "Online News",
                date: a.crawled_at,
                meta: a
            };
        } else if (activeTab === "print") {
            const p = item as PrintArticle;
            selected = {
                id: p.id,
                content_id: p.id,
                text: `${p.title}\n\n${p.content_text}`,
                type: "print",
                title: p.title,
                source: p.source?.name || "Print Media",
                date: p.publication_date,
                meta: p
            };
        } else if (activeTab === "broadcast") {
            const b = item as BroadcastTranscript;
            // Broadcast might use 'transcript_text' or 'content'
            const text = b.transcript_text || (b as any).content || "";
            selected = {
                id: b.id,
                content_id: b.id,
                text: text,
                type: "broadcast",
                title: b.program_name,
                source: b.channel?.name || "Broadcast",
                date: b.air_date,
                meta: b
            };
        }

        if (selected) onSelect(selected);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Select Content to Analyze</h3>
                <Button variant="ghost" size="sm" onClick={fetchContent} disabled={loading}>
                    <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="social_media" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Social</span>
                    </TabsTrigger>
                    <TabsTrigger value="news" className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4" /> <span className="hidden sm:inline">Online</span>
                    </TabsTrigger>
                    <TabsTrigger value="print" className="flex items-center gap-2">
                        <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print</span>
                    </TabsTrigger>
                    <TabsTrigger value="broadcast" className="flex items-center gap-2">
                        <Tv className="h-4 w-4" /> <span className="hidden sm:inline">Broadcast</span>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search content..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        fetchContent();
                                    }
                                }}
                            />
                        </div>
                        <Button type="button" onClick={fetchContent}>Search</Button>
                    </div>

                    {loading && items.length === 0 ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="p-4 rounded-md bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm mb-4">
                            {error}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
                            No content found. Please verify data sources.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
                            {items.map((item, idx) => {
                                const isSelected = selectedContent?.id === item.id && selectedContent?.type === activeTab;
                                return (
                                    <Card
                                        key={`${activeTab}-${item.id || idx}`}
                                        className={cn(
                                            "p-3 cursor-pointer transition-colors hover:bg-muted/50 border-l-4",
                                            isSelected ? "border-l-primary bg-primary/5 border-primary" : "border-l-transparent"
                                        )}
                                        onClick={() => selectItem(item)}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                {activeTab === "social_media" ? (
                                                    <>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 capitalize">
                                                                {item.platform}
                                                            </Badge>
                                                            <span>@{item.account_username}</span>
                                                            <span>• {item.posted_at ? new Date(item.posted_at).toLocaleDateString() : '-'}</span>
                                                        </div>
                                                        <p className="text-sm line-clamp-2">{item.content}</p>
                                                    </>
                                                ) : activeTab === "news" ? (
                                                    <>
                                                        <h4 className="text-sm font-medium line-clamp-1 text-primary">{item.title}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground my-1">
                                                            <span>{item.source?.name || "Unknown Source"}</span>
                                                            <span>• {item.crawled_at ? new Date(item.crawled_at).toLocaleDateString() : '-'}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                                                    </>
                                                ) : activeTab === "print" ? (
                                                    <>
                                                        <h4 className="text-sm font-medium line-clamp-1 text-primary">{item.title}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground my-1">
                                                            <span>{item.source?.name || "Unknown Source"}</span>
                                                            <span>• {item.publication_date ? new Date(item.publication_date).toLocaleDateString() : '-'}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{item.content_text}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h4 className="text-sm font-medium line-clamp-1 text-primary">{item.program_name}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground my-1">
                                                            <span>{item.channel?.name || "Unknown Channel"}</span>
                                                            <span>• {item.air_date ? new Date(item.air_date).toLocaleDateString() : '-'}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {item.transcript_text || item.content}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}

                </div>
            </Tabs>
        </div>
    );
}
