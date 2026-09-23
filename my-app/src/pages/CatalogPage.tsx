import { AccessGate } from "@/components/auth/AccessGate";
import { CatalogView } from "@/components/catalog-view";

export default function CatalogPage() {
  return (
    <AccessGate page="CATALOG">
      <CatalogView />
    </AccessGate>
  );
}
