"use client";

import { useState } from "react";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InsightsPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate insights.");
      }

      setAnalysis(data.analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            AI Insights on the HR toolset
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Generate a BI-style analysis of the group&apos;s HR tools portfolio, powered by Claude.
          The model reviews the same 20 tools shown in the catalog and produces a structured
          summary covering the current state, strengths, gaps, and standardization opportunities.
        </p>
      </header>

      <div>
        <Button onClick={handleGenerate} disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating analysis...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate analysis
            </>
          )}
        </Button>
      </div>

      {loading && (
        <Card className="border-border">
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-4 h-5 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      )}

      {!loading && analysis && (
        <Card className="border-border">
          <CardContent>
            <article
              className="max-w-none text-sm leading-relaxed text-foreground
                [&_h2]:font-heading [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-primary [&_h2]:first:mt-0
                [&_p]:mb-3 [&_p]:text-muted-foreground
                [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground
                [&_li]:mb-1
                [&_strong]:font-semibold [&_strong]:text-foreground"
            >
              <Markdown>{analysis}</Markdown>
            </article>
          </CardContent>
        </Card>
      )}

      {!loading && !analysis && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate analysis&quot; to get an AI-generated read on the HR tools
              portfolio.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
