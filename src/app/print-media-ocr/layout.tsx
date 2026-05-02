import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Print Media OCR - Sentimen Media",
  description: "Print media sentiment analysis with Nalar AI and IndoBERT",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function PrintMediaOcrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
