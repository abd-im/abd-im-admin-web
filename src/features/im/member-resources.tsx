import { Shield, Crown, UserRoundMinus, MessageSquareOff, MessageSquare } from "lucide-react";
import type { Resource } from "@/shared/resources/model";
import { textAt, splitIDs } from "@/shared/lib/records";
import { formatTime } from "@/shared/lib/date";
import * as api from "./members-api";

export const memberResource = (groupID: string): Resource => ({
  key: `im/members/${groupID}`,
  title: "management.groupMembers",
  id: "userID",
  filters: [{ key: "keyword", label: "management.memberSearch" }],
  load: async (filters, page, size, session) => {
    const data = await api.searchMembers(groupID, String(filters.keyword), page, size, session);
    return { rows: data.members || [], total: data.total };
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
            textAt(row, "nickname").slice(0, 1)
          )}
        </span>
      ),
    },
    { key: "userID", label: "fields.userID" },
    { key: "nickname", label: "fields.nickname" },
    {
      key: "roleLevel",
      label: "management.role",
      render: (row, t) =>
        t(
          row.roleLevel === 100
            ? "management.owner"
            : row.roleLevel === 60
              ? "management.administrator"
              : "management.member",
        ),
    },
    {
      key: "joinTime",
      label: "management.joinedAt",
      render: (row, _, language) => formatTime(row.joinTime, language, "seconds"),
    },
    {
      key: "joinSource",
      label: "management.joinSource",
      render: (row, t) =>
        t(
          row.joinSource === 1
            ? "join.admin"
            : row.joinSource === 2
              ? "management.invited"
              : row.joinSource === 3
                ? "join.search"
                : row.joinSource === 4
                  ? "join.qr"
                  : "management.unknown",
        ),
    },
    {
      key: "muteEndTime",
      label: "management.muteUntil",
      render: (row, _, language) => formatTime(row.muteEndTime, language, "seconds"),
    },
  ],
  create: {
    label: "management.addMembers",
    fields: [{ key: "ids", label: "management.members", type: "users", required: true }],
    execute: (values, _, session) => api.inviteMembers(groupID, splitIDs(values.ids), session),
  },
  actions: [
    {
      label: "management.setRole",
      icon: Shield,
      visible: (row) => row.roleLevel !== 100,
      fields: [
        {
          key: "role",
          label: "management.role",
          options: [
            { value: "20", label: "management.member" },
            { value: "60", label: "management.administrator" },
          ],
          default: "20",
        },
      ],
      initial: (row) => ({ role: String(row.roleLevel) }),
      execute: (values, row, session) =>
        api.setMemberRole(groupID, String(row?.userID), Number(values.role), session),
    },
    {
      label: "management.transferOwner",
      confirmation: (row, t) => t("management.transferWarning", { userID: String(row.userID) }),
      icon: Crown,
      danger: true,
      visible: (row) => row.roleLevel !== 100,
      execute: (_, row, session) => api.transferOwner(groupID, String(row?.userID), session),
    },
    {
      label: "management.mute",
      icon: MessageSquareOff,
      visible: (row) => row.roleLevel !== 100 && Number(row.muteEndTime) * 1000 <= Date.now(),
      fields: [
        {
          key: "seconds",
          label: "management.muteDuration",
          type: "number",
          required: true,
          min: 1,
          max: 4294967295,
          default: "3600",
        },
      ],
      execute: (values, row, session) =>
        api.muteMember(groupID, String(row?.userID), Number(values.seconds), session),
    },
    {
      label: "management.unmute",
      icon: MessageSquare,
      visible: (row) => Number(row.muteEndTime) * 1000 > Date.now(),
      execute: (_, row, session) => api.unmuteMember(groupID, String(row?.userID), session),
    },
    {
      label: "management.removeMember",
      icon: UserRoundMinus,
      danger: true,
      visible: (row) => row.roleLevel !== 100,
      execute: (_, row, session) => api.removeMember(groupID, String(row?.userID), session),
    },
  ],
});

export const friendResource = (userID: string): Resource => ({
  key: `im/friends/${userID}`,
  title: "management.friends",
  id: "friendUser.userID",
  filters: [],
  load: async (_, page, size, session) => {
    const data = await api.listFriends(userID, page, size, session);
    return { rows: data.friendsInfo || [], total: data.total };
  },
  columns: [
    {
      key: "friendUser.faceURL",
      label: "fields.avatar",
      render: (row) => (
        <span className="avatar">
          {textAt(row, "friendUser.faceURL") ? (
            <img src={textAt(row, "friendUser.faceURL")} alt="" />
          ) : (
            textAt(row, "friendUser.nickname").slice(0, 1)
          )}
        </span>
      ),
    },
    { key: "friendUser.userID", label: "fields.userID" },
    { key: "friendUser.nickname", label: "fields.nickname" },
  ],
  actions: [
    {
      label: "management.removeFriend",
      icon: UserRoundMinus,
      danger: true,
      execute: (_, row, session) =>
        api.deleteFriend(userID, textAt(row!, "friendUser.userID"), session),
    },
  ],
});
