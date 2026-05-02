"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopicTrain() {
  const DEFAULT_NUM_TOPICS = 10;
  const DEFAULT_PASSES = 10;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [responseBody, setResponseBody] = useState<any | null>(null);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setResponseBody(null);
    setLoading(true);
    try {
      // Backend ignores 'model' and auto-generates artifact name. Send only minimal params.
      const body = {
        num_topics: DEFAULT_NUM_TOPICS,
        passes: DEFAULT_PASSES,
      };

      const resp = await fetch("/api/topic-analyzer/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        setMessage(data?.error || `Train request failed (${resp.status})`);
      } else {
        setMessage("Train request accepted — backend will name the artifact automatically.");
        setResponseBody(data);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleTrain} className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Click the button below to start LDA training with default parameters.</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Training...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" /> Start Train
            </>
          )}
        </Button>
      </form>

      <div className="rounded-md border border-border p-4 bg-background">
        <h3 className="text-sm font-medium mb-2">About LDA Training</h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            This endpoint triggers LDA training on the topic-analyzer service. Training may take several minutes depending on dataset
            size. The backend will automatically persist the model artifact with a timestamped name (e.g. vYYYYMMDDT...Z).
          </p>
          <div>
            <div className="text-sm font-medium mb-1">Typical parameters (defaults used):</div>
            <ul className="list-disc ml-4 mt-2">
              <li>num_topics — number of latent topics to discover (default: 10)</li>
              <li>passes — how many passes over the corpus to run (default: 10)</li>
            </ul>
          </div>
          <p className="mt-2">Payload example sent to <code>/api/topic-analyzer/train</code> :</p>
          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">{`{
  "num_topics": 10,
  "passes": 10
}`}</pre>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-border p-3 bg-background">
          <div className="text-sm font-medium">Status</div>
          <div className="text-xs text-muted-foreground mt-1">{message}</div>
        </div>
      )}

      {responseBody && (
        <div className="rounded-md border border-border p-3 bg-background">
          <div className="text-sm font-medium">Response</div>
          <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(responseBody, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
