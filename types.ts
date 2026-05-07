
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER'
}

export enum NoticeType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  WEB = 'WEB'
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-'
}

export enum DonationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum FeedbackStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum HelpStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  REJECTED = 'REJECTED'
}

export enum BloodRequestStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export interface BloodRequestAcceptor {
  userId: string;
  name: string;
  phone: string;
  timestamp: number;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  bloodGroup: string;
  location: string;
  details?: string;
  timestamp: number;
  status: BloodRequestStatus;
  acceptedBy: BloodRequestAcceptor[];
  confirmedUserId?: string;
}

export interface NavLink {
  label: string;
  path: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  isVisible: boolean;
  timestamp: string;
}

export interface Notice {
  id: string;
  subject: string;
  details: string; 
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorApprovedBadge?: string;
  authorRole?: string;
  timestamp: string;
  type: NoticeType;
  pinned?: boolean;
  mentions?: string[];
}

export interface HelpRequest {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: HelpStatus;
  remark?: string;
  timestamp: string;
}

export interface SocialMediaLink {
  id: string;
  name: string;
  url: string;
  icon: string; // lucide-react icon name
  status: 'active' | 'inactive';
  type?: 'Group' | 'Page' | 'Channel';
}

export interface SocialMediaConfig {
  links: SocialMediaLink[];
}

export interface LandingPageConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonPrimary: string;
  heroButtonSecondary: string;
  statsSectionTitle: string;
  feedbackSectionTitle: string;
  feedbackSectionSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  
  navbarLinks?: NavLink[];
  footerLinks?: NavLink[];
  footerCopyright?: string;
  footerTagline?: string;
  
  loginHeadline?: string;       
  loginDescription?: string;    
  loginTitle?: string;          
  loginSubtitle?: string;       
  loginButtonLabel?: string;    

  registerHeadline?: string;    
  registerDescription?: string; 
  registerTitle?: string;       
  registerSubtitle?: string;    
  registerButtonLabel?: string; 

  resetHeadline?: string;
  resetDescription?: string;
  resetTitle?: string;
  resetSubtitle?: string;
  resetButtonLabel?: string;

  sentHeadline?: string;
  sentDescription?: string;
  sentTitle?: string;
  sentSubtitle?: string;
  sentButtonLabel?: string;
  sentGoToLoginLabel?: string;
  sentTryAgainLabel?: string;

  // Lock Modal Customization
  lockSubtitle?: string;
  lockButtonLabel?: string;
  lockFooterText?: string;

  softwareVersion?: string;

  // Privacy Policy Customization
  privacyTitle?: string;
  privacyEffectiveDate?: string;
  privacySection1Title?: string;
  privacySection1TitleBn?: string;
  privacySection1Content?: string;
  privacySection2Title?: string;
  privacySection2TitleBn?: string;
  privacySection2Content?: string;
  privacySection3Title?: string;
  privacySection3TitleBn?: string;
  privacySection3Content?: string;
  privacySection4Title?: string;
  privacySection4TitleBn?: string;
  privacySection4Content?: string;
  privacySection5Title?: string;
  privacySection5TitleBn?: string;
  privacySection5Content?: string;
  privacyContactTitle?: string;
  privacyContactSubtitle?: string;
  privacyContactEmail?: string;

  loginStyles?: any;
  signupStyles?: any;

  // Something Went Wrong Page Customization
  errorTitle?: string;
  errorSubtitle?: string;
  errorMessage?: string;
  errorTryAgainLabel?: string;
  errorHomeLabel?: string;
  errorFooterText?: string;

  // Badge Settings
  badgeDiamondName?: string;
  badgeDiamondColor?: string;
  badgePlatinumName?: string;
  badgePlatinumColor?: string;
  badgeGoldName?: string;
  badgeGoldColor?: string;
  badgeSilverName?: string;
  badgeSilverColor?: string;
  dashboardFooterContent?: string;
}

export interface CustomRankBadge {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  icon: string; // name of icon
  pointsRequired: number;
  color: string; // e.g. 'text-amber-500'
}

export interface BadgeConfig {
  diamond: { name: string; color: string };
  platinum: { name: string; color: string };
  gold: { name: string; color: string };
  silver: { name: string; color: string };
  
  // Advanced Badge Settings
  customRanks?: CustomRankBadge[];
  verificationBadgeColor?: string; // default to text-cyan-500
  roleBadgeColors?: {
    superadmin?: string;
    admin?: string;
    editor?: string;
  };
}

