import axios from "axios";
import type { AdminSession } from "@/shared/session/model";
import { loadSession, saveSession, sameLogin } from "@/shared/session/storage";
import { RequestError } from "./errors";

export type ApiKind = "admin" | "chat" | "im";
type ApiEnvelope<T> = { errCode: number; errMsg?: string; data: T };
const bases: Record<ApiKind, string> = {
  admin: import.meta.env.VITE_ADMIN_API_BASE || "/admin-api",
  chat: import.meta.env.VITE_CHAT_API_BASE || "/chat-api",
  im: import.meta.env.VITE_IM_API_BASE || "/im-api",
};

const authCodes = [1501, 1502, 1503, 1504, 1505, 1506, 1507];
const operationID = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const isAuthError = (error: unknown) =>
  error instanceof RequestError &&
  error.reason === "server" &&
  authCodes.includes(Number(error.details.code));

function expireSession(session: AdminSession, kind: ApiKind = "admin") {
  const current = loadSession();
  if (sameLogin(current, session) && (kind !== "im" || current?.imToken === session.imToken))
    saveSession(null);
}

export async function post<T>(
  kind: ApiKind,
  path: string,
  data: unknown,
  session?: AdminSession | null,
): Promise<T> {
  const stored = loadSession();
  const credentials = session && sameLogin(stored, session) ? stored : session;
  try {
    return await request<T>(kind, path, data, credentials);
  } catch (error) {
    if (!credentials || !isAuthError(error)) throw error;
    expireSession(credentials, kind);
    throw new RequestError("sessionExpired");
  }
}

async function request<T>(
  kind: ApiKind,
  path: string,
  data: unknown,
  session?: AdminSession | null,
): Promise<T> {
  const token = kind === "im" ? session?.imToken : session?.adminToken;
  const response = await axios.post<ApiEnvelope<T>>(`${bases[kind]}${path}`, data, {
    timeout: 20_000,
    headers: {
      operationID: operationID(),
      ...(token ? { token } : {}),
      ...(kind === "im" && path.startsWith("/object/")
        ? {
            "X-Request-Api": new URL(
              import.meta.env.VITE_PUBLIC_IM_API_BASE || bases.im,
              window.location.origin,
            ).href,
          }
        : {}),
    },
  });
  const envelope = response.data;
  if (!envelope || typeof envelope !== "object" || typeof envelope.errCode !== "number")
    throw new RequestError("malformed");
  if (envelope.errCode !== 0) {
    throw new RequestError("server", { code: envelope.errCode, message: envelope.errMsg || "" });
  }
  return envelope.data;
}

export const pagination = (page: number, pageSize: number) => ({
  pageNumber: page,
  showNumber: pageSize,
});
