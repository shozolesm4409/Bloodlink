
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  addDoc, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  deleteField,
  arrayUnion
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { db, auth } from "./firebase";
import { 
  User, 
  UserRole, 
  DonationRecord, 
  DonationFeedback, 
  Notice, 
  HelpRequest, 
  LandingPageConfig, 
  AuditLog, 
  ChatMessage, 
  AppPermissions,
  FAQ,
  DonationStatus,
  FeedbackStatus,
  HelpStatus,
  NoticeType,
  RolePermissions,
  RevokedPermission,
  BloodRequest,
  BadgeConfig,
  UserNotification,
  SocialMediaConfig
} from "../types";

export const ADMIN_EMAIL = "shozolesm4409@gmail.com";
export { db, auth };

// Collections matching firestore.rules
const COLLECTIONS = {
  USERS: 'users',
  DONATIONS: 'donations',
  FEEDBACKS: 'feedbacks',
  NOTICES: 'notices',
  HELP_REQUESTS: 'help_requests',
  LOGS: 'logs',
  MESSAGES: 'messages',      // Changed from 'chats' to match rules
  SETTINGS: 'settings',      // Changed from 'config' to match rules
  VERIFICATION_LOGS: 'verification_logs',
  FAQS: 'faqs',
  BLOOD_REQUESTS: 'blood_requests',
  DELETED_USERS: 'deleted_users', // Changed from 'archived_users'
  SOCIAL_MEDIA: 'social_media',
  DELETED_DONATIONS: 'deleted_donations',
  DELETED_LOGS: 'deleted_logs',
  DELETED_FEEDBACKS: 'deleted_feedbacks',
  DELETED_NOTICES: 'deleted_notices',
  DELETED_HELP_REQUESTS: 'deleted_help_requests',
  DELETED_VERIFICATION_LOGS: 'deleted_verification_logs',
  REVOKED_PERMISSIONS: 'revoked_permissions',
  USER_NOTIFICATIONS: 'user_notifications'
};

