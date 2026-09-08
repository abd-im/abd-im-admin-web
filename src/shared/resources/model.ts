import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import type { LucideIcon } from "lucide-react";
import type { AdminSession } from "@/shared/session/model";
import type { TranslationKey } from "@/shared/i18n";
import type { Row } from "@/shared/lib/records";

export type FormValues = Record<string, string | boolean>;
export type FormField = {
  visible?: (values: FormValues) => boolean;
  key: string;
  label: TranslationKey;
  type?:
    | "text"
    | "textarea"
    | "password"
    | "url"
    | "number"
    | "checkbox"
    | "date"
    | "users"
    | "user"
    | "groups"
    | "image";
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: TranslationKey }[];
  default?: string | boolean;
};
export type ResourceAction = {
  label: TranslationKey;
  icon?: LucideIcon;
  danger?: boolean;
  fields?: FormField[];
  execute: (
    values: FormValues,
    row: Row | undefined,
    session: AdminSession | null,
  ) => Promise<unknown>;
  initial?: (row: Row) => FormValues;
  visible?: (row: Row) => boolean;
  confirmation?: (row: Row, t: TFunction) => string;
};
export type Resource = {
  key: string;
  title: TranslationKey;
  id: string;
  filters: FormField[];
  load: (
    filters: FormValues,
    page: number,
    pageSize: number,
    session: AdminSession | null,
  ) => Promise<{ rows: Row[]; total: number }>;
  columns: {
    key: string;
    label: TranslationKey;
    render?: (row: Row, t: TFunction, language: string) => ReactNode;
  }[];
  create?: ResourceAction;
  actions?: ResourceAction[];
};
export const fieldDefaults = (fields: FormField[]): FormValues =>
  Object.fromEntries(fields.map((field) => [field.key, field.default ?? ""]));
