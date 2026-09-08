import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/shared/session/SessionProvider";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { Button, Empty, Modal, Pagination } from "@/shared/ui";
import { splitIDs } from "@/shared/lib/records";
import { searchDirectory } from "./api";

export function EntityPicker({
  label,
  value,
  onChange,
  group = false,
  single = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  group?: boolean;
  single?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const ids = splitIDs(value);
  return (
    <div className="form-stack">
      <span className="field-label">{label}</span>
      <div className="actions">
        <Button type="button" onClick={() => setOpen(true)}>
          <Users size={15} />
          {t(group ? "picker.groups" : "picker.users")}
          {ids.length > 0 && ` (${ids.length})`}
        </Button>
        {ids.length > 0 && (
          <Button
            type="button"
            className="icon-button"
            title={t("picker.clear", { label })}
            aria-label={t("picker.clear", { label })}
            onClick={() => onChange("")}
          >
            <X size={15} />
          </Button>
        )}
      </div>
      {ids.length > 0 && <div className="selected-ids">{ids.join(", ")}</div>}
      {open &&
        createPortal(
          <PickerDialog
            label={label}
            ids={ids}
            group={group}
            single={single}
            onClose={() => setOpen(false)}
            onSelect={(ids) => {
              onChange(ids.join("\n"));
              setOpen(false);
            }}
          />,
          document.body,
        )}
    </div>
  );
}

function PickerDialog({
  label,
  ids,
  group,
  single,
  onClose,
  onSelect,
}: {
  label: string;
  ids: string[];
  group: boolean;
  single: boolean;
  onClose: () => void;
  onSelect: (ids: string[]) => void;
}) {
  const { session } = useSession();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(new Set(ids));
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["picker", group, session?.adminUserID, keyword, page],
    queryFn: () => searchDirectory(group, keyword, page, session),
  });
  const rows = query.data?.rows || [];
  return (
    <Modal
      title={label}
      onClose={onClose}
      footer={
        <>
          <span className="selection-count">{t("picker.selected", { count: selected.size })}</span>
          <Button type="button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={() => onSelect([...selected])}>
            {t("picker.confirm")}
          </Button>
        </>
      }
    >
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          // Portal events still bubble through the parent form's React tree.
          event.stopPropagation();
          setKeyword(draft.trim());
          setPage(1);
        }}
      >
        <input
          className="input"
          aria-label={t(group ? "picker.searchGroups" : "picker.searchUsers")}
          placeholder={t(group ? "picker.searchGroups" : "picker.searchUsers")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit">
          <Search size={15} />
          {t("common.search")}
        </Button>
      </form>
      {query.error && (
        <div role="alert" className="error-banner">
          {errorMessage(query.error, t)}
          <Button type="button" onClick={() => void query.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t("common.select")}</th>
              <th>{t(group ? "fields.groupName" : "fields.nickname")}</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ id, name }) => (
              <tr key={id}>
                <td>
                  <input
                    type={single ? "radio" : "checkbox"}
                    name="entity"
                    aria-label={t("picker.select", { name: name || id })}
                    checked={selected.has(id)}
                    onChange={() =>
                      setSelected((current) => {
                        if (single) return new Set([id]);
                        const next = new Set(current);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                  />
                </td>
                <td>{name || "-"}</td>
                <td className="mono">{id}</td>
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
      <Pagination page={page} pageSize={10} total={query.data?.total || 0} onPage={setPage} />
      {selected.size > 0 && (
        <div className="selected-ids">
          {[...selected].map((id) => (
            <Button
              key={id}
              type="button"
              title={t("picker.remove", { id })}
              onClick={() =>
                setSelected((current) => {
                  const next = new Set(current);
                  next.delete(id);
                  return next;
                })
              }
            >
              {id}
              <X size={13} />
            </Button>
          ))}
        </div>
      )}
    </Modal>
  );
}
