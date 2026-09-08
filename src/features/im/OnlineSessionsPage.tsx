import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, LogOut, RefreshCw } from "lucide-react";
import { useSession } from "@/shared/session/SessionProvider";
import { Button, Modal, Empty, PageHeader } from "@/shared/ui";
import { errorMessage } from "@/shared/i18n/errorMessage";
import { onlinePlatforms, platformLabel } from "@/shared/lib/platforms";
import { onlineStatus } from "@/shared/api/presence";
import { forceLogout } from "./members-api";

export function OnlineSessionsPage() {
  const { userID = "" } = useParams();
  const { session } = useSession();
  const { t } = useTranslation();
  const client = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ["online", session?.adminUserID, userID],
    queryFn: () => onlineStatus([userID], session),
  });
  const ids = onlinePlatforms(query.data?.find((item) => item.userID === userID));
  const mutation = useMutation({
    mutationFn: () => forceLogout(userID, selected!, session),
    onSuccess: () => {
      setSelected(null);
      void query.refetch();
      void client.invalidateQueries({ queryKey: ["resource"] });
    },
  });
  return (
    <>
      <Link className="back-link" to="/im/users">
        <ArrowLeft size={15} />
        {t("management.back")}
      </Link>
      <PageHeader
        title={t("management.sessions")}
        actions={
          <Button
            aria-label={t("common.refresh")}
            title={t("common.refresh")}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={16} />
          </Button>
        }
      />
      <p className="mono">{userID}</p>
      {query.error && (
        <div role="alert" className="error-banner">
          {errorMessage(query.error, t)}
        </div>
      )}
      {!ids.length && (
        <Empty
          text={t(
            query.isPending
              ? "common.loading"
              : query.error
                ? "common.loadFailed"
                : "management.noOnline",
          )}
        />
      )}
      <div className="table-wrap">
        <table className="table">
          <tbody>
            {ids.map((id) => (
              <tr key={id}>
                <td>{platformLabel(id, t)}</td>
                <td>
                  <Button
                    variant="danger"
                    onClick={() => {
                      mutation.reset();
                      setSelected(id);
                    }}
                  >
                    <LogOut size={15} />
                    {t("management.forceLogout")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected !== null && (
        <Modal
          title={t("management.forceLogout")}
          onClose={() => {
            if (!mutation.isPending) setSelected(null);
          }}
          footer={
            <>
              <Button disabled={mutation.isPending} onClick={() => setSelected(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {t("common.confirm")}
              </Button>
            </>
          }
        >
          <p>
            {t("management.forceLogoutConfirm", {
              userID,
              platform: platformLabel(selected, t),
            })}
          </p>
          {mutation.error && (
            <div role="alert" className="error-banner">
              {errorMessage(mutation.error, t)}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
