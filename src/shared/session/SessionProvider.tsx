import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_KEY, SESSION_EXPIRED_EVENT, sessionSchema, type AdminSession } from "./model";

function loadSession() {
  try {
    const result = sessionSchema.safeParse(JSON.parse(localStorage.getItem(SESSION_KEY) || "null"));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

type SessionContextValue = {
  session: AdminSession | null;
  setSession: (session: AdminSession | null) => void;
};
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setState] = useState<AdminSession | null>(loadSession);
  const client = useQueryClient();
  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      setSession: (next) => {
        if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        else localStorage.removeItem(SESSION_KEY);
        if (!next || session?.adminToken !== next.adminToken || session?.imToken !== next.imToken)
          client.clear();
        setState(next);
      },
    }),
    [session, client],
  );
  useEffect(() => {
    const expire = () => value.setSession(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
  }, [value]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession requires SessionProvider");
  return value;
}
