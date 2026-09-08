import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "@/shared/session/SessionProvider";
import type { FormValues, Resource, ResourceAction } from "@/shared/resources/model";
import type { Row } from "@/shared/lib/records";
import type { TranslationKey } from "@/shared/i18n";

export class RequiredFieldError extends Error {
  constructor(readonly field: TranslationKey) {
    super(field);
  }
}

export function useResourceQuery(
  resource: Resource,
  filters: FormValues,
  page: number,
  size: number,
) {
  const { session } = useSession();
  return useQuery({
    queryKey: ["resource", resource.key, session?.adminUserID, filters, page, size],
    queryFn: () => resource.load(filters, page, size, session),
  });
}

export function useResourceAction(
  action: ResourceAction,
  row: Row | undefined,
  onSuccess: () => void,
) {
  const { session } = useSession();
  return useMutation({
    mutationFn: async (values: FormValues) => {
      for (const field of action.fields || []) {
        if (field.required && !String(values[field.key] || "").trim())
          throw new RequiredFieldError(field.label);
      }
      return action.execute(values, row, session);
    },
    onSuccess,
  });
}
