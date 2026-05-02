"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Upload, File } from "lucide-react";
import { uploadSource } from "@/utils/api/printMediaApi";
import { toast } from "sonner";
import { validateOcrFile } from "@/utils/uploadValidation";
import { OCR_UPLOAD_LIMITS, formatFileSize } from "@/constants/upload";

interface UploadSourceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadSourceModal({ open, onClose, onSuccess }: UploadSourceModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    newspaper_name: "",
    publication_date: "",
    auto_process: true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const { valid, error } = validateOcrFile(selectedFile);
    if (!valid) {
      toast.error(error || "File tidak valid");
      e.target.value = ''; // Reset input
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      formDataToSend.append("newspaper_name", formData.newspaper_name);
      formDataToSend.append("publication_date", formData.publication_date);
      formDataToSend.append("auto_process", formData.auto_process ? "true" : "false");

      await uploadSource(formDataToSend);
      toast.success("File uploaded successfully");
      onSuccess();
      // Dispatch event to refresh sources list
      window.dispatchEvent(new CustomEvent("source-upload-success"));
      onClose();
      // Reset form
      setFile(null);
      setFormData({
        newspaper_name: "",
        publication_date: "",
        auto_process: true,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Source File</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">File *</label>
            <div
              className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files?.[0];
                if (!droppedFile) return;

                const { valid, error } = validateOcrFile(droppedFile);
                if (!valid) {
                  toast.error(error || "File tidak valid");
                  return;
                }

                setFile(droppedFile);
              }}
            >
              <div className="text-center">
                {file ? (
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2 text-sm text-muted-foreground">
                      <label htmlFor="file-upload" className="cursor-pointer font-medium text-primary hover:text-primary/80">
                        Click to upload
                      </label>
                      <span> or drag and drop</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, JPG, PNG (Max {OCR_UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB per file)
                    </p>
                  </>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            </div>
            {file && (
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Ukuran: {formatFileSize(file.size)}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove File
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Newspaper Name *</label>
              <input
                type="text"
                value={formData.newspaper_name}
                onChange={(e) => setFormData({ ...formData, newspaper_name: e.target.value })}
                required
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Publication Date *</label>
              <input
                type="date"
                value={formData.publication_date}
                onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                required
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_process"
              checked={formData.auto_process}
              onChange={(e) => setFormData({ ...formData, auto_process: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="auto_process" className="text-sm font-medium">
              Auto Process OCR
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

