import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useSettings } from "../SettingsContext";
import {
  UserRole,
  AppPermissions,
  RolePermissions,
  DonationStatus,
  HelpStatus,
} from "../types";
import {
  getAppPermissions,
  getUsers,
  getDonations,
  subscribeToAllIncomingMessages,
  getAllFeedbacks,
  getHelpRequests,
  subscribeToNotices,
  subscribeToBloodRequests,
  subscribeToUserNotifications,
  requestMenuAccess,
  ADMIN_EMAIL,
} from "../services/api";
import {
  LayoutDashboard,
  UserCircle,
  Droplet,
  Search,
  FileText,
  LogOut,
  Menu,
  History,
  Users,
  Trash2,
  Bell,
  LifeBuoy,
  MessageSquareQuote,
  CheckCircle2,
  Monitor,
  Check,
  AlertTriangle,
  BadgeCheck,
  Megaphone,
  Database,
  UsersRound,
  ChevronRight,
  PieChart,
  Settings,
  IdCard,
  Medal,
  ShieldCheck,
  ClipboardList,
  Lock,
  HelpCircle,
  FileQuestion,
  Sun,
  Moon,
  HeartHandshake,
  DollarSign,
  Receipt,
  X,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import clsx from "clsx";
import { User } from "../types";
import { useToast, Toast } from "./UI";
import { AdPopup } from "./AdPopup";
import { PlayAdIcon } from "./PlayAdIcon";

import { RoleBadge } from "./UI";
import { getVerificationBadge } from "../pages/Users/Profile";

interface BadgeConfig {
  count: number;
  color: "red" | "blue" | "green" | "pink";
}

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, impersonatingAdmin, stopImpersonation } = useAuth();
  const { badgeConfig, softwareVersion, landingConfig } = useSettings();
  const { toastState, showToast, hideToast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHub, setActiveHub] = useState<string>("All");
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const [counts, setCounts] = useState({
    donations: 0,
    access: 0,
    messenger: 0,
    support: 0,
    feedbacks: 0,
    helpRequests: 0,
    badges: 0,
    unreadNotices: 0,
    bloodRequestsCount: 0,
    unreadBloodRequestsUser: 0,
    userNotifications: 0,
  });

  const [lockedMenuKey, setLockedMenuKey] = useState<{key: string, label: string, icon: any} | null>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);

  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("sidebar-scroll-pos");
    if (savedScrollPos && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(savedScrollPos, 10);
    }
  }, [location.pathname]);

  useEffect(() => {
    getAppPermissions().then(setPerms);

    // Check if user has admin/editor access to fetch counts,
    // even if they are currently impersonating a normal user (use originalAdmin to check roles)
    const currentUser = impersonatingAdmin || user;
    if (
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.EDITOR ||
      currentUser?.role === UserRole.SUPERADMIN
    ) {
      const fetchCounts = async () => {
        try {
          const [users, donations, feedbacks, helpReqs] = await Promise.all([
            getUsers(),
            getDonations(),
            getAllFeedbacks(),
            getHelpRequests(),
          ]);

          const userDonationCounts = users.reduce(
            (acc: any, u) => ({ ...acc, [u.id]: 0 }),
            {},
          );
          donations
            .filter((d) => d.status === DonationStatus.COMPLETED)
            .forEach((d) => {
              if (userDonationCounts[d.userId] !== undefined) {
                userDonationCounts[d.userId]++;
              }
            });

          const getEligible = (c: number) => {
            if (c > 10) return "blue";
            if (c > 7) return "green";
            if (c > 5) return "red";
            if (c > 3) return "pink";
            return null;
          };

          let pendingBadges = 0;
          users.forEach((u) => {
            if (u.role === UserRole.SUPERADMIN) return;
            const count = userDonationCounts[u.id] || 0;
            const eligible = getEligible(count);
            if (eligible && eligible !== u.approvedBadge) {
              pendingBadges++;
            }
          });

          setCounts((prev) => ({
            ...prev,
            access: users.filter(
              (u) =>
                u.directoryAccessRequested ||
                u.supportAccessRequested ||
                u.feedbackAccessRequested ||
                u.idCardAccessRequested ||
                u.requestedDonorAccessRequested ||
                u.donationFoundAccessRequested ||
                (u.menuAccessRequests && Object.keys(u.menuAccessRequests).length > 0),
            ).length,
            donations: donations.filter(
              (d) => d.status === DonationStatus.PENDING,
            ).length,
            feedbacks: feedbacks.filter((f) => f.status === "PENDING").length,
            helpRequests: helpReqs.filter(
              (h) => h.status === HelpStatus.PENDING,
            ).length,
            badges: pendingBadges,
          }));
        } catch (e) {
          console.error("Failed to fetch notification counts", e);
        }
      };
      fetchCounts();
    }

    if (user) {
      const unsubscribeMessages = subscribeToAllIncomingMessages(
        user.id,
        (msgs) => {
          const relevantMsgs = msgs.filter(
            (m) =>
              m.receiverId === user.id ||
              (user.role !== UserRole.USER && m.roomId.startsWith("SUPPORT_")),
          );
          const messengerCount = relevantMsgs.filter(
            (m) => !m.roomId.startsWith("SUPPORT_"),
          ).length;
          const supportCount = relevantMsgs.filter((m) =>
            m.roomId.startsWith("SUPPORT_"),
          ).length;
          setCounts((prev) => ({
            ...prev,
            messenger: messengerCount,
            support: supportCount,
          }));
        },
        (err) => {
          console.debug("Layout message subscription restricted");
        },
      );

      const unsubscribeNotices = subscribeToNotices(
        (data: any[]) => {
          const isStaff =
            user?.role === UserRole.ADMIN ||
            user?.role === UserRole.EDITOR ||
            user?.role === UserRole.SUPERADMIN ||
            (user?.email || "").trim().toLowerCase() === ADMIN_EMAIL;
          const relevantNotices = data
            .filter((n) => {
              if (n.type === "WEB") return true;
              if (n.type === "PUBLIC") return true;
              if (n.type === "PRIVATE") return isStaff;
              return false;
            })
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );

          if (relevantNotices.length > 0) {
            try {
              const readNoticesStr = localStorage.getItem("readNotices");
              const readNotices = readNoticesStr
                ? JSON.parse(readNoticesStr)
                : [];
              const unreadCount = relevantNotices.filter(
                (n) => !readNotices.includes(n.id),
              ).length;
              setCounts((prev) => ({ ...prev, unreadNotices: unreadCount }));
            } catch (e) {
              setCounts((prev) => ({ ...prev, unreadNotices: 1 }));
            }
          }
        },
        () => {},
      );

      const unsubscribeBloodRequests = subscribeToBloodRequests(
        (data: any[]) => {
          const isPrivileged =
            user?.role === UserRole.ADMIN ||
            user?.role === UserRole.SUPERADMIN ||
            user?.role === UserRole.EDITOR;

          let privCount = 0;
          if (isPrivileged) {
            privCount = data.filter(
              (br) =>
                br.requesterId !== user?.id &&
                !(br.acceptedBy || []).some((a: any) => a.userId === user?.id),
            ).length;
          }

          let userUnreadCount = 0;
          try {
            const readNoticesStr = localStorage.getItem("readNotices");
            const readNotices = readNoticesStr
              ? JSON.parse(readNoticesStr)
              : [];

            userUnreadCount = data.filter((br) => {
              if (readNotices.includes(br.id)) return false;
              if (br.requesterId === user?.id) return false;

              const hasAccepted = (br.acceptedBy || []).some(
                (a: any) => a.userId === user?.id,
              );
              if (hasAccepted) return false;

              if (br.bloodGroup !== user?.bloodGroup) return false;

              const brLoc = (br.location || "").toLowerCase();
              const uLoc = (user?.location || "").toLowerCase();
              if (
                !brLoc.includes(uLoc) &&
                !uLoc.includes(brLoc) &&
                brLoc !== uLoc
              ) {
                return false;
              }

              return true;
            }).length;
          } catch (e) {}

          setCounts((prev) => ({
            ...prev,
            bloodRequestsCount: privCount,
            unreadBloodRequestsUser: userUnreadCount,
          }));
        },
      );

      const unsubscribeUserNotifs = subscribeToUserNotifications(
        user.id,
        (data) => {
          const unreadCount = data.filter((n) => !n.read).length;
          setCounts((prev) => ({ ...prev, userNotifications: unreadCount }));
        },
      );

      return () => {
        unsubscribeMessages();
        unsubscribeNotices();
        if (unsubscribeBloodRequests) unsubscribeBloodRequests();
        if (unsubscribeUserNotifs) unsubscribeUserNotifs();
      };
    }
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const NavItem = ({
    to,
    icon: Icon,
    label,
    badges,
    locked,
    menuKey,
  }: {
    to: string;
    icon: any;
    label: string;
    badges?: BadgeConfig[];
    locked?: boolean;
    menuKey?: string;
  }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link
        to={locked ? location.pathname : to}
        onClick={(e) => {
          if (locked) {
            e.preventDefault();
            if (menuKey) {
              setLockedMenuKey({ key: menuKey, label, icon: Icon });
            } else {
              // Fallback if no specific menuKey provided
              navigate(to);
            }
          } else {
            setLockedMenuKey(null);
          }
          setIsMobileMenuOpen(false);
        }}
        className={clsx(
          "flex items-center justify-between px-2 py-1.5 rounded-lg transition-all duration-200 group relative",
          isActive
            ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100",
        )}
      >
        <div className="flex items-center gap-3">
          <Icon
            size={18}
            className={clsx(
              isActive
                ? "text-red-600 dark:text-red-400"
                : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
            )}
          />
          <span className="text-[13px] tracking-tight">{label}</span>
          {locked && <Lock size={12} className="text-amber-500" />}
        </div>

        <div className="flex items-center gap-1">
          {badges
            ?.filter((b) => b.count > 0)
            .map((b, i) => (
              <span
                key={i}
                className={clsx(
                  "text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm animate-in zoom-in-50",
                  b.color === "red"
                    ? "bg-red-600"
                    : b.color === "blue"
                      ? "bg-blue-600"
                      : b.color === "pink"
                        ? "bg-pink-500"
                        : "bg-green-600",
                )}
              >
                {b.count}
              </span>
            ))}
          {(!badges || badges.every((b) => b.count === 0)) && isActive && (
            <ChevronRight size={14} className="text-red-300" />
          )}
        </div>
      </Link>
    );
  };

  const SidebarSection = ({
    title,
    children,
  }: {
    title: string;
    children?: React.ReactNode;
  }) => {
    const hasVisibleChildren = React.Children.toArray(children).some(
      (child) => !!child,
    );
    if (!hasVisibleChildren) return null;

    return (
      <div className="space-y-1 mb-6">
        <h3 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
          {title}
        </h3>
        <div className="space-y-0.5">{children}</div>
      </div>
    );
  };

  const isSuperAdmin =
    user?.role === UserRole.SUPERADMIN ||
    user?.email.trim().toLowerCase() === ADMIN_EMAIL;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isEditor = user?.role === UserRole.EDITOR;

  const hasValidBadge = Boolean(
    isSuperAdmin ||
    isAdmin ||
    isEditor ||
    (user?.approvedBadge && (user.approvedBadge as string) !== "none"),
  );
  const requestedDonorCount = hasValidBadge
    ? counts.bloodRequestsCount + counts.unreadBloodRequestsUser
    : 0;

  let basePerms: any = {
    dashboard: true,
    profile: true,
    history: true,
    donors: true,
    feedback: true,
    myNotice: true,
    boardNotices: true,
    requestedDonor: true,
    donationFound: true,
    foundExpenses: isAdmin || isEditor || isSuperAdmin,
  };

  if (perms) {
    if (isSuperAdmin) {
      basePerms = {
        summary: true,
        dashboard: true,
        profile: true,
        history: true,
        donors: true,
        users: true,
        manageDonations: true,
        logs: true,
        rolePermissions: true,
        supportCenter: true,
        feedback: true,
        approveFeedback: true,
        landingSettings: true,
        myNotice: true,
        boardNotices: true,
        notifications: true,
        adminVerify: true,
        verificationHistory: true,
        teamIdCards: true,
        deletedUsers: true,
        helpCenterManage: true,
        moderateFaqs: true,
        serverStatus: true,
        requestedDonor: true,
        donationFound: true,
        foundManage: true,
        foundExpenses: true,
        avatarManage: true,
        addManagement: true,
        advertisements: true,
        ...(perms.superadmin?.sidebar || {}),
      };
      if (
        perms.superadmin?.sidebar &&
        perms.superadmin.sidebar.serverStatus === undefined
      ) {
        basePerms.serverStatus = true;
      }
    } else if (isAdmin) {
      basePerms = { ...basePerms, ...(perms.admin?.sidebar || {}) };
      if (
        perms.admin?.sidebar &&
        perms.admin.sidebar.serverStatus === undefined
      ) {
        basePerms.serverStatus = true;
      }
    } else if (isEditor) {
      basePerms = { ...basePerms, ...(perms.editor?.sidebar || {}) };
    } else {
      basePerms = { ...basePerms, ...(perms.user?.sidebar || {}) };
    }
  } else if (isSuperAdmin) {
    // If perms not loaded yet, default superadmin to all access to prevent flickering or lockout
    basePerms = {
      summary: true,
      dashboard: true,
      profile: true,
      history: true,
      donors: true,
      users: true,
      manageDonations: true,
      logs: true,
      rolePermissions: true,
      supportCenter: true,
      feedback: true,
      approveFeedback: true,
      landingSettings: true,
      myNotice: true,
      boardNotices: true,
      notifications: true,
      adminVerify: true,
      verificationHistory: true,
      teamIdCards: true,
      deletedUsers: true,
      helpCenterManage: true,
      moderateFaqs: true,
      serverStatus: true,
      requestedDonor: true,
      donationFound: true,
      foundManage: true,
      foundExpenses: true,
      avatarManage: true,
    };
  }

  // Determine effective permissions by merging base permissions with user overrides
  // Ensure SuperAdmin always has critical access even if overrides exist (failsafe)
  const s = user?.permissions?.sidebar
    ? { ...basePerms, ...user.permissions.sidebar }
    : basePerms;

  const baseLocked = perms
    ? isSuperAdmin
      ? perms.superadmin?.lockedMenus || {}
      : isAdmin
        ? perms.admin?.lockedMenus || {}
        : isEditor
          ? perms.editor?.lockedMenus || {}
          : perms.user?.lockedMenus || {}
    : {};

  const l = user?.permissions?.lockedMenus
    ? { ...baseLocked, ...user.permissions.lockedMenus }
    : baseLocked;

  const handleRequestAccess = async () => {
    if (!user || !lockedMenuKey) return;
    setRequestingAccess(true);
    try {
      await requestMenuAccess(user.id, lockedMenuKey.key);
      showToast("Access request submitted to administrators.");
      setLockedMenuKey(null);
    } catch (e) {
      showToast("Request failed.", "error");
    } finally {
      setRequestingAccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex transition-colors duration-300">
      <AdPopup targetPage={location.pathname.startsWith('/admin/') ? location.pathname.substring(1) : location.pathname.substring(1) || 'dashboard'} />
      <Toast {...toastState} onClose={hideToast} />
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[60] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden shadow-2xl lg:shadow-none",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Content Wrapper (Icons + Menu) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Hub Icon Bar (Left Column) */}
          {(isSuperAdmin || isAdmin || isEditor) && (
            <div className="w-16 flex-shrink-0 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-2 gap-2 overflow-y-auto no-scrollbar overflow-x-hidden">
              <Link
                to="/"
                className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-red-900/20 ring-2 ring-red-50 dark:ring-red-950/20 mb-2 hover:scale-105 transition-transform shrink-0"
              >
                <Droplet className="text-white" size={20} />
              </Link>

              <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-x-hidden">
                {[
                  { id: "All", icon: LayoutDashboard, label: "All Items" },
                  { id: "User Hub", icon: UserCircle, label: "User Hub" },
                  { id: "Community", icon: UsersRound, label: "Community" },
                  { id: "Funding", icon: HeartHandshake, label: "Donation Fund" },
                  { id: "System Customizer", icon: Settings, label: "System Customizer" },
                  { id: "People Control", icon: ShieldCheck, label: "People Control" },
                  { id: "System Intel", icon: Database, label: "System Intel" },
                ].map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => setActiveHub(hub.id)}
                    title={hub.label}
                    className={clsx(
                      "p-2 rounded-xl transition-all duration-300 relative group shrink-0",
                      activeHub === hub.id
                        ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800"
                    )}
                  >
                    <hub.icon size={22} />
                    {activeHub === hub.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-red-600 dark:bg-red-500 rounded-r-full" />
                    )}
                    <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 font-black uppercase tracking-widest">
                      {hub.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Hub Menu Area (Right Column) */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
            <Link to="/" className="h-20 flex-shrink-0 flex items-center px-4 mb-2 hover:opacity-80 transition-opacity">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter block leading-none mb-1">
                  Bloodlink
                </span>
                <span className="text-[8px] font-black text-red-600 uppercase tracking-widest leading-tight">
                  Management Hub
                </span>
              </div>
            </Link>

            <div
              ref={sidebarRef}
              onScroll={(e) =>
                sessionStorage.setItem(
                  "sidebar-scroll-pos",
                  e.currentTarget.scrollTop.toString(),
                )
              }
              className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4"
            >
            {(activeHub === "User Hub" || activeHub === "All") && (
              <SidebarSection title="User Hub">
                {s.dashboard && (
                  <NavItem
                    to="/dashboard"
                    icon={LayoutDashboard}
                    label="Dashboard"
                    locked={l.dashboard}
                    menuKey="dashboard"
                  />
                )}
                {s.profile && (
                  <NavItem
                    to="/profile"
                    icon={UserCircle}
                    label="Account Profile"
                    locked={l.profile}
                    menuKey="profile"
                  />
                )}
                {s.history && (
                  <NavItem
                    to="/my-donations"
                    icon={History}
                    label="My Donate"
                    locked={l.history}
                    menuKey="history"
                  />
                )}
                {s.myNotice && (
                  <NavItem
                    to="/user-notifications"
                    icon={Bell}
                    label="Notifications"
                    locked={l.myNotice}
                    menuKey="myNotice"
                    badges={[{ count: counts.userNotifications, color: "red" }]}
                  />
                )}
                {s.advertisements && (
                  <NavItem
                    to="/advertisements"
                    icon={Megaphone}
                    label="Advertisements"
                    locked={l.advertisements}
                    menuKey="advertisements"
                  />
                )}
              </SidebarSection>
            )}

            {(activeHub === "Community" || activeHub === "All") && (
              <SidebarSection title="Community">
                {s.donors && (
                  <NavItem
                    to="/directory"
                    icon={Search}
                    label="Donor Directory"
                    locked={
                      (user?.role === UserRole.USER &&
                        !user?.hasDirectoryAccess) ||
                      l.donors
                    }
                    menuKey="donors"
                  />
                )}
                {s.boardNotices && (
                  <NavItem
                    to="/notices"
                    icon={Megaphone}
                    label="Board Notices"
                    locked={l.boardNotices}
                    menuKey="boardNotices"
                  />
                )}
                {s.requestedDonor && (
                  <NavItem
                    to="/requested-donor"
                    icon={Droplet}
                    label="Requested Donor"
                    locked={
                      (user?.role === UserRole.USER &&
                        !user?.hasRequestedDonorAccess) ||
                      l.requestedDonor
                    }
                    menuKey="requestedDonor"
                    badges={[{ count: requestedDonorCount, color: "red" }]}
                  />
                )}
                {s.supportCenter && (
                  <NavItem
                    to="/support"
                    icon={LifeBuoy}
                    label="Support Center"
                    locked={
                      (user?.role === UserRole.USER && !user?.hasSupportAccess) ||
                      l.supportCenter
                    }
                    menuKey="supportCenter"
                    badges={[
                      { count: counts.messenger, color: "blue" },
                      { count: counts.support, color: "green" },
                    ]}
                  />
                )}
                {s.feedback && (
                  <NavItem
                    to="/feedback"
                    icon={MessageSquareQuote}
                    label="Post Feedback"
                    locked={
                      (user?.role === UserRole.USER &&
                        !user?.hasFeedbackAccess) ||
                      l.feedback
                    }
                    menuKey="feedback"
                  />
                )}
              </SidebarSection>
            )}

            {(activeHub === "Funding" || activeHub === "All") && (
              <SidebarSection title="Funding Info">
                {s.donationFound && (
                  <NavItem
                    to="/donation-found"
                    icon={HeartHandshake}
                    label="Donation Found"
                    locked={
                      (user?.role === UserRole.USER &&
                        !user?.hasDonationFoundAccess) ||
                      l.donationFound
                    }
                    menuKey="donationFound"
                  />
                )}
                {s.foundSummary && (
                  <NavItem
                    to="/found-summary"
                    icon={TrendingUp}
                    label="Found Summary"
                    locked={l.foundSummary}
                    menuKey="foundSummary"
                  />
                )}
                {s.foundManage && (
                  <NavItem
                    to="/found-manage"
                    icon={DollarSign}
                    label="Found Manage"
                    locked={l.foundManage}
                    menuKey="foundManage"
                  />
                )}
                {s.foundExpenses && (
                  <NavItem
                    to="/found-expenses"
                    icon={Receipt}
                    label="Found Expenses"
                    locked={l.foundExpenses}
                    menuKey="foundExpenses"
                  />
                )}
              </SidebarSection>
            )}

            {(activeHub === "System Customizer" || activeHub === "All") && (
              <SidebarSection title="System Customizer">
                {s.manageDonations && (
                  <NavItem
                    to="/manage-donations"
                    icon={Database}
                    label="Donation Records"
                    locked={l.manageDonations}
                    menuKey="manageDonations"
                    badges={[{ count: counts.donations, color: "red" }]}
                  />
                )}
                {s.approveFeedback && (
                  <NavItem
                    to="/approve-feedback"
                    icon={CheckCircle2}
                    label="Moderate Feedback"
                    locked={l.approveFeedback}
                    menuKey="approveFeedback"
                    badges={[{ count: counts.feedbacks, color: "red" }]}
                  />
                )}
                {s.helpCenterManage && (
                  <NavItem
                    to="/help-center-manage"
                    icon={HelpCircle}
                    label="Help Center manage"
                    locked={l.helpCenterManage}
                    menuKey="helpCenterManage"
                    badges={[{ count: counts.helpRequests, color: "red" }]}
                  />
                )}
                {s.moderateFaqs && (
                  <NavItem
                    to="/moderate-faqs"
                    icon={FileQuestion}
                    label="Moderate FAQ's"
                    locked={l.moderateFaqs}
                    menuKey="moderateFaqs"
                  />
                )}
                {s.addManagement && (
                    <NavItem
                        to="/add-management"
                        icon={Megaphone}
                        label="Add Management"
                        locked={l.addManagement}
                        menuKey="addManagement"
                    />
                )}
              </SidebarSection>
            )}

            {(activeHub === "People Control" || activeHub === "All") && (
              <SidebarSection title="People Control">
                {s.summary && (
                  <NavItem
                    to="/summary"
                    icon={PieChart}
                    label="System Summary"
                    locked={l.summary}
                    menuKey="summary"
                  />
                )}
                {s.users && (
                  <NavItem
                    to="/users"
                    icon={UsersRound}
                    label="Manage Users"
                    locked={l.users}
                    menuKey="users"
                  />
                )}
                {s.notifications && (
                  <NavItem
                    to="/notifications"
                    icon={Bell}
                    label="Access Requests"
                    locked={l.notifications}
                    menuKey="notifications"
                    badges={[{ count: counts.access, color: "red" }]}
                  />
                )}
                {(s.badgeManage || isSuperAdmin || isAdmin) && (
                  <NavItem
                    to="/badge-manage"
                    icon={Medal}
                    label="Badge Manage"
                    locked={l.badgeManage}
                    menuKey="badgeManage"
                    badges={
                      counts.badges > 0
                        ? [{ count: counts.badges, color: "pink" }]
                        : []
                    }
                  />
                )}
                {s.adminVerify && (
                  <NavItem
                    to="/admin/verify"
                    icon={ShieldCheck}
                    label="Verify Identity"
                    locked={l.adminVerify}
                    menuKey="adminVerify"
                  />
                )}

                {s.verificationHistory && (
                  <NavItem
                    to="/verification-history"
                    icon={ClipboardList}
                    label="Verification History"
                    locked={l.verificationHistory}
                    menuKey="verificationHistory"
                  />
                )}
                {s.teamIdCards && (
                  <NavItem
                    to="/team-id-cards"
                    icon={IdCard}
                    label="Team ID Cards"
                    locked={l.teamIdCards}
                    menuKey="teamIdCards"
                  />
                )}
              </SidebarSection>
            )}

            {(activeHub === "System Intel" || activeHub === "All") && (
              <SidebarSection title="System Intel">
                {s.landingSettings && (
                  <NavItem
                    to="/landing-settings"
                    icon={Monitor}
                    label="Global Customizer"
                    locked={l.landingSettings}
                    menuKey="landingSettings"
                  />
                )}
                {s.serverStatus && (
                  <NavItem
                    to="/server-status"
                    icon={Monitor}
                    label="Server Status"
                    locked={l.serverStatus}
                    menuKey="serverStatus"
                  />
                )}
                {s.rolePermissions && isSuperAdmin && (
                  <NavItem
                    to="/role-permissions"
                    icon={Lock}
                    label="Role Permissions"
                    locked={l.rolePermissions}
                    menuKey="rolePermissions"
                  />
                )}
                {s.avatarManage && (
                  <NavItem
                    to="/avatar-manage"
                    icon={UserCircle}
                    label="Avatar & Cover"
                    locked={l.avatarManage}
                    menuKey="avatarManage"
                  />
                )}
                {s.deletedUsers && (
                  <NavItem
                    to="/deleted-users"
                    icon={Trash2}
                    label="System Archives"
                    locked={l.deletedUsers}
                    menuKey="deletedUsers"
                  />
                )}
                {s.logs && (
                  <NavItem
                    to="/logs"
                    icon={FileText}
                    label="Activity Logs"
                    locked={l.logs}
                    menuKey="logs"
                  />
                )}
              </SidebarSection>
            )}
          </div>
        </div>
      </div>

      {/* Footer Area (Profile + Sign Out) */}
        <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 w-full">
          <div className="flex items-stretch min-h-[64px] border-b border-slate-100 dark:border-slate-800/50">
            {/* Avatar Column (Aligned with IconBar) */}
            <div className="w-16 flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900/30">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center font-black overflow-hidden border border-red-100 dark:border-red-900/50 shadow-sm relative group-hover:scale-105 transition-transform">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-full h-full object-cover"
                    alt={user.name}
                  />
                ) : (
                  user?.name.charAt(0)
                )}
              </div>
            </div>

            {/* Profile Info Column (Aligned with Menu) */}
            <div
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate("/profile");
              }}
              className="flex-1 flex flex-col justify-center px-3 py-1 cursor-pointer hover:bg-white dark:hover:bg-slate-800/50 transition-all group relative min-w-0"
              title="Profile Management"
            >
              <div className="flex-1 flex flex-col justify-center gap-1 pr-12 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors uppercase tracking-tight leading-tight truncate">
                    {user?.name}
                  </p>
                  {(() => {
                    const vb = getVerificationBadge(user, undefined);
                    if (!vb) return null;
                    return (
                      <BadgeCheck
                        size={14}
                        className={clsx(vb.color, "flex-shrink-0 drop-shadow-sm")}
                      />
                    );
                  })()}
                </div>

                <div className="flex items-center">
                  <RoleBadge
                    role={user?.role || "USER"}
                    className="ring-1 ring-inset py-0 px-1.5 text-[8px] font-black"
                  />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all shadow-sm active:scale-95 flex items-center justify-center group/theme hover:border-red-100 dark:hover:border-red-900/50"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-all bg-white dark:bg-slate-800 hover:border-red-100 dark:hover:border-red-900/50 shadow-sm active:scale-[0.98] group"
          >
            <LogOut
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-0 h-screen overflow-hidden relative">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex-shrink-0 flex items-center justify-between px-3 shadow-sm z-40 sticky top-0 transition-colors">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 lg:hidden mr-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Droplet className="text-white" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 dark:text-white tracking-tighter text-lg leading-tight">
                  BloodLink
                </span>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">
                  {softwareVersion?.toUpperCase().includes('VERSION') ? softwareVersion : `VERSION: ${softwareVersion || "1.0.0"}`}
                </span>
              </div>
            </Link>
            <div className="hidden lg:block">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Authenticated Session
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PlayAdIcon targetPage={location.pathname.startsWith('/admin/') ? location.pathname.substring(1) : location.pathname.substring(1) || 'dashboard'} />
            <Link
              to="/user-notifications"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative"
            >
              <Bell size={20} />
              {counts.unreadNotices + counts.unreadBloodRequestsUser > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white dark:border-slate-900">
                  {counts.unreadNotices + counts.unreadBloodRequestsUser > 99
                    ? "99+"
                    : counts.unreadNotices + counts.unreadBloodRequestsUser}
                </span>
              )}
            </Link>

            {impersonatingAdmin && (
              <button
                onClick={stopImpersonation}
                className="flex items-center gap-3 p-1.5 pr-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-600 group transition-all shadow-sm animate-in slide-in-from-right duration-500"
                title="Return to SuperAdmin Dashboard"
              >
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-md group-hover:bg-white group-hover:text-red-600 transition-colors">
                  {impersonatingAdmin.avatar ? (
                    <img
                      src={impersonatingAdmin.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    impersonatingAdmin.name.charAt(0)
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[10px] font-black text-slate-900 dark:text-white group-hover:text-white leading-none mb-1 transition-colors uppercase tracking-tight">
                    {impersonatingAdmin.name}
                  </p>
                  <p className="text-[8px] font-black text-red-600 dark:text-red-400 group-hover:text-red-100 uppercase tracking-widest leading-none transition-colors">
                    Switch to Admin
                  </p>
                </div>
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 lg:hidden"
            >
              <Menu size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-1 lg:p-3 custom-scrollbar bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
          {impersonatingAdmin && user?.role !== UserRole.SUPERADMIN && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-black text-amber-900 dark:text-amber-100 italic">
                  Currently impersonating: {user?.name}
                </p>
                <p className="text-[9px] text-amber-700 dark:text-amber-300">
                  Admin session is active.
                </p>
              </div>
              <button
                onClick={stopImpersonation}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-md transition-colors"
              >
                Return
              </button>
            </div>
          )}
          {lockedMenuKey ? (
            <div className="max-w-7xl mx-auto flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
              <div className="w-full max-w-xl flex flex-col items-center text-center relative mt-[-10vh]">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center mb-8 transition-colors">
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-red-100 dark:border-red-900/40">
                    {lockedMenuKey.icon && <lockedMenuKey.icon className="text-red-500" size={24} />}
                  </div>
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 transition-colors leading-tight">
                  {lockedMenuKey.label} ACCESS REQUIRED
                </h2>
                
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-8 transition-colors">
                  {landingConfig?.lockSubtitle || 'এই বিভাগটি দেখার জন্য আপনার বিশেষ অনুমতি প্রয়োজন। আপনি যদি অনুদান দিতে ইচ্ছুক হন বা এই বিষয় সম্পর্কিত তথ্য জানতে চান, তবে নিচের বাটনটি ক্লিক করে আবেদন করুন।'}
                </p>
                
                <button 
                  disabled={requestingAccess}
                  onClick={handleRequestAccess}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-xl shadow-red-100 dark:shadow-none transition-all uppercase tracking-widest text-sm mb-8"
                >
                  {requestingAccess ? 'SUBMITTING...' : (landingConfig?.lockButtonLabel || 'REQUEST FUND ACCESS')}
                </button>
                
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] transition-colors">
                  {landingConfig?.lockFooterText || 'ADMIN WILL REVIEW YOUR REQUEST SHORTLY'}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto flex flex-col min-h-full">
              <div className="flex-1">{children}</div>
              {landingConfig?.dashboardFooterContent && (
                <footer className="mt-2 py-3 border-t border-slate-100 dark:border-slate-900 text-center overflow-hidden">
                  <div 
                    className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.2em] max-w-4xl mx-auto leading-loose mb-0.5"
                    dangerouslySetInnerHTML={{ __html: landingConfig.dashboardFooterContent.replace(/\n/g, '<br />') }}
                  />
                  <div className="flex items-center justify-center gap-3">
                    <span className="w-6 h-[1px] bg-slate-100 dark:bg-slate-800/50"></span>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                      Build {landingConfig?.softwareVersion || "1.0.0"}
                    </p>
                    <span className="w-6 h-[1px] bg-slate-100 dark:bg-slate-800/50"></span>
                  </div>
                </footer>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
