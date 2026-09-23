import { useId } from "react";
import { useAuth } from "@/lib/auth/hooks";
import { ROLE_LABELS, isUserRole } from "@/lib/auth/roles";
import { USER_ROLES } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

/** Demo-only control: re-signs in as another role's account. */
export function RoleSwitcher({ className }: { className?: string }) {
  const { role, switchRole } = useAuth();
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">
        Switch role for testing
      </label>
      <select
        id={id}
        value={role ?? ""}
        onChange={(event) => {
          if (isUserRole(event.target.value)) void switchRole(event.target.value);
        }}
        className="h-9 w-full rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {USER_ROLES.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </select>
    </div>
  );
}