// --- Helpers ---
const createLog = async (action: string, userId: string, userName: string, details: string) => {
  try {
    await addDoc(collection(db, COLLECTIONS.LOGS), {
      action,
      userId,
      userName,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to create log:", e);
  }
};

// --- Auth Services ---

export const login = async (email: string, pass: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return await getUserProfile(userCredential.user.uid);
};

export const register = async (data: any): Promise<User> => {
  // Check if email already exists in Firestore
  const emailQuery = query(collection(db, COLLECTIONS.USERS), where("email", "==", data.email));
  const emailSnap = await getDocs(emailQuery);
  if (!emailSnap.empty) {
    throw new Error("এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
  }

  // Check if phone already exists in Firestore
  const phoneQuery = query(collection(db, COLLECTIONS.USERS), where("phone", "==", data.phone));
  const phoneSnap = await getDocs(phoneQuery);
  if (!phoneSnap.empty) {
    throw new Error("এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
  }

  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  
  // Calculate next sequential ID
  let nextId = "BL-361013"; // Default starting point
  try {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const users = usersSnap.docs.map(doc => doc.data() as User);
    let maxNum = 361012;
    users.forEach(u => {
      if (u.idNumber && u.idNumber.startsWith('BL-')) {
        const num = parseInt(u.idNumber.replace('BL-', ''));
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    nextId = `BL-${maxNum + 1}`;
  } catch (e) {
    console.warn("Could not determine next sequential ID, using fallback", e);
  }

  const newUser: User = {
    id: userCredential.user.uid,
    name: data.name,
    email: data.email,
    role: UserRole.USER,
    bloodGroup: data.bloodGroup,
    location: data.location,
    phone: data.phone,
    idNumber: nextId,
    avatar: data.avatar || '',
    hasDirectoryAccess: false,
    directoryAccessRequested: false,
    hasSupportAccess: false,
    supportAccessRequested: false,
    hasFeedbackAccess: false,
    feedbackAccessRequested: false,
    hasIDCardAccess: false,
    idCardAccessRequested: false,
    hasRequestedDonorAccess: false,
    requestedDonorAccessRequested: false,
  };
  await setDoc(doc(db, COLLECTIONS.USERS, newUser.id), newUser);
  await createLog('REGISTER', newUser.id, newUser.name, `New user registered with sequential ID ${nextId}`);
  return newUser;
};

export const logoutUser = async (user: User | null) => {
  if (user) {
    // Optional: Log logout
  }
  await signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<User> => {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as User;
  }
  throw new Error("User profile not found");
};

export const initiatePasswordResetLink = async (email: string) => {
  // Check if email exists in our records first
  const q = query(collection(db, COLLECTIONS.USERS), where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("ভুল ইমেইল দিয়েছেন? আবার চেষ্টা করুন");
  }
  await sendPasswordResetEmail(auth, email);
};

export const changePassword = async (userId: string, userName: string, current: string, newPass: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const cred = EmailAuthProvider.credential(user.email!, current);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPass);
  await createLog('PASSWORD_CHANGE', userId, userName, 'User changed password');
};

// --- User Management ---

export const getUsers = async (): Promise<User[]> => {
  const q = query(collection(db, COLLECTIONS.USERS));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  const ref = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(ref, data);
};

export const updateUserProfile = async (userId: string, data: Partial<User>, modifier: User): Promise<User> => {
  const ref = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(ref, data);
  
  const updatedSnap = await getDoc(ref);
  const updatedUser = { ...updatedSnap.data(), id: updatedSnap.id } as User;
  
  await createLog('PROFILE_UPDATE', modifier.id, modifier.name, `Updated profile for ${updatedUser.name}`);
  return updatedUser;
};

export const deleteUserRecord = async (userId: string, admin: User) => {
  const ref = doc(db, COLLECTIONS.USERS, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const userData = snap.data();
    await addDoc(collection(db, COLLECTIONS.DELETED_USERS), {
      ...userData,
      deletedAt: new Date().toISOString(),
      deletedBy: admin.name
    });
    await deleteDoc(ref);
    await createLog('USER_ARCHIVE', admin.id, admin.name, `Archived user ${userData.name}`);
  }
};

export const getDeletedUsers = async () => {
  const q = query(collection(db, COLLECTIONS.DELETED_USERS), orderBy('deletedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const restoreDeletedUser = async (id: string, admin: User) => {
  const archiveRef = doc(db, COLLECTIONS.DELETED_USERS, id);
  const snap = await getDoc(archiveRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...userData } = snap.data();
    await setDoc(doc(db, COLLECTIONS.USERS, userData.id), userData);
    await deleteDoc(archiveRef);
    await createLog('USER_RESTORE', admin.id, admin.name, `Restored user ${userData.name}`);
  }
};

export const permanentlyDeleteArchivedUser = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_USERS, id));
  await createLog('USER_PURGE', user.id, user.name, 'Permanently deleted archived user');
};

export const toggleUserSuspension = async (userId: string, suspend: boolean, admin: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), { isSuspended: suspend });
  await createLog('USER_SUSPENSION', admin.id, admin.name, `${suspend ? 'Suspended' : 'Unsuspended'} user ${userId}`);
};

export const adminForceChangePassword = async (userId: string, newPass: string, admin: User) => {
  console.warn("Client-side admin password reset is restricted by Firebase security rules.");
  await createLog('ADMIN_PWD_RESET_ATTEMPT', admin.id, admin.name, `Attempted password reset for ${userId}`);
  throw new Error("Password reset requires backend administration access.");
};

export const generateUserId = async (userId: string, admin: User) => {
  try {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const users = usersSnap.docs.map(doc => doc.data() as User);
    
    // Collect all existing numerical IDs starting with BL-
    const existingNums = new Set<number>();
    users.forEach(u => {
      if (u.idNumber && typeof u.idNumber === 'string' && u.idNumber.startsWith('BL-')) {
        const numPart = u.idNumber.replace('BL-', '').trim();
        const num = parseInt(numPart);
        if (!isNaN(num)) {
          existingNums.add(num);
        }
      }
    });

    // Find the first available ID starting from 361013
    let nextIdNum = 361013;
    while (existingNums.has(nextIdNum)) {
      nextIdNum++;
    }

    const idNum = `BL-${nextIdNum}`;
    
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), { idNumber: idNum });
    await createLog('ID_GENERATED', admin.id, admin.name, `Generated sequential ID ${idNum} for ${userId}`);
    return idNum;
  } catch (error) {
    console.error("ID Generation failed:", error);
    throw error;
  }
};

