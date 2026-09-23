import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";

export const LOGIN_ROUTE = "/login";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
