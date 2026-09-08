import { useId, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { FormField, FormValues } from "@/shared/resources/model";
import {
  Checkbox,
  Field,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
  Textarea,
} from "@/shared/ui";
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
  const formID = useId();
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
            <Label
              className="switch-row font-normal"
              key={field.key}
              htmlFor={`${formID}-${field.key}`}
            >
              <Checkbox
                id={`${formID}-${field.key}`}
                checked={Boolean(values[field.key])}
                onCheckedChange={(checked) => update(checked === true)}
              />
              {label}
            </Label>
          );
        return (
          <Field label={label} key={field.key}>
            {field.options ? (
              <NativeSelect
                className="h-[34px] bg-background py-0 dark:bg-background"
                aria-label={label}
                required={field.required}
                value={String(values[field.key] ?? "")}
                onChange={(event) => update(event.target.value)}
              >
                {field.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {t(option.label)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            ) : field.type === "textarea" ? (
              <Textarea
                className="min-h-[88px] resize-y bg-background dark:bg-background"
                required={field.required}
                value={String(values[field.key] ?? "")}
                onChange={(event) => update(event.target.value)}
              />
            ) : (
              <Input
                className="h-[34px] bg-background dark:bg-background"
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