export const resequenceAllIds = async (admin: User) => {
  try {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const users = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    
    // Sort logic: SuperAdmin first, then by name
    const sorted = [...users].sort((a, b) => {
      if (a.role === UserRole.SUPERADMIN && b.role !== UserRole.SUPERADMIN) return -1;
      if (b.role === UserRole.SUPERADMIN && a.role !== UserRole.SUPERADMIN) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    const batch = writeBatch(db);
    let currentId = 361013;

    for (const u of sorted) {
      const idNum = `BL-${currentId}`;
      const userRef = doc(db, COLLECTIONS.USERS, u.id);
      batch.update(userRef, { idNumber: idNum });
      currentId++;
    }

    await batch.commit();
    await createLog('RESEQUENCE_IDS', admin.id, admin.name, `Resequenced all user IDs starting from BL-361013. Total units: ${sorted.length}`);
  } catch (error) {
    console.error("Resequencing failed in service:", error);
    throw error;
  }
};

// --- Permissions ---

export const getAppPermissions = async (): Promise<AppPermissions> => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'permissions');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as AppPermissions;
  }
  return {
    user: { sidebar: { requestedDonor: true }, rules: { canEditProfile: true, canViewDonorDirectory: false, canRequestDonation: true, canPostNotice: false } } as RolePermissions,
    editor: { sidebar: { requestedDonor: true }, rules: {} } as RolePermissions,
    admin: { sidebar: { requestedDonor: true }, rules: {} } as RolePermissions
  };
};

export const updateAppPermissions = async (perms: AppPermissions, admin: User) => {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, 'permissions'), perms);
  await createLog('PERMISSIONS_UPDATE', admin.id, admin.name, 'Updated global role permissions');
};

const handleAccess = async (userId: string, field: string, accessField: string, approve: boolean, admin: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    [field]: approve,
    [accessField]: false 
  });
  await createLog('ACCESS_UPDATE', admin.id, admin.name, `${approve ? 'Granted' : 'Denied'} ${field} for user ${userId}`);
};

export const requestDirectoryAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { directoryAccessRequested: true });
};
export const handleDirectoryAccess = (uid: string, approve: boolean, admin: User) => handleAccess(uid, 'hasDirectoryAccess', 'directoryAccessRequested', approve, admin);

export const requestSupportAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { supportAccessRequested: true });
};
export const handleSupportAccess = (uid: string, approve: boolean, admin: User) => handleAccess(uid, 'hasSupportAccess', 'supportAccessRequested', approve, admin);

export const requestFeedbackAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { feedbackAccessRequested: true });
};
export const handleFeedbackAccess = (uid: string, approve: boolean, admin: User) => handleAccess(uid, 'hasFeedbackAccess', 'feedbackAccessRequested', approve, admin);

export const requestIDCardAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { idCardAccessRequested: true });
};
export const handleIDCardAccess = (uid: string, approve: boolean, admin: User) => handleAccess(uid, 'hasIDCardAccess', 'idCardAccessRequested', approve, admin);

export const requestRequestedDonorAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { requestedDonorAccessRequested: true });
};
export const handleRequestedDonorAccess = (uid: string, approve: boolean, admin: User) => handleAccess(uid, 'hasRequestedDonorAccess', 'requestedDonorAccessRequested', approve, admin);

// --- Donations ---

export const getDonations = async (): Promise<DonationRecord[]> => {
  const q = query(collection(db, COLLECTIONS.DONATIONS), orderBy('donationDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as DonationRecord));
};

export const getUserDonations = async (userId: string): Promise<DonationRecord[]> => {
  const q = query(collection(db, COLLECTIONS.DONATIONS), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as DonationRecord)).sort((a,b) => b.donationDate.localeCompare(a.donationDate));
};

export const addDonation = async (donation: any, user: User) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.DONATIONS), {
    ...donation,
    status: donation.status || DonationStatus.PENDING,
    timestamp: new Date().toISOString()
  });
  
  if (donation.status === DonationStatus.COMPLETED) {
    await updateDoc(doc(db, COLLECTIONS.USERS, donation.userId), {
      lastDonationDate: donation.donationDate
    });
  }
  
  await createLog('DONATION_ADD', user.id, user.name, `Added donation record`);
  return docRef.id;
};

export const updateDonationStatus = async (id: string, status: DonationStatus, admin: User) => {
  const ref = doc(db, COLLECTIONS.DONATIONS, id);
  await updateDoc(ref, { status });
  
  if (status === DonationStatus.COMPLETED) {
    const snap = await getDoc(ref);
    const data = snap.data();
    if (data) {
      await updateDoc(doc(db, COLLECTIONS.USERS, data.userId), {
        lastDonationDate: data.donationDate
      });
    }
  }
  await createLog('DONATION_UPDATE', admin.id, admin.name, `Updated donation status to ${status}`);
};

