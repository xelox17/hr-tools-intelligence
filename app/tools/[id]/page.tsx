import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe2, MapPin, Tag, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolCard } from "@/components/tool-card";
import { CategoryIcon } from "@/lib/category-icons";
import { getSimilarTools, getToolById, tools } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return tools.map((tool) => ({ id: tool.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tool = getToolById(id);
  if (!tool) return { title: "Tool not found — HR Tools Intelligence" };
  return {
    title: `${tool.name} — HR Tools Intelligence`,
    description: tool.shortDescription,
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = getToolById(id);
  if (!tool) notFound();

  const similar = getSimilarTools(tool);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/catalog"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary">
            <CategoryIcon category={tool.category} className="h-7 w-7" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">{tool.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant={tool.scope === "Corporate" ? "default" : "secondary"}>
                {tool.scope}
              </Badge>
              <Badge variant="outline">{tool.category}</Badge>
            </div>
          </div>
        </div>

        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          Open official site
          <ExternalLink className="h-4 w-4" />
        </a>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {tool.description.map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <MetaRow icon={Tag} label="Category" value={tool.category} />
            <MetaRow icon={Globe2} label="Scope" value={tool.scope} />
            <MetaRow icon={MapPin} label="Country" value={tool.country} />
            <div className="flex items-start gap-2.5">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Official URL</span>
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium break-all text-accent hover:underline"
                >
                  {tool.url.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {similar.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Similar tools</h2>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {similar.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}
