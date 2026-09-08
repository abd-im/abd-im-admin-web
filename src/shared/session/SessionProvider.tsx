import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_KEY, type AdminSession } from "./model";
import { loadSession, saveSession, sameLogin, SESSION_CHANGED_EVENT } from "./storage";

type SessionContextValue = {
  session: AdminSession | null;
  setSession: (session: AdminSession | null) => void;
};
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setState] = useState<AdminSession | null>(loadSession);
  const client = useQueryClient();
  const current = useRef(session);
  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      setSession: saveSession,
    }),
    [session],
  );
  useEffect(() => {
    const sync = () => {
      const next = loadSession();
      if (!next || !sameLogin(current.current, next)) client.clear();
      current.current = next;
      setState(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) sync();
    };
    window.addEventListener(SESSION_CHANGED_EVENT, sync);
    window.addEventListener("storage", onStorage);
    sync();
    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [client]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession requires SessionProvider");
  return value;
}