export const updateDonation = async (id: string, updates: any, admin: User) => {
  const ref = doc(db, COLLECTIONS.DONATIONS, id);
  await updateDoc(ref, updates);
  await createLog('DONATION_UPDATE', admin.id, admin.name, `Updated donation record ${id}`);
};

export const deleteDonationRecord = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.DONATIONS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await addDoc(collection(db, COLLECTIONS.DELETED_DONATIONS), {
      ...snap.data(),
      deletedAt: new Date().toISOString(),
      deletedBy: user.name
    });
    await deleteDoc(ref);
    await createLog('DONATION_DELETE', user.id, user.name, `Deleted donation record`);
  }
};

export const getDeletedDonations = async () => {
  const q = query(collection(db, COLLECTIONS.DELETED_DONATIONS), orderBy('deletedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const restoreDeletedDonation = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.DELETED_DONATIONS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    await setDoc(doc(db, COLLECTIONS.DONATIONS, data.id || id), data);
    await deleteDoc(ref);
    await createLog('DONATION_RESTORE', user.id, user.name, `Restored donation record`);
  }
};

export const permanentlyDeleteArchivedDonation = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_DONATIONS, id));
  await createLog('DONATION_PURGE', user.id, user.name, 'Permanently deleted archived donation');
};

// --- Feedbacks ---

let cachedFeedbacks: DonationFeedback[] = [];
export const getCachedFeedbacks = () => cachedFeedbacks;

export const getAllFeedbacks = async (): Promise<DonationFeedback[]> => {
  const q = query(collection(db, COLLECTIONS.FEEDBACKS), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as DonationFeedback));
};

export const getFeedbackById = async (id: string): Promise<DonationFeedback | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.FEEDBACKS, id));
  return snap.exists() ? { ...snap.data(), id: snap.id } as DonationFeedback : null;
};

export const getUserFeedbacks = async (userId: string): Promise<DonationFeedback[]> => {
  const q = query(collection(db, COLLECTIONS.FEEDBACKS), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as DonationFeedback));
};

export const subscribeToApprovedFeedbacks = (callback: (data: DonationFeedback[]) => void, onError?: (err: any) => void) => {
  // Sort client-side to avoid composite index error
  const q = query(collection(db, COLLECTIONS.FEEDBACKS), where('status', '==', FeedbackStatus.APPROVED), where('isVisible', '==', true));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({...d.data(), id: d.id} as DonationFeedback)).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    cachedFeedbacks = data;
    callback(data);
  }, onError);
};

export const submitFeedback = async (message: string, user: User) => {
  await addDoc(collection(db, COLLECTIONS.FEEDBACKS), {
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar || '',
    userApprovedBadge: user.approvedBadge || null,
    message,
    status: FeedbackStatus.PENDING,
    isVisible: true,
    timestamp: new Date().toISOString()
  });
};

export const updateFeedbackStatus = async (id: string, status: FeedbackStatus, isVisible: boolean) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDBACKS, id), { status, isVisible });
};

export const updateFeedbackMessage = async (id: string, message: string, admin: User) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDBACKS, id), { message });
  await createLog('FEEDBACK_UPDATE', admin.id, admin.name, 'Edited feedback content');
};

export const toggleFeedbackVisibility = async (id: string, isVisible: boolean) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDBACKS, id), { isVisible });
};

export const deleteFeedback = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.FEEDBACKS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await addDoc(collection(db, COLLECTIONS.DELETED_FEEDBACKS), {
      ...snap.data(),
      deletedAt: new Date().toISOString(),
      deletedBy: user.name
    });
    await deleteDoc(ref);
  }
};

export const getDeletedFeedbacks = async () => {
  const q = query(collection(db, COLLECTIONS.DELETED_FEEDBACKS), orderBy('deletedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const restoreDeletedFeedback = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.DELETED_FEEDBACKS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    await setDoc(doc(db, COLLECTIONS.FEEDBACKS, id), data);
    await deleteDoc(ref);
  }
};

export const permanentlyDeleteArchivedFeedback = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_FEEDBACKS, id));
  await createLog('FEEDBACK_PURGE', user.id, user.name, 'Permanently deleted archived feedback');
};

// --- Notices ---

