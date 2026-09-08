import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Search, Upload, X, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { searchAccounts } from "@/features/notifications/api";
import {
  sendNotification,
  type NotificationDraft,
  type NotificationAttachment,
  type DeliveryResult,
} from "@/features/notifications/send-api";
import type { NotificationAccount } from "@/features/notifications/types";
import { EntityPicker } from "@/features/directory/EntityPicker";
import { uploadMedia, type UploadedMedia } from "@/features/files/media";
import { Button, Empty, Field, Modal, PageHeader, Pagination } from "@/shared/ui";
import { useSession } from "@/shared/session/SessionProvider";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { ValidationError } from "@/shared/api/errors";
import { httpURL } from "@/shared/lib/url";
import { splitIDs } from "@/shared/lib/records";

function attachment(media: UploadedMedia | null): NotificationAttachment {
  if (!media) return { mixType: 0 };
  if (media.kind === "image") {
    const picture = {
      uuid: crypto.randomUUID(),
      type: media.mime,
      size: media.size,
      width: media.width,
      height: media.height,
      url: media.url,
    };
    return {
      mixType: 1,
      pictureElem: { sourcePicture: picture, bigPicture: picture, snapshotPicture: picture },
    };
  }
  return {
    mixType: 2,
    videoElem: {
      videoUUID: crypto.randomUUID(),
      videoUrl: media.url,
      videoType: media.mime,
      videoSize: media.size,
      duration: media.duration!,
      snapshotUrl: media.snapshotURL!,
      snapshotSize: media.snapshotSize!,
      snapshotWidth: media.width,
      snapshotHeight: media.height,
    },
  };
}

