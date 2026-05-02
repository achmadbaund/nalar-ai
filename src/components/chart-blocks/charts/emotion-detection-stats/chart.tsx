"use client";

import { VChart } from "@visactor/react-vchart";
import type { IBarChartSpec } from "@visactor/vchart";
import { useMemo, useState, useEffect } from "react";
import { addThousandsSeparator } from "@/lib/utils";

interface EmotionResult {
  content_id: number;
  dominant_emotion: string;
  anger_score: number;
  joy_score: number;
  sadness_score: number;
  fear_score: number;
  surprise_score: number;
  id: number;
  created_at: string;
}

interface ChartProps {
  data: EmotionResult[];
}

export default function Chart({ data }: ChartProps) {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const chartData = useMemo(() => {
    // Group by date and emotion
    const dateEmotionMap = new Map<string, Map<string, number>>();

    data.forEach((result) => {
      const createdDate = result.created_at
        ? new Date(result.created_at).toISOString().split("T")[0]
        : null;

      if (!createdDate) return;

      const emotion = result.dominant_emotion || "unknown";

      if (!dateEmotionMap.has(createdDate)) {
        dateEmotionMap.set(createdDate, new Map());
      }

      const emotionMap = dateEmotionMap.get(createdDate)!;
      emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1);
    });

    // Get all unique emotions
    const allEmotions = new Set<string>();
    dateEmotionMap.forEach((emotionMap) => {
      emotionMap.forEach((_, emotion) => {
        allEmotions.add(emotion);
      });
    });

    // Transform to chart format
    const chartValues: Array<{
      date: string;
      emotion: string;
      count: number;
    }> = [];

    const sortedDates = Array.from(dateEmotionMap.keys()).sort();

    sortedDates.forEach((date) => {
      const emotionMap = dateEmotionMap.get(date)!;
      allEmotions.forEach((emotion) => {
        chartValues.push({
          date,
          emotion,
          count: emotionMap.get(emotion) || 0,
        });
      });
    });

    return chartValues;
  }, [data]);

  const isMobile = windowWidth > 0 && windowWidth < 750;

  const spec: IBarChartSpec = useMemo(
    () => ({
      type: "bar",
      data: [
        {
          id: "emotionData",
          values: chartData,
        },
      ],
      xField: "date",
      yField: "count",
      seriesField: "emotion",
      padding: [10, 0, 10, 0],
      legends: {
        visible: true,
        orient: isMobile ? "bottom" : "top",
        position: "start",
        item: {
          spaceCol: isMobile ? 8 : 12,
          spaceRow: isMobile ? 4 : 8,
        },
      },
      stack: false,
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
        },
        // Add gap between bars to ensure all are visible
        barGap: 0.1,
        barCategoryGap: 0.2,
      },
      tooltip: {
        trigger: ["click", "hover"],
        mark: {
          content: [
            {
              key: (datum: any) => datum?.emotion,
              value: (datum: any) =>
                `${datum?.count} detection${datum?.count !== 1 ? "s" : ""}`,
            },
          ],
        },
      },
      axes: [
        {
          orient: "bottom",
          type: "band",
          domainLine: { visible: true },
          tick: { visible: true },
          label: {
            angle: isMobile ? -90 : -45,
            style: {
              textAlign: "right",
            },
            formatMethod: (value: string | string[]) => {
              const dateValue = Array.isArray(value) ? value[0] : value;
              try {
                const date = new Date(dateValue);
                return date.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: isMobile ? "numeric" : "short",
                });
              } catch {
                return dateValue;
              }
            },
          },
        },
        {
          orient: "left",
          type: "linear",
          domainLine: { visible: true },
          tick: { visible: true },
          label: {
            formatMethod: (value: string | string[]) => {
              const numValue = Array.isArray(value) ? parseFloat(value[0]) : parseFloat(value);
              if (isNaN(numValue)) return String(value);
              if (isMobile && numValue >= 1000) {
                return `${(numValue / 1000).toFixed(1)}k`;
              }
              return addThousandsSeparator(numValue);
            },
          },
        },
      ],
    }),
    [chartData, isMobile],
  );

  return <VChart spec={spec} />;
}

