"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { NewsSourceFormData } from "@/types/online-media";

interface NewsSourceFormProps {
  initialData?: Partial<NewsSourceFormData>;
  onSubmit: (data: NewsSourceFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export default function NewsSourceForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}: NewsSourceFormProps) {
  const [formData, setFormData] = useState<NewsSourceFormData>({
    name: initialData?.name || "",
    url: initialData?.url || "",
    tier: initialData?.tier || 2,
    category: initialData?.category || "",
    active: initialData?.active ?? true,
    extraction_strategy: initialData?.extraction_strategy || "generic",
    use_llm_fallback: initialData?.use_llm_fallback ?? true,
    crawl_config: initialData?.crawl_config || {},
    extraction_script: initialData?.extraction_script || {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {/* Name */}
        <div>
          <label className='block text-sm font-medium mb-1'>Name *</label>
          <input
            type='text'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder='Source name'
            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            required
          />
        </div>

        {/* URL */}
        <div>
          <label className='block text-sm font-medium mb-1'>URL *</label>
          <input
            type='url'
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder='https://example.com'
            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            required
          />
        </div>

        {/* Tier */}
        <div>
          <label className='block text-sm font-medium mb-1'>
            Priority Tier
          </label>
          <select
            value={formData.tier}
            onChange={(e) =>
              setFormData({
                ...formData,
                tier: Number(e.target.value) as 1 | 2 | 3,
              })
            }
            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          >
            <option value={1}>Tier 1 (High Priority - Every 1 hour)</option>
            <option value={2}>Tier 2 (Medium Priority - Every 6 hours)</option>
            <option value={3}>Tier 3 (Low Priority - Every 24 hours)</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className='block text-sm font-medium mb-1'>Category</label>
          <input
            type='text'
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            placeholder='e.g., Technology, Politics, Sports'
            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          />
        </div>

        {/* Extraction Strategy */}
        <div>
          <label className='block text-sm font-medium mb-1'>
            Extraction Strategy
          </label>
          <select
            value={formData.extraction_strategy}
            onChange={(e) =>
              setFormData({
                ...formData,
                extraction_strategy: e.target.value as "generic" | "specific",
              })
            }
            className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          >
            <option value='generic'>Generic Crawl4AI</option>
            <option value='specific'>Specific Script</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className='flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='active'
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className='h-4 w-4'
            />
            <label htmlFor='active' className='text-sm'>
              Active
            </label>
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='use_llm_fallback'
              checked={formData.use_llm_fallback}
              onChange={(e) =>
                setFormData({ ...formData, use_llm_fallback: e.target.checked })
              }
              className='h-4 w-4'
            />
            <label htmlFor='use_llm_fallback' className='text-sm'>
              Use LLM Fallback
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex justify-end gap-2 pt-4 border-t'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type='submit' disabled={loading}>
          {loading ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEdit ? "Update Source" : "Create Source"}</>
          )}
        </Button>
      </div>
    </form>
  );
}
