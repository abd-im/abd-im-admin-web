import { useId, useState } from "react";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fieldDefaults, type FormValues, type ResourceAction } from "@/shared/resources/model";
import { valueAt, type Row } from "@/shared/lib/records";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { Button, Modal } from "@/shared/ui";
import { FormFields } from "./FormFields";
import { RequiredFieldError, useResourceAction } from "./queries";

export function ActionForm({
  action,
  row,
  onClose,
  onSuccess,
}: {
  action: ResourceAction;
  row?: Row;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const formID = useId();
  const [values, setValues] = useState<FormValues>(() => ({
    ...fieldDefaults(action.fields || []),
    ...(row && action.initial ? action.initial(row) : {}),
  }));
  const [uploading, setUploading] = useState(false);
  const mutation = useResourceAction(action, row, onSuccess);
  const busy = mutation.isPending || uploading;
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <Modal
      title={t(action.label)}
      onClose={close}
      footer={
        <>
          <Button disabled={busy} onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button
            form={formID}
            type="submit"
            disabled={busy}
            variant={action.danger ? "danger" : "primary"}
          >
            <Save size={15} />
            {t(mutation.isPending ? "common.submitting" : "common.confirm")}
          </Button>
        </>
      }
    >
      <form
        id={formID}
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) mutation.mutate(values);
        }}
      >
        {row && (
          <div className="selected-ids">
            {String(
              row.userID ||
                row.groupID ||
                valueAt(row, "groupInfo.groupID") ||
                valueAt(row, "friendUser.userID") ||
                row.id ||
                "",
            )}
          </div>
        )}
        <fieldset disabled={mutation.isPending}>
          {action.confirmation && row && <p>{action.confirmation(row, t)}</p>}
          {action.fields?.length ? (
            <FormFields
              fields={action.fields}
              values={values}
              setValues={setValues}
              onUpload={setUploading}
            />
          ) : (
            !action.confirmation && <p>{t("common.confirmAction", { action: t(action.label) })}</p>
          )}
        </fieldset>
        {mutation.error && (
          <div role="alert" className="error-banner">
            {mutation.error instanceof RequiredFieldError
              ? t("common.required", { field: t(mutation.error.field) })
              : errorMessage(mutation.error, t)}
          </div>
        )}
      </form>
    </Modal>
  );
}
