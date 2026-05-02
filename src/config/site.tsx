import {
  Gauge,
  type LucideIcon,
  MessagesSquare,
  Facebook,
  Bot,
  Brain,
  Sparkles,
  Smile,
  TrendingUp,
  Database,
  Network,
  Layers,
  Tags,
  Scan,
  DatabaseZap,
  Newspaper,
  Users,
  Radio,
  Eraser,
  Wand2,
  Cpu,
  BadgeCheck,
  FileText,
  Workflow,
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
  description: "Analisis Sentimen dengan Nalar AI",
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
        icon: Bot,
        name: "Apify Crawler",
        href: "/apify-crawler",
      },
      {
        icon: Newspaper,
        name: "Online Media",
        href: "/online-media",
      },
      {
        icon: Radio,
        name: "Broadcast Media",
        href: "/broadcast-media",
        hidden: true,
      },
      {
        icon: Facebook,
        name: "Facebook Scraping",
        href: "/facebook-scraping",
        hidden: true,
      },
      {
        icon: Scan,
        name: "Print Media OCR",
        href: "/print-media-ocr",
      },
    ],
  },
  {
    icon: Eraser,
    name: "Data Cleaning",
    hidden: true,
    children: [
      {
        icon: Wand2,
        name: "Core Cleaning Engine",
        href: "/data-cleaning/core-cleaning-engine",
      },
      {
        icon: Cpu,
        name: "Processors",
        href: "/data-cleaning/processors",
      },
      {
        icon: BadgeCheck,
        name: "Validators & Quality Scoring",
        href: "/data-cleaning/validators-quality",
      },
      {
        icon: FileText,
        name: "Metadata Enrichment",
        href: "/data-cleaning/metadata-enrichment",
      },
      {
        icon: Workflow,
        name: "Celery Tasks & Orchestration",
        href: "/data-cleaning/celery-orchestration",
      },
    ],
  },
  {
    icon: Brain,
    name: "Sentiment Core",
    href: "/sentiment-core",
  },
  {
    icon: Sparkles,
    name: "Aspect Sentiment",
    href: "/aspect-sentiment",
  },
  {
    icon: MessagesSquare,
    name: "Entity Sentiment",
    href: "/entity-sentiment",
  },
  {
    icon: Smile,
    name: "Emotion Detection",
    href: "/emotion-detection",
  },
  {
    icon: Tags,
    name: "Topic Analyzer",
    href: "/topic-analyzer",
    hidden: true,
  },
  {
    icon: TrendingUp,
    name: "Trend Analyzer",
    href: "/trend-analyzer",
    hidden: true,
  },
  {
    icon: Database,
    name: "Model Management",
    href: "/model-management",
    hidden: true,
  },
  {
    icon: Network,
    name: "AI Gateway",
    href: "/ai-gateway",
    hidden: true,
  },
  {
    icon: Layers,
    name: "Batch Processor",
    href: "/batch-processor",
    hidden: true,
  },
];
