import { useEffect, useId, useRef, type PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  ContactRound,
  Ban,
  UserPlus,
  UsersRound,
  ListPlus,
  MessagesSquare,
  MessageSquare,
  ScrollText,
  Bell,
  Send,
  UserRound,
  CircleUserRound,
  KeyRound,
  Package,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui";
import { useSession } from "@/shared/session/SessionProvider";

export const navigationGroups = [
  { label: "nav.overview", items: [["dashboard", "nav.dashboard", Activity]] },
  {
    label: "nav.business",
    items: [
      ["business/users", "nav.users", ContactRound],
      ["business/blocked", "nav.blocked", Ban],
      ["business/default-friends", "nav.defaultFriends", UserPlus],
      ["business/default-groups", "nav.defaultGroups", ListPlus],
    ],
  },
  {
    label: "nav.im",
    items: [
      ["im/users", "nav.imUsers", UserRound],
      ["im/groups", "nav.groups", UsersRound],
      ["im/user-messages", "nav.userMessages", MessageSquare],
      ["im/group-messages", "nav.groupMessages", MessagesSquare],
      ["im/logs", "nav.logs", ScrollText],
    ],
  },
  {
    label: "nav.notifications",
    items: [
      ["notifications/accounts", "nav.notificationAccounts", Bell],
      ["notifications/send", "nav.sendNotification", Send],
    ],
  },
  { label: "nav.applications", items: [["applications/versions", "nav.versions", Package]] },
  {
    label: "nav.account",
    items: [
      ["account/profile", "nav.profile", CircleUserRound],
      ["account/password", "nav.password", KeyRound],
    ],
  },
] as const;

export function SidebarContent({
  collapsed,
  closedGroups,
  onToggleGroup,
  onNavigate,
  onClose,
}: {
  collapsed: boolean;
  closedGroups: string[];
  onToggleGroup: (group: string) => void;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const { session } = useSession();
  const id = useId();
  return (
    <div className={`sidebar-content${collapsed ? " compact" : ""}`}>
      <div className="brand-header">
        <NavLink to="/business/users" className="brand" title={t("app.title")} onClick={onNavigate}>
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span className="brand-name">ABD IM Admin</span>
        </NavLink>
        {onClose && (
          <Button
            className="icon-button sidebar-close"
            title={t("app.closeNavigation")}
            aria-label={t("app.closeNavigation")}
            onClick={onClose}
          >
            <PanelLeftClose size={17} />
          </Button>
        )}
      </div>
      <nav className="nav-scroll" aria-label={t("app.navigation")}>
        {navigationGroups.map((group, index) => {
          const expanded = collapsed || !closedGroups.includes(group.label);
          return (
            <div className="nav-group" key={group.label}>
              <button
                type="button"
                className="nav-label"
                aria-expanded={expanded}
                aria-controls={`${id}-${index}`}
                onClick={() => onToggleGroup(group.label)}
              >
                <span>{t(group.label)}</span>
                <ChevronDown size={13} className={expanded ? "" : "closed"} />
              </button>
              <div id={`${id}-${index}`} hidden={!expanded}>
                {group.items.map(([path, label, Icon]) => (
                  <NavLink
                    to={`/${path}`}
                    key={path}
                    className="nav-item"
                    title={collapsed ? `${t(group.label)}: ${t(label)}` : t(label)}
                    aria-label={t(label)}
                    onClick={onNavigate}
                  >
                    <Icon size={17} />
                    <span>{t(label)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <NavLink
          to="/account/profile"
          className="profile-chip"
          title={session?.nickname || session?.adminAccount}
          onClick={onNavigate}
        >
          <span className="avatar">
            {session?.faceURL ? (
              <img src={session.faceURL} alt="" />
            ) : (
              (session?.nickname || session?.adminAccount || "A").slice(0, 1)
            )}
          </span>
          <div className="profile-copy">
            <div className="profile-name">{session?.nickname || session?.adminAccount}</div>
            <div className="profile-role">{t("app.administrator")}</div>
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export function SidebarDrawer({ onClose, children }: PropsWithChildren<{ onClose: () => void }>) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      id="mobile-navigation"
      className="sidebar-drawer"
      aria-label={t("app.navigation")}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
