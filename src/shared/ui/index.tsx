import { X, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  type ButtonHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  useId,
  useRef,
  useEffect,
} from "react";

export function Button({
  variant,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger";
}) {
  return (
    <button
      type="button"
      className={`button${variant ? ` ${variant}` : ""} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  grow,
  children,
}: PropsWithChildren<{ label: string; grow?: boolean }>) {
  return (
    <label className={`field${grow ? " grow" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  actions,
  children,
  flush,
}: PropsWithChildren<{ title?: string; actions?: ReactNode; flush?: boolean }>) {
  return (
    <section className="panel">
      {(title || actions) && (
        <div className="panel-header">
          <div className="panel-title">{title}</div>
          <div className="actions">{actions}</div>
        </div>
      )}
      <div className={flush ? "" : "panel-body"}>{children}</div>
    </section>
  );
}

export function Modal({
  title,
  children,
  footer,
  onClose,
}: PropsWithChildren<{ title: string; footer?: ReactNode; onClose: () => void }>) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleID = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleID}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleID}>{title}</h2>
        <Button
          type="button"
          title={t("common.close")}
          className="icon-button"
          aria-label={t("common.close")}
          onClick={onClose}
        >
          <X size={16} />
        </Button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </dialog>
  );
}

export function StatusBadge({ active, children }: PropsWithChildren<{ active?: boolean }>) {
  return <span className={`badge${active ? " success" : ""}`}>{children}</span>;
}

export function Empty({ text }: { text?: string }) {
  const { t } = useTranslation();
  return (
    <div className="empty">
      <div>
        <div className="empty-icon">
          <Inbox size={21} />
        </div>
        {text ?? t("common.empty")}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pagination">
      <span>{t("common.total", { count: total })}</span>
      {onPageSize && (
        <select
          className="select page-size"
          aria-label={t("pagination.size")}
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value))}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      )}
      <Button
        title={t("common.previous")}
        aria-label={t("common.previous")}
        className="icon-button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <span>
        {t("common.page", {
          page: new Intl.NumberFormat(i18n.language).format(page),
          pages: new Intl.NumberFormat(i18n.language).format(pages),
        })}
      </span>
      <Button
        title={t("common.next")}
        aria-label={t("common.next")}
        className="icon-button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight size={16} />
      </Button>
      <input
        key={`${page}-${pages}`}
        className="input page-jump"
        type="number"
        min={1}
        max={pages}
        defaultValue={page}
        aria-label={t("pagination.jump")}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            const next = Number(event.currentTarget.value);
            if (Number.isInteger(next) && next >= 1 && next <= pages) onPage(next);
          }
        }}
        onBlur={(event) => {
          const next = Number(event.currentTarget.value);
          if (Number.isInteger(next) && next >= 1 && next <= pages) onPage(next);
          else event.currentTarget.value = String(page);
        }}
      />
    </div>
  );
}
