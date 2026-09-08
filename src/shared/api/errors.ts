import type { TranslationKey } from "@/shared/i18n";

export type ErrorReason =
  | "server"
  | "malformed"
  | "image"
  | "media"
  | "emptyFile"
  | "upload"
  | "invalidSession"
  | "sessionExpired";
export class RequestError extends Error {
  constructor(
    readonly reason: ErrorReason,
    readonly details: Record<string, string | number> = {},
  ) {
    super(reason);
  }
}

export class ValidationError extends Error {
  constructor(readonly key: TranslationKey) {
    super(key);
  }
}
