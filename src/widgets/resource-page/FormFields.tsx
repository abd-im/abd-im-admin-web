import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { FormField, FormValues } from "@/shared/resources/model";
import { Field } from "@/shared/ui";
import { EntityPicker } from "@/features/directory/EntityPicker";
import { UploadField } from "@/features/files/UploadField";

export function FormFields({
  fields,
  values,
  setValues,
  onUpload = () => {},
}: {
  fields: FormField[];
  values: FormValues;
  setValues: Dispatch<SetStateAction<FormValues>>;
  onUpload?: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      {fields.map((field) => {
        if (field.visible && !field.visible(values)) return null;
        const update = (value: string | boolean) =>
          setValues((current) => ({ ...current, [field.key]: value }));
        const label = t(field.label);
        if (field.type === "image")
          return (
            <UploadField
              key={field.key}
              label={label}
              value={String(values[field.key] || "")}
              onChange={update}
              onBusy={onUpload}
            />
          );
        if (field.type === "users" || field.type === "user" || field.type === "groups")
          return (
            <EntityPicker
              key={field.key}
              label={label}
              value={String(values[field.key] || "")}
              onChange={update}
              group={field.type === "groups"}
              single={field.type === "user"}
            />
          );
        if (field.type === "checkbox")
          return (
            <label className="switch-row" key={field.key}>
              <input
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(event) => update(event.target.checked)}
              />
              {label}
            </label>
          );
        return (
          <Field label={label} key={field.key}>
            {field.options ? (
              <select
                className="select"
                aria-label={label}
                required={field.required}
                value={String(values[field.key] ?? "")}
                onChange={(event) => update(event.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                className="textarea"
                required={field.required}
                value={String(values[field.key] ?? "")}
                onChange={(event) => update(event.target.value)}
              />
            ) : (
              <input
                className="input"
                type={field.type || "text"}
                autoComplete={field.type === "password" ? "new-password" : "off"}
                required={field.required}
                min={field.min}
                max={field.max}
                value={String(values[field.key] ?? "")}
                onChange={(event) => update(event.target.value)}
              />
            )}
          </Field>
        );
      })}
    </>
  );
}
