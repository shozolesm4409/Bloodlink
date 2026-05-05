import React, { useState, useEffect } from "react";
import { Card, Button, useToast, Input } from "../../components/UI";
import { getUsers, getDonations, updateUser, addUserNotification } from "../../services/api";
import {
  User,
  DonationRecord,
  DonationStatus,
  UserRole,
  CustomRankBadge,
} from "../../types";
import {
  Medal,
  ShieldAlert,
  Award,
  Search,
  Trash2,
  ShieldCheck,
  UserX,
  Star,
  UserCheck,
  RotateCcw,
  BadgeCheck,
  Palette,
  Edit3,
  Plus,
  Check,
} from "lucide-react";
import { useAuth } from "../../AuthContext";
import { useSettings } from "../../SettingsContext";
import clsx from "clsx";
import { getRankBadge } from "../Users/Profile";

const getEligible = (c: number) => {
  if (c >= 10) return "blue";
  if (c >= 7) return "green";
  if (c >= 5) return "red";
  if (c >= 3) return "pink";
  return null;
};

const badgeColorMap: any = {
  blue: "text-[#04b9dc] bg-[#04b9dc]/10",
  green: "text-[#04bd7f] bg-[#04bd7f]/10",
  red: "text-[#fea111] bg-[#fea111]/10",
  pink: "text-[#9babc0] bg-[#9babc0]/10",
  none: "text-slate-400 bg-slate-50 dark:bg-slate-800",
};

import { BADGE_COLOR_MAP } from "../../constants";

type BadgeType = "pink" | "red" | "green" | "blue";

const getBadgeTranslation = (name: string): string => {
  const map: Record<string, string> = {
    'লেভেল ১': 'Level 1',
    'লেভেল ২': 'Level 2',
    'লেভেল ৩': 'Level 3',
    'ভ্যানগার্ড': 'Vanguard',
    'এলিট': 'Elite',
    'লিজেন্ডারি': 'Legendary',
  };
  return map[name] || name;
};

