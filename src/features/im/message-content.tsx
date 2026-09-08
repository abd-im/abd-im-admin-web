import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import type { TranslationKey } from "@/shared/i18n";
import { httpURL } from "@/shared/lib/url";
import { textAt, type Row } from "@/shared/lib/records";

export const messageTypes: Record<number, TranslationKey> = {
  101: "messages.text",
  102: "messages.picture",
  103: "messages.sound",
  104: "messages.video",
  105: "messages.file",
  106: "messages.at",
  107: "messages.merged",
  108: "messages.card",
  109: "messages.location",
  110: "messages.custom",
  114: "messages.quote",
  1400: "messages.notification",
  143: "messages.text",
  118: "messages.markdown",
};

export function parseContent(content: string): Row {
  try {
    const data: unknown = JSON.parse(content);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const row = data as Row;
      return typeof row.detail === "string" ? parseContent(row.detail) : row;
    }
    return { content: String(data ?? "") };
  } catch {
    return { content };
  }
}

export function MessageContent({
  content,
  type,
  depth = 0,
}: {
  content: string;
  type: number;
  depth?: number;
}) {
  const { t } = useTranslation();
  const parsed = parseContent(content);
  const data = (
    type === 1400
      ? parsed
      : parsed.textElem ||
        parsed.pictureElem ||
        parsed.fileElem ||
        parsed.videoElem ||
        parsed.soundElem ||
        parsed.quoteElem ||
        parsed.markdownTextElem ||
        parsed.streamElem ||
        parsed
  ) as Row;
  const link = (value: unknown, label: string = t("messages.open")) => {
    const url = httpURL(value);
    return url ? (
      <a className="text-link" href={url} target="_blank" rel="noreferrer">
        {label}
      </a>
    ) : null;
  };
  const imageURL = httpURL(
    textAt(data, "sourcePicture.url") || textAt(data, "pictureElem.sourcePicture.url"),
  );
  const videoURL = httpURL(data.videoUrl || textAt(data, "videoElem.videoUrl"));
  const soundURL = httpURL(data.sourceUrl);
  const body =
    String(data.text || data.content || data.description || "") +
    (type === 143 && Array.isArray(data.packets) ? data.packets.join("") : "");
  return (
    <div className="message-content">
      {body && (type === 118 ? <ReactMarkdown>{body}</ReactMarkdown> : <p>{body}</p>)}
      {imageURL && (
        <a href={imageURL} target="_blank" rel="noreferrer">
          <img src={imageURL} alt={t("messages.picture")} loading="lazy" />
        </a>
      )}
      {videoURL && (
        <video
          src={videoURL}
          poster={httpURL(data.snapshotUrl || textAt(data, "videoElem.snapshotUrl"))}
          controls
          preload="metadata"
        />
      )}
      {type === 103 && soundURL && <audio controls src={soundURL} preload="metadata" />}
      {type === 105 && link(data.sourceUrl, String(data.fileName || t("messages.file")))}
      {type === 108 && (
        <p>
          {String(data.nickname || "")} <span className="mono">{String(data.userID || "")}</span>
        </p>
      )}
      {type === 109 && (
        <p>
          {String(data.latitude ?? "")} / {String(data.longitude ?? "")}
        </p>
      )}
      {type === 110 && (
        <pre>{typeof data.data === "string" ? data.data : JSON.stringify(data.data, null, 2)}</pre>
      )}
      {type === 1400 && (
        <>
          {link(data.url || data.externalUrl)}
          {link(
            textAt(data, "fileElem.sourceUrl"),
            textAt(data, "fileElem.fileName") || t("messages.file"),
          )}
        </>
      )}
      {depth < 3 && data.quoteMessage != null && typeof data.quoteMessage === "object" && (
        <blockquote>
          <MessageContent
            content={JSON.stringify(data.quoteMessage)}
            type={Number((data.quoteMessage as Row).contentType || 101)}
            depth={depth + 1}
          />
        </blockquote>
      )}
      {depth < 3 &&
        Array.isArray(data.multiMessage) &&
        data.multiMessage.map((message, index) => {
          const row = message as Row;
          const element =
            row.textElem ||
            row.pictureElem ||
            row.fileElem ||
            row.videoElem ||
            row.soundElem ||
            row.quoteElem ||
            row;
          return (
            <blockquote key={index}>
              <span>{String(row.senderNickname || "")}</span>
              <MessageContent
                content={JSON.stringify(element)}
                type={Number(row.contentType)}
                depth={depth + 1}
              />
            </blockquote>
          );
        })}
      {!body && !imageURL && !videoURL && !messageTypes[type] && <p>{t("messages.noPreview")}</p>}
    </div>
  );
}
