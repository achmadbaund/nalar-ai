"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { createArticle, getSources, type Source } from "@/utils/api/printMediaApi";
import { toast } from "sonner";

interface AddArticleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddArticleModal({ open, onClose, onSuccess }: AddArticleModalProps) {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [formData, setFormData] = useState({
    source: "",
    title: "",
    content: "",
    author: "",
    category: "",
    page_number: "",
    publication_date: "",
    newspaper_name: "",
    confidence_score: "",
  });

  useEffect(() => {
    if (open) {
      fetchSources();
    }
  }, [open]);

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

  const fetchSources = async () => {
    try {
      // Fetch sources dengan filter hanya yang sudah completed untuk user experience lebih baik
      const response = await getSources({ 
        page_size: 100,
        ocr_status: "completed" // Hanya tampilkan sources yang sudah selesai OCR
      });
      setSources(response.results);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
      // Fallback: fetch semua sources jika filter gagal
      try {
        const response = await getSources({ page_size: 100 });
        setSources(response.results);
      } catch (fallbackErr) {
        console.error("Failed to fetch sources (fallback):", fallbackErr);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Pastikan source ID adalah integer yang valid
    if (!formData.source || isNaN(parseInt(formData.source))) {
      toast.error("Please select a valid source");
      setLoading(false);
      return;
    }

    const sourceId = parseInt(formData.source);
    if (isNaN(sourceId)) {
      toast.error("Please select a valid source");
      setLoading(false);
      return;
    }

    const submitData: any = {
      source: sourceId, // Kirim sebagai integer ID
      title: formData.title,
      content: formData.content,
      publication_date: formData.publication_date,
      newspaper_name: formData.newspaper_name,
    };

    if (formData.author) submitData.author = formData.author;
    if (formData.category) submitData.category = formData.category;
    if (formData.page_number) submitData.page_number = parseInt(formData.page_number);
    if (formData.confidence_score) submitData.confidence_score = parseFloat(formData.confidence_score);

    try {
      console.log("Submitting article data:", submitData);
      await createArticle(submitData);
      toast.success("Article created successfully");
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        source: "",
        title: "",
        content: "",
        author: "",
        category: "",
        page_number: "",
        publication_date: "",
        newspaper_name: "",
        confidence_score: "",
      });
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create article";
      toast.error(errorMessage);
      console.error("Error creating article:", err);
      console.error("Form data sent:", submitData);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add New Article</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Source *</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Pilih Source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.newspaper_name} - {new Date(source.publication_date).toLocaleDateString("id-ID")}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih source yang sudah diproses OCR untuk dikaitkan dengan artikel ini
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Page Number</label>
              <input
                type="number"
                value={formData.page_number}
                onChange={(e) => setFormData({ ...formData, page_number: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Confidence Score</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.confidence_score}
                onChange={(e) => setFormData({ ...formData, confidence_score: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Article
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}



