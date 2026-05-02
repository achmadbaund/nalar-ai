"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Filter,
  X,
  Loader2,
  CheckCircle,
  Clock,
  Upload,
} from "lucide-react";
import type { Model, ModelType, ModelFormat } from "./types";

export default function ModelList() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<{
    model_type?: ModelType;
    is_active?: boolean;
  }>({});

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.model_type) params.set("model_type", filters.model_type);
      if (filters.is_active !== undefined)
        params.set("is_active", filters.is_active.toString());

      const queryString = params.toString();
      const url = `/api/model-management/models${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          typeof errorData.error === "string"
            ? errorData.error
            : errorData.error?.message ||
              errorData.detail ||
              JSON.stringify(errorData.error) ||
              "Failed to fetch models";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // API returns array directly, not wrapped in { models: [] }
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [filters]);

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  const getModelTypeBadge = (type: ModelType) => {
    const colors: Record<ModelType, string> = {
      sentiment: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      emotion: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      topic: "bg-green-500/10 text-green-500 border-green-500/20",
      aspect: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      entity: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };
    const defaultStyle = "bg-gray-500/10 text-gray-500 border-gray-500/20";
    return colors[type] || defaultStyle;
  };

  const getFormatBadge = (format: ModelFormat) => {
    const styles: Record<ModelFormat, string> = {
      pytorch: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      onnx: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      pickle: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };
    return styles[format] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <div className='space-y-6'>
      {/* Filter Toggle */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Model Registry</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className='flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted'
        >
          <Filter className='h-4 w-4' />
          Filters
          {activeFiltersCount > 0 && (
            <span className='rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground'>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='rounded-lg border border-border bg-card p-6 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h4 className='font-semibold'>Filter Models</h4>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
              >
                <X className='h-4 w-4' />
                Clear all
              </button>
            )}
          </div>
          <div className='grid grid-cols-1 gap-4 phone:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium'>
                Model Type
              </label>
              <select
                value={filters.model_type || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    model_type: (e.target.value || undefined) as
                      | ModelType
                      | undefined,
                  })
                }
                className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
              >
                <option value=''>All Types</option>
                <option value='sentiment'>Sentiment</option>
                <option value='emotion'>Emotion</option>
                <option value='topic'>Topic</option>
                <option value='aspect'>Aspect</option>
                <option value='entity'>Entity</option>
              </select>
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium'>
                Active Status
              </label>
              <select
                value={
                  filters.is_active === undefined
                    ? ""
                    : filters.is_active.toString()
                }
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    is_active:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
                  })
                }
                className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
              >
                <option value=''>All</option>
                <option value='true'>Active Only</option>
                <option value='false'>Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className='flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
          <p className='font-medium text-destructive'>Error</p>
          <p className='mt-1 text-sm text-destructive/80'>{error}</p>
        </div>
      )}

      {/* No Data */}
      {!loading && !error && models.length === 0 && (
        <div className='flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20'>
          <div className='text-center'>
            <Database className='mx-auto h-12 w-12 text-muted-foreground' />
            <p className='mt-4 text-muted-foreground'>No models found</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {activeFiltersCount > 0
                ? "Try adjusting your filters"
                : "Register your first model to get started"}
            </p>
          </div>
        </div>
      )}

      {/* Models Table */}
      {!loading && !error && models.length > 0 && (
        <div className='overflow-x-auto rounded-lg border border-border'>
          <table className='w-full'>
            <thead className='bg-muted/50'>
              <tr>
                <th className='px-4 py-3 text-left text-sm font-medium'>
                  Model Name
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium'>
                  Type
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium'>
                  Version
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium'>
                  Format
                </th>
                <th className='px-4 py-3 text-right text-sm font-medium'>
                  Size (MB)
                </th>
                <th className='px-4 py-3 text-right text-sm font-medium'>
                  Accuracy
                </th>
                <th className='px-4 py-3 text-center text-sm font-medium'>
                  Status
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium'>
                  Created
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {models.map((model) => (
                <tr key={model.id} className='hover:bg-muted/20'>
                  <td className='px-4 py-3 text-sm font-medium'>
                    {model.model_name}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getModelTypeBadge(
                        model.model_type
                      )}`}
                    >
                      {model.model_type}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-sm'>{model.version}</td>
                  <td className='px-4 py-3 text-sm'>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getFormatBadge(
                        model.format
                      )}`}
                    >
                      {model.format}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-right text-sm'>
                    {model.file_size_mb?.toFixed(2) || "N/A"}
                  </td>
                  <td className='px-4 py-3 text-right text-sm'>
                    {model.accuracy_score
                      ? `${model.accuracy_score.toFixed(1)}%`
                      : "N/A"}
                  </td>
                  <td className='px-4 py-3 text-center text-sm'>
                    {model.is_active ? (
                      <span className='inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500'>
                        <CheckCircle className='h-3 w-3' />
                        Active
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-500'>
                        <Clock className='h-3 w-3' />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-sm text-muted-foreground'>
                    {new Date(model.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && models.length > 0 && (
        <div className='text-center text-sm text-muted-foreground'>
          Showing {models.length} model{models.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
