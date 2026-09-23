import { AccessGate } from "@/components/auth/AccessGate";
import { RoleDashboard } from "@/components/dashboard/RoleDashboards";
import { useAuth } from "@/lib/auth/hooks";

export default function DashboardPage() {
  const { user } = useAuth();
  return <AccessGate page="DASHBOARD">{user && <RoleDashboard user={user} />}</AccessGate>;
}
