import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw, Search, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/shared/session/SessionProvider";
import { Button, Empty, Field, Modal, PageHeader, Pagination, StatusBadge } from "@/shared/ui";
import { formatTime } from "@/shared/lib/date";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { searchMessages, revokeMessage } from "./api";
import type { MessageResult } from "./types";
import { MessageContent, messageTypes } from "./message-content";

function defaults(group: boolean) {
  const date = new Date();
  return {
    sendID: "",
    recvID: "",
    sendTime: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    contentType: 0,
    sessionType: group ? 3 : 1,
  };
}

export function MessagesPage({ group = false }: { group?: boolean }) {
  const { t, i18n } = useTranslation();
  const { session } = useSession();
  const [draft, setDraft] = useState(() => defaults(group));
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detail, setDetail] = useState<MessageResult | null>(null);
  const [revoke, setRevoke] = useState<MessageResult | null>(null);
  const query = useQuery({
    queryKey: ["messages", group, session?.imUserID, filters, page, pageSize],
    queryFn: () => searchMessages(filters, filters.sessionType, page, pageSize, session),
  });
  const mutation = useMutation({
    mutationFn: (row: MessageResult) => revokeMessage(row.chatLog, session),
    onSuccess: () => {
      setRevoke(null);
      void query.refetch();
    },
  });
  const rows = query.data?.chatLogs || [];
  return (
    <>
      <PageHeader title={t(group ? "nav.groupMessages" : "nav.userMessages")} />
      <form
        className="toolbar page-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ ...draft });
          setPage(1);
        }}
      >
        <Field label={t("fields.senderID")}>
          <input
            className="input"
            value={draft.sendID}
            onChange={(event) => setDraft({ ...draft, sendID: event.target.value })}
          />
        </Field>
        <Field label={t(group ? "fields.groupID" : "fields.receiverID")}>
          <input
            className="input"
            value={draft.recvID}
            onChange={(event) => setDraft({ ...draft, recvID: event.target.value })}
          />
        </Field>
        <Field label={t("fields.date")}>
          <input
            className="input"
            type="date"
            value={draft.sendTime}
            onChange={(event) => setDraft({ ...draft, sendTime: event.target.value })}
          />
        </Field>
        {!group && (
          <Field label={t("messages.session")}>
            <select
              className="select"
              value={draft.sessionType}
              onChange={(event) => setDraft({ ...draft, sessionType: Number(event.target.value) })}
            >
              <option value={1}>{t("messages.single")}</option>
              <option value={4}>{t("messages.notification")}</option>
            </select>
          </Field>
        )}
        <Field label={t("messages.type")}>
          <select
            className="select"
            value={draft.contentType}
            onChange={(event) => setDraft({ ...draft, contentType: Number(event.target.value) })}
          >
            <option value={0}>{t("management.all")}</option>
            {Object.entries(messageTypes).map(([type, label]) => (
              <option key={type} value={type}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit">
          <Search size={15} />
          {t("common.search")}
        </Button>
        <Button
          type="button"
          onClick={() => {
            const next = defaults(group);
            setDraft(next);
            setFilters(next);
            setPage(1);
          }}
        >
          {t("common.reset")}
        </Button>
        <Button
          type="button"
          className="icon-button"
          title={t("common.refresh")}
          aria-label={t("common.refresh")}
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw size={15} />
        </Button>
      </form>
      {query.error && (
        <div className="error-banner" role="alert">
          {errorMessage(query.error, t)}
        </div>
      )}
      {query.isFetching && (
        <div className="loading-line" role="status" aria-label={t("common.loading")} />
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {group && <th>{t("fields.avatar")}</th>}
              {[
                "fields.sender",
                group ? "fields.group" : "fields.receiver",
                "messages.type",
                "fields.content",
                "fields.sentAt",
                "fields.status",
                "common.actions",
              ].map((key) => (
                <th key={key}>{t(key as "fields.sender")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.chatLog.clientMsgID}>
                {group && (
                  <td>
                    <span className="avatar">
                      {row.chatLog.groupFaceURL ? (
                        <img src={row.chatLog.groupFaceURL} alt="" />
                      ) : (
                        row.chatLog.groupName?.slice(0, 1)
                      )}
                    </span>
                  </td>
                )}
                <td>
                  {row.chatLog.senderNickname}
                  <div className="mono">{row.chatLog.sendID}</div>
                </td>
                <td>
                  {group ? row.chatLog.groupName : row.chatLog.recvNickname}
                  <div className="mono">{group ? row.chatLog.groupID : row.chatLog.recvID}</div>
                  {group && (
                    <small>
                      {t("fields.members")}: {row.chatLog.groupMemberCount ?? "-"}
                    </small>
                  )}
                </td>
                <td>{t(messageTypes[row.chatLog.contentType] || "management.unknown")}</td>
                <td>
                  <div className="message-cell">
                    <MessageContent
                      content={row.chatLog.content}
                      type={row.chatLog.contentType}
                      message={row.chatLog.message}
                    />
                  </div>
                </td>
                <td>{formatTime(row.chatLog.sendTime, i18n.language)}</td>
                <td>
                  <StatusBadge active={!row.isRevoked}>
                    {t(row.isRevoked ? "status.revoked" : "status.sent")}
                  </StatusBadge>
                </td>
                <td>
                  <div className="actions nowrap">
                    <Button
                      className="icon-button"
                      title={t("messages.expand")}
                      aria-label={t("messages.expand")}
                      onClick={() => setDetail(row)}
                    >
                      <Eye size={15} />
                    </Button>
                    <Button
                      className="icon-button"
                      variant="danger"
                      title={t("messages.revoke")}
                      aria-label={t("messages.revoke")}
                      disabled={
                        row.isRevoked ||
                        !row.chatLog.seq ||
                        ![101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 114, 118, 143].includes(
                          row.chatLog.contentType,
                        )
                      }
                      onClick={() => {
                        mutation.reset();
                        setRevoke(row);
                      }}
                    >
                      <Undo2 size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <Empty
          text={t(
            query.isPending ? "common.loading" : query.error ? "common.loadFailed" : "common.empty",
          )}
        />
      )}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={query.data?.chatLogsNum || 0}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      {detail && (
        <Modal title={t("messages.preview")} onClose={() => setDetail(null)}>
          <span className="mono">{detail.chatLog.clientMsgID}</span>
          <MessageContent
            content={detail.chatLog.content}
            type={detail.chatLog.contentType}
            message={detail.chatLog.message}
          />
          <details>
            <summary>{t("messages.raw")}</summary>
            <pre className="raw-content">{JSON.stringify(detail.chatLog, null, 2)}</pre>
          </details>
        </Modal>
      )}
      {revoke && (
        <Modal
          title={t("messages.revoke")}
          onClose={() => {
            if (!mutation.isPending) setRevoke(null);
          }}
          footer={
            <>
              <Button disabled={mutation.isPending} onClick={() => setRevoke(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(revoke)}
              >
                <Undo2 size={15} />
                {t(mutation.isPending ? "common.submitting" : "common.confirm")}
              </Button>
            </>
          }
        >
          <p>{t("messages.revokeConfirm", { id: revoke.chatLog.clientMsgID })}</p>
          {mutation.error && (
            <div className="error-banner" role="alert">
              {errorMessage(mutation.error, t)}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
