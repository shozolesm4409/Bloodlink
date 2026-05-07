import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useSettings } from "../../SettingsContext";
import {
  updateUserProfile,
  changePassword,
  getAppPermissions,
  requestIDCardAccess,
  getUserDonations,
  getUserFeedbacks,
} from "../../services/api";
import {
  Card,
  Input,
  Button,
  Select,
  Badge,
  Toast,
  useToast,
} from "../../components/UI";
import {
  User,
  BloodGroup,
  AppPermissions,
  UserRole,
  DonationStatus,
  DonationRecord,
  DonationFeedback,
  FeedbackStatus,
  BadgeConfig,
} from "../../types";
import { defaultBadgeConfig } from "../../SettingsContext";
import {
  UserCircle,
  Lock,
  Camera,
  Upload,
  IdCard,
  Download,
  X,
  Clock,
  ShieldAlert,
  Trophy,
  Award,
  Star,
  Medal,
  Edit3,
  Image as ImageIcon,
  Key,
  LayoutDashboard,
  History,
  MessageSquareQuote,
  ChevronRight,
  Activity,
  Droplet,
  Mail,
  Phone,
  MapPin,
  Hash,
  User as UserIcon,
  Check,
  Wallpaper,
  BadgeCheck,
  ShieldCheck,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Link as LinkIcon,
  Globe,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { IDCardFrame } from "../Admin/AdminIDCards";
import { toJpeg } from "html-to-image";
import Cropper from "react-easy-crop";
import clsx from "clsx";

import { BADGE_COLOR_MAP } from "../../constants";

// Helper for Verification Tick Badge
export const getVerificationBadge = (u: User | any, config?: BadgeConfig) => {
  if (!u || !u.approvedBadge) return null;
  
  // Check if approvedBadge is explicitly "none" or undefined
  if (u.approvedBadge === "none") return null;

  const color =
    BADGE_COLOR_MAP[u.approvedBadge as string] ||
    config?.verificationBadgeColor ||
    "text-cyan-500";
  return { color };
};

// Badge Helper function
export const getRoleBadge = (u: User | any, config?: BadgeConfig) => {
  if (!u) return null;
  const resolvedConfig = config || defaultBadgeConfig;

  if (u.role === UserRole.SUPERADMIN)
    return {
      name: "Super Admin",
      color: "text-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-950/20",
      icon: ShieldCheck,
      shadow: "shadow-cyan-200",
    };
  if (u.role === UserRole.ADMIN)
    return {
      name: "Admin",
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      icon: ShieldCheck,
      shadow: "shadow-emerald-200",
    };
  if (u.role === UserRole.EDITOR)
    return {
      name: "Editor",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      icon: ShieldCheck,
      shadow: "shadow-amber-200",
    };
  if (u.role === UserRole.USER)
    return {
      name: "User",
      color: "text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-900/20",
      icon: ShieldCheck,
      shadow: "shadow-slate-200",
    };
  return null;
};

export const getRankBadge = (
  u: User | any,
  config?: BadgeConfig,
  donationCount: number = 0,
) => {
  if (!u) return null;
  const resolvedConfig = { ...defaultBadgeConfig, ...config };

  if (resolvedConfig.customRanks && resolvedConfig.customRanks.length > 0) {
    const activeRanks = [...resolvedConfig.customRanks]
      .filter((r) => r.status === "active")
      .sort((a, b) => b.pointsRequired - a.pointsRequired);

    for (const rank of activeRanks) {
      if (donationCount >= rank.pointsRequired) {
        let IconComp: any = Trophy;
        if (rank.icon === "Star") IconComp = Star;
        else if (rank.icon === "TwoStars") {
          IconComp = (props: any) => (
            <div className="flex gap-0.5">
              <Star {...props} size={props.size ? props.size * 0.8 : 16} />
              <Star {...props} size={props.size ? props.size * 0.8 : 16} />
            </div>
          );
        } else if (rank.icon === "ThreeStars") {
          IconComp = (props: any) => (
            <div className="flex gap-0.5">
              <Star {...props} size={props.size ? props.size * 0.7 : 14} />
              <Star
                {...props}
                size={props.size ? props.size * 0.8 : 16}
                className="-mt-1"
              />
              <Star {...props} size={props.size ? props.size * 0.7 : 14} />
            </div>
          );
        } else if (rank.icon === "Shield") IconComp = ShieldAlert;
        else if (rank.icon === "Medal") IconComp = Medal;
        else if (rank.icon === "Award") IconComp = Award;
        else if (rank.icon === "Trophy") IconComp = Trophy;
        else if (rank.icon === "Crown") IconComp = Trophy;

        const colorParts = rank.color.split(" ");
        const textColor = colorParts.find((c) => c.startsWith("text-")) || "text-slate-500";
        const bgColor = colorParts.filter((c) => c.startsWith("bg-") || c.startsWith("dark:bg-")).join(" ") || "bg-slate-50 dark:bg-slate-900/50";

        return {
          name: rank.name,
          color: textColor,
          bg: bgColor,
          icon: IconComp,
          shadow: "shadow-slate-200",
        };
      }
    }
  }

  // Legacy fallback if customRanks fail or empty for 0 donations
  if (donationCount >= 20) return { name: resolvedConfig.diamond.name, color: resolvedConfig.diamond.color, bg: 'bg-cyan-50 dark:bg-cyan-950/20', icon: Trophy, shadow: 'shadow-cyan-200' };
  if (donationCount >= 15) return { name: resolvedConfig.platinum.name, color: resolvedConfig.platinum.color, bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: Medal, shadow: 'shadow-emerald-200' };
  if (donationCount >= 10) return { name: resolvedConfig.gold.name, color: resolvedConfig.gold.color, bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Award, shadow: 'shadow-amber-200' };
  if (donationCount >= 5) return { name: resolvedConfig.silver.name, color: resolvedConfig.silver.color, bg: 'bg-slate-100 dark:bg-slate-800', icon: Star, shadow: 'shadow-slate-200' };

  return {
    name: "Level 1",
    color: "text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/50",
    icon: Star,
    shadow: "shadow-slate-200"
  };
};

const AVATAR_TEMPLATES = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/personas/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Zack&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Bella&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Jack&backgroundColor=ffadad",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Maya&backgroundColor=ffd6a5",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Leo&backgroundColor=fdffb6",
  "https://api.dicebear.com/9.x/big-ears/svg?seed=Sasha&backgroundColor=caffbf",
];