export const getWebNotices = async (): Promise<Notice[]> => {
  const q = query(collection(db, COLLECTIONS.NOTICES), where('type', '==', NoticeType.WEB));
  const snap = await getDocs(q);
  const notices = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notice));
  
  // Join user data
  try {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const userMap = new Map();
    usersSnap.docs.forEach(d => userMap.set(d.id, d.data()));
    
    return notices.map(n => {
      const u = userMap.get(n.authorId);
      if (u) {
        return {
          ...n,
          authorApprovedBadge: u.approvedBadge || n.authorApprovedBadge,
          authorRole: u.role || n.authorRole
        };
      }
      return n;
    });
  } catch (e) {
    console.error("Failed to map users to notices:", e);
    return notices;
  }
};

export const getNoticeById = async (id: string): Promise<Notice | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.NOTICES, id));
  if (!snap.exists()) return null;
  const notice = { ...snap.data(), id: snap.id } as Notice;
  
  try {
    const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, notice.authorId));
    if (userSnap.exists()) {
      const u = userSnap.data();
      notice.authorApprovedBadge = u.approvedBadge || notice.authorApprovedBadge;
      notice.authorRole = u.role || notice.authorRole;
    }
  } catch (e) {
    console.error("Failed to fetch author data for notice", e);
  }
  
  return notice;
};

export const subscribeToNotices = (callback: (data: Notice[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.NOTICES));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({...d.data(), id: d.id} as Notice)));
  }, onError);
};

export const addNotice = async (notice: any, user: User) => {
  await addDoc(collection(db, COLLECTIONS.NOTICES), notice);
  await createLog('NOTICE_ADD', user.id, user.name, `Posted notice: ${notice.subject}`);
};

export const updateNotice = async (id: string, updates: any, user: User) => {
  await updateDoc(doc(db, COLLECTIONS.NOTICES, id), updates);
  await createLog('NOTICE_UPDATE', user.id, user.name, `Updated notice: ${updates.subject}`);
};

export const deleteNotice = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.NOTICES, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await addDoc(collection(db, COLLECTIONS.DELETED_NOTICES), {
      ...snap.data(),
      deletedAt: new Date().toISOString(),
      deletedBy: user.name
    });
    await deleteDoc(ref);
  }
};

export const getDeletedNotices = async () => {
  const q = query(collection(db, COLLECTIONS.DELETED_NOTICES), orderBy('deletedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const restoreDeletedNotice = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.DELETED_NOTICES, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    await setDoc(doc(db, COLLECTIONS.NOTICES, id), data);
    await deleteDoc(ref);
  }
};

export const permanentlyDeleteArchivedNotice = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_NOTICES, id));
  await createLog('NOTICE_PURGE', user.id, user.name, 'Permanently deleted archived notice');
};

// --- Support / Chat ---

export const sendMessage = async (msg: any) => {
  await addDoc(collection(db, COLLECTIONS.MESSAGES), {
    ...msg,
    timestamp: new Date().toISOString(),
    read: false
  });
};

export const subscribeToRoomMessages = (roomId: string, callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), where('roomId', '==', roomId), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({...d.data(), id: d.id} as ChatMessage)));
  }, onError);
};

export const subscribeToAllSupportRooms = (callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({...d.data(), id: d.id} as ChatMessage)));
  }, onError);
};

export const subscribeToAllIncomingMessages = (userId: string, callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), where('receiverId', 'in', [userId, 'SYSTEM']), where('read', '==', false));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({...d.data(), id: d.id} as ChatMessage)));
  }, onError);
};

export const markMessagesAsRead = async (roomId: string, userId: string) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), where('roomId', '==', roomId), where('receiverId', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });
  await batch.commit();
};

// --- Help Center ---

export const submitHelpRequest = async (data: any) => {
  await addDoc(collection(db, COLLECTIONS.HELP_REQUESTS), {
    ...data,
    status: HelpStatus.PENDING,
    timestamp: new Date().toISOString()
  });
};

export const getHelpRequests = async (): Promise<HelpRequest[]> => {
  const q = query(collection(db, COLLECTIONS.HELP_REQUESTS), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as HelpRequest));
};

export const getUserHelpRequests = async (userId: string): Promise<HelpRequest[]> => {
  const q = query(collection(db, COLLECTIONS.HELP_REQUESTS), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as HelpRequest)).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
};

export const getHelpRequestsByPhone = async (phone: string): Promise<HelpRequest[]> => {
  const q = query(collection(db, COLLECTIONS.HELP_REQUESTS), where('phone', '==', phone));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as HelpRequest)).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
};

