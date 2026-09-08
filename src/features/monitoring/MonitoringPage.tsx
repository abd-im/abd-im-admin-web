import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, PageHeader } from "@/shared/ui";

export function MonitoringPage() {
  const { t } = useTranslation();
  const [key, setKey] = useState(0);
  const [error, setError] = useState(false);
  const url =
    import.meta.env.VITE_MONITORING_URL ||
    `${import.meta.env.VITE_IM_API_BASE || "/im-api"}/third/prometheus`;
  return (
    <>
      <PageHeader
        title={t("nav.dashboard")}
        actions={
          <>
            <Button
              className="icon-button"
              title={t("common.refresh")}
              aria-label={t("common.refresh")}
              onClick={() => {
                setError(false);
                setKey((value) => value + 1);
              }}
            >
              <RefreshCw size={15} />
            </Button>
            <a className="button" href={url} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              {t("management.openMonitoring")}
            </a>
          </>
        }
      />
      {error && (
        <div className="error-banner" role="alert">
          {t("management.monitoringUnavailable")}
        </div>
      )}
      <iframe
        key={key}
        className="monitoring-frame"
        src={url}
        title={t("nav.dashboard")}
        onError={() => setError(true)}
      />
    </>
  );
}