export function NotificationPage() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [account, setAccount] = useState<NotificationAccount | null>(null);
  const [recipients, setRecipients] = useState("");
  const [all, setAll] = useState(false);
  const [text, setText] = useState("");
  const [url, setURL] = useState("");
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [review, setReview] = useState<NotificationDraft | null>(null);
  const [sentDraft, setSentDraft] = useState<NotificationDraft | null>(null);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const accounts = useQuery({
    queryKey: ["notification-accounts", session?.imUserID, search, page],
    queryFn: () => searchAccounts(search, page, 10, session),
  });
  const mutation = useMutation({
    mutationFn: (draft: NotificationDraft) => sendNotification(draft, session),
    onSuccess: (data, draft) => {
      setResult((previous) => ({
        results: [...(previous?.results || []), ...(data.results || [])],
        failedUserIDs: data.failedUserIDs || [],
      }));
      setSentDraft(draft);
      setReview(null);
    },
  });
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setMedia(await uploadMedia(file, session));
    } catch (error) {
      setError(error);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };
  const prepare = () => {
    setError(null);
    if (!account) return setError(new ValidationError("notification.chooseAccount"));
    if (!all && !splitIDs(recipients).length)
      return setError(new ValidationError("notification.chooseRecipients"));
    if (url && !httpURL(url)) return setError(new ValidationError("releases.invalidURL"));
    if (!text.trim()) return;
    mutation.reset();
    setReview({
      account,
      text: text.trim(),
      url: url.trim(),
      recvIDs: splitIDs(recipients),
      isSendAll: all,
      attachment: attachment(media),
    });
  };
  const busy = uploading || mutation.isPending;
  return (
    <>
      <PageHeader title={t("nav.sendNotification")} />
      {result ? (
        <div className="form-stack settings-form">
          <div role="status" className="success-banner">
            {t("notification.sent", { count: result.results.length })}
          </div>
          {result.failedUserIDs.length > 0 && (
            <>
              <div className="error-banner" role="alert">
                {t("notification.failed", { ids: result.failedUserIDs.join(", ") })}
              </div>
              <div>
                <Button
                  disabled={busy}
                  onClick={() => {
                    mutation.reset();
                    setReview({ ...sentDraft!, isSendAll: false, recvIDs: result.failedUserIDs });
                  }}
                >
                  <RotateCcw size={15} />
                  {t("notification.retryFailed")}
                </Button>
              </div>
            </>
          )}
          <div>
            <Button
              disabled={busy}
              onClick={() => {
                setResult(null);
                setSentDraft(null);
                mutation.reset();
                setText("");
                setURL("");
                setMedia(null);
              }}
            >
              {t("notification.new")}
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="form-stack notification-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) prepare();
          }}
        >
          <fieldset disabled={busy}>
            <div className="form-stack">
              <span className="field-label">{t("notification.account")}</span>
              <div className="toolbar">
                <input
                  className="input account-search"
                  aria-label={t("fields.keyword")}
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setSearch(keyword);
                      setPage(1);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    setSearch(keyword);
                    setPage(1);
                  }}
                >
                  <Search size={15} />
                  {t("common.search")}
                </Button>
              </div>
              {account && (
                <div className="selected-ids">
                  <span className="badge success">
                    {account.nickName} · {account.userID}
                  </span>
                </div>
              )}
              {accounts.error && (
                <div className="error-banner" role="alert">
                  {errorMessage(accounts.error, t)}{" "}
                  <Button type="button" onClick={() => void accounts.refetch()}>
                    {t("common.retry")}
                  </Button>
                </div>
              )}
              <div className="account-options">
                {(accounts.data?.notificationAccounts || []).map((item) => (
                  <label className="account-option" key={item.userID}>
                    <input
                      type="radio"
                      name="notificationAccount"
                      checked={account?.userID === item.userID}
                      onChange={() => setAccount(item)}
                    />
                    <span className="avatar">
                      {item.faceURL ? <img src={item.faceURL} alt="" /> : item.nickName.slice(0, 1)}
                    </span>
                    <span>
                      {item.nickName}
                      <small className="mono">{item.userID}</small>
                    </span>
                  </label>
                ))}
              </div>
              {!accounts.data?.notificationAccounts?.length && (
                <Empty
                  text={t(
                    accounts.isPending
                      ? "common.loading"
                      : accounts.error
                        ? "common.loadFailed"
                        : "common.empty",
                  )}
                />
              )}
              <Pagination
                page={page}
                pageSize={10}
                total={accounts.data?.total || 0}
                onPage={setPage}
              />
            </div>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={all}
                onChange={(event) => setAll(event.target.checked)}
              />
              {t("notification.allUsers")}
            </label>
            {!all && (
              <EntityPicker
                label={t("notification.recipients")}
                value={recipients}
                onChange={setRecipients}
              />
            )}
            <Field label={t("notification.content")}>
              <textarea
                className="textarea notification-text"
                required
                maxLength={500}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              <span className="character-count">{text.length} / 500</span>
            </Field>
            <Field label={t("notification.link")}>
              <input
                className="input"
                type="url"
                value={url}
                onChange={(event) => setURL(event.target.value)}
              />
            </Field>
            <div className="form-stack">
              <span className="field-label">{t("notification.attachment")}</span>
              <input
                ref={input}
                hidden
                type="file"
                accept="image/*,video/mp4"
                aria-label={t("notification.attachment")}
                onChange={(event) => void upload(event.target.files?.[0])}
              />
              <div className="actions">
                <Button type="button" onClick={() => input.current?.click()} disabled={busy}>
                  <Upload size={15} />
                  {t(uploading ? "upload.uploading" : "upload.upload")}
                </Button>
                {media && (
                  <>
                    <span className="truncate">{media.name}</span>
                    <Button
                      className="icon-button"
                      type="button"
                      title={t("upload.remove")}
                      aria-label={t("upload.remove")}
                      onClick={() => setMedia(null)}
                    >
                      <X size={15} />
                    </Button>
                  </>
                )}
              </div>
              {media && (
                <div className="message-content">
                  {media.kind === "image" ? (
                    <img src={media.url} alt={media.name} />
                  ) : (
                    <video controls src={media.url} poster={media.snapshotURL} />
                  )}
                </div>
              )}
            </div>
          </fieldset>
          {!!error && (
            <div className="error-banner" role="alert">
              {errorMessage(error, t)}
            </div>
          )}
          <div>
            <Button type="submit" variant="primary" disabled={busy}>
              <Send size={15} />
              {t("notification.review")}
            </Button>
          </div>
        </form>
      )}
      {review && (
        <Modal
          title={t("notification.confirmTitle")}
          onClose={() => {
            if (!mutation.isPending) setReview(null);
          }}
          footer={
            <>
              <Button disabled={mutation.isPending} onClick={() => setReview(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant={review.isSendAll ? "danger" : "primary"}
                disabled={mutation.isPending || mutation.isError}
                onClick={() => mutation.mutate(review)}
              >
                <Send size={15} />
                {t(mutation.isPending ? "notification.sending" : "notification.send")}
              </Button>
            </>
          }
        >
          <p>
            {t(review.isSendAll ? "notification.confirmAll" : "notification.confirmSelected", {
              count: review.recvIDs.length,
            })}
          </p>
          <strong>{review.account.nickName}</strong>
          {!review.isSendAll && <p className="selected-ids">{review.recvIDs.join(", ")}</p>}
          <p className="notification-preview">{review.text}</p>
          {review.url && (
            <a className="text-link" href={httpURL(review.url)} target="_blank" rel="noreferrer">
              {review.url}
            </a>
          )}
          {mutation.error && (
            <div className="error-banner" role="alert">
              {t("notification.unknownResult")} {errorMessage(mutation.error, t)}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
