
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getAppPermissions, updateAppPermissions, ADMIN_EMAIL, getUsers, updateUserProfile } from '../../services/api';
import { Card, Button, Badge, Toast, useToast, Input } from '../../components/UI';
import { RolePermissions, AppPermissions, UserRole, User } from '../../types';
import { Shield, Layout, Eye, EyeOff, Lock, Unlock, Save, Search, User as UserIcon, X, UserCog, ShieldAlert, ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';

const SIDEBAR_KEYS: (keyof RolePermissions['sidebar'])[] = [
  'dashboard', 'profile', 'history', 'donors', 'users', 'manageDonations', 
  'logs', 'rolePermissions', 'supportCenter', 'feedback', 'approveFeedback', 
  'landingSettings', 'myNotice', 'boardNotices', 'summary', 'notifications', 'badgeManage', 'adminVerify', 
  'verificationHistory', 'teamIdCards', 'deletedUsers', 'helpCenterManage', 'moderateFaqs', 'serverStatus', 'requestedDonor', 'donationFound', 'foundManage', 'foundExpenses', 'foundSummary', 'avatarManage'
];

const RULE_KEYS: (keyof RolePermissions['rules'])[] = [
  'canEditProfile', 'canViewDonorDirectory', 'canRequestDonation', 
  'canPerformAction', 'canLogDonation', 'canLogDonationForOthers', 
  'canUseMessenger', 'canUseSystemSupport', 'canPostNotice', 'canAssignVerificationBadge'
];

export const AdminRolePermissions = () => {
  const { user: admin } = useAuth();
  const location = useLocation();
  const { toastState, showToast, hideToast } = useToast();
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'individual' | 'menu-lock'>('global');
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    Promise.all([getAppPermissions(), getUsers()]).then(([perms, users]) => {
      setPermissions(perms);
      setAllUsers(users);
      setLoading(false);
    });
  }, []);

  // Handle auto-selection of user from navigation state
  useEffect(() => {
    if (location.state?.selectedUserId && allUsers.length > 0) {
      const target = allUsers.find(u => u.id === location.state.selectedUserId);
      if (target) {
        setActiveTab('individual');
        setSelectedUser(target);
        // Clear state to prevent re-selection on generic refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, allUsers]);

  const getBasePermsForRole = (role: UserRole): RolePermissions | null => {
    if (!permissions) return null;
    const roleKey = role.toLowerCase() as keyof AppPermissions;
    return (permissions as any)[roleKey] || permissions.user;
  };

  const handleToggleSidebar = (key: keyof RolePermissions['sidebar'], isOverride: boolean = false) => {
    if (isOverride && selectedUser) {
      const current = selectedUser.permissions || { sidebar: {}, rules: {} } as RolePermissions;
      const sidebar = { ...(current.sidebar || {}) };
      const base = getBasePermsForRole(selectedUser.role);
      
      // If currently using default (undefined), switch to inverse of base. 
      // If already overridden, allow undefined (reset) logic if desired, but here we just toggle boolean
      const currentVal = sidebar[key];
      const baseVal = base?.sidebar?.[key] ?? false;
      
      // If no override exists, we create one that toggles the base value
      if (currentVal === undefined) {
        sidebar[key] = !baseVal; 
      } else {
        // If it matches base now, remove override (set to undefined), else toggle
        if (!currentVal === baseVal) {
           delete sidebar[key]; // Reset to default
        } else {
           sidebar[key] = !currentVal;
        }
      }
      
      setSelectedUser({ ...selectedUser, permissions: { ...current, sidebar: sidebar as any } });
      return;
    }

    if (!permissions) return;
    const roleKey = activeRole.toLowerCase() as keyof AppPermissions;
    const currentRole = (permissions as any)[roleKey] || { sidebar: {}, rules: {} };
    const sidebar = { ...(currentRole.sidebar || {}) };
    const currentVal = sidebar[key] ?? false;
    sidebar[key] = !currentVal;
    
    setPermissions({
      ...permissions,
      [roleKey]: { ...currentRole, sidebar: sidebar }
    });
  };

  const handleToggleLock = (key: keyof RolePermissions['sidebar']) => {
    if (!permissions) return;
    const roleKey = activeRole.toLowerCase() as keyof AppPermissions;
    const currentRole = (permissions as any)[roleKey] || { sidebar: {}, rules: {}, lockedMenus: {} };
    const lockedMenus = { ...(currentRole.lockedMenus || {}) };
    const currentVal = lockedMenus[key] ?? false;
    lockedMenus[key] = !currentVal;
    
    setPermissions({
      ...permissions,
      [roleKey]: { ...currentRole, lockedMenus: lockedMenus }
    });
  };

  const handleToggleRule = (key: keyof RolePermissions['rules'], isOverride: boolean = false) => {
    if (isOverride && selectedUser) {
      const current = selectedUser.permissions || { sidebar: {}, rules: {} } as RolePermissions;
      const rules = { ...(current.rules || {}) };
      const base = getBasePermsForRole(selectedUser.role);
      
      const currentVal = rules[key];
      const baseVal = base?.rules?.[key] ?? false;

      if (currentVal === undefined) {
        rules[key] = !baseVal;
      } else {
        if (!currentVal === baseVal) {
           delete rules[key];
        } else {
           rules[key] = !currentVal;
        }
      }

      setSelectedUser({ ...selectedUser, permissions: { ...current, rules: rules as any } });
      return;
    }

    if (!permissions) return;
    const roleKey = activeRole.toLowerCase() as keyof AppPermissions;
    const currentRole = (permissions as any)[roleKey] || { sidebar: {}, rules: {} };
    const rules = { ...(currentRole.rules || {}) };
    const currentVal = rules[key] ?? false;
    rules[key] = !currentVal;

    setPermissions({
      ...permissions,
      [roleKey]: { ...currentRole, rules: rules }
    });
  };

  const handleResetOverride = (key: string, type: 'sidebar' | 'rules') => {
    if (!selectedUser) return;
    const current = selectedUser.permissions || { sidebar: {}, rules: {} } as RolePermissions;
    if (type === 'sidebar') {
       const sidebar = { ...(current.sidebar || {}) };
       delete sidebar[key as keyof RolePermissions['sidebar']];
       setSelectedUser({ ...selectedUser, permissions: { ...current, sidebar: sidebar as any } });
    } else {
       const rules = { ...(current.rules || {}) };
       delete rules[key as keyof RolePermissions['rules']];
       setSelectedUser({ ...selectedUser, permissions: { ...current, rules: rules as any } });
    }
  };

  const handleSaveGlobal = async () => {
    if (!admin || !permissions) return;
    setSaving(true);
    try {
      await updateAppPermissions(permissions, admin);
      showToast("Global configurations updated successfully.");
    } catch (e: any) {
      showToast("Sync failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!admin || !selectedUser) return;
    setSaving(true);
    try {
      await updateUserProfile(selectedUser.id, { permissions: selectedUser.permissions }, admin);
      showToast(`Overrides for ${selectedUser.name} synchronized.`);
      setAllUsers(allUsers.map(u => u.id === selectedUser.id ? selectedUser : u));
    } catch (e: any) {
      showToast("Override failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== admin?.id && 
    ((u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="p-10 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse transition-colors">Syncing...</div>;

  const currentRole = permissions ? (permissions as any)[activeRole.toLowerCase()] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-4">
      <Toast {...toastState} onClose={hideToast} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
           <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <Shield size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Master Security Hub</span>
           </div>
           <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Role Permissions</h1>
        </div>
        
        <div className="inline-flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <button onClick={() => { setActiveTab('global'); setSelectedUser(null); }} className={clsx("px-4 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all", activeTab === 'global' ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100")}>Roles</button>
          <button onClick={() => { setActiveTab('menu-lock'); setSelectedUser(null); }} className={clsx("px-4 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all", activeTab === 'menu-lock' ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100")}>Menu Lock</button>
          <button onClick={() => setActiveTab('individual')} className={clsx("px-4 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all", activeTab === 'individual' ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100")}>User Wish</button>
        </div>
      </div>

      {activeTab === 'global' ? (
        <div className="space-y-4 lg:space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg shadow-inner border border-slate-200 dark:border-slate-800 w-full lg:w-fit overflow-x-auto no-scrollbar transition-colors">
              {[UserRole.USER, UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPERADMIN].map((role) => (
                <button key={role} onClick={() => setActiveRole(role)} className={clsx("flex-1 lg:flex-none px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all whitespace-nowrap transition-colors", activeRole === role ? "bg-white dark:bg-slate-800 shadow-sm text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-600")}>{role}</button>
              ))}
            </div>
            <Button onClick={handleSaveGlobal} isLoading={saving} className="rounded-sm px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider hidden lg:block">Save</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
             <Card className="p-3 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 rounded-2xl transition-all hover:shadow-md">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                   <Layout className="text-blue-500" size={16} /> Sidebar Visibility
                </h3>
                <div className="space-y-1.5 max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                   {SIDEBAR_KEYS.map((key) => {
                     const value = currentRole?.sidebar?.[key] ?? false;
                     return (
                       <div key={key} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group" onClick={() => handleToggleSidebar(key)}>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{((key as string) === 'myNotice' ? 'Notifications' : key.replace(/([A-Z])/g, ' $1').trim())}</span>
                          <div className={clsx("w-9 h-5 rounded-full relative transition-all shadow-inner p-0.5", value ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700")}>
                             <div className={clsx("w-4 h-4 bg-white rounded-full transition-all shadow-sm", value ? "translate-x-4" : "translate-x-0")} />
                          </div>
                       </div>
                     );
                   })}
                </div>
             </Card>

             <Card className="p-3 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 rounded-2xl flex flex-col transition-all hover:shadow-md">
                 <div className="mb-5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="text-red-500" size={16} /> Functional Rules
                    </h3>
                 </div>
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[300px] lg:max-h-[400px]">
                   {RULE_KEYS.map((key) => {
                     const value = currentRole?.rules?.[key] ?? false;
                     return (
                       <div key={key} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group" onClick={() => handleToggleRule(key)}>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{((key as string) === 'myNotice' ? 'Notifications' : key.replace(/([A-Z])/g, ' $1').trim())}</span>
                          <div className={clsx("w-9 h-5 rounded-full relative transition-all shadow-inner p-0.5", value ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700")}>
                             <div className={clsx("w-4 h-4 bg-white rounded-full transition-all shadow-sm", value ? "translate-x-4" : "translate-x-0")} />
                          </div>
                       </div>
                     );
                   })}
                 </div>
             </Card>
          </div>
        </div>
      ) : activeTab === 'menu-lock' ? (
        <div className="space-y-4 lg:space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg shadow-inner border border-slate-200 dark:border-slate-800 w-full lg:w-fit overflow-x-auto no-scrollbar transition-colors">
              {[UserRole.USER, UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPERADMIN].map((role) => (
                <button key={role} onClick={() => setActiveRole(role)} className={clsx("flex-1 lg:flex-none px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all whitespace-nowrap transition-colors", activeRole === role ? "bg-white dark:bg-slate-800 shadow-sm text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-600")}>{role}</button>
              ))}
            </div>
            <Button onClick={handleSaveGlobal} isLoading={saving} className="rounded-sm px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider hidden lg:block">Save</Button>
          </div>

          <Card className="p-3 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 rounded-2xl transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <Lock className="text-amber-500" size={16} /> Restricted Menus (Lock/Unlock)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
               {SIDEBAR_KEYS.map((key) => {
                 const isVisible = currentRole?.sidebar?.[key] ?? false;
                 const isLocked = currentRole?.lockedMenus?.[key] ?? false;
                 
                 return (
                   <div key={key} className={clsx("flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border transition-all group", isVisible ? "border-slate-200 dark:border-slate-800 opacity-100" : "border-slate-100 dark:border-slate-900 opacity-50")}>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{(key as string) === 'myNotice' ? 'NOTIFICATIONS' : ((key as string) === 'myNotice' ? 'Notifications' : key.replace(/([A-Z])/g, ' $1').trim())}</span>
                        {!isVisible && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Hidden for this role</span>}
                      </div>
                      <button 
                        onClick={() => isVisible && handleToggleLock(key)}
                        disabled={!isVisible}
                        className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                          !isVisible ? "bg-slate-50 dark:bg-slate-900 text-slate-300" :
                          isLocked ? "bg-red-50 text-red-600 ring-1 ring-red-100" : "bg-green-50 text-green-600 ring-1 ring-green-100"
                        )}
                      >
                         {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                   </div>
                 );
               })}
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
           {/* Left Column: User Search - On mobile, hidden if user is selected */}
           <div className={clsx("lg:col-span-1 space-y-6 transition-colors", selectedUser ? "hidden lg:block" : "block")}>
              <Card className="p-3 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 rounded-2xl">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Find User</h3>
                 <div className="relative group mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-red-500 transition-colors" size={18} />
                    <input type="text" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950 border-0 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-red-500 transition-all outline-none" />
                 </div>
                 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredUsers.map(u => (
                      <div key={u.id} onClick={() => setSelectedUser(u)} className={clsx("p-1.5 rounded-sm border transition-all cursor-pointer flex items-center justify-between group", selectedUser?.id === u.id ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700")}>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                               {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2.5 text-slate-400" />}
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{u.name}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{u.role}</p>
                            </div>
                         </div>
                         <ChevronRight size={16} className={clsx("transition-transform", selectedUser?.id === u.id ? "text-red-500 translate-x-1" : "text-slate-300")} />
                      </div>
                    ))}
                 </div>
              </Card>
           </div>

           {/* Right Column: Detail View - On mobile, takes full screen if user is selected */}
           <div className={clsx("lg:col-span-2", selectedUser ? "block animate-in slide-in-from-right-4" : "hidden lg:block")}>
              {selectedUser ? (
                <div className="space-y-6 lg:space-y-8 duration-500 transition-colors">
                   {/* Mobile Back Button */}
                   <button onClick={() => setSelectedUser(null)} className="lg:hidden flex items-center gap-2 text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-widest mb-2 px-1 transition-colors">
                      <ArrowLeft size={16} /> Back to User List
                   </button>

                   <Card className="p-3 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
                      <div className="flex items-center gap-4 w-full sm:w-auto transition-colors">
                         <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden transition-colors">
                            {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : <UserCog size={28} className="text-red-600 dark:text-red-500" />}
                         </div>
                         <div className="min-w-0 flex-1">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white truncate transition-colors">{selectedUser.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 transition-colors">
                               <Badge color="red" className="text-[9px] px-2 py-0.5">{selectedUser.role}</Badge>
                               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 truncate max-w-[150px] transition-colors">{selectedUser.email}</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto transition-colors">
                         <Button onClick={() => setSelectedUser(null)} variant="outline" className="flex-1 sm:flex-none rounded-sm px-2 py-0.5 text-[10px]">Cancel</Button>
                         <Button onClick={handleSaveOverride} isLoading={saving} className="flex-1 sm:flex-none rounded-sm px-3 py-0.5 text-[10px]">Sync Overrides</Button>
                      </div>
                   </Card>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card className="p-3 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-sm transition-colors">
                         <h4 className="font-black text-lg mb-3 flex items-center gap-3 text-slate-900 dark:text-white transition-colors"><Layout size={18} className="text-blue-500"/> Custom Sidebar</h4>
                         <div className="space-y-2 max-h-[350px] lg:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar transition-colors">
                            {SIDEBAR_KEYS.map((key) => {
                               const userVal = selectedUser.permissions?.sidebar?.[key];
                               const baseRolePerms = getBasePermsForRole(selectedUser.role);
                               const isActive = userVal !== undefined ? userVal : (baseRolePerms?.sidebar?.[key] ?? false);
                               const isInherited = userVal === undefined && isActive;

                               return (
                                 <div key={key} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group" onClick={() => handleToggleSidebar(key, true)}>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{((key as string) === 'myNotice' ? 'Notifications' : key.replace(/([A-Z])/g, ' $1').trim())}</span>
                                      {isInherited && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Role Default</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                       {userVal !== undefined && (
                                          <button onClick={(e) => { e.stopPropagation(); handleResetOverride(key, 'sidebar'); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Reset to Role Default"><X size={12} /></button>
                                       )}
                                       {userVal !== undefined && <Badge color="red" className="text-[8px] font-bold uppercase shadow-none border-0">Custom</Badge>}
                                       <div className={clsx("w-9 h-5 rounded-full relative transition-all shadow-inner p-0.5", isActive ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700")}>
                                          <div className={clsx("w-4 h-4 bg-white rounded-full transition-all shadow-sm", isActive ? "translate-x-4" : "translate-x-0")} />
                                       </div>
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      </Card>

                      <Card className="p-3 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-sm transition-colors">
                         <h4 className="font-black text-lg mb-3 flex items-center gap-3 text-slate-900 dark:text-white transition-colors"><Lock size={18} className="text-red-500"/> Custom Rules</h4>
                         <div className="space-y-2 max-h-[350px] lg:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar transition-colors">
                            {RULE_KEYS.map((key) => {
                               const userVal = selectedUser.permissions?.rules?.[key];
                               const baseRolePerms = getBasePermsForRole(selectedUser.role);
                               const isActive = userVal !== undefined ? userVal : (baseRolePerms?.rules?.[key] ?? false);
                               const isInherited = userVal === undefined && isActive;

                               return (
                                 <div key={key} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group" onClick={() => handleToggleRule(key, true)}>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{((key as string) === 'myNotice' ? 'Notifications' : key.replace(/([A-Z])/g, ' $1').trim())}</span>
                                      {isInherited && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Role Default</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                       {userVal !== undefined && (
                                          <button onClick={(e) => { e.stopPropagation(); handleResetOverride(key, 'rules'); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Reset to Role Default"><X size={12} /></button>
                                       )}
                                       {userVal !== undefined && <Badge color="red" className="text-[8px] font-bold uppercase shadow-none border-0">Custom</Badge>}
                                       <div className={clsx("w-9 h-5 rounded-full relative transition-all shadow-inner p-0.5", isActive ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700")}>
                                          <div className={clsx("w-4 h-4 bg-white rounded-full transition-all shadow-sm", isActive ? "translate-x-4" : "translate-x-0")} />
                                       </div>
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      </Card>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-10 lg:p-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-sm text-center opacity-40 transition-colors">
                   <UserCog size={64} className="dark:text-slate-600" />
                   <p className="font-black uppercase tracking-widest text-sm dark:text-slate-600">Select a user to configure custom overrides</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  </div>
  );
};
