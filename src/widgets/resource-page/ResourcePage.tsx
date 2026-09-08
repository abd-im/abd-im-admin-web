import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Eye, Plus, RefreshCw, Search } from "lucide-react";
import { fieldDefaults, type Resource, type ResourceAction } from "@/shared/resources/model";
import { textAt, type Row } from "@/shared/lib/records";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { Button, Empty, Modal, PageHeader, Pagination } from "@/shared/ui";
import { FormFields } from "./FormFields";
import { ActionForm } from "./ActionForm";
import { useResourceQuery } from "./queries";

export function ResourcePage({ resource }: { resource: Resource }) {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const [draft, setDraft] = useState(() => fieldDefaults(resource.filters));
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<{ action: ResourceAction; row?: Row } | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const query = useResourceQuery(resource, filters, page, pageSize);
  const rows = query.data?.rows || [];
  useEffect(() => {
    if (query.data && !query.isFetching) {
      const last = Math.max(1, Math.ceil(query.data.total / pageSize));
      if (page > last) setPage(last);
    }
  }, [query.data, query.isFetching, page, pageSize]);
  return (
    <>
      <PageHeader
        title={t(resource.title)}
        actions={
          resource.create && (
            <Button variant="primary" onClick={() => setSelected({ action: resource.create! })}>
              <Plus size={16} />
              {t(resource.create.label)}
            </Button>
          )
        }
      />
      <form
        className="toolbar page-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ ...draft });
        }}
      >
        <FormFields fields={resource.filters} values={draft} setValues={setDraft} />
        {resource.filters.length > 0 && (
          <>
            <Button type="submit">
              <Search size={15} />
              {t("common.search")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const values = fieldDefaults(resource.filters);
                setDraft(values);
                setFilters(values);
                setPage(1);
              }}
            >
              {t("common.reset")}
            </Button>
          </>
        )}
        <Button
          type="button"
          title={t("common.refresh")}
          aria-label={t("common.refresh")}
          className="icon-button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={15} />
        </Button>
      </form>
      {query.error && (
        <div role="alert" className="error-banner">
          {errorMessage(query.error, t)}
        </div>
      )}
      {query.isFetching && (
        <div role="status" aria-label={t("common.loading")} className="loading-line" />
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {resource.columns.map((column) => (
                <th key={column.key}>{t(column.label)}</th>
              ))}
              <th className="row-actions">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={textAt(row, resource.id) || index}>
                {resource.columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? (
                      column.render(row, t, i18n.language)
                    ) : (
                      <span className="truncate" title={textAt(row, column.key)}>
                        {textAt(row, column.key) || "-"}
                      </span>
                    )}
                  </td>
                ))}
                <td>
                  <div className="actions nowrap">
                    <Button
                      title={t("common.details")}
                      aria-label={t("common.details")}
                      className="icon-button"
                      onClick={() => setDetail(row)}
                    >
                      <Eye size={15} />
                    </Button>
                    {resource.actions
                      ?.filter((action) => !action.visible || action.visible(row))
                      .map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.label}
                            title={t(action.label)}
                            aria-label={t(action.label)}
                            className={Icon ? "icon-button" : ""}
                            variant={action.danger ? "danger" : undefined}
                            onClick={() => setSelected({ action, row })}
                          >
                            {Icon ? <Icon size={15} /> : t(action.label)}
                          </Button>
                        );
                      })}
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
        total={query.data?.total || 0}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      {selected && (
        <ActionForm
          action={selected.action}
          row={selected.row}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
            void client.invalidateQueries({ queryKey: ["resource", resource.key] });
          }}
        />
      )}
      {detail && (
        <Modal title={t("common.details")} onClose={() => setDetail(null)}>
          <dl className="detail-list">
            {resource.columns.map((column) => (
              <div key={column.key}>
                <dt>{t(column.label)}</dt>
                <dd>
                  {column.render
                    ? column.render(detail, t, i18n.language)
                    : textAt(detail, column.key) || "-"}
                </dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </>
  );
}
