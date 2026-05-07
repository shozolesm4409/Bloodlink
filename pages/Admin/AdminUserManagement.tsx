
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getUsers, 
  deleteUserRecord, 
  updateUserProfile, 
  adminForceChangePassword, 
  handleDirectoryAccess,
  handleSupportAccess,
  handleFeedbackAccess,
  handleIDCardAccess,
  handleRequestedDonorAccess,
  handleDonationFoundAccess,
  toggleUserSuspension,
  getDonations,
  generateUserId,
  resequenceAllIds,
  ADMIN_EMAIL
} from '../../services/api';
import { Card, Badge, Button, Input, Toast, useToast, ConfirmModal, Select, RoleBadge } from '../../components/UI';
import { User, UserRole, BloodGroup, DonationStatus } from '../../types';
import { Search, User as UserIcon, Trash2, Key, Layout, Shield, ShieldCheck, UserCheck, MessageSquare, LifeBuoy, X, Edit2, Ban, IdCard, MoreVertical, Phone, MapPin, Star, Trophy, Medal, Award, Wand2, Settings, Fingerprint, Edit, Filter, LogIn, Mail, BadgeCheck, Droplet, HeartHandshake } from 'lucide-react';
import { getVerificationBadge, getRankBadge } from '../Users/Profile';
import clsx from 'clsx';



