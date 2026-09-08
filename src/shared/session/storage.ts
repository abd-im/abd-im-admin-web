import { SESSION_KEY, sessionSchema, type AdminSession } from "./model";

export const SESSION_CHANGED_EVENT = "admin-session-changed";

export function loadSession(): AdminSession | null {
  try {
    const result = sessionSchema.safeParse(JSON.parse(localStorage.getItem(SESSION_KEY) || "null"));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function sameLogin(left: AdminSession | null, right: AdminSession) {
  return left?.adminToken === right.adminToken && left.adminUserID === right.adminUserID;
}

export function saveSession(session: AdminSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}
