"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FolderUp } from "lucide-react";

interface UploadModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectBatch: () => void;
}

export default function UploadModeModal({
  open,
  onClose,
  onSelectSingle,
  onSelectBatch,
}: UploadModeModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Select Upload Mode</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => {
              onSelectSingle();
              onClose();
            }}
            className="flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-muted/50 p-6 transition-colors hover:bg-muted"
          >
            <Upload className="h-8 w-8 text-primary" />
            <div className="text-center">
              <h3 className="font-semibold">Single Upload</h3>
              <p className="mt-1 text-sm text-muted-foreground">Upload one file at a time</p>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectBatch();
              onClose();
            }}
            className="flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-muted/50 p-6 transition-colors hover:bg-muted"
          >
            <FolderUp className="h-8 w-8 text-primary" />
            <div className="text-center">
              <h3 className="font-semibold">Batch Upload</h3>
              <p className="mt-1 text-sm text-muted-foreground">Upload up to 50 files at once</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}



