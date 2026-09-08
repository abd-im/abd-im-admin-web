export type BusinessUser = {
  userID: string;
  nickname: string;
  faceURL: string;
  gender: number;
  birth: number;
  areaCode: string;
  phoneNumber: string;
  email: string;
};
export type CreateUserRequest = Pick<
  BusinessUser,
  "nickname" | "faceURL" | "gender" | "birth" | "areaCode" | "phoneNumber"
> & { password: string };
export type UpdateUserRequest = {
  userID: string;
  nickname: { value: string };
  faceURL: { value: string };
  gender: { value: number };
  birth: { value: number };
};
export type BlockedUser = BusinessUser & { reason: string; opUserID: string; createTime: number };
export type DefaultFriend = { userID: string; user: BusinessUser };
export type DefaultGroup = {
  groupID: string;
  groupName: string;
  faceURL: string;
  memberCount: number;
};
