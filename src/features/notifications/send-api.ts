import { post } from "@/shared/api/client";
import type { AdminSession } from "@/shared/session/model";
import type { NotificationAccount } from "./types";

type Picture = {
  uuid: string;
  type: string;
  size: number;
  width: number;
  height: number;
  url: string;
};
export type NotificationAttachment =
  | { mixType: 0 }
  | {
      mixType: 1;
      pictureElem: { sourcePicture: Picture; bigPicture: Picture; snapshotPicture: Picture };
    }
  | {
      mixType: 2;
      videoElem: {
        videoUUID: string;
        videoUrl: string;
        videoType: string;
        videoSize: number;
        duration: number;
        snapshotUrl: string;
        snapshotSize: number;
        snapshotWidth: number;
        snapshotHeight: number;
      };
    };
export type NotificationDraft = {
  account: NotificationAccount;
  text: string;
  url: string;
  recvIDs: string[];
  isSendAll: boolean;
  attachment: NotificationAttachment;
};
export type DeliveryResult = {
  results: { recvID: string; clientMsgID: string; serverMsgID: string; sendTime: number }[];
  failedUserIDs: string[];
};

export function sendNotification(draft: NotificationDraft, session: AdminSession | null) {
  const { account, text, url, recvIDs, isSendAll, attachment } = draft;
  return post<DeliveryResult>(
    "im",
    "/msg/batch_send_msg",
    {
      isSendAll,
      recvIDs: isSendAll ? [] : recvIDs,
      sendID: account.userID,
      groupID: "",
      senderNickname: account.nickName,
      senderFaceURL: account.faceURL,
      senderPlatformID: 5,
      content: {
        notificationName: account.nickName,
        notificationFaceURL: account.faceURL,
        notificationType: 1,
        text,
        url,
        externalUrl: url,
        ...attachment,
      },
      contentType: 1400,
      sessionType: 4,
      isOnlineOnly: false,
      notOfflinePush: false,
      offlinePushInfo: {
        title: account.nickName,
        desc: text,
        ex: "",
        iOSPushSound: "default",
        iOSBadgeCount: true,
      },
    },
    session,
  );
}
