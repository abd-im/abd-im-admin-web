import { Link } from "react-router-dom";
import { Pencil, Trash2, UsersRound, MessageSquareOff, MessageSquare } from "lucide-react";
import type { FormField, FormValues, Resource } from "@/shared/resources/model";
import { splitIDs, textAt, valueAt } from "@/shared/lib/records";
import { formatTime } from "@/shared/lib/date";
import { StatusBadge } from "@/shared/ui";
import {
  createGroup,
  searchGroups,
  updateGroup,
  muteGroup,
  unmuteGroup,
  dismissGroup,
} from "./api";

const fields: FormField[] = [
  { key: "faceURL", label: "fields.avatar", type: "image" },
  { key: "groupName", label: "fields.groupName", required: true },
  {
    key: "needVerification",
    label: "management.verification",
    default: "0",
    options: [
      { value: "0", label: "management.verifyInvites" },
      { value: "1", label: "management.verifyAll" },
      { value: "2", label: "management.verifyNone" },
    ],
  },
  { key: "allowFriends", label: "management.allowFriends", type: "checkbox", default: true },
  { key: "allowProfiles", label: "management.allowProfiles", type: "checkbox", default: true },
  { key: "notification", label: "fields.announcement", type: "textarea" },
  { key: "introduction", label: "management.introduction", type: "textarea" },
];
const groupValues = (values: FormValues) => ({
  groupName: String(values.groupName),
  faceURL: String(values.faceURL),
  notification: String(values.notification),
  introduction: String(values.introduction),
  needVerification: Number(values.needVerification),
  applyMemberFriend: values.allowFriends ? 0 : 1,
  lookMemberInfo: values.allowProfiles ? 0 : 1,
});

export const groupResource: Resource = {
  key: "im/groups",
  title: "nav.groups",
  id: "groupInfo.groupID",
  filters: [
    { key: "groupID", label: "fields.groupID" },
    { key: "groupName", label: "fields.groupName" },
  ],
  load: async (filters, page, size, session) => {
    const data = await searchGroups(
      { groupID: String(filters.groupID), groupName: String(filters.groupName) },
      page,
      size,
      session,
    );
    return { rows: data.groups || [], total: data.total };
  },
  columns: [
    {
      key: "groupInfo.faceURL",
      label: "fields.avatar",
      render: (row) => (
        <span className="avatar">
          {textAt(row, "groupInfo.faceURL") ? (
            <img src={textAt(row, "groupInfo.faceURL")} alt="" />
          ) : (
            textAt(row, "groupInfo.groupName").slice(0, 1)
          )}
        </span>
      ),
    },
    { key: "groupInfo.groupID", label: "fields.groupID" },
    { key: "groupInfo.groupName", label: "fields.groupName" },
    { key: "groupOwnerUserID", label: "fields.ownerID" },
    { key: "groupInfo.memberCount", label: "fields.members" },
    {
      key: "groupInfo.createTime",
      label: "management.createdAt",
      render: (row, _, lang) => formatTime(valueAt(row, "groupInfo.createTime"), lang, "seconds"),
    },
    {
      key: "groupInfo.status",
      label: "fields.status",
      render: (row, t) => (
        <StatusBadge active={valueAt(row, "groupInfo.status") === 0}>
          {t(
            valueAt(row, "groupInfo.status") === 3
              ? "status.muted"
              : valueAt(row, "groupInfo.status") === 2
                ? "status.dismissed"
                : "status.normal",
          )}
        </StatusBadge>
      ),
    },
    {
      key: "members",
      label: "management.groupMembers",
      render: (row, t) => (
        <Link
          className="button icon-button"
          title={t("management.groupMembers")}
          aria-label={t("management.groupMembers")}
          to={`/im/groups/${encodeURIComponent(textAt(row, "groupInfo.groupID"))}/members`}
        >
          <UsersRound size={16} />
        </Link>
      ),
    },
  ],
  create: {
    label: "actions.createGroup",
    fields: [
      ...fields,
      { key: "ownerUserID", label: "management.owner", type: "user", required: true },
      { key: "adminUserIDs", label: "management.admins", type: "users" },
      { key: "memberUserIDs", label: "management.members", type: "users" },
    ],
    execute: (values, _, session) => {
      const owner = String(values.ownerUserID);
      const admins = splitIDs(values.adminUserIDs).filter((id) => id !== owner);
      return createGroup(
        {
          groupInfo: { ...groupValues(values), groupType: 2 },
          ownerUserID: owner,
          adminUserIDs: admins,
          memberUserIDs: splitIDs(values.memberUserIDs).filter(
            (id) => id !== owner && !admins.includes(id),
          ),
        },
        session,
      );
    },
  },
  actions: [
    {
      label: "management.groupSettings",
      icon: Pencil,
      fields,
      visible: (row) => valueAt(row, "groupInfo.status") !== 2,
      initial: (row) => ({
        groupName: textAt(row, "groupInfo.groupName"),
        faceURL: textAt(row, "groupInfo.faceURL"),
        notification: textAt(row, "groupInfo.notification"),
        introduction: textAt(row, "groupInfo.introduction"),
        needVerification: String(valueAt(row, "groupInfo.needVerification") || 0),
        allowFriends: valueAt(row, "groupInfo.applyMemberFriend") !== 1,
        allowProfiles: valueAt(row, "groupInfo.lookMemberInfo") !== 1,
      }),
      execute: (values, row, session) => {
        const data = groupValues(values);
        return updateGroup(
          {
            groupID: textAt(row!, "groupInfo.groupID"),
            groupName: { value: data.groupName },
            faceURL: { value: data.faceURL },
            notification: { value: data.notification },
            introduction: { value: data.introduction },
            needVerification: { value: data.needVerification },
            applyMemberFriend: { value: data.applyMemberFriend },
            lookMemberInfo: { value: data.lookMemberInfo },
          },
          session,
        );
      },
    },
    {
      label: "actions.muteGroup",
      icon: MessageSquareOff,
      visible: (row) => valueAt(row, "groupInfo.status") === 0,
      execute: (_, row, session) => muteGroup(textAt(row!, "groupInfo.groupID"), session),
    },
    {
      label: "actions.unmuteGroup",
      icon: MessageSquare,
      visible: (row) => valueAt(row, "groupInfo.status") === 3,
      execute: (_, row, session) => unmuteGroup(textAt(row!, "groupInfo.groupID"), session),
    },
    {
      label: "actions.dismissGroup",
      icon: Trash2,
      danger: true,
      visible: (row) => valueAt(row, "groupInfo.status") !== 2,
      execute: (_, row, session) => dismissGroup(textAt(row!, "groupInfo.groupID"), session),
    },
  ],
};
