"use client";

import { VChart } from "@visactor/react-vchart";
import type { IPieChartSpec } from "@visactor/vchart";
import { useMemo } from "react";
import { addThousandsSeparator } from "@/lib/utils";
import type { Datum } from "@visactor/vchart/esm/typings";

interface SentimentDistribution {
  positive: {
    count: number;
    percentage: number;
    avg_score: number;
  };
  negative: {
    count: number;
    percentage: number;
    avg_score: number;
  };
  neutral: {
    count: number;
    percentage: number;
    avg_score: number;
  };
}

interface ChartProps {
  sentimentDistribution: SentimentDistribution | null | undefined;
}

export default function Chart({ sentimentDistribution }: ChartProps) {
  const chartData = useMemo(() => {
    if (!sentimentDistribution) {
      return [
        { type: "Positive", value: 0, percentage: 0, avgScore: 0 },
        { type: "Negative", value: 0, percentage: 0, avgScore: 0 },
        { type: "Neutral", value: 0, percentage: 0, avgScore: 0 },
      ];
    }

    return [
      {
        type: "Positive",
        value: sentimentDistribution.positive?.count || 0,
        percentage: sentimentDistribution.positive?.percentage || 0,
        avgScore: sentimentDistribution.positive?.avg_score || 0,
      },
      {
        type: "Negative",
        value: sentimentDistribution.negative?.count || 0,
        percentage: sentimentDistribution.negative?.percentage || 0,
        avgScore: sentimentDistribution.negative?.avg_score || 0,
      },
      {
        type: "Neutral",
        value: sentimentDistribution.neutral?.count || 0,
        percentage: sentimentDistribution.neutral?.percentage || 0,
        avgScore: sentimentDistribution.neutral?.avg_score || 0,
      },
    ];
  }, [sentimentDistribution]);

  const total = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  // Transform data for donut chart (cumulative values)
  // Sort by value descending to show largest segments first
  const donutData = useMemo(() => {
    const sortedData = [...chartData].sort((a, b) => b.value - a.value);
    return sortedData.reduce(
      (acc, curr) => {
        acc.push({
          type: curr.type,
          value: curr.value + (acc[acc.length - 1]?.value || 0),
          realValue: curr.value,
          percentage: curr.percentage,
          avgScore: curr.avgScore,
        });
        return acc;
      },
      [] as Array<{
        type: string;
        value: number;
        realValue: number;
        percentage: number;
        avgScore: number;
      }>,
    );
  }, [chartData]);

  const spec: IPieChartSpec = {
    type: "pie",
    legends: [
      {
        type: "discrete",
        visible: true,
        orient: "bottom",
      },
    ],
    data: [
      {
        id: "sentimentData",
        values: donutData,
      },
    ],
    valueField: "value",
    categoryField: "type",
    outerRadius: 1,
    innerRadius: 0.88,
    startAngle: -180,
    padAngle: 0.6,
    endAngle: 0,
    centerY: "80%",
    layoutRadius: "auto",
    pie: {
      style: {
        cornerRadius: 6,
      },
    },
    tooltip: {
      trigger: ["click", "hover"],
      mark: {
        title: {
          visible: false,
        },
        content: [
          {
            key: (datum: any) => datum?.type,
            value: (datum: any) => {
              return `${addThousandsSeparator(datum?.realValue)} (${datum?.percentage?.toFixed(1) || 0}%)`;
            },
          },
          {
            key: "Avg Score",
            value: (datum: any) => datum?.avgScore?.toFixed(2) || "N/A",
          },
        ],
      },
    },
    indicator: [
      {
      visible: true,
        offsetY: "40%",
        title: {
      style: {
            text: "Total Posts Analyzed",
            fontSize: 16,
            opacity: 0.6,
          },
        },
      },
      {
        visible: true,
        offsetY: "64%",
        title: {
          style: {
            text: addThousandsSeparator(total),
            fontSize: 28,
          },
      },
    },
    ],
    color: ["#22c55e", "#ef4444", "#94a3b8"],
  };

  return <VChart spec={spec} />;
}

