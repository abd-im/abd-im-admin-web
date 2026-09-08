import { post } from "@/shared/api/client";
import { RequestError } from "@/shared/api/errors";
import type { AdminSession } from "@/shared/session/model";

type UploadTicket = {
  id: string;
  url: string;
  file: string;
  formData: Record<string, string>;
  header?: { key: string; values: string[] }[];
  successCodes: number[];
};

export async function uploadFile(file: File, session: AdminSession | null) {
  if (!file.size) throw new RequestError("emptyFile");
  const name = `admin/${crypto.randomUUID()}/${file.name}`;
  const ticket = await post<UploadTicket>(
    "im",
    "/object/initiate_form_data",
    {
      name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      group: "admin",
    },
    session,
  );
  const body = new FormData();
  Object.entries(ticket.formData || {}).forEach(([key, value]) => body.append(key, value));
  body.append(ticket.file, file);
  const headers = new Headers();
  ticket.header?.forEach(({ key, values }) =>
    values.forEach((value) => headers.append(key, value)),
  );
  const response = await fetch(ticket.url, {
    method: "POST",
    body,
    headers,
    signal: AbortSignal.timeout(120_000),
  });
  if (!ticket.successCodes.includes(response.status))
    throw new RequestError("upload", { status: response.status });
  const result = await post<{ url: string }>(
    "im",
    "/object/complete_form_data",
    { id: ticket.id },
    session,
  );
  return result.url;
}
