export type IMUser = { userID: string; nickname: string; faceURL: string; createTime: number };
export type UserFilters = { userID: string; nickName: string };
export type GroupFilters = { groupID: string; groupName: string };
export type GroupSummary = {
  groupInfo: {
    groupID: string;
    groupName: string;
    memberCount: number;
    status: number;
    notification: string;
  };
  groupOwnerUserID: string;
};
export type UpdateGroupRequest = {
  groupID: string;
  groupName: { value: string };
  notification: { value: string };
  faceURL?: { value: string };
  introduction?: { value: string };
  needVerification?: { value: number };
  lookMemberInfo?: { value: number };
  applyMemberFriend?: { value: number };
};
export type LogInfo = {
  systemType: string;
  version: string;
  ex: string;
  logID: string;
  userID: string;
  nickname: string;
  platform: number;
  filename: string;
  createTime: number;
  url: string;
};
export type MessageFilters = {
  sendID: string;
  recvID: string;
  sendTime: string;
  contentType: number;
};
export type MessageResult = {
  chatLog: {
    clientMsgID: string;
    serverMsgID: string;
    sessionType: number;
    contentType: number;
    seq: number;
    sendID: string;
    recvID: string;
    groupID: string;
    senderNickname: string;
    recvNickname: string;
    groupName: string;
    groupFaceURL: string;
    groupMemberCount: number;
    content: string;
    sendTime: number;
  };
  isRevoked: boolean;
};