export const updateHelpRequest = async (id: string, updates: any, user: User) => {
  await updateDoc(doc(db, COLLECTIONS.HELP_REQUESTS, id), updates);
  await createLog('HELP_UPDATE', user.id, user.name, `Updated help request ${id}`);
};

export const deleteHelpRequest = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.HELP_REQUESTS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await addDoc(collection(db, COLLECTIONS.DELETED_HELP_REQUESTS), {
      ...snap.data(),
      deletedAt: new Date().toISOString(),
      deletedBy: user.name
    });
    await deleteDoc(ref);
  }
};

export const getDeletedHelpRequests = async () => {
  const q = query(collection(db, COLLECTIONS.DELETED_HELP_REQUESTS), orderBy('deletedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const restoreDeletedHelpRequest = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.DELETED_HELP_REQUESTS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    await setDoc(doc(db, COLLECTIONS.HELP_REQUESTS, id), data);
    await deleteDoc(ref);
  }
};

export const permanentlyDeleteArchivedHelpRequest = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_HELP_REQUESTS, id));
  await createLog('HELP_PURGE', user.id, user.name, 'Permanently deleted archived help request');
};

// --- Logs & Verification ---

export const getLogs = async (): Promise<AuditLog[]> => {
  const q = query(collection(db, COLLECTIONS.LOGS), orderBy('timestamp', 'desc'), limit(1000));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as AuditLog));
};

export const deleteLogEntry = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.LOGS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await addDoc(collection(db, COLLECTIONS.DELETED_LOGS), {
      ...snap.data(),
      deletedAt: new Date().toISOString(),
      deletedBy: user.name
    });
    await deleteDoc(ref);
  }
};

export const getDeletedLogs = async () => {
  const q = query(collection(db, COLLECTIONS.DELETED_LOGS), orderBy('deletedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const restoreDeletedLog = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.DELETED_LOGS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    await setDoc(doc(db, COLLECTIONS.LOGS, id), data);
    await deleteDoc(ref);
  }
};

export const permanentlyDeleteArchivedLog = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_LOGS, id));
  await createLog('LOG_PURGE', user.id, user.name, 'Permanently deleted archived log');
};

export const logVerificationCheck = async (memberId: string, memberName: string, bloodGroup: string) => {
  await addDoc(collection(db, COLLECTIONS.VERIFICATION_LOGS), {
    memberId, memberName, bloodGroup, timestamp: new Date().toISOString()
  });
};

export const getVerificationLogs = async () => {
  const q = query(collection(db, COLLECTIONS.VERIFICATION_LOGS), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const archiveVerificationLog = async (id: string) => {
  const ref = doc(db, COLLECTIONS.VERIFICATION_LOGS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await addDoc(collection(db, COLLECTIONS.DELETED_VERIFICATION_LOGS), {
      ...snap.data(),
      deletedAt: new Date().toISOString(),
      deletedBy: 'System' // Or get from context if available, but for now system
    });
    await deleteDoc(ref);
  }
};

export const addUserNotification = async (notif: Omit<UserNotification, 'id' | 'timestamp' | 'read'>) => {
  await addDoc(collection(db, COLLECTIONS.USER_NOTIFICATIONS), {
    ...notif,
    timestamp: new Date().toISOString(),
    read: false
  });
};

export const subscribeToUserNotifications = (userId: string, callback: (data: UserNotification[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.USER_NOTIFICATIONS), where("userId", "==", userId));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as UserNotification));
    data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(data);
  }, onError);
};

export const getDeletedVerificationLogs = async () => {
  const q = query(collection(db, COLLECTIONS.DELETED_VERIFICATION_LOGS), orderBy('deletedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export const restoreDeletedVerificationLog = async (id: string, user: User) => {
  const ref = doc(db, COLLECTIONS.DELETED_VERIFICATION_LOGS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    await setDoc(doc(db, COLLECTIONS.VERIFICATION_LOGS, id), data);
    await deleteDoc(ref);
    await createLog('VERIFICATION_RESTORE', user.id, user.name, `Restored verification log ${id}`);
  }
};

export const permanentlyDeleteArchivedVerificationLog = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_VERIFICATION_LOGS, id));
  await createLog('VERIFICATION_PURGE', user.id, user.name, 'Permanently deleted archived verification log');
};

export const purgeAllArchivedVerificationLogs = async (user: User) => {
  const snap = await getDocs(collection(db, COLLECTIONS.DELETED_VERIFICATION_LOGS));
  const batch = writeBatch(db);
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  await createLog('VERIFICATION_PURGE_ALL', user.id, user.name, 'Permanently deleted all archived verification logs');
};

