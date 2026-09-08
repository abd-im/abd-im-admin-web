import { post, pagination } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";

export type ReleaseInput = {
  platform: string;
  version: string;
  url: string;
  text: string;
  latest: boolean;
  force: boolean;
  hot: boolean;
};
export type Release = ReleaseInput & { id: string; createTime: number };
type Session = AdminSession | null;
export const searchVersions = (platform: string, page: number, size: number, session: Session) =>
  post<{ total: number; versions: Release[] }>(
    "admin",
    "/application/page_versions",
    { platform: platform ? [platform] : [], pagination: pagination(page, size) },
    session,
  );
export const createVersion = (input: ReleaseInput, session: Session) =>
  post("admin", "/application/add_version", input, session);
export const updateVersion = (id: string, input: ReleaseInput, session: Session) =>
  post(
    "admin",
    "/application/update_version",
    { id, ...Object.fromEntries(Object.entries(input).map(([key, value]) => [key, { value }])) },
    session,
  );
export const deleteVersion = (id: string, session: Session) =>
  post("admin", "/application/delete_version", { id: [id] }, session);
