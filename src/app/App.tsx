import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "@/shared/session/SessionProvider";
import { Shell } from "./layout/Shell";
import { Login } from "@/features/auth/LoginPage";
import { businessResources } from "@/features/business/resources";
import { imResources } from "@/features/im/resources";
import { notificationResources } from "@/features/notifications/resources";
import { releasesResource } from "@/features/releases/resources";
import { Empty, PageHeader } from "@/shared/ui";

const ResourcePage = lazy(() =>
  import("@/widgets/resource-page/ResourcePage").then((module) => ({
    default: module.ResourcePage,
  })),
);

const resources = {
  ...businessResources,
  ...imResources,
  ...notificationResources,
  "applications/versions": releasesResource,
};
const MessagesPage = lazy(() =>
  import("@/features/im/MessagesPage").then((m) => ({ default: m.MessagesPage })),
);
const OnlineSessionsPage = lazy(() =>
  import("@/features/im/OnlineSessionsPage").then((m) => ({ default: m.OnlineSessionsPage })),
);
const MemberPage = lazy(() =>
  import("@/widgets/im-management/MemberPages").then((m) => ({ default: m.MemberPage })),
);
const FriendPage = lazy(() =>
  import("@/widgets/im-management/MemberPages").then((m) => ({ default: m.FriendPage })),
);
const NotificationPage = lazy(() =>
  import("@/widgets/notifications/NotificationPage").then((m) => ({ default: m.NotificationPage })),
);
const ProfilePage = lazy(() =>
  import("@/widgets/account/AccountPages").then((m) => ({ default: m.ProfilePage })),
);
const PasswordPage = lazy(() =>
  import("@/widgets/account/AccountPages").then((m) => ({ default: m.PasswordPage })),
);
const MonitoringPage = lazy(() =>
  import("@/features/monitoring/MonitoringPage").then((m) => ({ default: m.MonitoringPage })),
);

function Protected() {
  const { session } = useSession();
  const location = useLocation();
  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  );
}

export function App() {
  const { t } = useTranslation();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route element={<Shell />}>
          <Route index element={<Navigate to="/business/users" replace />} />
          <Route path="dashboard" element={<MonitoringPage />} />
          <Route path="im/user-messages" element={<MessagesPage key="user" />} />
          <Route path="im/group-messages" element={<MessagesPage key="group" group />} />
          <Route path="im/users/:userID/sessions" element={<OnlineSessionsPage />} />
          <Route path="im/users/:userID/friends" element={<FriendPage />} />
          <Route path="im/groups/:groupID/members" element={<MemberPage />} />
          <Route path="notifications/send" element={<NotificationPage />} />
          <Route path="account/profile" element={<ProfilePage />} />
          <Route path="account/password" element={<PasswordPage />} />
          {Object.entries(resources).map(([path, resource]) => (
            <Route
              key={path}
              path={path}
              element={
                <Suspense fallback={<Empty text={t("common.loading")} />}>
                  <ResourcePage key={path} resource={resource} />
                </Suspense>
              }
            />
          ))}
          <Route
            path="*"
            element={
              <>
                <PageHeader title={t("app.unavailable")} />
                <p>{t("app.unavailableDescription")}</p>
              </>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
