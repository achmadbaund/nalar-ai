"use client";

import { VChart } from "@visactor/react-vchart";
import type { IBarChartSpec } from "@visactor/vchart";
import { useMemo, useState, useEffect } from "react";
import { addThousandsSeparator } from "@/lib/utils";

interface Post {
  id: number;
  platform: string;
  source: string;
  engagement: {
    likes: number;
  };
  posted_at: string;
  crawled_at: string;
}

interface ChartProps {
  data: Post[];
}

export default function Chart({ data }: ChartProps) {
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
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
    // Group by date and platform
    const datePlatformMap = new Map<string, Map<string, number>>();

    data.forEach((post) => {
      // Extract date from crawled_at (format: "2025-12-19T10:59:21.226447+07:00")
      const crawledDate = post.crawled_at
        ? new Date(post.crawled_at).toISOString().split("T")[0]
        : null;

      if (!crawledDate) return;

      const platform = post.platform || "unknown";

      if (!datePlatformMap.has(crawledDate)) {
        datePlatformMap.set(crawledDate, new Map());
      }

      const platformMap = datePlatformMap.get(crawledDate)!;
      platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
    });

    // Get all unique platforms
    const allPlatforms = new Set<string>();
    datePlatformMap.forEach((platformMap) => {
      platformMap.forEach((_, platform) => {
        allPlatforms.add(platform);
      });
    });

    // Transform to chart format: date as x-axis, platform as series
    const chartValues: Array<{
      date: string;
      platform: string;
      count: number;
    }> = [];

    // Sort dates
    const sortedDates = Array.from(datePlatformMap.keys()).sort();

    sortedDates.forEach((date) => {
      const platformMap = datePlatformMap.get(date)!;
      allPlatforms.forEach((platform) => {
        chartValues.push({
          date,
          platform,
          count: platformMap.get(platform) || 0,
        });
      });
    });

    return chartValues;
  }, [data]);

  // Responsive padding based on window size
  const isMobile = windowWidth > 0 && windowWidth < 750;

  const spec: IBarChartSpec = useMemo(
    () => ({
      type: "bar",
      data: [
        {
          id: "crawlData",
          values: chartData,
        },
      ],
      xField: "date",
      yField: "count",
      seriesField: "platform",
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
      tooltip: {
        trigger: ["click", "hover"],
        mark: {
          content: [
            {
              key: (datum: any) => datum?.platform,
              value: (datum: any) =>
                `${datum?.count} crawl${datum?.count !== 1 ? "s" : ""}`,
            },
          ],
        },
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
        },
        // Add gap between bars to ensure all are visible
        barGap: 0.1,
        barCategoryGap: 0.2,
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
              // Format date to be more readable (e.g., "2025-12-19" -> "19 Dec")
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
              // Shorten large numbers on mobile
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