const COVER_TEMPLATES = [
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=1000&auto=format&fit=crop", // Red blood cells abstract
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1000&auto=format&fit=crop", // Abstract red flow
  "https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?q=80&w=1000&auto=format&fit=crop", // Red abstract
  "https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1000&auto=format&fit=crop", // Geometric Pattern
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop", // DNA / Medical
  "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=1000&auto=format&fit=crop", // Cell abstract
];

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { badgeConfig } = useSettings();
  const { toastState, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar || "",
  );
  const [coverPreview, setCoverPreview] = useState<string>(
    user?.coverImage || "",
  );

  // System Templates from Firestore
  const [systemAvatars, setSystemAvatars] = useState<any[]>([]);
  const [systemCovers, setSystemCovers] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Stats State
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);

  // View/Edit Mode State
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [editTab, setEditTab] = useState<"profile" | "image" | "password" | "social">(
    "profile",
  );

  // Crop States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "cover" | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [showCardModal, setShowCardModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAppPermissions().then(setPerms);
    if (user) {
      setAvatarPreview(user.avatar || "");
      setCoverPreview(user.coverImage || "");
      Promise.all([getUserDonations(user.id), getUserFeedbacks(user.id)]).then(
        ([d, f]) => {
          setDonations(d);
          setFeedbacks(f);
        },
      );
    }
  }, [user]);

  // Fetch System Templates
  useEffect(() => {
    const avatarsRef = collection(db, "system_avatars");
    const coversRef = collection(db, "system_covers");
    
    const avatarsQuery = query(avatarsRef);
    const coversQuery = query(coversRef);

    const unsubAvatars = onSnapshot(avatarsQuery, (snapshot) => {
      const avatarList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((a: any) => a.visibility !== 'hidden');

      // Sort client-side to respect manual order and avoid index errors
      avatarList.sort((a: any, b: any) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
        const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
        return dateB - dateA;
      });

      setSystemAvatars(avatarList);
    });

    const unsubCovers = onSnapshot(coversQuery, (snapshot) => {
      const coverList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((c: any) => c.visibility !== 'hidden');

      // Sort client-side to respect manual order and avoid index errors
      coverList.sort((a: any, b: any) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
        const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
        return dateB - dateA;
      });

      setSystemCovers(coverList);
      setTemplatesLoading(false);
    });

    return () => {
      unsubAvatars();
      unsubCovers();
    };
  }, []);

  if (!user) return null;

  const donationCount = donations.filter(
    (d) => d.status === DonationStatus.COMPLETED,
  ).length;
  const rank = getRankBadge(user, badgeConfig, donationCount);
  const roleBadge = getRoleBadge(user, badgeConfig);

  // Helper to check effective permissions (Override > Global)
  const canEditProfile = (() => {
    if (user.permissions?.rules?.canEditProfile !== undefined) {
      return user.permissions.rules.canEditProfile;
    }
    const roleKey = user.role.toLowerCase() as keyof AppPermissions;
    if (user.role === UserRole.SUPERADMIN) return true;
    return (
      perms?.[roleKey]?.rules?.canEditProfile ?? user.role !== UserRole.USER
    ); // Default fallback
  })();

  const isRestricted = !canEditProfile;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size must be under 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropType("avatar");
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size must be under 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        setCropType("cover");
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSaveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setImgUploading(true);
    try {
      const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);

      const updates =
        cropType === "avatar"
          ? { avatar: croppedBase64 }
          : { coverImage: croppedBase64 };

      const updatedUser = await updateUserProfile(user.id, updates, user);
      updateUser(updatedUser);

      if (cropType === "avatar") {
        setAvatarPreview(croppedBase64);
        showToast("Profile photo synchronized.");
      } else {
        setCoverPreview(croppedBase64);
        showToast("Cover photo synchronized.");
      }

      setImageToCrop(null);
      setCropType(null);
    } catch (err) {
      showToast("Failed to process image.", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const handleAvatarTemplateClick = async (url: string) => {
    setImgUploading(true);
    try {
      const updatedUser = await updateUserProfile(
        user.id,
        { avatar: url },
        user,
      );
      updateUser(updatedUser);
      setAvatarPreview(url);
      showToast("Avatar updated from template.");
    } catch (err) {
      showToast("Failed to update avatar.", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const handleCoverTemplateClick = async (url: string) => {
    setImgUploading(true);
    try {
      const updatedUser = await updateUserProfile(
        user.id,
        { coverImage: url },
        user,
      );
      updateUser(updatedUser);
      setCoverPreview(url);
      showToast("Cover updated from template.");
    } catch (err) {
      showToast("Failed to update cover.", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const handleIDCardClick = async () => {
    if (user.hasIDCardAccess) {
      setShowCardModal(true);
    } else if (!user.idCardAccessRequested) {
      setIsRequesting(true);
      try {
        await requestIDCardAccess(user);
        updateUser({ ...user, idCardAccessRequested: true });
        showToast("ID Card access request sent to Admin.");
      } catch (err) {
        showToast("Request failed.", "error");
      } finally {
        setIsRequesting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRestricted) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updates: Partial<User> = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      location: formData.get("location") as string,
      bloodGroup: formData.get("bloodGroup") as BloodGroup,
    };

    try {
      const updatedUser = await updateUserProfile(user.id, updates, user);
      updateUser(updatedUser);
      showToast("Profile synchronized successfully.");
    } catch (err) {
      showToast("Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwdLoading(true);
    const formData = new FormData(e.currentTarget);
    const current = formData.get("currentPassword") as string;
    const newPwd = formData.get("newPassword") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (newPwd !== confirm) {
      showToast("PIN matching error.", "error");
      setPwdLoading(false);
      return;
    }

    try {
      await changePassword(user.id, user.name, current, newPwd);
      showToast("PIN updated successfully.");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      showToast(err.message || "Update failed.", "error");
    } finally {
      setPwdLoading(false);
    }
  };

  const downloadIDCard = async () => {
    if (!cardRef.current) return;
    try {
      await new Promise((r) => setTimeout(r, 600));
      const dataUrl = await toJpeg(cardRef.current, {
        quality: 1,
        backgroundColor: "#ffffff",
        pixelRatio: 4,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `BloodLink-ID-${(user.name || "User").replace(/\s+/g, "-").toLowerCase()}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast("ID Card downloaded successfully.");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Download failed.", "error");
    }
  };

  const StatBox = ({ label, count, color, icon: Icon }: any) => (
    <div
      className={clsx(
        "flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-colors",
        color,
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className="text-xl font-black">{count}</span>
    </div>
  );

  const IdentityRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-slate-400 dark:text-slate-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">
          {label}
        </span>
      </div>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
        {value}
      </span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <Toast {...toastState} onClose={hideToast} />

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 text-white rounded-sm shadow-xl shadow-red-100 dark:shadow-red-900/20">
            <UserCircle size={32} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">
              Profile Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs lg:text-sm">
              Update your digital identity and security settings.
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {user.hasIDCardAccess ? (
            <Button
              onClick={handleIDCardClick}
              variant="outline"
              className="flex-1 md:flex-none rounded-2xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            >
              <IdCard className="mr-2" size={18} /> My ID Card
            </Button>
          ) : (
            <Button
              onClick={handleIDCardClick}
              isLoading={isRequesting}
              className="flex-1 md:flex-none rounded-2xl shadow-xl shadow-red-100 dark:shadow-red-900/20 bg-slate-900 dark:bg-slate-800 text-white"
            >
              <ShieldAlert className="mr-2" size={18} /> Request ID
            </Button>
          )}

          {viewMode === "view" ? (
            <Button
              onClick={() => setViewMode("edit")}
              className="flex-1 md:flex-none rounded-2xl shadow-xl shadow-red-100 dark:shadow-red-900/20"
            >
              <Edit3 className="mr-2" size={18} /> Edit Profile
            </Button>
          ) : (
            <Button
              onClick={() => setViewMode("view")}
              variant="outline"
              className="flex-1 md:flex-none rounded-2xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            >
              <LayoutDashboard className="mr-2" size={18} /> View Profile
            </Button>
          )}
        </div>
      </div>

      {viewMode === "view" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4">
          {/* Main Profile Card (Wider: col-span-3) */}
          <Card className="lg:col-span-3 p-0 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-sm relative overflow-hidden text-center h-fit transition-colors">
            <div className="h-32 w-full relative overflow-hidden">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  className="w-full h-full object-cover"
                  alt="Cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600"></div>
              )}
              {/* Overlay gradient for text contrast if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>

            <div className="px-8 pb-8 -mt-20">
              <div className="relative mb-6 inline-block">
                <div className="w-40 h-40 mx-auto bg-white dark:bg-slate-800 rounded-sm p-2 shadow-xl border border-slate-100 dark:border-slate-700 transition-colors">
                  <div className="w-full h-full rounded-sm overflow-hidden relative border-4 border-slate-50 dark:border-slate-900 transition-colors">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle
                        size={64}
                        className="text-slate-200 dark:text-slate-700 w-full h-full p-4"
                      />
                    )}
                  </div>
                </div>
                {rank && (
                  <div
                    className={clsx(
                      "absolute bottom-0 right-0 translate-x-1/4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800",
                      rank.bg,
                      rank.color,
                    )}
                  >
                    {(() => {
                      const Icon = rank.icon;
                      return <Icon size={20} />;
                    })()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight transition-colors">
                  {user.name}
                </h2>
                {(() => {
                  const vb = getVerificationBadge(user, badgeConfig);
                  if (!vb) return null;
                  return (
                    <BadgeCheck
                      size={24}
                      className={clsx(vb.color, "flex-shrink-0")}
                    />
                  );
                })()}
              </div>

              {user.socialLinks && Object.keys(user.socialLinks).length > 0 && (
                <div className="flex justify-center gap-3 mb-6">
                  {Object.entries(user.socialLinks).map(([platform, url]) => {
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
                        className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                        title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                      >
                        <Icon size={18} />
                      </a>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-center flex-wrap gap-2 mb-8">
                <Badge
                  color="red"
                  className="px-3 py-1 text-[10px] ring-1 ring-red-100 dark:ring-red-900/50"
                >
                  {user.bloodGroup} Donor
                </Badge>
                {roleBadge ? (
                  <div
                    className={clsx(roleBadge.bg, roleBadge.color, "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset shadow-sm flex items-center gap-1 border border-current")}
                  >
                    <roleBadge.icon size={12} />
                    {roleBadge.name}
                  </div>
                ) : (
                  <Badge
                    color="blue"
                    className="px-3 py-1 text-[10px] ring-1 ring-blue-100 dark:ring-blue-900/50"
                  >
                    {user.role}
                  </Badge>
                )}
              </div>

              <div className="text-left space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2 transition-colors">
                  <Upload size={14} /> Identity Details
                </h3>
                <div className="space-y-3">
                  <IdentityRow
                    label="BL ID Number"
                    value={user.idNumber || "N/A"}
                    icon={Hash}
                  />
                  <IdentityRow
                    label="Email Address"
                    value={user.email}
                    icon={Mail}
                  />
                  <IdentityRow
                    label="Full Identity Name"
                    value={user.name}
                    icon={UserIcon}
                  />
                  <IdentityRow
                    label="Primary Phone"
                    value={user.phone}
                    icon={Phone}
                  />
                  <IdentityRow
                    label="Blood Group"
                    value={user.bloodGroup}
                    icon={Droplet}
                  />
                  <IdentityRow
                    label="Current City"
                    value={user.location}
                    icon={MapPin}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Section (Narrower: col-span-2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stacked Vertically as requested */}
            <div className="flex flex-col gap-6">
              <Card className="p-6 border-0 shadow-xl bg-slate-50 dark:bg-slate-900 rounded-sm transition-colors border border-slate-100 dark:border-slate-800">
                <h3 className="text-[11px] font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest transition-colors text-center justify-center">
                  <History className="text-red-500" size={18} /> My Donate
                  Summary
                </h3>
                <div className="space-y-3">
                  <StatBox
                    label="Pending"
                    count={
                      donations.filter(
                        (d) => d.status === DonationStatus.PENDING,
                      ).length
                    }
                    color="text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/30"
                    icon={Clock}
                  />
                  <StatBox
                    label="Completed"
                    count={
                      donations.filter(
                        (d) => d.status === DonationStatus.COMPLETED,
                      ).length
                    }
                    color="text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/30"
                    icon={Activity}
                  />
                  <StatBox
                    label="Rejected"
                    count={
                      donations.filter(
                        (d) => d.status === DonationStatus.REJECTED,
                      ).length
                    }
                    color="text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/30"
                    icon={X}
                  />
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-xl bg-slate-50 dark:bg-slate-900 rounded-sm transition-colors border border-slate-100 dark:border-slate-800">
                <h3 className="text-[11px] font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest transition-colors text-center justify-center">
                  <MessageSquareQuote className="text-blue-500" size={18} />{" "}
                  Post Feedback Summary
                </h3>
                <div className="space-y-3">
                  <StatBox
                    label="Pending"
                    count={
                      feedbacks.filter(
                        (d) => d.status === FeedbackStatus.PENDING,
                      ).length
                    }
                    color="text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/30"
                    icon={Clock}
                  />
                  <StatBox
                    label="Approved"
                    count={
                      feedbacks.filter(
                        (d) => d.status === FeedbackStatus.APPROVED,
                      ).length
                    }
                    color="text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/30"
                    icon={Activity}
                  />
                  <StatBox
                    label="Rejected"
                    count={
                      feedbacks.filter(
                        (d) => d.status === FeedbackStatus.REJECTED,
                      ).length
                    }
                    color="text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/30"
                    icon={X}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {viewMode === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 grid grid-cols-2 lg:flex lg:flex-col gap-2 h-fit">
            <button
              onClick={() => setEditTab("profile")}
              className={clsx(
                "w-full flex items-center justify-between p-2.5 lg:p-4 rounded-2xl transition-all",
                editTab === "profile"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <UserCircle size={18} />
                <span className="font-bold text-[11px] lg:text-sm">Profile</span>
              </div>
              <ChevronRight
                size={16}
                className={clsx(
                  "hidden lg:block",
                  editTab === "profile"
                    ? "text-white"
                    : "text-slate-300 dark:text-slate-600",
                )}
              />
            </button>
            <button
              onClick={() => setEditTab("image")}
              className={clsx(
                "w-full flex items-center justify-between p-2.5 lg:p-4 rounded-2xl transition-all",
                editTab === "image"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <ImageIcon size={18} />
                <span className="font-bold text-[11px] lg:text-sm">Image Upload</span>
              </div>
              <ChevronRight
                size={16}
                className={clsx(
                  "hidden lg:block",
                  editTab === "image"
                    ? "text-white"
                    : "text-slate-300 dark:text-slate-600",
                )}
              />
            </button>
            <button
              onClick={() => setEditTab("social")}
              className={clsx(
                "w-full flex items-center justify-between p-2.5 lg:p-4 rounded-2xl transition-all",
                editTab === "social"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <LinkIcon size={18} />
                <span className="font-bold text-[11px] lg:text-sm">Social Links</span>
              </div>
              <ChevronRight
                size={16}
                className={clsx(
                  "hidden lg:block",
                  editTab === "social"
                    ? "text-white"
                    : "text-slate-300 dark:text-slate-600",
                )}
              />
            </button>
            <button
              onClick={() => setEditTab("password")}
              className={clsx(
                "w-full flex items-center justify-between p-2.5 lg:p-4 rounded-2xl transition-all",
                editTab === "password"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Key size={18} />
                <span className="font-bold text-[11px] lg:text-sm truncate">Password</span>
              </div>
              <ChevronRight
                size={16}
                className={clsx(
                  "hidden lg:block",
                  editTab === "password"
                    ? "text-white"
                    : "text-slate-300 dark:text-slate-600",
                )}
              />
            </button>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {editTab === "profile" && (
              <Card className="p-5 border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] animate-in fade-in transition-colors border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-3 transition-colors">
                  <Upload size={16} /> Identity Details
                </h3>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-2">
                    <Input
                      label="BL ID Number (Protected)"
                      value={user.idNumber}
                      disabled
                      className="opacity-50 font-mono dark:bg-slate-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Email Address (Locked)"
                      value={user.email}
                      disabled
                      className="opacity-50 dark:bg-slate-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Full Identity Name"
                      name="name"
                      defaultValue={user.name}
                      disabled={isRestricted}
                    />
                  </div>
                  <Input
                    label="Primary Phone"
                    name="phone"
                    defaultValue={user.phone}
                    disabled={isRestricted}
                  />
                  <Select
                    label="Blood Group"
                    name="bloodGroup"
                    defaultValue={user.bloodGroup}
                    disabled={isRestricted}
                  >
                    {Object.values(BloodGroup).map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </Select>
                  <div className="md:col-span-2">
                    <Input
                      label="Current City / Area"
                      name="location"
                      defaultValue={user.location}
                      disabled={isRestricted}
                    />
                  </div>
                  <div className="md:col-span-2 pt-4 flex justify-end">
                    <Button
                      type="submit"
                      isLoading={loading}
                      disabled={isRestricted}
                      className="w-full lg:w-auto px-12 py-5 rounded-2xl shadow-xl shadow-red-100 dark:shadow-red-900/20"
                    >
                      {isRestricted
                        ? "Profile Locked by Admin"
                        : "Synchronize Identity"}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {editTab === "image" && (
              <Card className="p-5 border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] animate-in fade-in transition-colors border border-slate-100 dark:border-slate-800">
                {/* Avatar Upload Section */}
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-3 transition-colors">
                  <ImageIcon size={16} /> Avatar Upload
                </h3>

                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-sm border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group transition-colors">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle
                        size={64}
                        className="text-slate-300 dark:text-slate-600"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={32} />
                    </div>
                  </div>

                  <div className="w-full max-w-sm text-center">
                    <label
                      className={clsx(
                        "block w-full py-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/50 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all",
                        isRestricted && "opacity-50 pointer-events-none",
                      )}
                    >
                      Choose Image from Device
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isRestricted}
                      />
                    </label>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2 mb-4">
                      Supported formats: JPG, PNG. Max size: 2MB.
                    </p>
                  </div>

                  <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 text-center transition-colors">
                      Or Select Avatar Template
                    </h4>
                    {templatesLoading && systemAvatars.length === 0 ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-red-600" size={24} />
                      </div>
                    ) : systemAvatars.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {systemAvatars.map((avatar, idx) => (
                          <button
                            key={avatar.id || idx}
                            onClick={() => handleAvatarTemplateClick(avatar.url)}
                            disabled={imgUploading || isRestricted}
                            className={clsx(
                              "aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 overflow-hidden hover:border-red-500 hover:shadow-md transition-all relative group",
                              avatarPreview === avatar.url
                                ? "border-red-600 ring-2 ring-red-100 dark:ring-red-900/50"
                                : "border-slate-100 dark:border-slate-700",
                            )}
                          >
                            <img
                              src={avatar.url}
                              alt={avatar.name || `Template ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {avatarPreview === avatar.url && (
                              <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                <div className="bg-red-600 text-white rounded-full p-1">
                                  <Check size={12} />
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <p className="text-[8px] text-white font-black uppercase truncate px-2">{avatar.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {AVATAR_TEMPLATES.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAvatarTemplateClick(url)}
                            disabled={imgUploading || isRestricted}
                            className={clsx(
                              "aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 overflow-hidden hover:border-red-500 hover:shadow-md transition-all relative group",
                              avatarPreview === url
                                ? "border-red-600 ring-2 ring-red-100 dark:ring-red-900/50"
                                : "border-slate-100 dark:border-slate-700",
                            )}
                          >
                            <img
                              src={url}
                              alt={`Template ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {avatarPreview === url && (
                              <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                <div className="bg-red-600 text-white rounded-full p-1">
                                  <Check size={12} />
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Upload Section */}
                <div className="pt-4 border-t-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-3 transition-colors">
                    <Wallpaper size={16} /> Cover Upload
                  </h3>

                  <div className="flex flex-col gap-4">
                    <div className="w-full h-32 bg-slate-50 dark:bg-slate-800 rounded-sm border-4 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden relative group transition-colors">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 opacity-20 dark:opacity-40"></div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={32} />
                      </div>
                    </div>

                    <div className="w-full max-w-sm mx-auto text-center">
                      <label
                        className={clsx(
                          "block w-full py-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/50 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-all",
                          isRestricted && "opacity-50 pointer-events-none",
                        )}
                      >
                        Upload Cover Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverSelect}
                          className="hidden"
                          disabled={isRestricted}
                        />
                      </label>
                    </div>

                    <div className="w-full pt-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 text-center transition-colors">
                        Blood Related Templates
                      </h4>
                      {templatesLoading && systemCovers.length === 0 ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="animate-spin text-red-600" size={24} />
                        </div>
                      ) : systemCovers.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {systemCovers.map((cover, idx) => (
                            <button
                              key={cover.id || idx}
                              onClick={() => handleCoverTemplateClick(cover.url)}
                              disabled={imgUploading || isRestricted}
                              className={clsx(
                                "h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 overflow-hidden hover:border-red-500 hover:shadow-md transition-all relative group",
                                coverPreview === cover.url
                                  ? "border-red-600 ring-2 ring-red-100 dark:ring-red-900/50"
                                  : "border-slate-100 dark:border-slate-700",
                              )}
                            >
                              <img
                                src={cover.url}
                                alt={cover.name || `Cover Template ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {coverPreview === cover.url && (
                                <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                  <div className="bg-red-600 text-white rounded-full p-1">
                                    <Check size={12} />
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <p className="text-[8px] text-white font-black uppercase truncate px-2">{cover.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {COVER_TEMPLATES.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCoverTemplateClick(url)}
                              disabled={imgUploading || isRestricted}
                              className={clsx(
                                "h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 overflow-hidden hover:border-red-500 hover:shadow-md transition-all relative group",
                                coverPreview === url
                                  ? "border-red-600 ring-2 ring-red-100 dark:ring-red-900/50"
                                  : "border-slate-100 dark:border-slate-700",
                              )}
                            >
                              <img
                                src={url}
                                alt={`Cover Template ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {coverPreview === url && (
                                <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                  <div className="bg-red-600 text-white rounded-full p-1">
                                    <Check size={12} />
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {editTab === "social" && (
              <Card className="p-5 border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] animate-in fade-in transition-colors border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-3 transition-colors">
                  <LinkIcon size={16} /> Social Media Profiles
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    const formData = new FormData(e.currentTarget);
                    const socialLinks: { [key: string]: string } = {};
                    ["facebook", "twitter", "instagram", "linkedin", "youtube", "github", "whatsapp", "telegram"].forEach(p => {
                      const val = formData.get(p) as string;
                      if (val) socialLinks[p] = val;
                    });
                    try {
                      const updatedUser = await updateUserProfile(user.id, { socialLinks }, user);
                      updateUser(updatedUser);
                      showToast("Social links synchronized.");
                    } catch (err) {
                      showToast("Failed to update links.", "error");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input 
                      label="Facebook URL" 
                      name="facebook" 
                      defaultValue={user.socialLinks?.facebook || ""} 
                      placeholder="https://facebook.com/username"
                    />
                    <Input 
                      label="Twitter (X) URL" 
                      name="twitter" 
                      defaultValue={user.socialLinks?.twitter || ""} 
                      placeholder="https://twitter.com/username"
                    />
                    <Input 
                      label="Instagram URL" 
                      name="instagram" 
                      defaultValue={user.socialLinks?.instagram || ""} 
                      placeholder="https://instagram.com/username"
                    />
                    <Input 
                      label="LinkedIn URL" 
                      name="linkedin" 
                      defaultValue={user.socialLinks?.linkedin || ""} 
                      placeholder="https://linkedin.com/in/username"
                    />
                    <Input 
                      label="YouTube URL" 
                      name="youtube" 
                      defaultValue={user.socialLinks?.youtube || ""} 
                      placeholder="https://youtube.com/@channel"
                    />
                    <Input 
                      label="GitHub URL" 
                      name="github" 
                      defaultValue={user.socialLinks?.github || ""} 
                      placeholder="https://github.com/username"
                    />
                    <Input 
                      label="WhatsApp Number/Link" 
                      name="whatsapp" 
                      defaultValue={user.socialLinks?.whatsapp || ""} 
                      placeholder="https://wa.me/8801xxxxxxxxx"
                    />
                    <Input 
                      label="Telegram URL" 
                      name="telegram" 
                      defaultValue={user.socialLinks?.telegram || ""} 
                      placeholder="https://t.me/username"
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      isLoading={loading}
                      className="w-full lg:w-auto px-12 py-5 rounded-2xl shadow-xl shadow-red-100 dark:shadow-red-900/20"
                    >
                      Save Social Links
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {editTab === "password" && (
              <Card className="p-5 border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] animate-in fade-in transition-colors border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-3 transition-colors">
                  <Lock size={16} /> Security Center Layout
                </h3>
                <form
                  onSubmit={handlePasswordChange}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <Input
                    label="Current PIN"
                    name="currentPassword"
                    type="password"
                    required
                    className="dark:bg-slate-800"
                  />
                  <Input
                    label="New PIN"
                    name="newPassword"
                    type="password"
                    required
                    className="dark:bg-slate-800"
                  />
                  <Input
                    label="Confirm PIN"
                    name="confirmPassword"
                    type="password"
                    required
                    className="dark:bg-slate-800"
                  />
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full py-4 rounded-2xl shadow-xl dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                      isLoading={pwdLoading}
                    >
                      Update Credentials
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg aspect-square bg-slate-800 rounded-sm overflow-hidden shadow-2xl border-4 border-white/10">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={cropType === "cover" ? 3 : 1}
              cropShape={cropType === "avatar" ? "round" : "rect"}
              showGrid={true}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <Card className="w-full max-w-lg mt-8 p-8 space-y-6 bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-sm">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest px-1">
                <span>Adjust Frame</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSaveCroppedImage}
                isLoading={imgUploading}
                className="flex-1 py-4 rounded-2xl shadow-xl bg-red-600"
              >
                <Upload size={18} className="mr-2" /> Crop & Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImageToCrop(null);
                  setCropType(null);
                }}
                className="flex-1 py-4 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-2xl"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
          <div className="max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col items-center gap-6">
            <IDCardFrame user={user} ref={cardRef} />
            <div className="flex gap-4 w-full">
              <Button
                onClick={downloadIDCard}
                className="flex-1 rounded-2xl py-4 shadow-2xl"
              >
                <Download size={18} className="mr-2" /> Download JPG
              </Button>
              <Button
                onClick={() => setShowCardModal(false)}
                variant="outline"
                className="flex-1 bg-white dark:bg-slate-800 rounded-2xl py-4 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          aside, header, button, .no-print, .space-y-8 > *:not(.id-card-container) { display: none !important; }
          body, main { background: white !important; padding: 0 !important; margin: 0 !important; }
          .id-card-container { margin: 0 auto !important; box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `,
        }}
      />
    </div>
  );
};
