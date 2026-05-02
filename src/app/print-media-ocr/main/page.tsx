"use client";

import Container from "@/components/container";
import ChartTitle from "@/components/chart-blocks/components/chart-title";
import PrintMediaOcr from "@/components/print-media-ocr";
import NalarAvatar from "@/components/nalar";
import UploadSourceModal from "@/components/print-media-ocr/upload-source-modal";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";

export default function PrintMediaOcrPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <Container className="py-6">
      <div className="flex gap-6">
        {/* Nalar Avatar Sidebar */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-6">
            <NalarAvatar message="Saya Nalar, AI analisis sentimen berbasis IndoBERT yang dilatih khusus untuk bahasa Indonesia. Saya langsung menganalisis emosi dan opini dari berita media cetak yang Anda upload." />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <ChartTitle title="Analisis Sentimen IndoBERT" />

          {/* Prominent Upload Section */}
          <div className="mt-6 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">Upload Dokumen Media Cetak</h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Unggah file PDF atau gambar untuk dianalisis dengan IndoBERT</p>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg rounded-lg shadow-lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload File
            </Button>
          </div>

          {/* Upload Modal */}
          <UploadSourceModal
            open={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => setShowUploadModal(false)}
          />

          <div className="mt-6">
            <PrintMediaOcr />
          </div>
        </div>
      </div>
    </Container>
  );
}
