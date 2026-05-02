"use client";

import { VChart } from "@visactor/react-vchart";
import type { IBarChartSpec } from "@visactor/vchart";
import { useMemo, useState, useEffect } from "react";
import { addThousandsSeparator } from "@/lib/utils";

interface AspectResult {
  content_id: number;
  aspect: string;
  sentiment_label: string;
  sentiment_score: number;
  mention_count: number;
  context_sentences: string[];
  created_at: string;
}

interface ChartProps {
  data: AspectResult[];
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
    // Group by date and aspect
    const dateAspectMap = new Map<string, Map<string, number>>();

    data.forEach((result) => {
      const createdDate = result.created_at
        ? new Date(result.created_at).toISOString().split("T")[0]
        : null;

      if (!createdDate) return;

      const aspect = result.aspect || "unknown";

      if (!dateAspectMap.has(createdDate)) {
        dateAspectMap.set(createdDate, new Map());
      }

      const aspectMap = dateAspectMap.get(createdDate)!;
      aspectMap.set(aspect, (aspectMap.get(aspect) || 0) + 1);
    });

    // Get all unique aspects
    const allAspects = new Set<string>();
    dateAspectMap.forEach((aspectMap) => {
      aspectMap.forEach((_, aspect) => {
        allAspects.add(aspect);
      });
    });

    // Transform to chart format
    const chartValues: Array<{
      date: string;
      aspect: string;
      count: number;
    }> = [];

    const sortedDates = Array.from(dateAspectMap.keys()).sort();

    sortedDates.forEach((date) => {
      const aspectMap = dateAspectMap.get(date)!;
      allAspects.forEach((aspect) => {
        chartValues.push({
          date,
          aspect,
          count: aspectMap.get(aspect) || 0,
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
          id: "aspectData",
          values: chartData,
        },
      ],
      xField: "date",
      yField: "count",
      seriesField: "aspect",
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
              key: (datum: any) => datum?.aspect,
              value: (datum: any) =>
                `${datum?.count} analysis${datum?.count !== 1 ? "es" : ""}`,
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

