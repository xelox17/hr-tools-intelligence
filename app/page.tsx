import { Building2, LayoutGrid, MapPin, Tags } from "lucide-react";
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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome, Anas Mehri
          </h1>
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