const AccessHub = ({ users, onAction, searchQuery, accessType, accessStatus }: { 
  users: User[], 
  onAction: (uid: string, type: 'directory' | 'support' | 'feedback' | 'idcard' | 'requested_donor' | 'donation_found', approve: boolean) => void,
  searchQuery: string,
  accessType: string,
  accessStatus: string
}) => {
  
  // Filter Logic for Access Hub
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // If "ALL Types" is selected, just return based on search
    if (accessType === 'ALL') return true;

    // Specific access check
    let hasAccess = false;
    let isRequested = false;

    if (accessType === 'directory') {
      hasAccess = !!u.hasDirectoryAccess;
      isRequested = !!u.directoryAccessRequested;
    } else if (accessType === 'support') {
      hasAccess = !!u.hasSupportAccess;
      isRequested = !!u.supportAccessRequested;
    } else if (accessType === 'feedback') {
      hasAccess = !!u.hasFeedbackAccess;
      isRequested = !!u.feedbackAccessRequested;
    } else if (accessType === 'idcard') {
      hasAccess = !!u.hasIDCardAccess;
      isRequested = !!u.idCardAccessRequested;
    } else if (accessType === 'requested_donor') {
      hasAccess = !!u.hasRequestedDonorAccess;
      isRequested = !!u.requestedDonorAccessRequested;
    } else if (accessType === 'donation_found') {
      hasAccess = !!u.hasDonationFoundAccess;
      isRequested = !!u.donationFoundAccessRequested;
    }

    if (accessStatus === 'ALL') return true;
    if (accessStatus === 'REQUESTED') return isRequested;
    if (accessStatus === 'ACTIVE') return hasAccess;
    if (accessStatus === 'REVOKED') return !hasAccess && !isRequested;

    return true;
  });

  const AccessItem = ({ title, requested, has, type, uid, icon: Icon, color }: any) => {
    // If a specific type is selected for filtering, hide non-relevant items within the card
    if (accessType !== 'ALL' && accessType !== type) return null;

    return (
      <div className="flex items-center justify-between p-1.5 sm:p-3 bg-slate-50 dark:bg-[#161e31] rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <div className={clsx("w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0", has ? color : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600")}>
            <Icon size={14} className="sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider leading-tight sm:mb-0.5 truncate">{title}</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {has ? (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase text-green-600 dark:text-green-500 tracking-widest">Active</span>
                </div>
              ) : requested ? (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-500 animate-bounce"></div>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase text-yellow-600 dark:text-yellow-500 tracking-widest">Pending</span>
                </div>
              ) : (
                <span className="text-[7px] sm:text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest">None</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 ml-1">
          {requested ? (
            <div className="flex gap-1 sm:gap-1.5">
              <button onClick={() => onAction(uid, type, true)} className="w-7 h-7 sm:w-7 sm:h-7 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all active:scale-90"><UserCheck size={10}/></button>
              <button onClick={() => onAction(uid, type, false)} className="w-7 h-7 sm:w-7 sm:h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all active:scale-90"><X size={10}/></button>
            </div>
          ) : (
            <button 
              onClick={() => onAction(uid, type, !has)}
              className={clsx(
                "text-[7px] sm:text-[9px] font-black px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all border uppercase tracking-widest active:scale-95 whitespace-nowrap flex-shrink-0", 
                has ? "text-red-500 border-red-500/20 bg-red-500/10 hover:bg-red-500 hover:text-white" : "text-blue-500 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500 hover:text-white"
              )}
            >
              {has ? 'Revoke' : 'Grant'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-700">
      {filteredUsers.length > 0 ? filteredUsers.map(u => (
        <Card key={u.id} className="p-3 sm:p-5 shadow-xl bg-[#0d121f] rounded-2xl relative overflow-hidden transition-all border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden flex items-center justify-center font-black text-slate-600">
                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24}/>}
              </div>
              <div className={clsx("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0d121f] shadow-lg flex items-center justify-center", u.role === UserRole.SUPERADMIN ? "bg-purple-600" : (u.role === UserRole.ADMIN ? "bg-red-500" : (u.role === UserRole.EDITOR ? "bg-blue-500" : "bg-green-500")))}>
                <ShieldCheck size={10} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-lg font-black text-white truncate tracking-tight uppercase leading-none">{u.name}</h3>
                  {(() => {
                    const badgeClr = getVerificationBadge(u)?.color;
                    return badgeClr && <BadgeCheck className={clsx(badgeClr, "flex-shrink-0")} size={16} />;
                  })()}
                  <RoleBadge role={u.role} />
               </div>
               <div className="flex items-center gap-2">
                  <Mail size={12} className="text-slate-500" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{u.email}</p>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
            <AccessItem title="Directory Access" requested={u.directoryAccessRequested} has={u.hasDirectoryAccess} type="directory" uid={u.id} icon={Search} color="bg-red-500/20 text-red-500" />
            <AccessItem title="Support Access" requested={u.supportAccessRequested} has={u.hasSupportAccess} type="support" uid={u.id} icon={LifeBuoy} color="bg-blue-500/20 text-blue-500" />
            <AccessItem title="Feedback Access" requested={u.feedbackAccessRequested} has={u.hasFeedbackAccess} type="feedback" uid={u.id} icon={MessageSquare} color="bg-green-500/20 text-green-500" />
            <AccessItem title="ID Card Access" requested={u.idCardAccessRequested} has={u.hasIDCardAccess} type="idcard" uid={u.id} icon={IdCard} color="bg-orange-500/20 text-orange-500" />
            <AccessItem title="Req. Donor Access" requested={u.requestedDonorAccessRequested} has={u.hasRequestedDonorAccess} type="requested_donor" uid={u.id} icon={Droplet} color="bg-red-500/20 text-red-500" />
            <AccessItem title="Donation Fund Access" requested={u.donationFoundAccessRequested} has={u.hasDonationFoundAccess} type="donation_found" uid={u.id} icon={HeartHandshake} color="bg-red-500/20 text-red-500" />
          </div>
        </Card>
      )) : (
        <div className="col-span-full py-20 text-center opacity-40">
           <Search size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
           <p className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-xs">No users found matching access criteria</p>
        </div>
      )}
    </div>
  );
};

export const AdminUserManagement = () => {
  const { user: admin, impersonateUser } = useAuth();
  const navigate = useNavigate();
  const { toastState, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [userRankMap, setUserRankMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'users' | 'access-hub'>('users');
  
  // Access Hub Filter States
  const [accessSearch, setAccessSearch] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('ALL');
  const [accessStatusFilter, setAccessStatusFilter] = useState('ALL');
  
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<{id: string, current: boolean} | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([getUsers(), getDonations()]);
      
      // Calculate rank map
      const map: Record<string, number> = {};
      d.filter(record => record.status === DonationStatus.COMPLETED).forEach(rec => {
        map[rec.userId] = (map[rec.userId] || 0) + 1;
      });
      
      setUserRankMap(map);
      setUsers(u);
    } catch (e) { showToast("Failed to fetch data", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const isSuperAdminViewer = admin?.role === UserRole.SUPERADMIN || (admin?.email || '').trim().toLowerCase() === ADMIN_EMAIL;

  const handleDelete = async () => {
    if (!admin || !deleteUserId) return;
    setActionLoading(true);
    try {
      await deleteUserRecord(deleteUserId, admin);
      showToast("User account archived.");
      setDeleteUserId(null);
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleSuspendToggle = async () => {
    if (!admin || !suspendUserId) return;
    setActionLoading(true);
    try {
      await toggleUserSuspension(suspendUserId.id, !suspendUserId.current, admin);
      showToast(`User ${!suspendUserId.current ? 'suspended' : 'reinstated'}.`);
      setSuspendUserId(null);
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!admin) return;
    if (newRole === UserRole.SUPERADMIN && !isSuperAdminViewer) {
      showToast("Only a SuperAdmin can assign this role.", "error");
      return;
    }
    try {
      await updateUserProfile(userId, { role: newRole }, admin);
      showToast("Role updated.");
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
  };

  const handleAccessAction = async (uid: string, type: 'directory' | 'support' | 'feedback' | 'idcard' | 'requested_donor' | 'donation_found', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(uid, approve, admin);
      else if (type === 'support') await handleSupportAccess(uid, approve, admin);
      else if (type === 'feedback') await handleFeedbackAccess(uid, approve, admin);
      else if (type === 'idcard') await handleIDCardAccess(uid, approve, admin);
      else if (type === 'requested_donor') await handleRequestedDonorAccess(uid, approve, admin);
      else if (type === 'donation_found') await handleDonationFoundAccess(uid, approve, admin);
      showToast("Access updated.");
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
  };

  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !editUser) return;
    setActionLoading(true);
    try {
      await updateUserProfile(editUser.id, {
        name: editUser.name,
        phone: editUser.phone,
        location: editUser.location,
        bloodGroup: editUser.bloodGroup
      }, admin);
      showToast("User details updated.");
      setEditUser(null);
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleForcePassword = async () => {
    if (!admin || !pwdUser || !newPassword) return;
    setActionLoading(true);
    try {
      await adminForceChangePassword(pwdUser.id, newPassword, admin);
      showToast("Password reset triggered.");
      setPwdUser(null);
      setNewPassword('');
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleGenerateId = async (userId: string) => {
    if (!admin) return;
    try {
      await generateUserId(userId, admin);
      showToast("New BL ID generated.");
      fetchData();
    } catch (e) {
      showToast("ID Generation failed.", "error");
    }
  };

  const handleResequenceAll = async () => {
    if (!admin || !isSuperAdminViewer) return;
    if (!window.confirm("This will permanently re-assign BL IDs to ALL users sequentially starting from BL-361013 (SuperAdmin first). This action cannot be reversed. Continue?")) return;
    
    setActionLoading(true);
    setLoading(true); // Force main sync loader to appear
    try {
      await resequenceAllIds(admin);
      showToast("All user BL IDs have been successfully resequenced.");
      // Small delay to ensure Firestore consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchData();
    } catch (e) {
      console.error("Resequencing failed:", e);
      showToast("Resequencing failed. Check logs.", "error");
    } finally {
      setActionLoading(false);
      setLoading(false);
    }
  };

  // User List filtering and sorting
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    // SuperAdmin always at top
    if (a.role === UserRole.SUPERADMIN && b.role !== UserRole.SUPERADMIN) return -1;
    if (b.role === UserRole.SUPERADMIN && a.role !== UserRole.SUPERADMIN) return 1;

    // Numerically sort by BL ID if present
    const idA = a.idNumber || '';
    const idB = b.idNumber || '';
    const numA = parseInt(idA.replace('BL-', '').trim()) || 0;
    const numB = parseInt(idB.replace('BL-', '').trim()) || 0;

    if (numA !== numB) return numA - numB;

    // Fallback to name
    return (a.name || '').localeCompare(b.name || '');
  });

  const superAdminsCount = users.filter(u => u.role === UserRole.SUPERADMIN).length;
  const adminsCount = users.filter(u => u.role === UserRole.ADMIN).length;
  const editorsCount = users.filter(u => u.role === UserRole.EDITOR).length;
  const usersCount = users.filter(u => u.role === UserRole.USER).length;

  const StatPill = ({ icon: Icon, label, count, color }: any) => (
    <div className={clsx("flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors")}>
       <div className={clsx("w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-inner transition-transform hover:scale-110", color)}>
          <Icon size={16} className="sm:w-5 sm:h-5" />
       </div>
       <div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none transition-colors">{count}</p>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{label}</p>
       </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Syncing...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      
      <ConfirmModal 
        isOpen={!!deleteUserId} 
        onClose={() => setDeleteUserId(null)} 
        onConfirm={handleDelete} 
        title="Archive User?" 
        message="This will move the user to system archives." 
        isLoading={actionLoading} 
      />

      <ConfirmModal 
        isOpen={!!suspendUserId} 
        onClose={() => setSuspendUserId(null)} 
        onConfirm={handleSuspendToggle} 
        title={suspendUserId?.current ? "Reinstate User?" : "Suspend User?"} 
        message={suspendUserId?.current ? "User will regain access to the platform." : "User will be blocked from logging into the platform immediately."} 
        isLoading={actionLoading} 
      />

      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-sm">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors"><Edit2 className="text-red-600" /> Edit Identity</h3>
               <button onClick={() => setEditUser(null)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X size={20} className="dark:text-white" /></button>
            </div>
            <form onSubmit={handleUpdateUserDetails} className="space-y-6">
              <Input label="Full Name" value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} required className="dark:bg-slate-800" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone Number" value={editUser.phone} onChange={e => setEditUser({...editUser, phone: e.target.value})} required className="dark:bg-slate-800" />
                <Select label="Blood Group" value={editUser.bloodGroup} onChange={e => setEditUser({...editUser, bloodGroup: e.target.value as BloodGroup})} className="dark:bg-slate-800">
                  {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </Select>
              </div>
              <Input label="Location" value={editUser.location} onChange={e => setEditUser({...editUser, location: e.target.value})} required className="dark:bg-slate-800" />
              <div className="pt-4 flex gap-4">
                <Button type="submit" isLoading={actionLoading} className="flex-1 py-4 rounded-2xl shadow-xl shadow-red-100 dark:shadow-red-900/20">Update User</Button>
                <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1 py-4 rounded-2xl border-slate-200 dark:border-slate-700 dark:text-slate-400">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {pwdUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-sm">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><Key size={32} /></div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">System PIN Reset</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Resetting password for <span className="text-red-600 dark:text-red-400 font-bold">{pwdUser.name}</span></p>
            </div>
            <div className="space-y-6">
              <Input type="password" label="New Password / PIN" placeholder="Enter strong password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} className="dark:bg-slate-800" />
              <div className="flex gap-4">
                <Button onClick={handleForcePassword} isLoading={actionLoading} disabled={!newPassword} className="flex-1 py-4 rounded-2xl shadow-xl shadow-red-100 dark:shadow-red-900/20">Confirm Reset</Button>
                <Button variant="outline" onClick={() => { setPwdUser(null); setNewPassword(''); }} className="flex-1 py-4 rounded-2xl border-slate-200 dark:border-slate-700 dark:text-slate-400">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Control global access and system privileges.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar transition-colors">
          {['users', 'access-hub'].map((t: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={clsx("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === t ? "bg-white dark:bg-slate-900 shadow-md text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400")}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
             <StatPill icon={Fingerprint} label="Super Admin" count={superAdminsCount} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" />
             <StatPill icon={Shield} label="Total Admin" count={adminsCount} color="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" />
             <StatPill icon={Edit} label="Total Editor" count={editorsCount} color="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" />
             <StatPill icon={UserIcon} label="Total Users" count={usersCount} color="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400" />
          </div>

          <div className="bg-white dark:bg-slate-900 p-1.5 sm:p-1.5 rounded-sm border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
               <div className="flex items-center gap-2 flex-1">
                 <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-red-600 transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500/10 transition-all dark:text-white" 
                    />
                 </div>
                 {isSuperAdminViewer && (
                   <button 
                     onClick={handleResequenceAll}
                     disabled={actionLoading}
                     className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 dark:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 dark:hover:bg-red-600 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 disabled:opacity-50 whitespace-nowrap"
                   >
                     <Wand2 size={14} />
                     Resequence
                   </button>
                 )}
               </div>
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar transition-colors lg:flex-none">
                 {[
                   { id: 'ALL', label: 'All' },
                   { id: UserRole.USER, label: 'User' },
                   { id: UserRole.EDITOR, label: 'Editor' },
                   { id: UserRole.ADMIN, label: 'Admin' },
                   { id: UserRole.SUPERADMIN, label: 'SuperAdmin' }
                 ].map((r) => (
                   <button 
                     key={r.id} 
                     onClick={() => setRoleFilter(r.id)} 
                     className={clsx(
                       "px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", 
                       roleFilter === r.id ? "bg-white dark:bg-slate-900 shadow-sm text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                     )}
                   >
                     {r.label}
                   </button>
                 ))}
               </div>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                    <tr>
                      <th className="p-1">Profile</th>
                      <th className="p-1">BL ID</th>
                      <th className="p-1">Email</th>
                      <th className="p-1 text-center">Group</th>
                      <th className="p-1 text-center">Donation</th>
                      <th className="p-1 text-center">Role</th>
                      <th className="p-1 text-right">Actions</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredUsers.map(u => {
                  const count = userRankMap[u.id] || 0;
                  const rank = getRankBadge(u, undefined, count);
                  
                  return (
                    <tr key={u.id} className={clsx("transition-colors", u.isSuspended ? "bg-red-50/50 dark:bg-red-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800")}>
                      <td className="p-1">
                        <div className="flex items-center gap-2">
                          <div className={clsx(
                            "w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white dark:border-slate-800 shadow-sm relative transition-all",
                            rank ? `ring-1 ${rank.color.replace('text-', 'ring-')}` : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-slate-300 dark:text-slate-600" />}
                            {u.isSuspended && <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center text-red-600"><Ban size={10}/></div>}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                               <p className="font-black text-slate-900 dark:text-white transition-colors truncate text-xs">{u.name}</p>
                               {(() => {
                                 const badgeClr = getVerificationBadge(u)?.color;
                                 return badgeClr && <BadgeCheck className={clsx(badgeClr, "flex-shrink-0")} size={14} />;
                               })()}
                               {rank && <div className={clsx("w-2 h-2 rounded-full", rank.color.replace('text-', 'bg-'))} title={rank.name} />}
                            </div>
                            {u.isSuspended && <p className="text-[7px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Suspended</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-1 text-slate-500 dark:text-slate-400 font-bold font-mono whitespace-nowrap text-xs">
                        {u.idNumber || 'N/A'}
                      </td>
                      <td className="p-1 text-slate-400 dark:text-slate-500 font-bold text-xs truncate max-w-[150px]"> {u.email} </td>
                      <td className="p-1 text-center">
                        <Badge color="red" className="text-[10px] font-bold">{u.bloodGroup}</Badge>
                      </td>
                      <td className="p-1 text-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {count}
                      </td>
                      <td className="p-1 text-center">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} 
                          disabled={(u.role === UserRole.SUPERADMIN && !isSuperAdminViewer) || (u.email === ADMIN_EMAIL)}
                          className={clsx(
                            "bg-transparent border rounded px-2 py-0.5 font-black text-[9px] uppercase tracking-[0.1em] outline-none cursor-pointer disabled:opacity-50 transition-colors appearance-none text-center inline-block",
                            u.role === UserRole.SUPERADMIN ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" :
                            u.role === UserRole.ADMIN ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" :
                            u.role === UserRole.EDITOR ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" :
                            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          )}
                          style={{ textAlignLast: 'center' }}
                        >
                          {Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN || isSuperAdminViewer).map(r => (
                            <option key={r} value={r} className="bg-white dark:bg-slate-900">{r}</option>
                          ))}
                        </select>
                      </td>
                          <td className="p-1 text-right">
                        <div className="flex justify-end gap-1">
                            {isSuperAdminViewer && (
                              <button 
                                onClick={() => { impersonateUser(u); showToast(`Logged in as ${u.name}`); navigate('/'); }} 
                                title="Login as User" 
                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                              >
                                <LogIn size={18} />
                              </button>
                            )}
                            {isSuperAdminViewer && (
                              <button 
                                onClick={() => navigate('/role-permissions', { state: { selectedUserId: u.id } })} 
                                title="Manage Permissions" 
                                className="p-2 text-slate-300 dark:text-slate-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-xl transition-all"
                              >
                                <Settings size={18} />
                              </button>
                            )}
                           <button onClick={() => navigate(`/admin/verify/${u.idNumber || u.phone}`, { state: { fromAdminUsers: true } })} title="Verify Identity" className="p-2 rounded-xl text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"><BadgeCheck size={18} /></button>
                           <button onClick={() => setSuspendUserId({id: u.id, current: !!u.isSuspended})} disabled={u.role === UserRole.SUPERADMIN} className={clsx("p-2 rounded-xl transition-all", u.isSuspended ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30" : "text-red-400 dark:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30", u.role === UserRole.SUPERADMIN && "opacity-0 pointer-events-none")}><Ban size={18} /></button>
                           <button onClick={() => setEditUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} title="Edit User" className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-20"><Edit2 size={18} /></button>
                           
                           {isSuperAdminViewer && (
                             <button onClick={() => setPwdUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} title="Change Password" className="p-2 text-slate-300 dark:text-slate-600 hover:text-orange-500 dark:hover:text-orange-400 transition-colors disabled:opacity-20"><Key size={18} /></button>
                           )}
                           
                           <button onClick={() => setDeleteUserId(u.id)} disabled={u.role === UserRole.SUPERADMIN || u.email === admin?.email} title="Delete User" className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-0 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4 pb-20">
           {filteredUsers.map((u) => {
              const count = userRankMap[u.id] || 0;
              const rank = getRankBadge(u, undefined, count);
              return (
                <Card key={u.id} className="p-3 sm:p-4 rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-colors">
                   <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className={clsx(
                        "w-12 h-12 flex-none rounded-xl overflow-hidden shadow-sm flex items-center justify-center relative transition-all",
                        rank ? `ring-2 ${rank.color.replace('text-', 'ring-')} ring-offset-2 dark:ring-offset-slate-900` : "bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                      )}>
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300 dark:text-slate-600" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                         <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-slate-900 dark:text-white text-base truncate transition-colors">{u.name}</p>
                            {(() => {
                              const badgeClr = getVerificationBadge(u)?.color;
                              return badgeClr && <BadgeCheck className={clsx(badgeClr, "flex-shrink-0")} size={16} />;
                            })()}
                         </div>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail size={12} className="text-slate-400 flex-shrink-0" />
                            <p className="text-[11px] text-slate-500 font-bold truncate transition-colors">{u.email}</p>
                         </div>
                         <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1"><Fingerprint size={10} className="text-slate-400"/>{u.idNumber || 'N/A'}</span>
                            {rank && <div className={clsx("w-2 h-2 rounded-full", rank.color.replace('text-', 'bg-'))} title={rank.name} />}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-[#1a2335] rounded-xl border border-slate-800 shadow-inner">
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={14} className="text-red-500" />
                         <span className="text-[11px] font-bold text-slate-100 truncate">{u.bloodGroup || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <MapPin size={14} className="text-blue-500" />
                         <span className="text-[11px] font-bold text-slate-100 truncate">{u.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Droplet size={14} className="text-red-500" />
                         <span className="text-[11px] font-bold text-slate-100 truncate">{count} Times</span>
                      </div>
                   </div>

                   {/* Footer Action Section */}
                   <div className="flex flex-row items-stretch gap-2 mt-2 pt-2 border-t border-slate-800/50">
                      {/* Role Selection Box */}
                      <div className="flex-1 bg-[#161e31] px-2 py-1.5 rounded-lg border border-slate-800 flex flex-col justify-center gap-0.5">
                         <div className="flex items-center gap-1.5 mb-1">
                           <ShieldCheck size={10} className="text-slate-500" />
                           <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">Account Role</span>
                         </div>
                         <div className="relative">
                           <select 
                             value={u.role} 
                             onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} 
                             disabled={(u.role === UserRole.SUPERADMIN && !isSuperAdminViewer) || (u.email === ADMIN_EMAIL)}
                             className={clsx(
                               "w-full bg-transparent border rounded px-2 py-1 font-black text-[9px] uppercase tracking-[0.1em] outline-none cursor-pointer disabled:opacity-50 appearance-none pr-6",
                               u.role === UserRole.SUPERADMIN ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" :
                               u.role === UserRole.ADMIN ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" :
                               u.role === UserRole.EDITOR ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" :
                               "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                             )}
                           >
                            {Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN || isSuperAdminViewer).map(r => (
                              <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                            ))}
                          </select>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <MoreVertical size={12} />
                          </div>
                        </div>
                     </div>
                     
                     {/* Action Grid */}
                     <div className="grid grid-cols-4 gap-1.5 self-center flex-none w-[140px]">
                        {isSuperAdminViewer && (
                          <button 
                            onClick={() => navigate('/role-permissions', { state: { selectedUserId: u.id } })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-green-500 hover:bg-green-500/10 transition-all active:scale-90"
                          >
                            <Settings size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/admin/verify/${u.idNumber || u.phone}`, { state: { fromAdminUsers: true } })}
                          title="Verify Identity"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-indigo-500 hover:bg-indigo-500/10 transition-all active:scale-90"
                        >
                          <BadgeCheck size={14} />
                        </button>
                        <button 
                          onClick={() => setSuspendUserId({id: u.id, current: !!u.isSuspended})} 
                          disabled={u.role === UserRole.SUPERADMIN}
                          className={clsx(
                            "w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 transition-all active:scale-90",
                            u.isSuspended ? "text-green-500 hover:bg-green-500/10" : "text-red-500 hover:bg-red-500/10"
                          )}
                        >
                          <Ban size={14} />
                        </button>
                        {admin?.role === UserRole.SUPERADMIN && (
                          <button 
                            onClick={() => { impersonateUser(u); showToast(`Logged in as ${u.name}`); navigate('/'); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-indigo-500 hover:bg-indigo-500/10 transition-all active:scale-90"
                          >
                            <LogIn size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => setEditUser(u)} 
                          disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-blue-500 hover:bg-blue-500/10 transition-all active:scale-90"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setPwdUser(u)} 
                          disabled={!isSuperAdminViewer || (u.role === UserRole.SUPERADMIN && !isSuperAdminViewer)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-orange-500 hover:bg-orange-500/10 transition-all active:scale-90"
                        >
                          <Key size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteUserId(u.id)} 
                          disabled={u.role === UserRole.SUPERADMIN || u.email === admin?.email}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
                </Card>

               );
             })}
          </div>
        </div>
      )}

      {activeTab === 'access-hub' && (
        <div className="space-y-4">
           <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-900 p-2 rounded-sm border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <div className="relative w-full lg:w-[30%] flex-none group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-red-600 transition-colors" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search user name..." 
                   value={accessSearch} 
                   onChange={(e) => setAccessSearch(e.target.value)} 
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl sm:rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20 transition-all dark:text-white" 
                 />
              </div>
              
              <div className="flex flex-row gap-2 w-full lg:w-[70%] flex-none">
                 <div className="w-1/2 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar transition-colors">
                    {[
                      { id: 'ALL', label: 'All Types', icon: Layout },
                      { id: 'directory', label: 'Directory', icon: Search },
                      { id: 'support', label: 'Support', icon: LifeBuoy },
                      { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                      { id: 'idcard', label: 'ID Card', icon: IdCard },
                      { id: 'requested_donor', label: 'Req. Donor', icon: Droplet },
                      { id: 'donation_found', label: 'Donation Fund', icon: HeartHandshake }
                    ].map((t) => (
                      <button 
                        key={t.id} 
                        onClick={() => setAccessTypeFilter(t.id)}
                        className={clsx(
                          "flex-1 px-2 sm:px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2",
                          accessTypeFilter === t.id ? "bg-white dark:bg-slate-900 shadow-sm text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                        )}
                        title={t.label}
                      >
                        <t.icon size={14} className="sm:hidden" />
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    ))}
                 </div>

                 <div className="w-1/2 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar transition-colors">
                    {[
                      { id: 'ALL', label: 'All Status', icon: Filter },
                      { id: 'REQUESTED', label: 'Pending', icon: UserCheck },
                      { id: 'ACTIVE', label: 'Granted', icon: ShieldCheck },
                      { id: 'REVOKED', label: 'Revoked', icon: Ban }
                    ].map((s) => (
                      <button 
                        key={s.id} 
                        onClick={() => setAccessStatusFilter(s.id)}
                        className={clsx(
                          "flex-1 px-2 sm:px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2",
                          accessStatusFilter === s.id ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                        )}
                        title={s.label}
                      >
                        <s.icon size={14} className="sm:hidden" />
                        <span className="hidden sm:inline">{s.label}</span>
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <AccessHub 
             users={users} 
             onAction={handleAccessAction} 
             searchQuery={accessSearch}
             accessType={accessTypeFilter}
             accessStatus={accessStatusFilter}
           />
        </div>
      )}
    </div>
  );
};
