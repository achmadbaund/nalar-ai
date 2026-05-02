"use client";

import { ChevronDown, ChevronRight, Hash, FileText, Layers } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Topic {
    id: number;
    slug: string;
    name: string;
    confidence_score: number;
}

interface Subtopic {
    id: number;
    slug: string;
    name: string;
    topic_id: number;
    similarity_score?: number;
}

interface Story {
    id: number;
    slug: string;
    title: string;
    subtopic_id: number;
    similarity_score?: number;
    is_representative?: boolean;
}

interface HierarchyData {
    topics: Topic[];
    subtopics: Subtopic[];
    stories: Story[];
}

interface HierarchyViewProps {
    data: HierarchyData | null;
}

export default function HierarchyView({ data }: HierarchyViewProps) {
    if (!data || !data.topics || data.topics.length === 0) {
        return <div className="text-muted-foreground text-sm">No hierarchical data available.</div>;
    }

    return (
        <div className="space-y-4">
            {data.topics.map((topic) => (
                <TopicItem key={topic.id} topic={topic} data={data} />
            ))}
        </div>
    );
}

function TopicItem({ topic, data }: { topic: Topic; data: HierarchyData }) {
    const [isOpen, setIsOpen] = useState(true);
    const subtopics = data.subtopics.filter((s) => s.topic_id === topic.id);

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <Hash className="h-4 w-4 text-primary" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{topic.name}</h4>
                        <Badge variant="secondary" className="text-[10px] h-5">
                            {(topic.confidence_score * 100).toFixed(0)}%
                        </Badge>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="border-t border-border bg-muted/10 p-4 pt-2 ml-4 border-l">
                    {subtopics.length === 0 ? (
                        <div className="text-xs text-muted-foreground pl-4 py-2">No subtopics assigned</div>
                    ) : (
                        subtopics.map((subtopic) => (
                            <SubtopicItem key={subtopic.id} subtopic={subtopic} data={data} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function SubtopicItem({ subtopic, data }: { subtopic: Subtopic; data: HierarchyData }) {
    const [isOpen, setIsOpen] = useState(true);
    const stories = data.stories.filter((s) => s.subtopic_id === subtopic.id);

    return (
        <div className="mt-2">
            <div
                className="flex items-center gap-2 py-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <Layers className="h-3 w-3 text-blue-500" />
                <span className="text-sm font-medium">{subtopic.name}</span>
                {subtopic.similarity_score !== undefined && (
                    <span className="text-xs text-muted-foreground">({(subtopic.similarity_score * 100).toFixed(0)}%)</span>
                )}
            </div>

            {isOpen && (
                <div className="pl-6 border-l border-border/50 ml-1.5 space-y-2 mt-1">
                    {stories.length === 0 ? (
                        <div className="text-xs text-muted-foreground">No stories assigned</div>
                    ) : (
                        stories.map((story) => (
                            <div key={story.id} className="flex items-start gap-2 py-1">
                                <FileText className="h-3 w-3 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-sm leading-tight text-foreground/90">{story.title}</p>
                                    {story.is_representative && (
                                        <Badge variant="outline" className="text-[10px] h-4 mt-1 border-green-200 text-green-700">Rep</Badge>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
