import { Ban, Check, KeyRound, Pencil, UserRoundMinus, CircleMinus } from "lucide-react";
import md5 from "blueimp-md5";
import type { Resource, ResourceAction, FormField } from "@/shared/resources/model";
import { textAt, splitIDs } from "@/shared/lib/records";
import { formatTime } from "@/shared/lib/date";
import { onlineStatus } from "@/shared/api/presence";
import { onlinePlatforms, platformLabel } from "@/shared/lib/platforms";
import * as api from "./api";

const keyword: FormField = { key: "keyword", label: "fields.keyword" };
const genders = [
  { value: "0", label: "gender.private" },
  { value: "1", label: "gender.male" },
  { value: "2", label: "gender.female" },
] as const;
const profileFields: FormField[] = [
  { key: "faceURL", label: "fields.avatar", type: "image" },
  { key: "nickname", label: "fields.nickname", required: true },
  { key: "gender", label: "fields.gender", default: "0", options: [...genders] },
  { key: "birth", label: "fields.birth", type: "date" },
];
const birth = (value: unknown) => (value ? new Date(`${value}T00:00:00`).getTime() : 0);
const birthDate = (value: unknown) => {
  if (!Number(value)) return "";
  const date = new Date(Number(value));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const userColumns: Resource["columns"] = [
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
];
const block: ResourceAction = {
  label: "actions.block",
  icon: Ban,
  danger: true,
  fields: [{ key: "reason", label: "fields.reason", required: true, type: "textarea" }],
  execute: (values, row, session) =>
    api.blockUser(String(row?.userID || values.userID), String(values.reason), session),
};

export const businessResources: Record<string, Resource> = {
  "business/users": {
    key: "business/users",
    title: "nav.users",
    id: "userID",
    filters: [keyword],
    load: async (filters, page, size, session) => {
      const data = await api.searchUsers(String(filters.keyword), page, size, session);
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
            ? onlinePlatforms(statuses.find((status) => status.userID === user.userID))
            : null,
        })),
        total: data.total,
      };
    },
    columns: [
      ...userColumns,
      {
        key: "gender",
        label: "fields.gender",
        render: (row, t) =>
          t(
            genders.find((option) => option.value === String(row.gender))?.label ||
              "gender.private",
          ),
      },
      { key: "phoneNumber", label: "fields.phone" },
      { key: "email", label: "fields.email" },
      {
        key: "online",
        label: "management.online",
        render: (row, t) =>
          row.online === null
            ? t("common.loadFailed")
            : (row.online as number[]).map((id) => platformLabel(id, t)).join(" / ") ||
              t("management.offline"),
      },
    ],
    create: {
      label: "actions.createUser",
      fields: [
        ...profileFields,
        { key: "areaCode", label: "fields.areaCode", default: "+86", required: true },
        { key: "phoneNumber", label: "fields.phone", required: true },
        { key: "password", label: "fields.password", type: "password", required: true },
      ],
      execute: (values, _, session) =>
        api.createUser(
          {
            nickname: String(values.nickname),
            faceURL: String(values.faceURL),
            gender: Number(values.gender),
            birth: birth(values.birth),
            areaCode: String(values.areaCode),
            phoneNumber: String(values.phoneNumber),
            password: md5(String(values.password)),
          },
          session,
        ),
    },
    actions: [
      {
        label: "actions.editUser",
        icon: Pencil,
        fields: profileFields,
        initial: (row) => ({
          faceURL: textAt(row, "faceURL"),
          nickname: textAt(row, "nickname"),
          gender: String(row.gender ?? 0),
          birth: birthDate(row.birth),
        }),
        execute: (values, row, session) =>
          api.updateUser(
            {
              userID: String(row?.userID),
              faceURL: { value: String(values.faceURL) },
              nickname: { value: String(values.nickname) },
              gender: { value: Number(values.gender) },
              birth: { value: birth(values.birth) },
            },
            session,
          ),
      },
      block,
      {
        label: "actions.resetPassword",
        icon: KeyRound,
        fields: [
          { key: "password", label: "fields.newPassword", type: "password", required: true },
        ],
        execute: (values, row, session) =>
          api.resetPassword(String(row?.userID), md5(String(values.password)), session),
      },
    ],
  },
  "business/blocked": {
    key: "business/blocked",
    title: "nav.blocked",
    id: "userID",
    filters: [keyword],
    load: async (filters, page, size, session) => {
      const data = await api.searchBlocked(String(filters.keyword), page, size, session);
      return { rows: data.users || [], total: data.total };
    },
    columns: [
      ...userColumns,
      { key: "reason", label: "fields.reason" },
      { key: "opUserID", label: "fields.operator" },
      {
        key: "createTime",
        label: "fields.blockedAt",
        render: (row, _, language) => formatTime(row.createTime, language, "seconds"),
      },
    ],
    create: {
      ...block,
      fields: [{ key: "userID", label: "fields.userID", required: true }, ...block.fields!],
    },
    actions: [
      {
        label: "actions.unblock",
        icon: Check,
        execute: (_, row, session) => api.unblockUser(String(row?.userID), session),
      },
    ],
  },
  "business/default-friends": {
    key: "business/default-friends",
    title: "nav.defaultFriends",
    id: "userID",
    filters: [keyword],
    load: async (filters, page, size, session) => {
      const data = await api.searchDefaultFriends(String(filters.keyword), page, size, session);
      return { rows: data.users || [], total: data.total };
    },
    columns: [
      { key: "userID", label: "fields.userID" },
      { key: "user.nickname", label: "fields.nickname" },
    ],
    create: {
      label: "actions.addDefaultFriends",
      fields: [{ key: "ids", label: "nav.defaultFriends", type: "users", required: true }],
      execute: (values, _, session) => api.addDefaultFriends(splitIDs(values.ids), session),
    },
    actions: [
      {
        label: "actions.removeDefaultFriend",
        icon: UserRoundMinus,
        danger: true,
        execute: (_, row, session) => api.removeDefaultFriend(String(row?.userID), session),
      },
    ],
  },
  "business/default-groups": {
    key: "business/default-groups",
    title: "nav.defaultGroups",
    id: "groupID",
    filters: [{ key: "keyword", label: "fields.groupID" }],
    load: async (filters, page, size, session) => {
      const data = await api.searchDefaultGroups(String(filters.keyword), page, size, session);
      return { rows: data.groups || [], total: data.total };
    },
    columns: [
      { key: "groupID", label: "fields.groupID" },
      {
        key: "faceURL",
        label: "fields.avatar",
        render: (row) => (
          <span className="avatar">
            {row.faceURL ? (
              <img src={String(row.faceURL)} alt="" />
            ) : (
              textAt(row, "groupName").slice(0, 1)
            )}
          </span>
        ),
      },
      { key: "groupName", label: "fields.groupName" },
      { key: "memberCount", label: "fields.members" },
    ],
    create: {
      label: "actions.addDefaultGroups",
      fields: [{ key: "ids", label: "nav.defaultGroups", type: "groups", required: true }],
      execute: (values, _, session) => api.addDefaultGroups(splitIDs(values.ids), session),
    },
    actions: [
      {
        label: "actions.removeDefaultGroup",
        icon: CircleMinus,
        danger: true,
        execute: (_, row, session) => api.removeDefaultGroup(String(row?.groupID), session),
      },
    ],
  },
};
