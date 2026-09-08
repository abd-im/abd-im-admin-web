import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/shared/session/SessionProvider";
import { uploadFile } from "./api";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { RequestError } from "@/shared/api/errors";
import { Button } from "@/shared/ui";

export function UploadField({
  label,
  value,
  onChange,
  onBusy,
  image = true,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
  image?: boolean;
}) {
  const { session } = useSession();
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const select = async (file?: File) => {
    if (!file) return;
    if (image && !file.type.startsWith("image/")) {
      setError(new RequestError("image"));
      return;
    }
    setBusy(true);
    onBusy(true);
    setError(null);
    try {
      onChange(await uploadFile(file, session));
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
      onBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="form-stack upload-field">
      <span className="field-label">{label}</span>
      <div className="actions">
        {value && image && <img className="upload-preview" src={value} alt={label} />}
        <input
          ref={input}
          type="file"
          accept={image ? "image/*" : undefined}
          aria-label={label}
          disabled={busy}
          hidden
          onChange={(event) => void select(event.target.files?.[0])}
        />
        <Button type="button" disabled={busy} onClick={() => input.current?.click()}>
          <Upload size={15} />
          {t(busy ? "upload.uploading" : "upload.upload")}
        </Button>
        {value && (
          <Button
            type="button"
            className="icon-button"
            disabled={busy}
            title={t("upload.remove")}
            aria-label={t("upload.remove")}
            onClick={() => onChange("")}
          >
            <X size={15} />
          </Button>
        )}
      </div>
      {value && !image && (
        <a className="text-link truncate" href={value} target="_blank" rel="noreferrer">
          {t("upload.view")}
        </a>
      )}
      {!!error && (
        <div role="alert" className="error-banner">
          {errorMessage(error, t)}
        </div>
      )}
    </div>
  );
}
