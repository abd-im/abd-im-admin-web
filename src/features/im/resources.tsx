import { Link } from "react-router-dom";
import { ContactRound, Trash2 } from "lucide-react";
import type { Resource } from "@/shared/resources/model";
import { textAt } from "@/shared/lib/records";
import { formatTime, dateRange } from "@/shared/lib/date";
import { platformLabel, onlinePlatforms } from "@/shared/lib/platforms";
import { DownloadLink } from "@/shared/ui/DownloadLink";
import { groupResource } from "./group-resource";
import { onlineStatus } from "@/shared/api/presence";
import * as api from "./api";

export const imResources: Record<string, Resource> = {
  "im/groups": groupResource,
  "im/users": {
    key: "im/users",
    title: "nav.imUsers",
    id: "userID",
    filters: [
      { key: "userID", label: "fields.userID" },
      { key: "nickName", label: "fields.nickname" },
    ],
    load: async (filters, page, size, session) => {
      const data = await api.searchUsers(
        { userID: String(filters.userID), nickName: String(filters.nickName) },
        page,
        size,
        session,
      );
      const users = data.users || [];
      const statuses = users.length
        ? await onlineStatus(
            users.map((user) => user.userID),
            session,
          ).catch(() => null)
        : [];
      return {
        rows: users.map((user) => ({
          ...user,
          online: statuses
            ? onlinePlatforms(statuses.find((item) => item.userID === user.userID))
            : null,
        })),
        total: data.total,
      };
    },
    columns: [
      {
        key: "faceURL",
        label: "fields.avatar",
        render: (row) => (
          <span className="avatar">
            {row.faceURL ? (
              <img src={String(row.faceURL)} alt="" />
            ) : (
              String(row.nickname || "?").slice(0, 1)
            )}
          </span>
        ),
      },
      { key: "userID", label: "fields.userID" },
      { key: "nickname", label: "fields.nickname" },
      {
        key: "online",
        label: "management.online",
        render: (row, t) => {
          if (row.online === null) return t("common.loadFailed");
          const platforms = (row.online as number[]).map((id) => platformLabel(id, t)).join(" / ");
          if (!platforms) return t("management.offline");
          return (
            <Link
              className="text-link"
              title={t("management.sessions")}
              to={`/im/users/${encodeURIComponent(String(row.userID))}/sessions`}
            >
              {platforms}
            </Link>
          );
        },
      },
      {
        key: "friends",
        label: "management.friends",
        render: (row, t) => (
          <Link
            className="button icon-button"
            title={t("management.friends")}
            aria-label={t("management.friends")}
            to={`/im/users/${encodeURIComponent(String(row.userID))}/friends`}
          >
            <ContactRound size={16} />
          </Link>
        ),
      },
    ],
  },
  "im/logs": {
    key: "im/logs",
    title: "nav.logs",
    id: "logID",
    filters: [
      { key: "keyword", label: "fields.userID" },
      { key: "start", label: "management.start", type: "date" },
      { key: "end", label: "management.end", type: "date" },
    ],
    load: async (filters, page, size, session) => {
      const data = await api.searchLogs(
        String(filters.keyword),
        dateRange(String(filters.start), String(filters.end)),
        page,
        size,
        session,
      );
      return { rows: data.logsInfos || [], total: data.total };
    },
    columns: [
      { key: "userID", label: "fields.userID" },
      { key: "nickname", label: "fields.nickname" },
      { key: "systemType", label: "management.system" },
      {
        key: "platform",
        label: "fields.platform",
        render: (row, t) => platformLabel(Number(row.platform), t),
      },
      { key: "version", label: "management.version" },
      { key: "filename", label: "fields.filename" },
      {
        key: "createTime",
        label: "management.createdAt",
        render: (row, _, language) => formatTime(row.createTime, language),
      },
      { key: "ex", label: "management.extra" },
      {
        key: "url",
        label: "fields.download",
        render: (row) => <DownloadLink url={textAt(row, "url")} />,
      },
    ],
    actions: [
      {
        label: "actions.deleteLog",
        icon: Trash2,
        danger: true,
        execute: (_, row, session) => api.deleteLog(String(row?.logID), session),
      },
    ],
  },
};
