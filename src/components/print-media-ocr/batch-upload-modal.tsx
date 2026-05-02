"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Upload, File, Trash2 } from "lucide-react";
import { API_CONFIG } from "@/config/api";
import { toast } from "sonner";
import { validateOcrBatchFiles, validateOcrFile } from "@/utils/uploadValidation";
import { OCR_UPLOAD_LIMITS, formatFileSize } from "@/constants/upload";

interface BatchUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileMetadata {
  file: File;
  newspaper_name: string;
  publication_date: string;
}

export default function BatchUploadModal({ open, onClose, onSuccess }: BatchUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    
    // Validasi jumlah file
    if (fileMetadata.length + newFiles.length > OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH) {
      toast.error(`Maksimal ${OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH} file per upload.`);
      e.target.value = '';
      return;
    }

    // Validasi setiap file
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of newFiles) {
      const result = validateOcrFile(file);
      if (result.valid) {
        validFiles.push(file);
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    // Tampilkan error jika ada
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    // Hanya tambahkan file yang valid
    if (validFiles.length > 0) {
      const newMetadata: FileMetadata[] = validFiles.map((file) => ({
        file,
        newspaper_name: "",
        publication_date: "",
      }));
      setFileMetadata([...fileMetadata, ...newMetadata]);
    }

    // Reset input jika ada file yang tidak valid
    if (errors.length > 0) {
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFileMetadata(fileMetadata.filter((_, i) => i !== index));
  };

  const updateFileMetadata = (index: number, field: "newspaper_name" | "publication_date", value: string) => {
    setFileMetadata(
      fileMetadata.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileMetadata.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    // Validasi semua file harus memiliki newspaper name dan publication date
    const invalidFiles = fileMetadata.filter(
      (item) => !item.newspaper_name.trim() || !item.publication_date
    );
    if (invalidFiles.length > 0) {
      toast.error(`Please fill newspaper name and publication date for all ${invalidFiles.length} file(s)`);
      return;
    }

    setLoading(true);

    try {
      // Upload setiap file secara individual dengan metadata masing-masing
      const uploadPromises = fileMetadata.map((item) => {
        const formDataToSend = new FormData();
        formDataToSend.append("file", item.file);
        formDataToSend.append("newspaper_name", item.newspaper_name);
        formDataToSend.append("publication_date", item.publication_date);
        formDataToSend.append("auto_process", "true");
        
        // Gunakan API route Next.js untuk upload
        return fetch("/api/print-media-ocr/sources", {
          method: "POST",
          body: formDataToSend,
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `Failed to upload ${item.file.name}`);
          }
          return response.json();
        });
      });

      await Promise.all(uploadPromises);
      toast.success(`${fileMetadata.length} files uploaded successfully`);
      onSuccess();
      onClose();
      // Reset form
      setFileMetadata([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload files");
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
      <div className="relative w-full max-w-3xl rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Batch Upload Source Files</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Files * (Max 50 files)</label>
            <div
              className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!e.dataTransfer.files) return;

                const newFiles = Array.from(e.dataTransfer.files);
                
                // Validasi jumlah file
                if (fileMetadata.length + newFiles.length > OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH) {
                  toast.error(`Maksimal ${OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH} file per upload.`);
                  return;
                }

                // Validasi setiap file
                const errors: string[] = [];
                const validFiles: File[] = [];

                for (const file of newFiles) {
                  const result = validateOcrFile(file);
                  if (result.valid) {
                    validFiles.push(file);
                  } else if (result.error) {
                    errors.push(result.error);
                  }
                }

                // Tampilkan error jika ada
                if (errors.length > 0) {
                  errors.forEach((error) => toast.error(error));
                }

                // Hanya tambahkan file yang valid
                if (validFiles.length > 0) {
                  const newMetadata: FileMetadata[] = validFiles.map((file) => ({
                    file,
                    newspaper_name: "",
                    publication_date: "",
                  }));
                  setFileMetadata([...fileMetadata, ...newMetadata]);
                }
              }}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <div className="mt-2 text-sm text-muted-foreground">
                  <label htmlFor="batch-file-upload" className="cursor-pointer font-medium text-primary hover:text-primary/80">
                    Click to upload
                  </label>
                  <span> or drag and drop</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, JPG, PNG (Max {OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH} files, {OCR_UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB per file)
                </p>
                <input
                  id="batch-file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            </div>
            {fileMetadata.length > 0 && (
              <div className="mt-4 max-h-96 space-y-4 overflow-y-auto rounded-md border border-border bg-muted/50 p-4">
                {fileMetadata.map((item, index) => (
                  <div key={index} className="rounded-md bg-background p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(item.file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium">Newspaper Name *</label>
                        <input
                          type="text"
                          value={item.newspaper_name}
                          onChange={(e) => updateFileMetadata(index, "newspaper_name", e.target.value)}
                          required
                          placeholder="Enter newspaper name"
                          className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">Publication Date *</label>
                        <input
                          type="date"
                          value={item.publication_date}
                          onChange={(e) => updateFileMetadata(index, "publication_date", e.target.value)}
                          required
                          className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {fileMetadata.length} file(s) selected (Max {OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH})
              {fileMetadata.length > 0 && (
                <span className="ml-2">
                  • Total: {formatFileSize(fileMetadata.reduce((sum, item) => sum + item.file.size, 0))}
                </span>
              )}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fileMetadata.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload {fileMetadata.length > 0 && `(${fileMetadata.length} files)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