// --- FAQs ---

export const getPublicFaqs = async (): Promise<FAQ[]> => {
  // Sort client-side to avoid composite index requirement
  const q = query(collection(db, COLLECTIONS.FAQS), where('isVisible', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as FAQ))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

export const getAllFaqs = async (): Promise<FAQ[]> => {
  const q = query(collection(db, COLLECTIONS.FAQS));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as FAQ));
};

export const addFaq = async (data: any, user: User) => {
  await addDoc(collection(db, COLLECTIONS.FAQS), { ...data, isVisible: true, timestamp: new Date().toISOString() });
  await createLog('FAQ_ADD', user.id, user.name, 'Added new FAQ');
};

export const updateFaq = async (id: string, data: any, user: User) => {
  await updateDoc(doc(db, COLLECTIONS.FAQS, id), data);
};

export const deleteFaq = async (id: string, user: User) => {
  await deleteDoc(doc(db, COLLECTIONS.FAQS, id));
  await createLog('FAQ_DELETE', user.id, user.name, 'Deleted FAQ');
};

export const toggleFaqVisibility = async (id: string, isVisible: boolean) => {
  await updateDoc(doc(db, COLLECTIONS.FAQS, id), { isVisible });
};

// --- Config ---

export const getLandingConfig = async (): Promise<LandingPageConfig | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'landing'));
  return snap.exists() ? snap.data() as LandingPageConfig : null;
};

export const updateLandingConfig = async (config: LandingPageConfig, user: User) => {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, 'landing'), config);
  await createLog('CONFIG_UPDATE', user.id, user.name, 'Updated landing page configuration');
};

export const getBadgeConfig = async (): Promise<BadgeConfig | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'badges'));
  if (snap.exists()) {
    return snap.data() as BadgeConfig;
  }
  return null;
};

export const updateBadgeConfig = async (config: BadgeConfig, user: User) => {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, 'badges'), config);
  await createLog('BADGE_CONFIG_UPDATE', user.id, user.name, 'Updated badge configuration metrics');
};

export const getSocialMediaConfig = async (): Promise<SocialMediaConfig | null> => {
   const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'social_media'));
   return snap.exists() ? snap.data() as SocialMediaConfig : { links: [] };
};

export const updateSocialMediaConfig = async (config: SocialMediaConfig, user: User) => {
   await setDoc(doc(db, COLLECTIONS.SETTINGS, 'social_media'), config);
   await createLog('SOCIAL_MEDIA_UPDATE', user.id, user.name, 'Updated social media configuration');
};

export const purgeAllArchivedUsers = async (admin: User) => {
  const q = query(collection(db, COLLECTIONS.DELETED_USERS));
  const snap = await getDocs(q);
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await createLog('ARCHIVE_PURGE_ALL', admin.id, admin.name, 'Purged all archived users');
};

export const purgeAllArchivedDonations = async (admin: User) => {
  const q = query(collection(db, COLLECTIONS.DELETED_DONATIONS));
  const snap = await getDocs(q);
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await createLog('ARCHIVE_PURGE_ALL', admin.id, admin.name, 'Purged all archived donations');
};

export const purgeAllArchivedFeedbacks = async (admin: User) => {
  const q = query(collection(db, COLLECTIONS.DELETED_FEEDBACKS));
  const snap = await getDocs(q);
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await createLog('ARCHIVE_PURGE_ALL', admin.id, admin.name, 'Purged all archived feedbacks');
};

export const purgeAllArchivedNotices = async (admin: User) => {
  const q = query(collection(db, COLLECTIONS.DELETED_NOTICES));
  const snap = await getDocs(q);
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await createLog('ARCHIVE_PURGE_ALL', admin.id, admin.name, 'Purged all archived notices');
};

export const purgeAllArchivedHelpRequests = async (admin: User) => {
  const q = query(collection(db, COLLECTIONS.DELETED_HELP_REQUESTS));
  const snap = await getDocs(q);
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await createLog('ARCHIVE_PURGE_ALL', admin.id, admin.name, 'Purged all archived help requests');
};

export const purgeAllArchivedLogs = async (admin: User) => {
  const q = query(collection(db, COLLECTIONS.DELETED_LOGS));
  const snap = await getDocs(q);
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await createLog('ARCHIVE_PURGE_ALL', admin.id, admin.name, 'Purged all archived audit logs');
};

