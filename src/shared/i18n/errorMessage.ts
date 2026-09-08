import axios from "axios";
import type { TFunction } from "i18next";
import { RequestError, ValidationError } from "@/shared/api/errors";

export function errorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ValidationError) return t(error.key);
  if (error instanceof RequestError) {
    if (error.reason === "server")
      return t("errors.server", { code: error.details.code, message: error.details.message });
    if (error.reason === "upload") return t("errors.upload", { status: error.details.status });
    return t(`errors.${error.reason}`);
  }
  if (axios.isAxiosError(error))
    return t(error.code === "ECONNABORTED" ? "errors.timeout" : "errors.network");
  return t("errors.request");
}