export interface User {
  id: string;
  idNumber?: string;
  name: string;
  email: string;
  role: UserRole;
  bloodGroup: BloodGroup;
  location: string;
  phone: string;
  lastDonationDate?: string;
  avatar?: string;
  coverImage?: string;
  password?: string;
  hasDirectoryAccess?: boolean;
  directoryAccessRequested?: boolean;
  hasSupportAccess?: boolean;
  supportAccessRequested?: boolean;
  hasFeedbackAccess?: boolean;
  feedbackAccessRequested?: boolean;
  hasIDCardAccess?: boolean;
  idCardAccessRequested?: boolean;
  hasRequestedDonorAccess?: boolean;
  requestedDonorAccessRequested?: boolean;
  hasDonationFoundAccess?: boolean;
  donationFoundAccessRequested?: boolean;
  menuAccessRequests?: { [key: string]: boolean };
  isSuspended?: boolean;
  permissions?: RolePermissions;
  approvedBadge?: 'pink' | 'red' | 'green' | 'blue';
  socialLinks?: { [key: string]: string };
}

export interface DonationRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userBloodGroup: BloodGroup;
  donationDate: string;
  location: string;
  units: number;
  status: DonationStatus;
  notes?: string;
}

export interface DonationFeedback {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userApprovedBadge?: string;
  message: string;
  status: FeedbackStatus;
  isVisible: boolean;
  timestamp: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'BADGE_APPROVED' | 'RANK_UPDATED' | 'GENERAL';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId?: string;
  roomId: string;
  text: string;
  timestamp: string;
  isAdminReply?: boolean;
  read?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userAvatar?: string; 
  timestamp: string;
  details: string;
}

export interface RolePermissions {
  sidebar: {
    dashboard: boolean;
    profile: boolean;
    history: boolean;
    donors: boolean;
    users?: boolean;
    manageDonations?: boolean;
    logs?: boolean;
    rolePermissions?: boolean;
    supportCenter?: boolean;
    badgeManage?: boolean;
    feedback?: boolean;
    approveFeedback?: boolean;
    landingSettings?: boolean;
    myNotice?: boolean;
    boardNotices?: boolean;
    summary?: boolean;
    notifications?: boolean;
    adminVerify?: boolean;
    verificationHistory?: boolean;
    teamIdCards?: boolean;
    deletedUsers?: boolean;
    helpCenterManage?: boolean;
    moderateFaqs?: boolean;
    serverStatus?: boolean;
    requestedDonor?: boolean;
    donationFound?: boolean;
    foundManage?: boolean;
    foundExpenses?: boolean;
    foundSummary?: boolean;
    avatarManage?: boolean;
  };
  lockedMenus?: {
    dashboard?: boolean;
    profile?: boolean;
    history?: boolean;
    donors?: boolean;
    users?: boolean;
    manageDonations?: boolean;
    logs?: boolean;
    rolePermissions?: boolean;
    supportCenter?: boolean;
    badgeManage?: boolean;
    feedback?: boolean;
    approveFeedback?: boolean;
    landingSettings?: boolean;
    myNotice?: boolean;
    boardNotices?: boolean;
    summary?: boolean;
    notifications?: boolean;
    adminVerify?: boolean;
    verificationHistory?: boolean;
    teamIdCards?: boolean;
    deletedUsers?: boolean;
    helpCenterManage?: boolean;
    moderateFaqs?: boolean;
    serverStatus?: boolean;
    requestedDonor?: boolean;
    donationFound?: boolean;
    foundManage?: boolean;
    foundExpenses?: boolean;
    foundSummary?: boolean;
    avatarManage?: boolean;
  };
  rules: {
    canEditProfile: boolean;
    canViewDonorDirectory: boolean;
    canRequestDonation: boolean;
    canPerformAction?: boolean;
    canLogDonation?: boolean;
    canLogDonationForOthers?: boolean;
    canUseMessenger?: boolean;
    canUseSystemSupport?: boolean;
    canPostNotice?: boolean;
    canAssignVerificationBadge?: boolean;
  };
}

export interface AppPermissions {
  user: RolePermissions;
  editor: RolePermissions;
  admin: RolePermissions;
  superadmin?: RolePermissions;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  impersonatingAdmin?: User | null;
}

export interface RevokedPermission {
  id: string;
  userId: string;
  type: 'DIRECTORY' | 'SUPPORT' | 'FEEDBACK';
  revokedAt?: string;
  revokedBy?: string;
}

export enum FundingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface FundingContribution {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  purpose: string;
  status: FundingStatus;
  timestamp: string;
  adminRemark?: string;
}

export interface FundExpense {
  id: string;
  purpose: string;
  amount: number;
  date: string; // ISO string
  notes?: string;
  addedBy: {
    uid: string;
    name: string;
    phone?: string;
  };
  createdAt: number;
}

export interface FundingConfig {
  isEnabled: boolean;
  goalAmount: number;
  currentAmount: number;
  totalExpense?: number;
  title: string;
  description: string;
  paymentInfo?: string;
}
