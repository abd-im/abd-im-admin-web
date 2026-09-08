import md5 from "blueimp-md5";
import pkg from "../../../package.json";
import { post } from "@/shared/api/client";
import { RequestError } from "@/shared/api/errors";
import { sessionSchema } from "@/shared/session/model";

export async function login(account: string, password: string) {
  const response = await post("admin", "/account/login", {
    account,
    password: md5(password),
    version: pkg.version,
  });
  const result = sessionSchema.safeParse(response);
  if (!result.success) throw new RequestError("invalidSession");
  return result.data;
}
