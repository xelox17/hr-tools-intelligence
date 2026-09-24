import type { Application, RoleLevel } from "@/data/applications";
import type { User, UserRole } from "@/lib/auth/types";

/**
 * PDD §5.3 "Visibilité par pays & rôle (cible)": a tool with no country
 * restriction is visible to everyone ("Global"); a tool scoped to a country
 * only appears for employees in that country. There is no real Azure AD
 * profile to read a real employee's country/role from (still a demo login),
 * so this filters against the signed-in demo account's own `country`/`role`
 * — the filtering logic itself is real, only the identity source is demo.
 */
function isCountryVisible(tool: Application, userCountry: string | undefined): boolean {
  if (!tool.country) return true; // No restriction = Global.
  return tool.country === userCountry;
}

// Each role's "tier": which RoleLevel values it can see. HR is the highest
// tier (sees everything); Manager sees Manager+All; everyone sees All.
const ROLE_TIERS: Record<UserRole, RoleLevel[]> = {
  ADMIN: ["All", "Manager", "HR"],
  RH_MANAGER: ["All", "Manager", "HR"],
  MANAGER: ["All", "Manager"],
  RECRUITER: ["All"],
  EMPLOYEE: ["All"],
};

function isRoleVisible(tool: Application, userRole: UserRole | undefined): boolean {
  const level = tool.roleLevel ?? "All";
  if (level === "All") return true;
  if (!userRole) return false;
  return ROLE_TIERS[userRole].includes(level);
}

export function isToolVisibleTo(tool: Application, user: User | null): boolean {
  if (!user) return false;
  return isCountryVisible(tool, user.country) && isRoleVisible(tool, user.role);
}

export function filterVisibleTools(tools: Application[], user: User | null): Application[] {
  return tools.filter((tool) => isToolVisibleTo(tool, user));
}
