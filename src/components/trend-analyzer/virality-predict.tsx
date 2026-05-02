"use client";

import { useState } from "react";
import { Zap, Loader2, Sparkles, XCircle, Lightbulb } from "lucide-react";
import type { ViralityPredictRequest, ViralityPredictResponse } from "./types";

// Topic categories as specified by PM (8 categories)
const TOPIC_CATEGORIES = [
  "politik/kebijakan",
  "ekonomi",
  "sosial",
  "hukum",
  "korupsi",
  "lingkungan",
  "infrastruktur",
  "kesehatan"
] as const;

// Platform options with mapping to source_type
const PLATFORM_OPTIONS = [
  { value: "twitter", label: "Twitter", mapsTo: "social" },
  { value: "instagram", label: "Instagram", mapsTo: "social" },
  { value: "facebook", label: "Facebook", mapsTo: "social" },
  { value: "tiktok", label: "TikTok", mapsTo: "video" },
  { value: "youtube", label: "YouTube", mapsTo: "video" },
  { value: "news", label: "News Site", mapsTo: "news" },
  { value: "blog", label: "Blog", mapsTo: "blog" },
  { value: "other", label: "Other", mapsTo: "other" },
] as const;

export default function ViralityPredict() {
  const [formData, setFormData] = useState<Partial<ViralityPredictRequest>>({
    sentiment_score: 0.5,
    credibility_score: 0.5,
    emotion_distribution: {
      joy: 0.2,
      surprise: 0.1,
      anger: 0.1,
      fear: 0.05,
      sadness: 0.05,
    },
  });

  // Selected platform state (separate from source_type for mapping)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ViralityPredictResponse | null>(null);

  // Insights modal state
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Helper function to get feature label in Indonesian
  const getFeatureLabel = (key: string): string => {
    const labels: Record<string, string> = {
      sentiment_score: "Sentiment Positif",
      emotion_intensity: "Intensitas Emosi",
      topic_trending: "Topik Trending",
      source_credibility: "Kredibilitas Sumber",
      temporal_factor: "Faktor Waktu",
    };
    return labels[key] || key;
  };

  // Get insights from result
  const getViralityInsights = (result: ViralityPredictResponse) => {
    const { is_viral, virality_score, threshold, features } = result;
    const sortedFeatures = Object.entries(features).sort((a, b) => b[1] - a[1]);
    const strongest = sortedFeatures[0];
    const weakest = sortedFeatures[sortedFeatures.length - 1];

    return {
      status: is_viral ? "POTENSI VIRAL 🎉" : "Potensi Menengah",
      strongest: `${getFeatureLabel(strongest[0])}: ${(strongest[1] * 100).toFixed(0)}%`,
      weakest: `${getFeatureLabel(weakest[0])}: ${(weakest[1] * 100).toFixed(0)}%`,
      recommendation: is_viral
        ? "Konten ini berpotensi viral! Pastikan timing dan distribusi optimal untuk memaksimalkan jangkauan."
        : `Tingkatkan ${getFeatureLabel(weakest[0])} untuk meningkatkan potensi viral dari ${virality_score.toFixed(2)} ke ${threshold}.`,
    };
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Map platform to source_type
      const platformMapping = PLATFORM_OPTIONS.find(p => p.value === selectedPlatform);
      const sourceType = platformMapping?.mapsTo;

      const requestPayload: ViralityPredictRequest = {
        sentiment_score: formData.sentiment_score ?? 0.5,
        ...formData,
        ...(sourceType && { source_type: sourceType }),
      };

      const response = await fetch("/api/trend-analyzer/virality/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to predict virality");
      }

      const data: ViralityPredictResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to predict virality");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getViralityLevel = (score: number, threshold: number) => {
    if (score >= threshold) return { level: "Viral", color: "bg-purple-500", text: "text-purple-500" };
    if (score >= 0.8) return { level: "High", color: "bg-orange-500", text: "text-orange-500" };
    if (score >= 0.6) return { level: "Medium", color: "bg-yellow-500", text: "text-yellow-500" };
    return { level: "Low", color: "bg-gray-500", text: "text-gray-500" };
  };

  const viralityInfo = result ? getViralityLevel(result.virality_score, result.threshold) : null;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Predict Content Virality</h3>

        <div className="space-y-4">
          {/* Required Field: Sentiment Score */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Sentiment Score <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={formData.sentiment_score ?? 0.5}
                onChange={(e) => setFormData({ ...formData, sentiment_score: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="w-16 text-center font-mono text-sm">
                {(formData.sentiment_score ?? 0.5).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
            {/* Credibility Score */}
            <div>
              <label className="mb-2 block text-sm font-medium">Credibility Score (Optional)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.credibility_score ?? 0.5}
                  onChange={(e) =>
                    setFormData({ ...formData, credibility_score: parseFloat(e.target.value) })
                  }
                  className="flex-1"
                />
                <span className="w-16 text-center font-mono text-sm">
                  {(formData.credibility_score ?? 0.5).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Early Engagement Rate */}
            <div>
              <label className="mb-2 block text-sm font-medium">Early Engagement Rate (Optional)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.early_engagement_rate ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    early_engagement_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="0.0 - 1.0"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
            {/* Topic Category */}
            <div>
              <label className="mb-2 block text-sm font-medium">Topic Category (Optional)</label>
              <select
                value={formData.topic_category ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, topic_category: e.target.value || undefined })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih kategori topik...</option>
                {TOPIC_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Platform (maps to source_type) */}
            <div>
              <label className="mb-2 block text-sm font-medium">Platform (Optional)</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih platform...</option>
                {PLATFORM_OPTIONS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Emotion Distribution */}
          <div>
            <label className="mb-2 block text-sm font-medium">Emotion Distribution (Optional)</label>
            <div className="grid grid-cols-1 gap-3 phone:grid-cols-5">
              {[
                { key: "joy", label: "Joy" },
                { key: "surprise", label: "Surprise" },
                { key: "anger", label: "Anger" },
                { key: "fear", label: "Fear" },
                { key: "sadness", label: "Sadness" },
              ].map((emotion) => (
                <div key={emotion.key}>
                  <label className="mb-1 block text-xs text-muted-foreground">{emotion.label}</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      (formData.emotion_distribution?.[emotion.key as keyof typeof formData.emotion_distribution] ?? 0) as number
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emotion_distribution: {
                          ...formData.emotion_distribution,
                          [emotion.key]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading || formData.sentiment_score === undefined}
          className="mt-6 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Predicting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Predict Virality
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && viralityInfo && (
        <div className="space-y-4">
          {/* Virality Score Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Virality Prediction</h3>
                <p className="text-sm text-muted-foreground">
                  {result.is_viral ? "🎉 This content is likely to go viral!" : "This content has moderate virality potential."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-16 w-16 rounded-full ${viralityInfo.color} flex items-center justify-center`}>
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 phone:grid-cols-3">
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Virality Score</p>
                <p className={`mt-1 text-2xl font-bold ${viralityInfo.text}`}>
                  {result.virality_score.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Level</p>
                <p className={`mt-1 text-2xl font-bold ${viralityInfo.text}`}>
                  {viralityInfo.level}
                </p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Threshold</p>
                <p className="mt-1 text-2xl font-bold text-muted-foreground">
                  {result.threshold.toFixed(2)}
                </p>
              </div>
            </div>

            {result.ml_score !== null && (
              <div className="mt-4 rounded-lg bg-blue-500/10 p-4">
                <p className="text-sm text-muted-foreground">ML Model Score</p>
                <p className="mt-1 text-xl font-semibold text-blue-500">
                  {result.ml_score.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Feature Breakdown */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Feature Breakdown</h3>
            <div className="space-y-4">
              <FeatureBar
                label="Sentiment Score"
                value={result.features.sentiment_score}
                color="bg-blue-500"
              />
              <FeatureBar
                label="Emotion Intensity"
                value={result.features.emotion_intensity}
                color="bg-purple-500"
              />
              <FeatureBar
                label="Topic Trending"
                value={result.features.topic_trending}
                color="bg-green-500"
              />
              <FeatureBar
                label="Source Credibility"
                value={result.features.source_credibility}
                color="bg-orange-500"
              />
              <FeatureBar
                label="Temporal Factor"
                value={result.features.temporal_factor}
                color="bg-yellow-500"
              />
            </div>
          </div>

          {/* Insights Button */}
          <button
            onClick={() => setShowInsightsModal(true)}
            className="flex items-center gap-2 rounded-md border border-border bg-purple-500/10 px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-500/20 dark:text-purple-300 dark:hover:bg-purple-500/20"
          >
            <Lightbulb className="h-4 w-4" />
            Lihat Kesimpulan
          </button>
        </div>
      )}

      {/* Insights Modal */}
      {showInsightsModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInsightsModal(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-6">
              <div>
                <h3 className="text-xl font-semibold">⚡ Kesimpulan Viral</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Interpretasi hasil prediksi virality
                </p>
              </div>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="rounded-md p-2 hover:bg-muted"
                title="Close"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {(() => {
                const insights = getViralityInsights(result);
                return (
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/30">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="mt-1 text-xl font-bold text-purple-700 dark:text-purple-300">
                        {insights.status}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Virality Score</p>
                        <p className="mt-1 text-lg font-semibold">
                          {result.virality_score.toFixed(2)} / {result.threshold.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Threshold</p>
                        <p className="mt-1 text-lg font-semibold">
                          {(result.threshold * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Strongest Feature */}
                    <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/30">
                      <p className="text-sm text-green-700 dark:text-green-300">🎯 Faktor Terkuat</p>
                      <p className="mt-1 font-semibold">{insights.strongest}</p>
                    </div>

                    {/* Weakest Feature */}
                    <div className="rounded-lg bg-orange-500/10 p-4 border border-orange-500/30">
                      <p className="text-sm text-orange-700 dark:text-orange-300">📉 Faktor Terlemah</p>
                      <p className="mt-1 font-semibold">{insights.weakest}</p>
                    </div>

                    {/* Recommendation */}
                    <div className={`rounded-lg p-4 border ${result.is_viral ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                      <p className={`text-sm font-medium ${result.is_viral ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                        {result.is_viral ? '✅ Rekomendasi' : '💡 Tips'}
                      </p>
                      <p className={`mt-1 ${result.is_viral ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {insights.recommendation}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono font-medium">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
