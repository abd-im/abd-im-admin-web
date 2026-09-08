import { RequestError } from "@/shared/api/errors";
import type { AdminSession } from "@/shared/session/model";
import { uploadFile } from "./api";

export type UploadedMedia = {
  kind: "image" | "video";
  url: string;
  name: string;
  size: number;
  mime: string;
  width: number;
  height: number;
  duration?: number;
  snapshotURL?: string;
  snapshotSize?: number;
};

async function videoSnapshot(file: File) {
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  video.muted = true;
  video.preload = "auto";
  try {
    return await new Promise<{ width: number; height: number; duration: number; snapshot: File }>(
      (resolve, reject) => {
        const fail = () => {
          clearTimeout(timeout);
          reject(new RequestError("media"));
        };
        const timeout = window.setTimeout(fail, 15000);
        video.onerror = fail;
        video.onloadeddata = () => {
          video.currentTime = Math.min(0.1, video.duration / 2);
        };
        video.onseeked = () => {
          if (!Number.isFinite(video.duration) || !video.videoWidth) return fail();
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d")!.drawImage(video, 0, 0);
          canvas.toBlob(
            (blob) => {
              clearTimeout(timeout);
              if (!blob) return fail();
              resolve({
                width: canvas.width,
                height: canvas.height,
                duration: Math.max(1, Math.ceil(video.duration)),
                snapshot: new File([blob], "snapshot.jpg", { type: "image/jpeg" }),
              });
            },
            "image/jpeg",
            0.85,
          );
        };
        video.src = url;
      },
    );
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export async function uploadMedia(
  file: File,
  session: AdminSession | null,
): Promise<UploadedMedia> {
  const base = { name: file.name, size: file.size, mime: file.type };
  if (file.type.startsWith("image/")) {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new RequestError("media");
    }
    const { width, height } = bitmap;
    bitmap.close();
    return { ...base, kind: "image", width, height, url: await uploadFile(file, session) };
  }
  if (file.type !== "video/mp4") throw new RequestError("media");
  const { snapshot, ...info } = await videoSnapshot(file);
  const snapshotURL = await uploadFile(snapshot, session);
  return {
    ...base,
    ...info,
    kind: "video",
    snapshotURL,
    snapshotSize: snapshot.size,
    url: await uploadFile(file, session),
  };
}
