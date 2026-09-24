import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Bot, LayoutGrid, LibraryBig, ShieldCheck, Tags } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { hrSubcategories } from "@/data/applications";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { useToolAnalytics } from "@/hooks/useToolAnalytics";
import { useAuth } from "@/lib/auth/hooks";
import { filterVisibleTools } from "@/lib/visibility";
import { LESAFFRE_THEME } from "@/lib/config/branding";

// No charts here (dropped, per the group's "keep it simple" request) — the
// catalog's own sub-category/scope filters already cover this data.
const QUICK_ACCESS = [
  {
    href: "/ai-assistant",
    title: "Assistant RH IA",
    description: "Posez vos questions RH à tout moment (mode démo).",
    icon: Bot,
  },
  {
    href: "/catalog",
    title: "Catalogue des outils",
    description: "Parcourez et recherchez les outils RH du groupe.",
    icon: LibraryBig,
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { tools } = useToolsCatalog();
  const { topTools, totalOpens } = useToolAnalytics();
  const visibleTools = filterVisibleTools(tools, user);
  const activeCount = visibleTools.filter((a) => (a.status ?? "Active") === "Active").length;
  const mostOpened = topTools(5);

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-lesaffre-blue to-lesaffre-dark-blue px-6 py-10 text-white sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-lesaffre-cyan/30 blur-3xl"
        />
        <div className="relative flex max-w-2xl flex-col gap-4">
          <span className="text-xs font-semibold tracking-widest text-white/90 uppercase">
            {LESAFFRE_THEME.productName}
          </span>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {user ? `Bienvenue, ${user.name.split(" ")[0]} !` : "Bienvenue au portail RH Lesaffre"}
          </h1>
          <p className="text-base text-white/90 sm:text-lg">{LESAFFRE_THEME.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              to="/ai-assistant"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-lesaffre-blue transition-colors hover:bg-white/90 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              <Bot className="h-4 w-4" />
              Ouvrir l'assistant RH
            </Link>
            <Link
              to="/catalog"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/70 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              Voir le catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="quick-access" className="flex flex-col gap-4">
        <h2 id="quick-access" className="font-heading text-lg font-semibold text-foreground">
          Accès rapide
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_ACCESS.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
                      {title}
                    </span>
                    <span className="text-sm text-muted-foreground">{description}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Portefeuille d'outils RH</h2>
          <p className="text-sm text-muted-foreground">
            Overview of the HR tools portfolio available to you.
          </p>
        </div>
        <Link to="/catalog" className="text-sm font-medium text-accent link-underline">
          Parcourir le catalogue →
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total tools" value={visibleTools.length} icon={LayoutGrid} />
        <KpiCard label="Categories" value={hrSubcategories.length} icon={Tags} />
        <KpiCard label="Active" value={activeCount} icon={ShieldCheck} />
        <KpiCard label="Corporate scope" value={visibleTools.filter((a) => a.scope === "Corporate").length} icon={Bot} />
      </section>

      {/* Lightweight stand-in for the PDD's "cible" Power BI usage dashboard
          (no Power BI license or real data source here) — counts "Open
          tool" clicks in this browser only. */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Outils les plus consultés</h2>
        </div>
        <Card className="border-border">
          <CardContent>
            {mostOpened.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun clic enregistré pour l'instant — ouvrez un outil depuis le catalogue pour commencer à voir des statistiques.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {mostOpened.map(({ id, count }) => {
                  const tool = tools.find((t) => t.id === id);
                  const max = mostOpened[0]?.count ?? 1;
                  return (
                    <li key={id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="w-32 shrink-0 truncate text-sm font-medium text-foreground">{tool?.title ?? id}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                        {count} clic{count > 1 ? "s" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {totalOpens} ouverture{totalOpens > 1 ? "s" : ""} enregistrée{totalOpens > 1 ? "s" : ""} dans ce navigateur (démo — un vrai
              tableau de bord Power BI nécessiterait Dataverse/une base de données partagée).
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
