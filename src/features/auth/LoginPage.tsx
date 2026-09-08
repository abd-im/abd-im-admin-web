import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Field } from "@/shared/ui";
import { useSession } from "@/shared/session/SessionProvider";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { LanguageSelect } from "@/shared/i18n/LanguageSelect";
import { login } from "./api";

export function Login() {
  const { session, setSession } = useSession();
  const { t } = useTranslation();
  const location = useLocation();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () => login(account.trim(), password),
    onSuccess: setSession,
  });
  const from = location.state?.from;
  if (session)
    return (
      <Navigate
        replace
        to={
          typeof from === "string" &&
          from.startsWith("/") &&
          !from.startsWith("//") &&
          from !== "/login"
            ? from
            : "/business/users"
        }
      />
    );
  return (
    <main className="login-shell">
      <div className="login-language">
        <LanguageSelect />
      </div>
      <div className="login-panel">
        <div className="login-brand">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          ABD IM Admin
        </div>
        <h1>{t("auth.title")}</h1>
        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label={t("auth.account")}>
            <input
              className="input"
              autoComplete="username"
              required
              value={account}
              onChange={(event) => setAccount(event.target.value)}
            />
          </Field>
          <Field label={t("auth.password")}>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {mutation.error && (
            <div role="alert" className="error-banner">
              {errorMessage(mutation.error, t)}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            <LogIn size={16} />
            {t(mutation.isPending ? "auth.signingIn" : "auth.signIn")}
          </Button>
        </form>
      </div>
    </main>
  );
}