export const BadgeManage = () => {
  const { user: currentUser } = useAuth();
  const { badgeConfig } = useSettings();
  const [activeMainTab, setActiveMainTab] = useState<"assign" | "settings">(
    "assign",
  );
  const [activeSettingTab, setActiveSettingTab] = useState<
    "rank" | "verification" | "role"
  >("rank");

  // Add default values for badgeNameMap
  const badgeNameMap: any = {
    blue: badgeConfig?.diamond?.name || "Diamond",
    green: badgeConfig?.platinum?.name || "Platinum",
    red: badgeConfig?.gold?.name || "Gold",
    pink: badgeConfig?.silver?.name || "Silver",
    none: "No Badge",
  };

  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("ALL");
  const { showToast } = useToast();

  const isSuperAdmin = currentUser?.role === UserRole.SUPERADMIN;
  const hasVerificationPermission = isSuperAdmin || currentUser?.permissions?.rules?.canAssignVerificationBadge;

  useEffect(() => {
    const load = async () => {
      try {
        const [u, d] = await Promise.all([getUsers(), getDonations()]);
        setUsers(u);
        setDonations(d.filter((x) => x.status === DonationStatus.COMPLETED));
      } catch (e) {
        console.error(e);
        showToast("Failed to load data.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdateBadge = async (
    userId: string,
    newBadge: BadgeType | null,
  ) => {
    try {
      const oldUser = users.find((u) => u.id === userId);
      const oldBadge = oldUser?.approvedBadge || "none";
      await updateUser(userId, { approvedBadge: newBadge as any });

      if (newBadge && newBadge !== oldBadge) {
        await addUserNotification({
          userId: userId,
          title: oldBadge === "none" ? "🎉 Badge Approved!" : "✨ Badge Updated!",
          message:
            oldBadge === "none"
              ? `Congratulations! You have been awarded the ${badgeNameMap[newBadge].toUpperCase()} Badge.`
              : `Your badge has been updated to the ${badgeNameMap[newBadge].toUpperCase()} Badge.`,
          type: "BADGE_APPROVED",
        });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, approvedBadge: newBadge as any } : u,
        ),
      );
      showToast(
        newBadge
          ? "Badge updated successfully!"
          : "Badge removed successfully!",
      );
    } catch (e) {
      console.error(e);
      showToast("Error updating badge.", "error");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );

  const userDonationCounts = users.reduce(
    (acc: any, u) => ({ ...acc, [u.id]: 0 }),
    {},
  );
  donations.forEach((d) => {
    if (userDonationCounts[d.userId] !== undefined) {
      userDonationCounts[d.userId]++;
    }
  });

  const badgeRanks: any = { none: 0, pink: 1, red: 2, green: 3, blue: 4 };

  const pendingRequests = users
    .map((u) => {
      const count = userDonationCounts[u.id] || 0;
      const eligible = getEligible(count);
      return { user: u, count, eligible, current: u.approvedBadge || "none" };
    })
    .filter(
      (x) =>
        x.eligible &&
        badgeRanks[x.current] < badgeRanks[x.eligible],
    );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeBadgeHolders = users.filter(
    (u) =>
      u.approvedBadge &&
      (badgeFilter === "ALL" || u.approvedBadge === badgeFilter),
  );

  const badgeCounts = users.reduce((acc, u) => {
    if (u.approvedBadge) {
      acc[u.approvedBadge] = (acc[u.approvedBadge] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const rankCounts = users.reduce((acc, u) => {
    const dCount = userDonationCounts[u.id] || 0;
    const rank = getRankBadge(u, badgeConfig, dCount);
    acc[rank?.name || "Level 1"] = (acc[rank?.name || "Level 1"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4 pt-3 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto pb-10 px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            Badge Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-[10px]">
            Verify and configure contribution badges
          </p>
        </div>
        {hasVerificationPermission && (
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={() => setActiveMainTab("assign")}
              className={clsx(
                "flex-1 md:w-36 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeMainTab === "assign"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
              )}
            >
              Assign Badges
            </button>
            <button
              onClick={() => setActiveMainTab("settings")}
              className={clsx(
                "flex-1 md:w-36 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeMainTab === "settings"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
              )}
            >
              Badge Setting
            </button>
          </div>
        )}
      </div>

      {activeMainTab === "assign" && (
        <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
          {/* ... Search & Filters ... */}
          {hasVerificationPermission && (
            <div className="flex gap-2 w-full justify-end">
              <select
                value={badgeFilter}
                onChange={(e) => setBadgeFilter(e.target.value)}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-sm p-3 outline-none"
              >
                <option value="ALL">All Badge</option>
                <option value="pink">{badgeNameMap.pink}</option>
                <option value="red">{badgeNameMap.red}</option>
                <option value="green">{badgeNameMap.green}</option>
                <option value="blue">{badgeNameMap.blue}</option>
              </select>
              <div className="relative w-full md:w-80 group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors"
                  size={18}
                />
                <Input
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  placeholder="Search users to manage badges..."
                  className="pl-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={20} className="text-amber-500" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Pending Approvals
              </h2>
            </div>

            {pendingRequests.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-4 sm:p-8 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-slate-800 text-slate-100 dark:text-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Medal size={32} />
                </div>
                <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">
                  No pending badge requests
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((req) => (
                  <BadgeCard
                    key={req.user.id}
                    user={req.user}
                    count={req.count}
                    badge={req.eligible as BadgeType}
                    currentBadge={req.current}
                    onApprove={() =>
                      handleUpdateBadge(req.user.id, req.eligible as BadgeType)
                    }
                    isPending
                  />
                ))}
              </div>
            )}
          </div>

          {hasVerificationPermission && searchQuery && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Star size={20} className="text-indigo-500" />
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Manual Management
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((u) => (
                  <BadgeCard
                    key={u.id}
                    user={u}
                    count={userDonationCounts[u.id] || 0}
                    badge={u.approvedBadge}
                    onSetBadge={(b: BadgeType) => handleUpdateBadge(u.id, b)}
                    onRemove={() => handleUpdateBadge(u.id, null)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={20} className="text-green-500" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Active Badge Holders
              </h2>
            </div>

            {/* Desktop View */}
            <Card className="hidden md:block overflow-hidden border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        User
                      </th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Donations
                      </th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Active Badge
                      </th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeBadgeHolders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-slate-400 font-bold italic"
                        >
                          No active badge holders found.
                        </td>
                      </tr>
                    ) : (
                      activeBadgeHolders.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Award size={18} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-black text-slate-900 dark:text-white truncate text-sm uppercase">
                                    {u.name}
                                  </p>
                                  {getRankBadge(u, badgeConfig) && (
                                    <BadgeCheck
                                      size={14}
                                      className={clsx(
                                        u.approvedBadge
                                          ? BADGE_COLOR_MAP[u.approvedBadge]
                                          : getRankBadge(u, badgeConfig)?.color,
                                        "flex-shrink-0",
                                      )}
                                    />
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase mt-0.5">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black">
                              {userDonationCounts[u.id] || 0}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <select
                                value={u.approvedBadge}
                                onChange={(e) =>
                                  handleUpdateBadge(
                                    u.id,
                                    e.target.value as BadgeType,
                                  )
                                }
                                className={clsx(
                                  "bg-transparent border-0 font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer appearance-none px-3 py-1.5 rounded-lg",
                                  badgeColorMap[u.approvedBadge],
                                )}
                              >
                                {["pink", "red", "green", "blue"].map((b) => (
                                  <option
                                    key={b}
                                    value={b}
                                    className="bg-white dark:bg-slate-900 border-0 text-slate-900 dark:text-white"
                                  >
                                    {badgeNameMap[b]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleUpdateBadge(u.id, null)}
                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all"
                                title="Make Pending"
                              >
                                <RotateCcw size={18} />
                              </button>
                              <button
                                onClick={() => handleUpdateBadge(u.id, null)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                title="Remove Badge"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {activeBadgeHolders.length === 0 ? (
                <Card className="p-6 text-center text-slate-400 font-bold italic border-dashed rounded-3xl">
                  No active badge holders found.
                </Card>
              ) : (
                activeBadgeHolders.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Award size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-black text-slate-900 dark:text-white truncate text-xs uppercase leading-tight">
                            {u.name}
                          </p>
                          {getRankBadge(u, badgeConfig) && (
                            <BadgeCheck
                              size={12}
                              className={clsx(
                                u.approvedBadge
                                  ? BADGE_COLOR_MAP[u.approvedBadge]
                                  : getRankBadge(u, badgeConfig)?.color,
                                "flex-shrink-0",
                              )}
                            />
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase mt-0.5">
                          {u.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <select
                          value={u.approvedBadge}
                          onChange={(e) =>
                            handleUpdateBadge(u.id, e.target.value as BadgeType)
                          }
                          className={clsx(
                            "bg-transparent border-0 font-black text-[8px] uppercase tracking-widest outline-none cursor-pointer appearance-none px-2 py-1 rounded-sm text-right",
                            badgeColorMap[u.approvedBadge],
                          )}
                        >
                          {["pink", "red", "green", "blue"].map((b) => (
                            <option
                              key={b}
                              value={b}
                              className="bg-white dark:bg-slate-900"
                            >
                              {badgeNameMap[b]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase">
                          Donations:
                        </p>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">
                          {userDonationCounts[u.id] || 0}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateBadge(u.id, null)}
                          className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          <RotateCcw size={12} /> Pending
                        </button>
                        <button
                          onClick={() => handleUpdateBadge(u.id, null)}
                          className="px-2 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* BADGE SETTINGS TAB */}
      {activeMainTab === "settings" && (
        <div className="lg:flex gap-3 mt-2 md:mt-4 animate-in slide-in-from-left-4 duration-300">
          <div className="lg:w-1/4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin shrink-0 hidden lg:block">
            <div className="p-2 border-r border-slate-200 dark:border-slate-800/60 pr-2 mr-2 h-full">
              <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-4 ml-2 tracking-widest">
                BADGE SETTINGS
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSettingTab("rank")}
                  className={clsx(
                    "w-full px-2 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1 transition-colors uppercase tracking-tight",
                    activeSettingTab === "rank"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <div
                    className={clsx(
                      "p-2 rounded-xl",
                      activeSettingTab === "rank"
                        ? "bg-white/10 dark:bg-slate-900/10"
                        : "bg-slate-100 dark:bg-slate-800",
                    )}
                  >
                    <Medal size={16} />
                  </div>
                  <div className="text-left leading-tight font-black">
                    Rank Badge
                  </div>
                </button>
                <button
                  onClick={() => setActiveSettingTab("verification")}
                  className={clsx(
                    "w-full px-2 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1 transition-colors uppercase tracking-tight",
                    activeSettingTab === "verification"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <div
                    className={clsx(
                      "p-2 rounded-xl",
                      activeSettingTab === "verification"
                        ? "bg-white/10 dark:bg-slate-900/10"
                        : "bg-slate-100 dark:bg-slate-800",
                    )}
                  >
                    <BadgeCheck size={16} />
                  </div>
                  <div className="text-left leading-tight font-black">
                    Verification Tik Badge
                  </div>
                </button>
                <button
                  onClick={() => setActiveSettingTab("role")}
                  className={clsx(
                    "w-full px-2 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1 transition-colors uppercase tracking-tight",
                    activeSettingTab === "role"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <div
                    className={clsx(
                      "p-2 rounded-xl",
                      activeSettingTab === "role"
                        ? "bg-white/10 dark:bg-slate-900/10"
                        : "bg-slate-100 dark:bg-slate-800",
                    )}
                  >
                    <ShieldCheck size={16} />
                  </div>
                  <div className="text-left leading-tight font-black">
                    Role Badge
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Settings Nav */}
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 scrollbar-none mb-4 items-center">
            {["rank", "verification", "role"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSettingTab(tab as any)}
                className={clsx(
                  "px-4 py-2 shrink-0 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                  activeSettingTab === tab
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="lg:flex-1">
            {activeSettingTab === "rank" && (
              <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tighter">
                    Rank Badge{" "}
                  </h2>
                </div>

                <Card className="p-2 sm:p-3 border-slate-200 dark:border-slate-800 rounded-[1.5rem] shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-t border-slate-200 dark:border-slate-800">
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            #
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Badge Name
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Status
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Icon
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Donation
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Users
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {badgeConfig.customRanks?.map((rank, index) => (
                          <tr
                            key={rank.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="p-1 text-sm font-black text-slate-900 dark:text-slate-100">
                              {index + 1}
                            </td>
                            <td className="p-1 text-sm font-black text-slate-900 dark:text-slate-100">
                              {rank.name}
                            </td>
                            <td className="p-1 text-center">
                              <span
                                className={clsx(
                                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                  rank.status === "active"
                                    ? "bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                                    : "bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
                                )}
                              >
                                {rank.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td className="p-1">
                              <div
                                className={clsx(
                                  "flex justify-center w-10 h-10 mx-auto rounded-xl items-center",
                                  rank.color
                                    .replace("text-", "bg-")
                                    .replace("-500", "-50")
                                    .replace("-600", "-50") +
                                    " dark:bg-white/5",
                                )}
                              >
                                {rank.icon === "Star" && (
                                  <Star size={20} className={rank.color} />
                                )}
                                {rank.icon === "TwoStars" && (
                                  <div
                                    className={clsx("flex gap-0.5", rank.color)}
                                  >
                                    <Star size={14} />
                                    <Star size={14} />
                                  </div>
                                )}
                                {rank.icon === "ThreeStars" && (
                                  <div
                                    className={clsx("flex gap-0.5", rank.color)}
                                  >
                                    <Star size={12} />
                                    <Star size={14} className="-mt-1" />
                                    <Star size={12} />
                                  </div>
                                )}
                                {rank.icon === "Shield" && (
                                  <ShieldCheck
                                    size={20}
                                    className={rank.color}
                                  />
                                )}
                                {rank.icon === "Medal" && (
                                  <Medal size={20} className={rank.color} />
                                )}
                                {rank.icon === "Award" && (
                                  <Award size={20} className={rank.color} />
                                )}
                                {rank.icon === "Trophy" && (
                                  <Trophy size={20} className={rank.color} />
                                )}
                                {rank.icon === "Crown" && (
                                  <Trophy size={20} className={rank.color} />
                                )}
                              </div>
                            </td>
                            <td className="p-1 text-center text-sm font-black text-slate-900 dark:text-slate-100">
                              {rank.pointsRequired}
                            </td>
                             <td className="p-1 text-center text-sm font-black text-slate-900 dark:text-slate-100">
                              {rankCounts[rank.name] || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeSettingTab === "verification" && (
              <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tighter">
                    Verification Tik Badge{" "}
                  </h2>
                </div>

                <Card className="p-2 sm:p-3 border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-t border-slate-200 dark:border-slate-800">
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            #
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Badge Name
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Status
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Icon
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Donation
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Users
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {[
                          {
                            id: 1,
                            name: "Silver",
                            color:
                              "text-slate-400 bg-slate-50 dark:bg-slate-900/20",
                            iconColor: "text-slate-400",
                            donation: 3,
                            badge: "pink",
                          },
                          {
                            id: 2,
                            name: "Gold",
                            color:
                              "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
                            iconColor: "text-amber-500",
                            donation: 5,
                            badge: "red",
                          },
                          {
                            id: 3,
                            name: "Platinum",
                            color:
                              "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                            iconColor: "text-emerald-500",
                            donation: 7,
                            badge: "green",
                          },
                          {
                            id: 4,
                            name: "Diamond",
                            color:
                              "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20",
                            iconColor: "text-cyan-500",
                            donation: 10,
                            badge: "blue",
                          },
                        ].map((badge, index) => (
                          <tr
                            key={badge.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="p-1 text-sm font-black text-slate-900 dark:text-slate-100">
                              {index + 1}
                            </td>
                            <td className="p-1 text-sm font-black text-slate-900 dark:text-white">
                              {badge.name}
                            </td>
                            <td className="p-1 text-center">
                              <span
                                className={clsx(
                                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
                                )}
                              >
                                সক্রিয়
                              </span>
                            </td>
                            <td className="p-1">
                              <div
                                className={clsx(
                                  "flex justify-center w-10 h-10 mx-auto rounded-xl items-center",
                                  badge.color.split(" ").slice(1).join(" "),
                                )}
                              >
                                <BadgeCheck
                                  size={20}
                                  className={badge.iconColor}
                                />
                              </div>
                            </td>
                            <td className="p-1 text-center text-sm font-black text-slate-900 dark:text-slate-100">
                              {badge.donation}
                            </td>
                             <td className="p-1 text-center text-sm font-black text-slate-900 dark:text-slate-100">
                              {badgeCounts[badge.badge] || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeSettingTab === "role" && (
              <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tighter">
                    Role Badge{" "}
                  </h2>
                </div>

                <Card className="p-2 sm:p-3 border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-t border-slate-200 dark:border-slate-800">
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            #
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            Badge Name
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Status
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Icon
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Color
                          </th>
                          <th className="p-1 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                            Users
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {[
                          {
                            id: 1,
                            name: "Super Admin",
                            role: "SUPERADMIN",
                            color:
                              "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20",
                            iconColor: "text-cyan-500",
                          },
                          {
                            id: 2,
                            name: "Admin",
                            role: "ADMIN",
                            color:
                              "text-emerald-500 bg-emerald-50 bg-emerald-900/20",
                            iconColor: "text-emerald-500",
                          },
                          {
                            id: 3,
                            name: "Editor",
                            role: "EDITOR",
                            color:
                              "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
                            iconColor: "text-amber-500",
                          },
                          {
                            id: 4,
                            name: "User",
                            role: "USER",
                            color:
                              "text-slate-400 bg-slate-50 dark:bg-slate-900/20",
                            iconColor: "text-slate-400",
                          },
                        ].map((badge, index) => (
                          <tr
                            key={badge.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="p-1 text-sm font-black text-slate-900 dark:text-slate-100">
                              {index + 1}
                            </td>
                            <td className="p-1 text-sm font-black text-slate-900 dark:text-white">
                              {badge.name}
                            </td>
                            <td className="p-1 text-center">
                              <span
                                className={clsx(
                                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
                                )}
                              >
                                সক্রিয়
                              </span>
                            </td>
                            <td className="p-1">
                              <div
                                className={clsx(
                                  "flex justify-center w-10 h-10 mx-auto rounded-xl items-center",
                                  badge.color.split(" ").slice(1).join(" "),
                                )}
                              >
                                <ShieldCheck
                                  size={20}
                                  className={badge.iconColor}
                                />
                              </div>
                            </td>
                            <td className="p-1 text-center">
                              <code className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {badge.color}
                              </code>
                            </td>
                             <td className="p-1 text-center text-sm font-black text-slate-900 dark:text-slate-100">
                              {roleCounts[badge.role] || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ...(rest of the file stays same structure)
const BadgeCard = ({
  user,
  count,
  badge,
  currentBadge,
  onApprove,
  onSetBadge,
  onRemove,
  isPending,
}: {
  user: User;
  count: number;
  badge: BadgeType | null | undefined;
  currentBadge?: string;
  onApprove?: () => void;
  onSetBadge?: (b: BadgeType) => void;
  onRemove?: () => void;
  isPending?: boolean;
}) => {
  const { badgeConfig } = useSettings();
  const badgeNameMap: any = {
    blue: badgeConfig?.diamond?.name || "Diamond",
    green: badgeConfig?.platinum?.name || "Platinum",
    red: badgeConfig?.gold?.name || "Gold",
    pink: badgeConfig?.silver?.name || "Silver",
    none: "No Badge",
  };
  return (
    <Card className="p-3 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-md overflow-hidden flex items-center justify-center font-black text-slate-400 dark:text-slate-500">
          {user.avatar ? (
            <img src={user.avatar} className="w-full h-full object-cover" />
          ) : (
            <Award size={22} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-black text-slate-900 dark:text-white truncate tracking-tight uppercase">
              {user.name}
            </h3>
            {getRankBadge(user, badgeConfig) && (
              <BadgeCheck
                size={16}
                className={clsx(
                  getRankBadge(user, badgeConfig)?.color,
                  "flex-shrink-0",
                )}
              />
            )}
          </div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {user.email}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Donations
            </p>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {count}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Status
            </p>
            <p
              className={clsx(
                "text-xs font-black uppercase tracking-tighter",
                user.approvedBadge ? "text-green-600" : "text-slate-400",
              )}
            >
              {user.approvedBadge
                ? `${badgeNameMap[user.approvedBadge]} Active`
                : "No Badge"}
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-600">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    "p-1.5 rounded-lg",
                    badge && badgeColorMap[badge].split(" ").slice(1).join(" "),
                  )}
                >
                  <Trophy
                    size={16}
                    className={clsx(
                      badge && badgeColorMap[badge].split(" ")[0],
                    )}
                  />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    Eligible For
                  </p>
                  <p
                    className={clsx(
                      "text-[10px] font-black uppercase tracking-widest",
                      badge && badgeColorMap[badge].split(" ")[0],
                    )}
                  >
                    {badgeNameMap[badge]}
                  </p>
                </div>
              </div>
              <Button
                onClick={onApprove}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-lg h-7 px-3 text-[9px] uppercase tracking-widest shadow-sm"
              >
                Approve
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["pink", "red", "green", "blue"] as BadgeType[]).map((b) => (
                <button
                  key={b}
                  onClick={() => onSetBadge?.(b)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                    user.approvedBadge === b
                      ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white " +
                          badgeColorMap[b]
                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300",
                  )}
                >
                  {badgeNameMap[b]}
                </button>
              ))}
            </div>
            {user.approvedBadge && (
              <Button
                onClick={onRemove}
                variant="outline"
                className="w-full border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 size={14} className="mr-2" /> Remove Badge
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

const Trophy = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 22V18" />
    <path d="M14 22V18" />
    <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
  </svg>
);
