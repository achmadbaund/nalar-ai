"use client";

import { useState, useEffect } from "react";
import { Brain, Loader2, XCircle, CheckCircle, Users, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentSelector, { SelectedContent } from "../topic-analyzer/content-selector";

type Entity = {
	entity_name: string;
	entity_type: string;
	source?: string;
	sentiment_label?: string;
	sentiment_score?: number;
	mention_count?: number;
	context_sentences?: string[];
};

type AnalyzeResponse = {
	content_id: number;
	entities: Entity[];
	total_entities: number;
	processing_time?: number;
};

export default function EntityAnalyze() {
	const [contentId, setContentId] = useState("");
	const [text, setText] = useState("");
	const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
	const [contentType, setContentType] = useState<string>("news");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<AnalyzeResponse | null>(null);


	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setResults(null);
		setLoading(true);

		try {
			if (!contentId.trim()) throw new Error("Content ID is required");
			if (!text.trim()) throw new Error("Text is required");
			// Preprocess the text to improve NER recall on noisy inputs (hashtags, URLs, glued tokens)
			const preprocessText = (raw: string) => {
				if (!raw) return raw;
				// Insert a space before any '#' to separate glued hashtags like "music#ai" -> "music #ai"
				let t = raw.replace(/#/g, " #");
				// Remove URLs
				t = t.replace(/https?:\/\/\S+/gi, "");
				// Split tokens and remove hashtag tokens (tokens starting with '#')
				const tokens = t.split(/\s+/).filter((tok) => tok && !tok.startsWith("#"));
				// Collapse whitespace and trim
				return tokens.join(" ").replace(/\s{2,}/g, " ").trim();
			};

			const cleaned = preprocessText(text.trim());

			const response = await fetch("/api/entity-sentiment/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					content_id: Number(contentId),
					text: cleaned,
					content_type: contentType,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				if (response.status === 504) {
					throw new Error("Analysis timed out. Please try again.");
				}
				throw new Error(data.error || "Failed to analyze");
			}

			setResults(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleContentSelect = (content: SelectedContent) => {
		setSelectedContent(content);
		setContentId(content.content_id.toString());
		setText(content.text);
		setContentType(content.type);
		// Clear previous results when selection changes
		setResults(null);
		setError(null);
	};

	const groupedEntities = results?.entities.reduce((acc, entity) => {
		const type = (entity.entity_type || "UNKNOWN").toUpperCase();
		if (!acc[type]) acc[type] = [];
		acc[type].push(entity);
		return acc;
	}, {} as Record<string, Entity[]>);

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 gap-4">
					<div>
						<ContentSelector
							onSelect={handleContentSelect}
							selectedContent={selectedContent}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label htmlFor="contentId" className="block text-sm font-medium mb-2">
								Content ID
							</label>
							<input
								id="contentId"
								type="number"
								value={contentId}
								onChange={(e) => {
									setContentId(e.target.value);
								}}
								placeholder="Enter content ID (e.g., 12345)"
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								disabled={loading}
							/>
						</div>
						<div>
							<label htmlFor="contentType" className="block text-sm font-medium mb-2">
								Content Type
							</label>
							<select
								id="contentType"
								value={contentType}
								onChange={(e) => setContentType(e.target.value)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								disabled={loading}
							>
								<option value="news">Online News</option>
								<option value="social_media">Social Media</option>
								<option value="print">Print Media</option>
								<option value="broadcast">Broadcast</option>
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="text" className="block text-sm font-medium mb-2">
							Article Text
						</label>
						<textarea
							id="text"
							value={text}
							onChange={(e) => {
								setText(e.target.value);
							}}
							placeholder="Paste article text here for entity extraction and sentiment analysis..."
							rows={8}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
							disabled={loading}
						/>
					</div>
				</div>

				<Button type="submit" disabled={loading} className="w-full">
					{loading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...
						</>
					) : (
						<>
							<Brain className="h-4 w-4 mr-2" /> Analyze Entity Sentiment
						</>
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

			{results && (
				<div className="space-y-4">
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
							<p className="text-sm text-green-600 dark:text-green-400">
								Analysis complete! Found {results.total_entities} entities
								{results.processing_time && ` in ${results.processing_time.toFixed(2)}s`}
							</p>
						</div>
					</div>

					{/* (Sentiment summary is now provided by entity-sentiment/analyze) */}

					{results.entities.length === 0 ? (
						<div className="text-center py-8 text-sm text-muted-foreground">
							<p>No entities found.</p>
							<p className="mt-2">Try seeding NER or add user keywords.</p>
						</div>
					) : (
						<div className="space-y-6">
							{/* PEOPLE */}
							{groupedEntities?.["PERSON"] && (
								<div>
									<div className="flex items-center gap-2 mb-3 text-sm font-medium">
										<Users className="h-4 w-4" /> PEOPLE ({groupedEntities["PERSON"].length})
									</div>
									<div className="rounded border border-border p-3 space-y-2">
										{groupedEntities["PERSON"].map((entity, idx) => (
											<div key={idx} className="text-sm">
												<span className="font-medium">{entity.entity_name}</span>
												{entity.source && (
													<span className="ml-2 text-xs text-muted-foreground">({entity.source})</span>
												)}
												{entity.sentiment_label && (
													<span className="ml-2 text-xs">
														• {entity.sentiment_label.toUpperCase()}
														{entity.sentiment_score && ` (${entity.sentiment_score.toFixed(2)})`}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* ORGANIZATIONS */}
							{groupedEntities?.["ORGANIZATION"] && (
								<div>
									<div className="flex items-center gap-2 mb-3 text-sm font-medium">
										<Building className="h-4 w-4" /> ORGANIZATIONS ({groupedEntities["ORGANIZATION"].length})
									</div>
									<div className="rounded border border-border p-3 space-y-2">
										{groupedEntities["ORGANIZATION"].map((entity, idx) => (
											<div key={idx} className="text-sm">
												<span className="font-medium">{entity.entity_name}</span>
												{entity.source && (
													<span className="ml-2 text-xs text-muted-foreground">({entity.source})</span>
												)}
												{entity.sentiment_label && (
													<span className="ml-2 text-xs">
														• {entity.sentiment_label.toUpperCase()}
														{entity.sentiment_score && ` (${entity.sentiment_score.toFixed(2)})`}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* LOCATIONS */}
							{(groupedEntities?.["LOCATION"] || groupedEntities?.["GPE"]) && (
								<div>
									<div className="flex items-center gap-2 mb-3 text-sm font-medium">
										<MapPin className="h-4 w-4" /> LOCATIONS (
										{(groupedEntities["LOCATION"]?.length || 0) + (groupedEntities["GPE"]?.length || 0)})
									</div>
									<div className="rounded border border-border p-3 space-y-2">
										{[...(groupedEntities["LOCATION"] || []), ...(groupedEntities["GPE"] || [])].map(
											(entity, idx) => (
												<div key={idx} className="text-sm">
													<span className="font-medium">{entity.entity_name}</span>
													{entity.source && (
														<span className="ml-2 text-xs text-muted-foreground">({entity.source})</span>
													)}
													{entity.sentiment_label && (
														<span className="ml-2 text-xs">
															• {entity.sentiment_label.toUpperCase()}
															{entity.sentiment_score && ` (${entity.sentiment_score.toFixed(2)})`}
														</span>
													)}
												</div>
											),
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
