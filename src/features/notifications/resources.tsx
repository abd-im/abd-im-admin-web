import { Pencil } from "lucide-react";
import type { Resource, FormField } from "@/shared/resources/model";
import { textAt } from "@/shared/lib/records";
import * as api from "./api";

const fields: FormField[] = [
  { key: "nickName", label: "fields.nickname", required: true },
  { key: "faceURL", label: "fields.avatar", type: "image" },
];
export const notificationResources: Record<string, Resource> = {
  "notifications/accounts": {
    key: "notifications/accounts",
    title: "nav.notificationAccounts",
    id: "userID",
    filters: [{ key: "keyword", label: "fields.keyword" }],
    load: async (filters, page, size, session) => {
      const data = await api.searchAccounts(String(filters.keyword), page, size, session);
      return { rows: data.notificationAccounts || [], total: data.total };
    },
    columns: [
      { key: "userID", label: "fields.accountID" },
      { key: "nickName", label: "fields.nickname" },
      {
        key: "faceURL",
        label: "fields.avatar",
        render: (row) => (
          <span className="avatar">
            {row.faceURL ? (
              <img src={String(row.faceURL)} alt="" />
            ) : (
              textAt(row, "nickName").slice(0, 1)
            )}
          </span>
        ),
      },
    ],
    create: {
      label: "actions.createNotificationAccount",
      fields: [{ key: "userID", label: "fields.accountID", required: true }, ...fields],
      execute: (values, _, session) =>
        api.createAccount(
          {
            userID: String(values.userID),
            nickName: String(values.nickName),
            faceURL: String(values.faceURL),
          },
          session,
        ),
    },
    actions: [
      {
        label: "actions.editNotificationAccount",
        icon: Pencil,
        fields,
        initial: (row) => ({ nickName: textAt(row, "nickName"), faceURL: textAt(row, "faceURL") }),
        execute: (values, row, session) =>
          api.updateAccount(
            {
              userID: String(row?.userID),
              nickName: String(values.nickName),
              faceURL: String(values.faceURL),
            },
            session,
          ),
      },
    ],
  },
};
