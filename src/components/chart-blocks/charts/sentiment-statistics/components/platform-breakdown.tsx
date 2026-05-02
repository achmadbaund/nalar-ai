"use client";

import { useMemo } from "react";
import { VChart } from "@visactor/react-vchart";
import type { IBarChartSpec } from "@visactor/vchart";
import { addThousandsSeparator } from "@/lib/utils";
import MetricCard from "../../average-tickets-created/components/metric-card";

interface PlatformBreakdownData {
  [platform: string]: {
    count: number;
    positive: number;
    negative: number;
    neutral: number;
  };
}

export default function PlatformBreakdown({
  platformBreakdown,
}: {
  platformBreakdown: PlatformBreakdownData | null | undefined;
}) {
  const chartData = useMemo(() => {
    if (!platformBreakdown) {
      return [];
    }

    const values: Array<{
      platform: string;
      type: string;
      value: number;
    }> = [];

    Object.entries(platformBreakdown).forEach(([platform, data]) => {
      if (data) {
        values.push({ platform, type: "Positive", value: data.positive || 0 });
        values.push({ platform, type: "Negative", value: data.negative || 0 });
        values.push({ platform, type: "Neutral", value: data.neutral || 0 });
      }
    });

    return values;
  }, [platformBreakdown]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!platformBreakdown) {
      return { totalPositive: 0, totalNegative: 0 };
    }

    let totalPositive = 0;
    let totalNegative = 0;

    Object.values(platformBreakdown).forEach((data) => {
      totalPositive += data.positive || 0;
      totalNegative += data.negative || 0;
    });

    return { totalPositive, totalNegative };
  }, [platformBreakdown]);

  if (!platformBreakdown || chartData.length === 0) {
    return (
      <section className="flex h-full flex-col gap-2">
        <h3 className="text-sm font-semibold">Platform Breakdown</h3>
        <div className="flex items-center justify-center min-h-32">
          <p className="text-sm text-muted-foreground">Tidak ada data platform</p>
        </div>
      </section>
    );
  }

  const spec: IBarChartSpec = {
    type: "bar",
    data: [
      {
        id: "platformData",
        values: chartData,
      },
    ],
    xField: "platform",
    yField: "value",
    seriesField: "type",
    padding: [10, 0, 10, 0],
    legends: {
      visible: false,
    },
    stack: false,
    tooltip: {
      trigger: ["click", "hover"],
    },
    bar: {
      state: {
        hover: {
          outerBorder: {
            distance: 2,
            lineWidth: 2,
          },
        },
      },
      style: {
        cornerRadius: [12, 12, 12, 12],
        zIndex: (datum: any) => {
          return datum.type === "Negative" ? 2 : 1;
        },
      },
    },
  };

  return (
    <section className="flex h-full flex-col gap-2">
      <h3 className="text-sm font-semibold">Platform Breakdown</h3>
      <div className="flex flex-wrap">
        <div className="my-4 flex w-52 shrink-0 flex-col justify-center gap-6">
          <MetricCard
            title="Total Positive"
            value={metrics.totalPositive}
            color="#22c55e"
          />
          <MetricCard
            title="Total Negative"
            value={metrics.totalNegative}
            color="#ef4444"
          />
        </div>
        <div className="relative h-96 min-w-[320px] flex-1">
        <VChart spec={spec} />
      </div>
    </div>
    </section>
  );
}