export const purgeAllLogs = async (admin: User, actionCodes?: string[]) => {
  let allDocs: any[] = [];
  
  if (actionCodes && actionCodes.length > 0) {
    // Firestore 'in' limit is 30
    for (let i = 0; i < actionCodes.length; i += 30) {
      const chunk = actionCodes.slice(i, i + 30);
      const q = query(collection(db, COLLECTIONS.LOGS), where("action", "in", chunk));
      const snap = await getDocs(q);
      allDocs = [...allDocs, ...snap.docs];
    }
  } else {
    const q = query(collection(db, COLLECTIONS.LOGS));
    const snap = await getDocs(q);
    allDocs = snap.docs;
  }

  // Firestore batch limit is 500 (each write counts as 1, so set+delete = 2 ops per doc, limit 250 docs per batch)
  for (let i = 0; i < allDocs.length; i += 250) {
    const batch = writeBatch(db);
    const chunk = allDocs.slice(i, i + 250);
    chunk.forEach(d => {
      const archiveRef = doc(collection(db, COLLECTIONS.DELETED_LOGS));
      batch.set(archiveRef, {
        ...d.data(),
        deletedAt: new Date().toISOString(),
        deletedBy: admin.name
      });
      batch.delete(d.ref);
    });
    await batch.commit();
  }
  
  await createLog('LOGS_ARCHIVE_FILTERED', admin.id, admin.name, `Archived audit logs with actions: ${actionCodes?.join(', ') || 'ALL'}`);
};

// --- Blood Requests ---

export const getBloodRequests = async (): Promise<BloodRequest[]> => {
  const q = query(collection(db, COLLECTIONS.BLOOD_REQUESTS), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as BloodRequest));
};

export const subscribeToBloodRequests = (callback: (data: BloodRequest[]) => void) => {
  const q = query(collection(db, COLLECTIONS.BLOOD_REQUESTS), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as BloodRequest)));
  });
};

export const createBloodRequest = async (requestData: Partial<BloodRequest>, user: User) => {
  const newRequest = {
    ...requestData,
    requesterId: user.id,
    requesterName: user.name,
    status: 'OPEN',
    timestamp: Date.now(),
    acceptedBy: []
  };
  await addDoc(collection(db, COLLECTIONS.BLOOD_REQUESTS), newRequest);
  await createLog('CREATE_BLOOD_REQUEST', user.id, user.name, `Created blood request for ${requestData.bloodGroup} at ${requestData.location}`);
};

export const acceptBloodRequest = async (requestId: string, user: User) => {
  const reqRef = doc(db, COLLECTIONS.BLOOD_REQUESTS, requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found");
  
  const req = reqSnap.data() as unknown as BloodRequest;
  if (req.acceptedBy && req.acceptedBy.find(a => a.userId === user.id)) {
    throw new Error("Already accepted");
  }
  
  const acceptor = {
    userId: user.id,
    name: user.name,
    phone: user.phone || 'N/A',
    timestamp: Date.now()
  };
  
  await updateDoc(reqRef, {
    acceptedBy: arrayUnion(acceptor)
  });
  await createLog('ACCEPT_BLOOD_REQUEST', user.id, user.name, `Accepted blood request ${requestId}`);
};

export const deleteBloodRequest = async (requestId: string, user: User) => {
  const reqRef = doc(db, COLLECTIONS.BLOOD_REQUESTS, requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found");
  
  const reqData = reqSnap.data();
  if (reqData.requesterId !== user.id && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
     throw new Error("Permission denied");
  }

  await deleteDoc(reqRef);
  await createLog('DELETE_BLOOD_REQUEST', user.id, user.name, `Deleted blood request ${requestId}`);
};

export const closeBloodRequest = async (requestId: string, user: User, confirmedUserId?: string) => {
  console.log("closeBloodRequest called with:", { requestId, userId: user.id, confirmedUserId });
  const reqRef = doc(db, COLLECTIONS.BLOOD_REQUESTS, requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error("Request not found");
  
  const reqData = reqSnap.data() as BloodRequest;
  if (reqData.requesterId !== user.id && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
     throw new Error("Permission denied");
  }

  await updateDoc(reqRef, { 
    status: 'CLOSED',
    confirmedUserId: confirmedUserId || null
  });
  console.log("Request closed successfully in Firestore");
  await createLog('CLOSE_BLOOD_REQUEST', user.id, user.name, `Closed blood request ${requestId}${confirmedUserId ? ` (Confirmed donor: ${confirmedUserId})` : ''}`);
};
