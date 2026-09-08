import { z } from "zod";

export const sessionSchema = z.object({
  adminAccount: z.string(),
  adminToken: z.string().min(1),
  adminUserID: z.string().min(1),
  nickname: z.string(),
  faceURL: z.string(),
  level: z.number(),
  imUserID: z.string().min(1),
  imToken: z.string().min(1),
});
export type AdminSession = z.infer<typeof sessionSchema>;
export const SESSION_KEY = "abd_im_admin_session_v1";
