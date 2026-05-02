import {
  Gauge,
  type LucideIcon,
  Scan,
  DatabaseZap,
} from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href?: string;
  hidden?: boolean;
  children?: Navigation[];
};

export const siteConfig = {
  title: "Sentimen Media",
  description: "Sentiment Analysis with Nalar AI",
};

export const navigations: Navigation[] = [
  {
    icon: Gauge,
    name: "Dashboard",
    href: "/",
  },
  {
    icon: DatabaseZap,
    name: "Data Crawler",
    children: [
      {
        icon: Scan,
        name: "Print Media OCR",
        href: "/print-media-ocr",
      },
    ],
  },
];
