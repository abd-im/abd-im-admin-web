import { Pencil, Trash2 } from "lucide-react";
import { valid } from "semver";
import type { FormField, FormValues, Resource } from "@/shared/resources/model";
import { ValidationError } from "@/shared/api/errors";
import { httpURL } from "@/shared/lib/url";
import { formatTime } from "@/shared/lib/date";
import { StatusBadge } from "@/shared/ui";
import * as api from "./api";

const platforms: FormField["options"] = ["windows", "mac", "linux", "android", "ios"].map(
  (value) => ({ value, label: `releases.${value}` as "releases.windows" }),
);
const fields: FormField[] = [
  {
    key: "platform",
    label: "releases.platform",
    options: platforms,
    required: true,
    default: "windows",
  },
  { key: "version", label: "releases.version", required: true },
  { key: "url", label: "releases.url", type: "url", required: true },
  { key: "text", label: "releases.notes", type: "textarea", required: true },
  { key: "latest", label: "releases.latest", type: "checkbox", default: true },
  { key: "force", label: "releases.force", type: "checkbox" },
  { key: "hot", label: "releases.hot", type: "checkbox" },
];
export function releaseInput(values: FormValues): api.ReleaseInput {
  const version = String(values.version).trim();
  if (!valid(version)) throw new ValidationError("releases.invalidVersion");
  const url = httpURL(String(values.url).trim());
  if (!url) throw new ValidationError("releases.invalidURL");
  return {
    platform: String(values.platform),
    version,
    url,
    text: String(values.text).trim(),
    latest: Boolean(values.latest),
    force: Boolean(values.force),
    hot: Boolean(values.hot),
  };
}
export const releasesResource: Resource = {
  key: "applications/versions",
  title: "nav.versions",
  id: "id",
  filters: [
    {
      key: "platform",
      label: "releases.platform",
      options: [{ value: "", label: "management.all" }, ...platforms],
    },
  ],
  load: async (filters, page, size, session) => {
    const data = await api.searchVersions(String(filters.platform), page, size, session);
    return { rows: data.versions || [], total: data.total };
  },
  columns: [
    {
      key: "platform",
      label: "releases.platform",
      render: (row, t) => {
        const platform = platforms.find((value) => value.value === row.platform);
        return platform ? t(platform.label) : String(row.platform);
      },
    },
    { key: "version", label: "releases.version" },
    { key: "text", label: "releases.notes" },
    {
      key: "url",
      label: "releases.url",
      render: (row, t) =>
        httpURL(row.url) ? (
          <a className="text-link" href={httpURL(row.url)} target="_blank" rel="noreferrer">
            {t("fields.download")}
          </a>
        ) : (
          String(row.url || "-")
        ),
    },
    ...(["latest", "force", "hot"] as const).map((key) => ({
      key,
      label: `releases.${key}` as const,
      render: (row: Record<string, unknown>) => (
        <StatusBadge active={Boolean(row[key])}>{row[key] ? "✓" : "-"}</StatusBadge>
      ),
    })),
    {
      key: "createTime",
      label: "management.createdAt",
      render: (row, _, language) => formatTime(row.createTime, language),
    },
  ],
  create: {
    label: "releases.create",
    fields,
    execute: (values, _, session) => api.createVersion(releaseInput(values), session),
  },
  actions: [
    {
      label: "releases.edit",
      icon: Pencil,
      fields,
      initial: (row) =>
        Object.fromEntries(
          fields.map((field) => [
            field.key,
            typeof row[field.key] === "boolean"
              ? (row[field.key] as boolean)
              : String(row[field.key] ?? ""),
          ]),
        ),
      execute: (values, row, session) =>
        api.updateVersion(String(row?.id), releaseInput(values), session),
    },
    {
      label: "releases.remove",
      confirmation: (row, t) => t("releases.confirmDelete", { version: String(row.version) }),
      icon: Trash2,
      danger: true,
      execute: (_, row, session) => api.deleteVersion(String(row?.id), session),
    },
  ],
};
