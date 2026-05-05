import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Toast,
  useToast,
} from "../../components/UI";
import { useAuth } from "../../AuthContext";
import {
  BloodRequest,
  UserRole,
  User,
  FeedbackStatus,
  DonationRecord,
  DonationFeedback,
} from "../../types";
import {
  createBloodRequest as apiCreateBloodRequest,
  subscribeToBloodRequests as apiSubscribeToBloodRequests,
  acceptBloodRequest,
  deleteBloodRequest,
  getUsers,
  requestRequestedDonorAccess,
  getDonations,
  getUserFeedbacks,
  closeBloodRequest,
} from "../../services/api";
import {
  MapPin,
  Droplet,
  Clock,
  CheckCircle,
  BadgeCheck,
  CheckCircle2,
  Lock,
  ShieldAlert,
  X,
  User as UserIcon,
  Phone,
  Activity,
  Calendar,
  Trash2,
  Check,
  AlertCircle,
  MessageSquareQuote,
  Quote,
  Mail,
  Search,
  ListFilter,
  Eye,
  Award,
  UserCheck,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  MessageCircle,
  Send,
  Globe,
} from "lucide-react";
import { getVerificationBadge, getRankBadge, getRoleBadge } from "./Profile";
import clsx from "clsx";

export const RequestedDonor = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const isPrivileged = user?.role !== UserRole.USER;
  const hasAccess = isPrivileged || user?.hasRequestedDonorAccess;
  const [activeTab, setActiveTab] = useState<"ALL" | "MY_REQUESTS" | "MONITOR">(
    isPrivileged ? "ALL" : "MY_REQUESTS",
  );
  const [monitorSubTab, setMonitorSubTab] = useState<
    "OPEN" | "CLOSED" | "CONFIRMED"
  >("CONFIRMED");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<DonationFeedback[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);

  // Form state
  const [bloodGroup, setBloodGroup] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState<string | null>(null);
  const [confirmingDonor, setConfirmingDonor] = useState<{
    reqId: string;
    userId: string;
  } | null>(null);
  const [systemUsers, setSystemUsers] = useState<Record<string, User>>({});

  useEffect(() => {
    getUsers()
      .then((users) => {
        const userMap: Record<string, User> = {};
        users.forEach((u) => (userMap[u.id] = u));
        setSystemUsers(userMap);
      })
      .catch(console.error);

    getDonations().then(setDonations).catch(console.error);

    const unsubscribe = apiSubscribeToBloodRequests((data) => {
      setRequests(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (viewUser) {
      getUserFeedbacks(viewUser.id).then((data) => {
        setUserFeedbacks(
          data.filter((f) => f.status === FeedbackStatus.APPROVED),
        );
      });
    } else {
      setUserFeedbacks([]);
    }
  }, [viewUser]);

  const checkEligibility = (lastDate?: string) => {
    if (!lastDate) return { eligible: true, daysLeft: 0 };
    const lastDonation = new Date(lastDate);
    const today = new Date();
    const nextEligible = new Date(
      lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000,
    );
    const diffTime = nextEligible.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      eligible: diffDays <= 0,
      daysLeft: Math.max(0, diffDays),
    };
  };

  const getDonationCount = (userId: string) => {
    return donations.filter(
      (d) => d.userId === userId && d.status === "COMPLETED",
    ).length;
  };

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await requestRequestedDonorAccess(user);
      updateUser({ ...user, requestedDonorAccessRequested: true });
      showToast("Access requested successfully.");
    } catch (e) {
      showToast("Request failed.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodGroup || !location) {
      showToast("Please provide blood group and location", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCreateBloodRequest({ bloodGroup, location, details }, user!);
      showToast("Blood request created successfully", "success");
      setBloodGroup("");
      setLocation("");
      setDetails("");
      setActiveTab("MY_REQUESTS");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await acceptBloodRequest(id, user!);
      showToast("Request accepted successfully", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCloseRequest = async (id: string, confirmedUserId?: string) => {
    if (!user) return;

    setIsClosing(id);
    try {
      await closeBloodRequest(id, user, confirmedUserId);
      showToast("রিকোয়েস্ট সফলভাবে ক্লোজ করা হয়েছে।", "success");
      setConfirmingDonor(null);
    } catch (err: any) {
      console.error("Close request error:", err);
      showToast(err.message || "রিকোয়েস্ট ক্লোজ করতে সমস্যা হয়েছে।", "error");
    } finally {
      setIsClosing(null);
    }
  };

  const getUserDisplay = (uid: string, defaultName: string) => {
    const u = systemUsers[uid];
    if (!u)
      return { name: defaultName, avatar: null, badge: null, role: "USER", roleBadgeData: null };

    let badge = null;
    const vb = getVerificationBadge(u, undefined);

    if (vb) {
      badge = (
        <BadgeCheck size={14} className={clsx(vb.color, "flex-shrink-0")} />
      );
    }

    const roleBadgeData = getRoleBadge(u, undefined);

    return { name: u.name, avatar: u.avatar, badge, role: u.role, roleBadgeData };
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;
    try {
      await deleteBloodRequest(id, user!);
      showToast("Request deleted successfully", "success");
      setDeleteId(null);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const filteredMonitorRequests = requests.filter((r) => {
    const isClosed = r.status === "CLOSED";
    const isConfirmed = isClosed && !!r.confirmedUserId;

    let matchesTab = false;
    if (monitorSubTab === "OPEN") matchesTab = !isClosed;
    else if (monitorSubTab === "CLOSED") matchesTab = isClosed && !isConfirmed;
    else if (monitorSubTab === "CONFIRMED") matchesTab = isConfirmed;

    const matchesSearch =
      (r.requesterName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.bloodGroup || "").toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const getDonorName = (id: string) => {
    const u = systemUsers[id];
    return u ? u.name : "Unknown Donor";
  };

  const myRequests = requests.filter((r) => r.requesterId === user?.id);
  const openRequests = requests.filter((r) => {
    const isNotMine = r.requesterId !== user?.id;
    const isOpen = r.status === "OPEN" || !r.status;
    if (isPrivileged) return isNotMine && isOpen;
    return isNotMine && isOpen && r.bloodGroup === user?.bloodGroup;
  });

  if (user && !hasAccess) {
    return (
      <div className="w-full  pb-8 animate-in slide-in-from-bottom-4 duration-500">
        <Toast {...toastState} onClose={hideToast} />
        <div className="w-full py-12 px-4 transition-colors">
          <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-sm flex items-center justify-center mx-auto shadow-inner transition-colors">
              <Lock size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
                Requested Donor Access Restricted
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-colors">
                রিকোয়েস্টেড ডোনার ফিচারটি বর্তমানে লক করা আছে। অ্যাক্সেস পেতে
                এ্যাডমিনের কাছে রিকোয়েস্ট পাঠান। আপনার রিকোয়েস্টটি এ্যাডমিন
                এপ্রুভ করলে আপনি এই সার্ভিসটি ব্যবহার করতে পারবেন।
              </p>
            </div>

            {user.requestedDonorAccessRequested ? (
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-2xl flex items-center justify-center gap-3 border border-yellow-100 dark:border-yellow-900/30 font-black uppercase tracking-widest text-xs transition-colors">
                <ShieldAlert size={18} /> Request Pending Approval
              </div>
            ) : (
              <Button
                onClick={handleRequestAccess}
                isLoading={isRequesting}
                className="w-full py-5 rounded-sm text-lg shadow-xl shadow-red-100 dark:shadow-none bg-red-600 hover:bg-red-700"
              >
                Request Access to Feature
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
          <Droplet size={24} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Requested Donor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Request blood and see who accepted
          </p>
        </div>
      </div>

      <Toast {...toastState} onClose={hideToast} />

      {/* View Profile Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 transition-colors">
            <button
              onClick={() => setViewUser(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-sm shadow-lg"
            >
              <X size={20} />
            </button>

            {/* Profile Header Background */}
            <div className="h-44 relative">
              {viewUser.coverImage ? (
                <img
                  src={viewUser.coverImage}
                  className="w-full h-full object-cover"
                  alt="Cover"
                />
              ) : (
                <div className="w-full h-full bg-red-600"></div>
              )}

              {/* Avatar Center Overlap */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                <div
                  className={clsx(
                    "w-36 h-36 rounded-full border-[6px] shadow-2xl overflow-hidden bg-white dark:bg-slate-800 transition-all duration-500",
                    checkEligibility(viewUser.lastDonationDate).eligible
                      ? "border-green-500 shadow-green-500/20"
                      : "border-red-500 shadow-red-500/20",
                  )}
                >
                  {viewUser.avatar ? (
                    <img
                      src={viewUser.avatar}
                      className="w-full h-full object-cover"
                      alt={viewUser.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 font-black text-5xl">
                      {viewUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Rank Badge Overlap */}
                {(() => {
                  const donationCount = getDonationCount(viewUser.id);
                  const rank = getRankBadge(viewUser, undefined, donationCount);
                  return (
                    rank &&
                    donationCount > 0 && (
                      <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-900 transition-colors">
                        <div
                          className={clsx(
                            "w-full h-full rounded-full flex items-center justify-center",
                            rank.bg,
                            rank.color,
                          )}
                        >
                          <rank.icon size={20} />
                        </div>
                      </div>
                    )
                  );
                })()}
              </div>
            </div>

            <div className="pt-20 pb-6 px-6 text-center space-y-4">
              {/* Identity Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
                    {viewUser.name}
                  </h2>
                  {(() => {
                    const vb = getVerificationBadge(viewUser, undefined);
                    if (vb) {
                      return (
                        <BadgeCheck
                          size={24}
                          className={clsx(vb.color, "flex-shrink-0")}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {(() => {
                    const roleBadgeData = getRoleBadge(viewUser);
                    if (roleBadgeData) {
                      return (
                        <div
                          className={clsx(roleBadgeData.bg, roleBadgeData.color, "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest ring-1 ring-inset shadow-sm flex items-center gap-1 border border-current")}
                        >
                          <roleBadgeData.icon size={12} />
                          {roleBadgeData.name}
                        </div>
                      )
                    }
                    return (
                      <Badge
                        color="blue"
                        className="text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-sm shadow-sm"
                      >
                        {viewUser.role}
                      </Badge>
                    )
                  })()}
                  <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-sm text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                    {viewUser.id}
                  </div>
                </div>
              </div>



              {/* Status Section */}
              {(() => {
                const { eligible, daysLeft } = checkEligibility(
                  viewUser.lastDonationDate,
                );
                return (
                  <div
                    className={clsx(
                      "p-2 rounded-2xl border flex items-center justify-center gap-3 transition-colors",
                      eligible
                        ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400",
                    )}
                  >
                    {eligible ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <AlertCircle size={24} />
                    )}
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                        Current Status
                      </p>
                      <p className="text-sm font-black tracking-tight">
                        {eligible
                          ? "Eligible for Donation"
                          : `Resting (${daysLeft} days left)`}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Info Grid */}
              <div className="space-y-2 text-left">
                {/* Blood Group and Location in one row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-red-600 shadow-sm shrink-0">
                      <Droplet size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                        Group
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white transition-colors">
                        {viewUser.bloodGroup}
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                        Location
                      </p>
                      <p
                        className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors"
                        title={viewUser.location}
                      >
                        {viewUser.location}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Contact Number
                    </p>
                    <a
                      href={`tel:${viewUser.phone}`}
                      className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase"
                    >
                      {viewUser.phone}
                    </a>
                  </div>
                </div>

                {viewUser.email && (
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Email Address
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors">
                        {viewUser.email}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                      <Activity size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                        Donations
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white transition-colors">
                        {getDonationCount(viewUser.id)}
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                        Last Donate
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate transition-colors">
                        {viewUser.lastDonationDate
                          ? new Date(
                              viewUser.lastDonationDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Media Section */}
                {viewUser.socialLinks && Object.keys(viewUser.socialLinks).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-2 transition-colors">
                      <Globe
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                      />{" "}
                      Social Media
                    </h3>
                    <div className="flex gap-2 mb-2">
                      {Object.entries(viewUser.socialLinks).map(([platform, url]) => {
                        const Icon = {
                          facebook: Facebook,
                          twitter: Twitter,
                          instagram: Instagram,
                          linkedin: Linkedin,
                          youtube: Youtube,
                          github: Github,
                          whatsapp: MessageCircle,
                          telegram: Send,
                        }[platform] || Globe;
                        
                        return (
                          <a 
                            key={platform}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                            title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                          >
                            <Icon size={16} />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Approved Feedbacks Section */}
                {userFeedbacks.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-2 transition-colors">
                      <MessageSquareQuote
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                      />{" "}
                      Community Feedback
                    </h3>
                    <div className="space-y-2">
                      {userFeedbacks.map((f) => (
                        <div
                          key={f.id}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 relative group transition-colors"
                        >
                          <Quote
                            size={14}
                            className="absolute top-2 left-2 text-slate-300 dark:text-slate-700 fill-current"
                          />
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 pl-5 italic leading-relaxed transition-colors">
                            "{f.message}"
                          </p>
                          <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 text-right mt-1.5 uppercase tracking-widest transition-colors">
                            {new Date(f.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 font-bold text-sm overflow-x-auto scrollbar-thin whitespace-nowrap">
        <button
          className={clsx(
            "pb-2 px-4 relative transition-colors",
            activeTab === "ALL"
              ? "text-red-600 dark:text-red-400"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
          )}
          onClick={() => setActiveTab("ALL")}
        >
          All Requests{" "}
          {activeTab === "ALL" && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 dark:bg-red-400 rounded-t-full" />
          )}
        </button>
        <button
          className={clsx(
            "pb-2 px-4 relative transition-colors",
            activeTab === "MY_REQUESTS"
              ? "text-red-600 dark:text-red-400"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
          )}
          onClick={() => setActiveTab("MY_REQUESTS")}
        >
          My Requests{" "}
          {activeTab === "MY_REQUESTS" && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 dark:bg-red-400 rounded-t-full" />
          )}
        </button>
        {isPrivileged && (
          <button
            className={clsx(
              "pb-2 px-4 relative transition-colors",
              activeTab === "MONITOR"
                ? "text-red-600 dark:text-red-400"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
            onClick={() => setActiveTab("MONITOR")}
          >
            Blood Requests{" "}
            {activeTab === "MONITOR" && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 dark:bg-red-400 rounded-t-full" />
            )}
          </button>
        )}
      </div>

      <div
        className={clsx(
          "grid grid-cols-1 gap-6",
          activeTab === "MY_REQUESTS" ? "lg:grid-cols-4" : "w-full",
        )}
      >
        {activeTab === "MY_REQUESTS" && (
          <Card className="p-4 lg:col-span-1 h-fit border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-3">
              Post a Request
            </h2>
            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Blood Group *
                </label>
                <Select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full py-2"
                  required
                >
                  <option value="">Select Group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (bg) => {
                      const availableCount = Object.values(systemUsers).filter(
                        (u) =>
                          u.bloodGroup === bg &&
                          checkEligibility(u.lastDonationDate).eligible,
                      ).length;
                      return (
                        <option key={bg} value={bg}>
                          {bg} ({availableCount} Available)
                        </option>
                      );
                    },
                  )}
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Location *
                </label>
                <Input
                  placeholder="Hospital/City Area"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Details
                </label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm min-h-[80px] resize-y"
                  placeholder="Specific needs?"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 font-bold"
              >
                {isSubmitting ? "Posting..." : "Post Request"}
              </Button>
            </form>
          </Card>
        )}

        <div
          className={clsx(
            "space-y-2",
            activeTab === "MY_REQUESTS" ? "lg:col-span-3" : "",
          )}
        >
          {activeTab === "MONITOR" ? (
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-slate-900 p-1.5 px-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
                  {(["OPEN", "CLOSED", "CONFIRMED"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setMonitorSubTab(tab)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                        monitorSubTab === tab
                          ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700",
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search requests..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-red-500/50 transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredMonitorRequests.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl transition-colors">
                    <ListFilter
                      size={32}
                      className="mx-auto text-slate-300 mb-3"
                    />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors">
                      No records found
                    </p>
                  </div>
                ) : (
                  filteredMonitorRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2 px-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all hover:border-red-100 dark:hover:border-red-900/50"
                    >
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 space-y-1">
                          {(() => {
                            const display = getUserDisplay(
                              req.requesterId,
                              req.requesterName,
                            );
                            return (
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-red-50 dark:bg-red-950/20 flex items-center justify-center border border-red-100 dark:border-red-900/20">
                                    {display.avatar ? (
                                      <img
                                        src={display.avatar}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <UserIcon
                                        size={18}
                                        className="text-red-600"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5 transition-colors">
                                      Requester
                                    </p>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 whitespace-nowrap transition-colors">
                                      {display.name}
                                      {display.badge}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge className="bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-0 font-black text-[8px] px-1 py-0">
                                        {req.bloodGroup}
                                      </Badge>
                                      <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 transition-colors">
                                        <MapPin size={9} /> {req.location}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Mobile/Tablet Delete Button */}
                                <button
                                  onClick={() => handleDeleteRequest(req.id)}
                                  className="lg:hidden p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-100 dark:border-white/5 active:scale-95 shadow-sm"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex-1">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1 transition-colors">
                            <CheckCircle2
                              size={10}
                              className="text-green-500"
                            />{" "}
                            Accepted ({req.acceptedBy?.length || 0})
                          </p>
                          <div className="flex flex-wrap gap-1 transition-colors">
                            {req.acceptedBy && req.acceptedBy.length > 0 ? (
                              req.acceptedBy.map((acc, i) => {
                                const display = getUserDisplay(
                                  acc.userId,
                                  acc.name,
                                );
                                return (
                                  <div
                                    key={i}
                                    onClick={() => setViewUser(systemUsers[acc.userId])}
                                    className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-100 dark:border-slate-700 pr-2 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                  >
                                    <div className="w-4.5 h-4.5 rounded overflow-hidden bg-white dark:bg-slate-700 flex items-center justify-center text-[7px] font-black text-slate-400 transition-colors">
                                      {display.avatar ? (
                                        <img
                                          src={display.avatar}
                                          alt=""
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        acc.name.charAt(0)
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[8px] font-black text-slate-800 dark:text-slate-200 leading-none truncate transition-colors flex items-center gap-1">
                                        {display.name}
                                        {display.badge}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[8px] italic text-slate-400">
                                Searching...
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 lg:w-48 p-1.5 px-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors">
                          {req.confirmedUserId ? (
                            <>
                              <div className="absolute top-0 right-0 w-6 h-6 bg-green-500/10 rotate-45 translate-x-4 -translate-y-4"></div>
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                                <Award size={10} className="text-amber-500" />{" "}
                                Finalized
                              </p>
                              {(() => {
                                const donorName = getDonorName(
                                  req.confirmedUserId,
                                );
                                const display = getUserDisplay(
                                  req.confirmedUserId,
                                  donorName,
                                );
                                return (
                                  <div 
                                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setViewUser(systemUsers[req.confirmedUserId!])}
                                  >
                                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-green-100 dark:bg-green-950/20 text-green-600 flex items-center justify-center border border-green-200 dark:border-green-900/20 transition-colors">
                                      {display.avatar ? (
                                        <img
                                          src={display.avatar}
                                          alt=""
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <UserCheck size={14} />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-[10px] font-black text-slate-900 dark:text-white leading-tight truncate transition-colors flex items-center gap-1">
                                        {display.name}
                                        {display.badge}
                                      </h4>
                                      <p className="text-[7px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider transition-colors">
                                        Completed
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                              <Clock
                                size={14}
                                className="text-slate-400 mb-0.5"
                              />
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 transition-colors">
                                Pending
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Desktop Delete Column */}
                        <div className="hidden lg:flex items-center justify-center px-2">
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-100 dark:border-white/5 active:scale-90"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "ALL" ? (
            openRequests.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center text-slate-500 border border-slate-100 dark:border-slate-800">
                No requests available.
              </div>
            ) : (
              <>
                <Card className="hidden md:block overflow-hidden border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-1 px-3 py-2">Requester</th>
                        <th className="p-1 px-3 py-2">Group</th>
                        <th className="p-1 px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {openRequests.map((req) => {
                        const hasAccepted = (req.acceptedBy || []).some(
                          (a) => a.userId === user?.id,
                        );
                        const requester = getUserDisplay(
                          req.requesterId,
                          req.requesterName,
                        );
                        return (
                          <tr key={req.id} className="p-1">
                            <td className="p-1 px-3 py-2">
                              <div
                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setViewUser(systemUsers[req.requesterId])
                                }
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                                  {requester.avatar ? (
                                    <img
                                      src={requester.avatar}
                                      alt="avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-500">
                                      {requester.name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {requester.name} {requester.badge}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">
                                    {new Date(req.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-1 px-3 py-2">
                              <Badge
                                color={hasAccepted ? "green" : "red"}
                                className="text-[10px] font-bold"
                              >
                                {req.bloodGroup}
                              </Badge>
                            </td>
                            <td className="p-1 px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {hasAccepted ? (
                                  <Badge color="green">Accepted</Badge>
                                ) : (
                                  <Button
                                    onClick={() => handleAcceptRequest(req.id)}
                                    className="text-[10px] py-1 font-black uppercase tracking-widest"
                                  >
                                    Accept
                                  </Button>
                                )}
                                {isPrivileged && (
                                  <Button
                                    onClick={() => handleDeleteRequest(req.id)}
                                    variant="danger"
                                    className="text-[10px] py-1 font-black uppercase tracking-widest"
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
                <div className="md:hidden space-y-4">
                  {openRequests.map((req) => {
                    const hasAccepted = (req.acceptedBy || []).some(
                      (a) => a.userId === user?.id,
                    );
                    const requester = getUserDisplay(
                      req.requesterId,
                      req.requesterName,
                    );
                    return (
                      <Card
                        key={req.id}
                        className="p-3 space-y-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div
                            className="flex gap-3"
                            onClick={() =>
                              setViewUser(systemUsers[req.requesterId])
                            }
                          >
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0">
                              {requester.avatar ? (
                                <img
                                  src={requester.avatar}
                                  alt="avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                requester.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1 leading-none pt-0.5">
                                {requester.name} {requester.badge}
                              </p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1">
                                {new Date(req.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            color="red"
                            className="font-black ring-1 ring-red-100 dark:ring-red-900/50 text-[10px] py-0 px-2"
                          >
                            {req.bloodGroup}
                          </Badge>
                        </div>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] font-bold flex flex-col gap-1 border border-slate-100 dark:border-slate-800 transition-colors">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <MapPin size={12} className="text-red-500" />
                            {req.location}
                          </div>
                          {req.details && (
                            <p className="text-slate-500 dark:text-slate-400 font-normal pl-5 leading-tight">
                              {req.details}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {hasAccepted ? (
                            <div className="flex-1 text-center py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-green-100 dark:border-green-900/30">
                              Accepted
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAcceptRequest(req.id)}
                              className="flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md"
                            >
                              Accept Request
                            </Button>
                          )}
                          {isPrivileged && (
                            <Button
                              onClick={() => handleDeleteRequest(req.id)}
                              variant="danger"
                              className="px-3 rounded-xl"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )
          ) : myRequests.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center text-slate-500 border border-slate-100 dark:border-slate-800">
              You haven't posted any requests.
            </div>
          ) : (
            <>
              <Card className="hidden md:block overflow-hidden border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-1 px-3 py-2">Info</th>
                      <th className="p-1 px-3 py-2">Accepted By</th>
                      <th className="p-1 px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myRequests.map((req) => (
                      <tr key={req.id} className="p-1 align-top">
                        <td className="p-1 px-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              color="blue"
                              className="text-[10px] py-0 px-2"
                            >
                              {req.bloodGroup}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-500">
                              {new Date(req.timestamp).toLocaleDateString()}
                            </span>
                            {req.status === "CLOSED" && (
                              <Badge
                                color="green"
                                className="text-[10px] py-0 px-2"
                              >
                                CLOSED
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={10} />
                            {req.location}
                          </div>
                        </td>
                        <td className="p-1 px-3 py-2">
                          {(req.acceptedBy || []).length === 0 ? (
                            <span className="text-xs text-slate-400 italic">
                              Pending...
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(req.acceptedBy || []).map((acc, i) => {
                                const display = getUserDisplay(
                                  acc.userId,
                                  acc.name,
                                );
                                return (
                                  <div
                                    key={i}
                                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                    onClick={() =>
                                      setViewUser(systemUsers[acc.userId])
                                    }
                                  >
                                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0">
                                      {display.avatar ? (
                                        <img
                                          src={display.avatar}
                                          alt="avatar"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-[10px]">
                                          {display.name.charAt(0)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 leading-none">
                                          {display.name} {display.badge}
                                        </span>
                                        {(req.status === "OPEN" ||
                                          !req.status) && (
                                          <div className="flex items-center gap-1">
                                            {confirmingDonor?.reqId ===
                                              req.id &&
                                            confirmingDonor?.userId ===
                                              acc.userId ? (
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCloseRequest(
                                                      req.id,
                                                      acc.userId,
                                                    );
                                                  }}
                                                  className="px-2 py-0.5 bg-green-600 text-white rounded text-[8px] font-black uppercase hover:bg-green-700 transition-colors"
                                                >
                                                  {isClosing === req.id
                                                    ? "..."
                                                    : "Yes"}
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmingDonor(null);
                                                  }}
                                                  className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-[8px] font-black uppercase hover:bg-slate-300 transition-colors"
                                                >
                                                  No
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                disabled={isClosing === req.id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConfirmingDonor({
                                                    reqId: req.id,
                                                    userId: acc.userId,
                                                  });
                                                }}
                                                className={clsx(
                                                  "ml-2 px-3 py-1 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95",
                                                  isClosing === req.id
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:bg-green-700",
                                                )}
                                                title="Confirm this donor and close request"
                                              >
                                                Confirm
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[8px] font-black text-blue-500 dark:text-blue-400 leading-none mt-0.5">
                                        {acc.phone}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="p-1 px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(req.status === "OPEN" || !req.status) && (
                              <button
                                onClick={() => handleCloseRequest(req.id)}
                                disabled={isClosing === req.id}
                                className="text-[10px] py-1 px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                              >
                                {isClosing === req.id ? "Closing..." : "Close"}
                              </button>
                            )}
                            <Button
                              onClick={() => handleDeleteRequest(req.id)}
                              variant="danger"
                              className="text-[10px] py-0.5 font-black uppercase"
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <div className="md:hidden space-y-4">
                {myRequests.map((req) => (
                  <Card
                    key={req.id}
                    className="p-3 space-y-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge
                          color="blue"
                          className="font-black px-3 py-0 ring-1 ring-blue-100 dark:ring-blue-900/50 text-[10px]"
                        >
                          {req.bloodGroup}
                        </Badge>
                        {req.status === "CLOSED" && (
                          <Badge
                            color="green"
                            className="text-[9px] font-black uppercase px-2 py-0"
                          >
                            CLOSED
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(req.status === "OPEN" || !req.status) && (
                          <button
                            onClick={() => handleCloseRequest(req.id)}
                            disabled={isClosing === req.id}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                            title="Close Request"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <Button
                          onClick={() => handleDeleteRequest(req.id)}
                          variant="danger"
                          className="p-1.5 h-auto rounded-lg shadow-md"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] font-bold flex items-center gap-2 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                      <MapPin size={14} className="text-red-500 shrink-0" />
                      {req.location}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Accepted By ({(req.acceptedBy || []).length})
                      </p>
                      <div className="space-y-1.5">
                        {(req.acceptedBy || []).length === 0 ? (
                          <div className="p-3 text-center text-[10px] text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border-dashed border border-slate-200 dark:border-slate-700">
                            No one yet
                          </div>
                        ) : (
                          (req.acceptedBy || []).map((acc, i) => {
                            const acceptor = getUserDisplay(
                              acc.userId,
                              acc.name,
                            );
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() =>
                                  setViewUser(systemUsers[acc.userId])
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                                    {acceptor.avatar ? (
                                      <img
                                        src={acceptor.avatar}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <UserIcon
                                        size={12}
                                        className="text-slate-400"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-1 leading-none">
                                      {acceptor.name} {acceptor.badge}
                                      {(req.status === "OPEN" ||
                                        !req.status) && (
                                        <div className="flex items-center gap-1 mt-1">
                                          {confirmingDonor?.reqId === req.id &&
                                          confirmingDonor?.userId ===
                                            acc.userId ? (
                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleCloseRequest(
                                                    req.id,
                                                    acc.userId,
                                                  );
                                                }}
                                                className="px-2 py-1 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase"
                                              >
                                                {isClosing === req.id
                                                  ? "..."
                                                  : "Yes"}
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConfirmingDonor(null);
                                                }}
                                                className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px] font-black uppercase"
                                              >
                                                No
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              disabled={isClosing === req.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmingDonor({
                                                  reqId: req.id,
                                                  userId: acc.userId,
                                                });
                                              }}
                                              className={clsx(
                                                "ml-2 px-3 py-1 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase transition-all shadow-md active:scale-95",
                                                isClosing === req.id
                                                  ? "opacity-50 cursor-not-allowed"
                                                  : "hover:bg-green-700",
                                              )}
                                            >
                                              Confirm
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[9px] font-bold text-blue-500 dark:text-blue-400 mt-0.5">
                                      {acc.phone}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">
                                    {new Date(acc.timestamp).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </div>
                                  {req.status === "CLOSED" &&
                                    req.confirmedUserId === acc.userId && (
                                      <Badge
                                        color="green"
                                        className="text-[8px] py-0 px-1"
                                      >
                                        CONFIRMED
                                      </Badge>
                                    )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
