"use client";

import { useEffect, useState } from "react";
import { Loader2, Globe, Share2, Layers, Calendar } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type EntitySourceResult = {
    entity_name: string;
    source_id: string;
    source_type: string;
    sentiment_class: string;
    sentiment_score: number;
    mention_count: number;
    date: string;
};

type EntitySourceBreakdownResponse = {
    entity_name: string;
    results: EntitySourceResult[];
};

export default function SourceBreakdown({ entityName }: { entityName: string }) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<EntitySourceBreakdownResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && entityName) {
            fetchData();
        }
    }, [open, entityName]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/entity-sentiment/entity/by-source/${encodeURIComponent(entityName)}`);
            if (res.ok) {
                const payload = await res.json();
                setData(payload);
            }
        } catch (error) {
            console.error("Failed to fetch source breakdown", error);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment?.toLowerCase()) {
            case "positive":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "negative":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "neutral":
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Layers className="h-3 w-3" />
                    Sources
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Source Breakdown: {entityName}</DialogTitle>
                    <DialogDescription>
                        Sentiment analysis across different media sources.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : !data || data.results.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No source data available.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-6 gap-2 font-medium text-sm text-muted-foreground border-b pb-2">
                                <div className="col-span-2">Source</div>
                                <div>Type</div>
                                <div>Sentiment</div>
                                <div>Score</div>
                                <div className="text-right">Mentions</div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                                {data.results.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-6 gap-2 items-center text-sm py-2 border-b border-border last:border-0 hover:bg-muted/50 rounded-sm px-1">
                                        <div className="col-span-2 font-medium flex items-center gap-2">
                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                            {item.source_id}
                                        </div>
                                        <div>
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {item.source_type}
                                            </Badge>
                                        </div>
                                        <div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSentimentColor(item.sentiment_class)}`}>
                                                {item.sentiment_class}
                                            </span>
                                        </div>
                                        <div className="font-mono text-xs">
                                            {(item.sentiment_score * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-right font-medium">
                                            {item.mention_count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
