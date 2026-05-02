"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    CheckCircle,
    Database,
    BarChart3,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CleaningStatisticsPanelProps {
    componentId?: string;
}

export default function CleaningStatisticsPanel({ componentId }: CleaningStatisticsPanelProps) {
    const [stats, setStats] = useState({
        totalCollected: 0,
        uncleanedTotal: 0,
        cleanedTotal: 0,
        loading: true,
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                // If we have a specific componentId, we primarily care about how many items were processed by IT.
                // But for general stats, we might show context.

                const cleanedParams = new URLSearchParams();
                cleanedParams.set("limit", "1");
                if (componentId) {
                    cleanedParams.set("component_id", componentId);
                }

                // Parallel requests for counts
                const [onlineRes, socialRes, cleanedRes] = await Promise.all([
                    fetch("/api/online-media/articles?page_size=1").then(r => r.json()),
                    fetch("/api/posts?limit=1").then(r => r.json()),
                    fetch(`/api/cleaning/cleaned-data?${cleanedParams.toString()}`).then(r => r.json())
                ]);

                // Online media count
                const onlineCount = onlineRes.count || 0;

                // Social media count
                let socialCount = 0;
                if (Array.isArray(socialRes)) socialCount = socialRes.length; // Fallback
                else socialCount = socialRes.total || socialRes.count || 0;

                // Cleaned/Processed count specific to this component
                const cleanedCount = cleanedRes.total || cleanedRes.count || 0;

                const totalCollected = onlineCount + socialCount;
                // "Uncleaned" logic is a bit vague when specific component is used, 
                // but let's assume it means "Not yet processed by this component".
                // However, totalCollected is GLOBAL raw data.
                // If componentId is 2.2 (Processors), input is Cleaned Data (2.1).
                // So "Uncleaned" is actually "Unprocessed Cleaned Data".
                // Ideally we would fetch count of 2.1 data to know the Input size.
                // For now, keeping it simple: Total Raw vs Processed by THIS component.
                const uncleanedTotal = Math.max(0, totalCollected - cleanedCount);

                setStats({
                    totalCollected,
                    uncleanedTotal,
                    cleanedTotal: cleanedCount,
                    loading: false,
                });

            } catch (error) {
                console.error("Failed to fetch stats", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        }

        fetchStats();
    }, [componentId]);

    const StatCard = ({
        title,
        value,
        icon: Icon,
        color,
    }: {
        title: string;
        value: string | number;
        icon: any;
        color: string;
    }) => (
        <div className='border rounded-lg p-4 bg-background'>
            <div className='flex items-center gap-3'>
                <div className={cn("p-2 rounded-lg text-white", color)}>
                    <Icon className='h-5 w-5' />
                </div>
                <div>
                    <p className='text-sm text-muted-foreground'>{title}</p>
                    <p className='text-2xl font-semibold'>
                        {stats.loading ? (
                            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground/30' />
                        ) : (
                            value
                        )}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <StatCard
                title='Data Collecting'
                value={stats.totalCollected.toLocaleString()}
                icon={FileText}
                color='bg-blue-500'
            />
            <StatCard
                title='Data Uncleaned'
                value={stats.uncleanedTotal.toLocaleString()}
                icon={Database}
                color='bg-purple-500'
            />
            <StatCard
                title='Cleaned Records'
                value={stats.cleanedTotal.toLocaleString()}
                icon={CheckCircle}
                color='bg-green-500'
            />
            <StatCard
                title='Total Cleaned'
                value={stats.cleanedTotal.toLocaleString()}
                icon={BarChart3}
                color='bg-orange-500'
            />
        </div>
    );
}
