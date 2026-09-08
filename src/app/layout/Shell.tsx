import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Moon, Sun, LogOut, PanelLeftClose, PanelLeftOpen, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Empty } from "@/shared/ui";
import { useSession } from "@/shared/session/SessionProvider";
import { LanguageSelect } from "@/shared/i18n/LanguageSelect";
import { navigationGroups, SidebarContent, SidebarDrawer } from "./Sidebar";

export function Shell() {
  const { setSession } = useSession();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("abd_admin_sidebar_collapsed") === "true",
  );
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [closedGroups, setClosedGroups] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("abd_admin_sidebar_groups") || "[]");
      return Array.isArray(saved)
        ? saved.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  });
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("abd_admin_theme");
    return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("abd_admin_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    localStorage.setItem("abd_admin_sidebar_collapsed", String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    localStorage.setItem("abd_admin_sidebar_groups", JSON.stringify(closedGroups));
  }, [closedGroups]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const change = () => {
      setNarrow(media.matches);
      setMobileOpen(false);
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const currentGroup = navigationGroups.find((group) =>
    group.items.some(([path]) => pathname.startsWith(`/${path}`)),
  );
  const current = currentGroup?.items.find(([path]) => pathname.startsWith(`/${path}`));
  const compact = narrow || collapsed;
  const toggleGroup = (group: string) =>
    setClosedGroups((previous) =>
      previous.includes(group) ? previous.filter((item) => item !== group) : [...previous, group],
    );
  return (
    <div className={`app${compact ? " sidebar-collapsed" : ""}`}>
      <aside id="sidebar-navigation" className="sidebar">
        <SidebarContent
          collapsed={compact}
          closedGroups={closedGroups}
          onToggleGroup={toggleGroup}
        />
      </aside>
      {narrow && mobileOpen && (
        <SidebarDrawer onClose={() => setMobileOpen(false)}>
          <SidebarContent
            collapsed={false}
            closedGroups={closedGroups}
            onToggleGroup={toggleGroup}
            onNavigate={() => setMobileOpen(false)}
            onClose={() => setMobileOpen(false)}
          />
        </SidebarDrawer>
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-leading">
            <Button
              className="icon-button sidebar-toggle"
              title={t(compact ? "app.expandSidebar" : "app.collapseSidebar")}
              aria-label={t(compact ? "app.expandSidebar" : "app.collapseSidebar")}
              aria-expanded={narrow ? mobileOpen : !collapsed}
              aria-controls={narrow ? "mobile-navigation" : "sidebar-navigation"}
              onClick={() => (narrow ? setMobileOpen(true) : setCollapsed((value) => !value))}
            >
              {compact ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </Button>
            <span className="breadcrumbs">
              <span>{currentGroup && t(currentGroup.label)}</span>
              <ChevronRight size={13} />
              <span className="breadcrumb-current">{t(current?.[1] || "common.details")}</span>
            </span>
          </div>
          <div className="top-actions">
            <LanguageSelect />
            <Button
              className="icon-button"
              title={t(dark ? "common.light" : "common.dark")}
              aria-label={t(dark ? "common.light" : "common.dark")}
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button
              className="icon-button"
              title={t("auth.signOut")}
              aria-label={t("auth.signOut")}
              onClick={() => setSession(null)}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </header>
        <main className="page">
          <Suspense fallback={<Empty text={t("common.loading")} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
