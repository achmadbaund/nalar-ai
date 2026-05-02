"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataCleaningFormProps {
  componentId: string;
  componentName: string;
  options: {
    value: string;
    label: string;
  }[];
}

export default function DataCleaningForm({
  componentId,
  componentName,
  options,
}: DataCleaningFormProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOption) {
      setError("Silakan pilih opsi cleaning terlebih dahulu");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setResult({
        component_id: componentId,
        component_name: componentName,
        selected_option: selectedOption,
        status: "success",
        message: `Data cleaning untuk ${componentName} dengan opsi ${selectedOption} berhasil dijalankan`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menjalankan cleaning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Informasi:</p>
            <p className="text-xs">
              Pilih opsi cleaning yang ingin dijalankan untuk {componentName}. Progress akan ditampilkan setelah proses dimulai.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Pilih Opsi Cleaning <span className="text-red-500">*</span>
            </label>
            <Select value={selectedOption} onValueChange={setSelectedOption}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih opsi..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Component:</span> {componentName} ({componentId})
            </p>
            {selectedOption && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Selected:</span> {options.find(o => o.value === selectedOption)?.label}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={loading || !selectedOption} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Memproses...
            </>
          ) : (
            "Jalankan Cleaning"
          )}
        </Button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold">Cleaning Berhasil Dijalankan</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Component: </span>
              <span className="font-medium">{result.component_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Opsi: </span>
              <span className="font-medium">{result.selected_option}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-medium capitalize text-green-600 dark:text-green-400">{result.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Message: </span>
              <span className="font-medium">{result.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
