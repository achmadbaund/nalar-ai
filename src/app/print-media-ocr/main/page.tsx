"use client";

import Container from "@/components/container";
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
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-6">
            <NalarAvatar message="Saya Nalar, AI analisis sentimen berbasis IndoBERT yang dilatih khusus untuk bahasa Indonesia. Saya langsung menganalisis emosi dan opini dari berita media cetak yang Anda upload." />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-center">
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">Upload Dokumen Media Cetak</h2>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Unggah file PDF atau gambar untuk dianalisis dengan IndoBERT</p>
            <Button
              onClick={() => setShowUploadModal(true)}
              size="lg"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg rounded-lg shadow-lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload File
            </Button>
          </div>

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
