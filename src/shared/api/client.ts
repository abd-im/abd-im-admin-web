import axios from "axios";
import type { AdminSession } from "@/shared/session/model";
import { SESSION_EXPIRED_EVENT } from "@/shared/session/model";
import { RequestError } from "./errors";

export type ApiKind = "admin" | "chat" | "im";
type ApiEnvelope<T> = { errCode: number; errMsg?: string; data: T };
const bases: Record<ApiKind, string> = {
  admin: import.meta.env.VITE_ADMIN_API_BASE || "/admin-api",
  chat: import.meta.env.VITE_CHAT_API_BASE || "/chat-api",
  im: import.meta.env.VITE_IM_API_BASE || "/im-api",
};

export async function post<T>(
  kind: ApiKind,
  path: string,
  data: unknown,
  session?: AdminSession | null,
): Promise<T> {
  const token = kind === "im" ? session?.imToken : session?.adminToken;
  const response = await axios.post<ApiEnvelope<T>>(`${bases[kind]}${path}`, data, {
    timeout: 20_000,
    headers: {
      operationID: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
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
    if (token && [1501, 1502, 1503, 1504, 1505].includes(envelope.errCode))
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new RequestError("server", { code: envelope.errCode, message: envelope.errMsg || "" });
  }
  return envelope.data;
}

export const pagination = (page: number, pageSize: number) => ({
  pageNumber: page,
  showNumber: pageSize,
});
