import Link from "next/link";
import { ArrowRight, Bot, Building2, LayoutDashboard, LayoutGrid, LibraryBig, MapPin, Sparkles, Tags } from "lucide-react";
import { CategoryBarChart } from "@/components/charts/category-bar";
import { CountryBarChart } from "@/components/charts/country-bar";
import { ScopeDonutChart } from "@/components/charts/scope-donut";
import { DashboardSearch } from "@/components/dashboard-search";
import { KpiCard } from "@/components/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { byCategory, byCountry, byScope, tools, uniqueCategories } from "@/lib/analytics";
import { LESAFFRE_THEME } from "@/lib/config/branding";

const QUICK_ACCESS = [
  {
    href: "/dashboard",
    title: "Dashboard opérationnel",
    description: "Alertes, santé des outils et qualité des données.",
    icon: LayoutDashboard,
  },
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
  {
    href: "/insights",
    title: "Insights IA",
    description: "Analyses et recommandations sur le portefeuille d'outils.",
    icon: Sparkles,
  },
];

export default function DashboardPage() {
  const categoryData = byCategory();
  const scopeData = byScope();
  const countryData = byCountry(
    tools.filter((t) => t.country !== "Global"),
    5
  );

  const corporateCount = scopeData.find((s) => s.scope === "Corporate")?.count ?? 0;
  const localCount = scopeData.find((s) => s.scope === "Local")?.count ?? 0;

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
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Bienvenue au portail RH Lesaffre</h1>
          <p className="text-base text-white/90 sm:text-lg">{LESAFFRE_THEME.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/ai-assistant"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-lesaffre-blue transition-colors hover:bg-white/90 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              <Bot className="h-4 w-4" />
              Ouvrir l&apos;assistant RH
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/70 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              Voir le dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="quick-access" className="flex flex-col gap-4">
        <h2 id="quick-access" className="font-heading text-lg font-semibold text-foreground">
          Accès rapide
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACCESS.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
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
          <h2 className="font-heading text-xl font-bold text-foreground">Portefeuille d&apos;outils RH</h2>
          <p className="text-sm text-muted-foreground">
            Overview of the HR tools portfolio across the Lesaffre group.
          </p>
        </div>
        <DashboardSearch />
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total tools" value={tools.length} icon={LayoutGrid} />
        <KpiCard label="Categories" value={uniqueCategories().length} icon={Tags} />
        <KpiCard label="Corporate tools" value={corporateCount} icon={Building2} />
        <KpiCard label="Local tools" value={localCount} icon={MapPin} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="border-border lg:col-span-3">
          <CardHeader>
            <CardTitle>Tools by category</CardTitle>
            <CardDescription>
              Distribution of the {tools.length} tools across {categoryData.length} categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={categoryData} />
          </CardContent>
        </Card>

        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Corporate vs Local</CardTitle>
            <CardDescription>Global standards vs. country-specific tools</CardDescription>
          </CardHeader>
          <CardContent>
            <ScopeDonutChart data={scopeData} />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Top countries</CardTitle>
            <CardDescription>
              Where local tools are concentrated (Global-scope tools excluded)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CountryBarChart data={countryData} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
