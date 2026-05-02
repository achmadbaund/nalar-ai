import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Print Media OCR - Sentimen Media",
  description: "Analisis sentimen media cetak dengan Nalar AI dan IndoBERT",
};

export default function PrintMediaOcrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
