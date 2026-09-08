import { X, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type ButtonHTMLAttributes, type PropsWithChildren, type ReactNode, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button as BaseButton } from "./button";
import { Badge } from "./badge";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { Label } from "./label";
import { Input } from "./input";

export { Input } from "./input";
export { Textarea } from "./textarea";
export { Label } from "./label";
export { Checkbox } from "./checkbox";
export { NativeSelect, NativeSelectOption } from "./native-select";

export function Button({
  variant,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger";
}) {
  return (
    <BaseButton
      type="button"
      variant={variant === "primary" ? "default" : "outline"}
      className={cn(
        "button h-[34px] gap-[7px] px-3 py-0 text-[13px] shadow-[var(--surface-shadow)] has-[>svg]:px-3",
        variant === "danger" &&
          "border-destructive/35 bg-[var(--danger-soft)] text-destructive hover:bg-[var(--danger-soft)] dark:bg-[var(--danger-soft)] dark:hover:bg-[var(--danger-soft)]",
        className.includes("icon-button") && "w-[34px] px-0 has-[>svg]:px-0",
        className,
      )}
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
    <Label className={cn("field grid items-start gap-[5px] font-normal", grow && "grow")}>
      <span>{label}</span>
      {children}
    </Label>
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
  // Resource actions mount dialogs without a DialogTrigger, so retain their focus target.
  const [returnFocus] = useState(() => document.activeElement);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="modal block w-[calc(100%-24px)] max-w-[640px] gap-0 overflow-y-auto bg-popover p-0 shadow-[var(--floating-shadow)] sm:max-w-[640px]"
        showCloseButton={false}
        aria-describedby={undefined}
        onInteractOutside={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
        }}
      >
        <div className="modal-head">
          <DialogTitle className="text-base leading-normal">{title}</DialogTitle>
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
      </DialogContent>
    </Dialog>
  );
}

export function StatusBadge({ active, children }: PropsWithChildren<{ active?: boolean }>) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "min-h-[22px] px-[7px] py-0.5 text-[11px]",
        active && "bg-[var(--success-soft)] text-[var(--success)]",
      )}
    >
      {children}
    </Badge>
  );
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
      <Input
        key={`${page}-${pages}`}
        className="input page-jump h-[34px] w-[66px] py-0"
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
