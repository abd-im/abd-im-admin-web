import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getProfile, updateProfile, changePassword, type Profile } from "@/features/account/api";
import { UploadField } from "@/features/files/UploadField";
import { useSession } from "@/shared/session/SessionProvider";
import { Button, Empty, Field, PageHeader } from "@/shared/ui";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { ValidationError } from "@/shared/api/errors";
import { formatTime } from "@/shared/lib/date";

function ProfileForm({ profile }: { profile: Profile }) {
  const client = useQueryClient();
  const { t, i18n } = useTranslation();
  const { session, setSession } = useSession();
  const [nickname, setNickname] = useState(profile.nickname);
  const [faceURL, setFaceURL] = useState(profile.faceURL);
  const [uploading, setUploading] = useState(false);
  const mutation = useMutation({
    mutationFn: () => updateProfile(nickname.trim(), faceURL, session),
    onSuccess: () => {
      client.setQueryData(["account", session?.adminUserID], {
        ...profile,
        nickname: nickname.trim(),
        faceURL,
      });
      if (session) setSession({ ...session, nickname: nickname.trim(), faceURL });
    },
  });
  return (
    <form
      className="settings-form form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (!uploading && !mutation.isPending) mutation.mutate();
      }}
    >
      <dl className="detail-list">
        <div>
          <dt>{t("auth.account")}</dt>
          <dd>{profile.account}</dd>
        </div>
        <div>
          <dt>{t("fields.userID")}</dt>
          <dd className="mono">{profile.userID}</dd>
        </div>
        <div>
          <dt>{t("management.createdAt")}</dt>
          <dd>{formatTime(profile.createTime, i18n.language, "seconds")}</dd>
        </div>
      </dl>
      <fieldset disabled={mutation.isPending}>
        <UploadField
          label={t("fields.avatar")}
          value={faceURL}
          onChange={setFaceURL}
          onBusy={setUploading}
        />
        <Field label={t("fields.nickname")}>
          <input
            className="input"
            required
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </Field>
      </fieldset>
      {mutation.error && (
        <div className="error-banner" role="alert">
          {errorMessage(mutation.error, t)}
        </div>
      )}
      {mutation.isSuccess && (
        <div className="success-banner" role="status">
          {t("management.saved")}
        </div>
      )}
      <div>
        <Button
          variant="primary"
          type="submit"
          disabled={uploading || mutation.isPending || !nickname.trim()}
        >
          <Save size={15} />
          {t(mutation.isPending ? "common.submitting" : "management.save")}
        </Button>
      </div>
    </form>
  );
}
export function ProfilePage() {
  const { t } = useTranslation();
  const { session } = useSession();
  const query = useQuery({
    queryKey: ["account", session?.adminUserID],
    queryFn: () => getProfile(session),
  });
  return (
    <>
      <PageHeader title={t("nav.profile")} />
      {query.error && (
        <div className="error-banner" role="alert">
          {errorMessage(query.error, t)}{" "}
          <Button onClick={() => void query.refetch()}>{t("common.retry")}</Button>
        </div>
      )}
      {query.data ? (
        <ProfileForm profile={query.data} />
      ) : (
        <Empty text={t(query.isPending ? "common.loading" : "common.loadFailed")} />
      )}
    </>
  );
}
export function PasswordPage() {
  const { t } = useTranslation();
  const { session, setSession } = useSession();
  const [values, setValues] = useState({ current: "", password: "", confirm: "" });
  const mutation = useMutation({
    mutationFn: () => {
      if (values.password !== values.confirm)
        throw new ValidationError("management.passwordMismatch");
      if (values.password === values.current) throw new ValidationError("management.passwordSame");
      return changePassword(values.current, values.password, session);
    },
    onSuccess: () => setSession(null),
  });
  return (
    <>
      <PageHeader title={t("nav.password")} />
      <form
        className="settings-form form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.isPending) mutation.mutate();
        }}
      >
        <fieldset disabled={mutation.isPending}>
          {(
            [
              ["current", "management.passwordCurrent"],
              ["password", "management.passwordNew"],
              ["confirm", "management.passwordConfirm"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={t(label)}>
              <input
                className="input"
                type="password"
                required
                autoComplete={key === "current" ? "current-password" : "new-password"}
                value={values[key]}
                onChange={(event) => setValues({ ...values, [key]: event.target.value })}
              />
            </Field>
          ))}
        </fieldset>
        {mutation.error && (
          <div className="error-banner" role="alert">
            {errorMessage(mutation.error, t)}
          </div>
        )}
        <div>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            <KeyRound size={15} />
            {t(mutation.isPending ? "common.submitting" : "nav.password")}
          </Button>
        </div>
      </form>
    </>
  );
}
