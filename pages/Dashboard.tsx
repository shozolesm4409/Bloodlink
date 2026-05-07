
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { UserRole, DonationRecord, DonationStatus, User, BloodGroup } from '../types';
import { getDonations, getUserDonations, getUsers, handleDirectoryAccess, handleSupportAccess, handleFeedbackAccess, handleIDCardAccess, handleRequestedDonorAccess, updateDonationStatus, ADMIN_EMAIL, subscribeToBloodRequests } from '../services/api';
import { Card, Badge, Button, Toast, useToast } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Droplet, Users, TrendingUp, Trophy, ArrowRight, CheckCircle, BellRing, Clock, ShieldCheck, Check, X, HeartPulse, History, Activity, Heart, Calendar, Award, Shield, Edit, User as UserIcon, UserCheck, ShieldCheck as ShieldIcon, IdCard, LayoutList, Fingerprint, MapPin, BadgeCheck } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import * as ReactRouterDOM from 'react-router-dom';
import clsx from 'clsx';
import { getRankBadge } from './Users/Profile';

const { Link } = ReactRouterDOM;

const UserBadge = ({ user, size = 14 }: { user: any, size?: number }) => {
  const { badgeConfig } = useSettings();
  
  if (!user.approvedBadge) return null;

  const badgeColor = user.approvedBadge === 'pink' ? badgeConfig.silver?.color || 'text-slate-400' :
                     user.approvedBadge === 'red' ? badgeConfig.gold?.color || 'text-amber-500' :
                     user.approvedBadge === 'green' ? badgeConfig.platinum?.color || 'text-emerald-500' :
                     user.approvedBadge === 'blue' ? badgeConfig.diamond?.color || 'text-cyan-500' :
                     badgeConfig.verificationBadgeColor || 'text-blue-500';

  return (
      <BadgeCheck 
        size={size} 
        className={clsx(badgeColor)} 
      />
  );
};

export const Dashboard = () => {
  const { user } = useAuth();
  const { badgeConfig } = useSettings();
  const { isDarkMode } = useTheme();
  const { toastState, showToast, hideToast } = useToast();
  const [userDonations, setUserDonations] = useState<DonationRecord[]>([]);
  const [allDonations, setAllDonations] = useState<DonationRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingRequests, setMatchingRequests] = useState<any[]>([]);

  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || (user?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
  const isManagement = isSuperAdmin || user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;

  const fetchData = async () => {
    try {
      const [userDons, globalDons, u] = await Promise.all([
        getUserDonations(user?.id || ''),
        getDonations(),
        getUsers()
      ]);
      
      setUserDonations(userDons);
      setAllDonations(globalDons);
      setAllUsers(u);
      
      if (isManagement) {
        const directoryReqs = u.filter(usr => usr.directoryAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Directory' }));
        const supportReqs = u.filter(usr => usr.supportAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Support' }));
        const feedbackReqs = u.filter(usr => usr.feedbackAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Feedback' }));
        const idCardReqs = u.filter(usr => usr.idCardAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'IDCard' }));
        const requestedDonorReqs = u.filter(usr => usr.requestedDonorAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Requested_Donor' }));
        
        const donationReqs = globalDons.filter(don => don.status === DonationStatus.PENDING).map(don => {
          const donor = u.find(usr => usr.id === don.userId);
          // Ensure we pass essential user info for the badge
          return { ...don, type: 'DONATION', accessType: 'Donation', approvedBadge: donor?.approvedBadge, role: donor?.role };
        });
        
        // Combine all items and ensure they have necessary user info for badges where available
        const allPending = [...directoryReqs, ...supportReqs, ...feedbackReqs, ...idCardReqs, ...requestedDonorReqs, ...donationReqs];
        
        setPendingItems(allPending.sort((a,b) => b.id.localeCompare(a.id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    
    const unsubscribe = subscribeToBloodRequests((reqs) => {
      if (user && !isManagement) {
        const matching = reqs.filter(r => r.bloodGroup === user.bloodGroup && r.requesterId !== user.id && (r.status === 'OPEN' || !r.status)).slice(0, 3);
        setMatchingRequests(matching);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleAction = async (itemId: string, type: string, accessType: string, approve: boolean) => {
    if (!user || !isManagement) return;
    try {
      if (type === 'ACCESS') {
        const sub = accessType.toLowerCase();
        if (sub === 'directory') await handleDirectoryAccess(itemId, approve, user);
        else if (sub === 'support') await handleSupportAccess(itemId, approve, user);
        else if (sub === 'feedback') await handleFeedbackAccess(itemId, approve, user);
        else if (sub === 'idcard') await handleIDCardAccess(itemId, approve, user);
        else if (sub === 'requested_donor') await handleRequestedDonorAccess(itemId, approve, user);
      } else if (type === 'DONATION') {
        await updateDonationStatus(itemId, approve ? DonationStatus.COMPLETED : DonationStatus.REJECTED, user);
      }
      showToast("Verification action completed successfully.");
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Initializing Dashboard...</div>;

  const lastDonationDate = user?.lastDonationDate ? new Date(user.lastDonationDate) : null;
  const today = new Date();
  const nextEligibleDate = lastDonationDate ? new Date(lastDonationDate.getTime() + 90 * 24 * 60 * 60 * 1000) : today;
  const isEligible = today >= nextEligibleDate;
  const diffDays = Math.max(0, Math.ceil((nextEligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = lastDonationDate ? Math.min(100, Math.max(0, (90 - diffDays) / 90 * 100)) : 100;
  
  const completedCount = userDonations.filter(d => d.status === DonationStatus.COMPLETED).length;
  const globalCompleted = allDonations.filter(d => d.status === DonationStatus.COMPLETED);

  const topHero = [...allUsers].sort((a, b) => {
    const aCount = allDonations.filter(d => d.userId === a.id && d.status === DonationStatus.COMPLETED).length;
    const bCount = allDonations.filter(d => d.userId === b.id && d.status === DonationStatus.COMPLETED).length;
    return bCount - aCount;
  })[0];

  const topHeroCount = allDonations.filter(d => d.userId === topHero?.id && d.status === DonationStatus.COMPLETED).length;
  const topRank = getRankBadge(topHero, badgeConfig, topHeroCount);

  const roleData = [
    { name: 'Admin', value: allUsers.filter(u => u.role === UserRole.ADMIN).length, color: '#ef4444' },
    { name: 'Editor', value: allUsers.filter(u => u.role === UserRole.EDITOR).length, color: '#3b82f6' },
    { name: 'User', value: allUsers.filter(u => u.role === UserRole.USER).length, color: '#10b981' },
    { name: 'SuperAdmin', value: allUsers.filter(u => u.role === UserRole.SUPERADMIN).length, color: '#8b5cf6' },
  ];

  const groupData = Object.values(BloodGroup).map(bg => ({
    group: bg,
    count: allUsers.filter(u => u.bloodGroup === bg).length
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Monitoring system analytics and community activity.</p>
        </div>
      </div>

      {!isManagement && matchingRequests.length > 0 && (
        <div className="animate-in slide-in-from-top-4 duration-500">
           <Card className="p-4 lg:p-5 border-0 shadow-xl bg-red-600 text-white rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Urgent Needs</div>
                  <h3 className="text-xl font-black tracking-tighter">Matching Blood Requests</h3>
                  <p className="text-red-100 font-medium text-xs">Someone near you needs <span className="font-black text-white">{user?.bloodGroup}</span> blood right now.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
                   {matchingRequests.map(req => (
                     <div key={req.id} className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 min-w-[180px]">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] font-black uppercase text-red-200">{req.requesterName}</p>
                          <Badge className="bg-white text-red-600 border-0 font-black text-[9px] py-0 px-1">{req.bloodGroup}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold mb-2">
                          <MapPin size={12} className="text-white" /> {req.location}
                        </div>
                        <Link to="/requested-donor" className="block text-center py-1.5 bg-white text-red-600 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-50 transition-colors shadow-md">View Request</Link>
                     </div>
                   ))}
                </div>
              </div>
           </Card>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard title="Total Volume" value={`${globalCompleted.reduce((a,b)=>a+b.units,0)}ml`} icon={Droplet} color="text-red-600" />
        <StatCard title="Total Donors" value={allUsers.length} icon={Users} color="text-blue-600" />
        <StatCard title="Success Donation" value={globalCompleted.length} icon={CheckCircle} color="text-green-600" />
        <StatCard title="Success Donors" value={new Set(globalCompleted.map(d => d.userId)).size} icon={LayoutList} color="text-orange-600" />
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard title="Total Users" value={allUsers.filter(u => u.role === UserRole.USER).length} icon={UserIcon} color="text-green-600" />
          <StatCard title="Total Admin" value={allUsers.filter(u => u.role === UserRole.ADMIN).length} icon={ShieldIcon} color="text-red-600" />
          <StatCard title="Total Editor" value={allUsers.filter(u => u.role === UserRole.EDITOR).length} icon={Edit} color="text-blue-600" />
          <StatCard title="Total Super Admin" value={allUsers.filter(u => u.role === UserRole.SUPERADMIN).length} icon={Fingerprint} color="text-purple-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isSuperAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-3 lg:p-4 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-xl">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Activity size={20} className="text-red-600 dark:text-red-400" /> Role Distribution</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none">
                        {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDarkMode ? '#0f172a' : '#fff', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900', color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
 
              <Card className="p-3 lg:p-4 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-xl">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Droplet size={20} className="text-blue-600 dark:text-blue-400" /> Blood Spread</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="group" fontSize={10} axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b'}} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b'}} />
                      <Tooltip cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc', radius: 12}} contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#0f172a' : '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900', color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          <Card className="p-4 lg:p-5 border-0 shadow-2xl bg-white dark:bg-slate-900 relative overflow-hidden rounded-xl">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">Health & Eligibility</h3>
              </div>
 
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className={clsx(
                    "p-4 rounded-xl border-2 transition-all duration-500",
                    isEligible 
                      ? "bg-green-50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30 ring-4 ring-green-50/50 dark:ring-green-900/20" 
                      : "bg-blue-50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30 ring-4 ring-blue-50/50 dark:ring-blue-900/20"
                  )}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Current Status</p>
                    <p className={clsx("text-2xl font-black tracking-tighter mb-1", isEligible ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400")}>
                      {isEligible ? "ELIGIBLE TO DONATE" : "RESTING PERIOD"}
                    </p>
                    {!isEligible && (
                      <p className="text-xs font-bold text-slate-500/80 dark:text-slate-400">
                        Next blood donation possible in <span className="text-blue-600 dark:text-blue-400 font-black">{diffDays} days</span>.
                      </p>
                    )}
                  </div>
 
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center lg:text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Last Donated</p>
                      <p className="text-base font-black text-slate-900 dark:text-slate-100">{user?.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : 'No Records'}</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center lg:text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Contribution</p>
                      <p className="text-base font-black text-slate-900 dark:text-slate-100">{completedCount} Times</p>
                    </div>
                  </div>
                </div>
 
                <div className="lg:w-40 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="relative w-24 h-24 flex items-center justify-center">
                      <Heart className={clsx("w-full h-full transition-colors duration-500", isEligible ? "text-green-100 dark:text-green-950/30" : "text-blue-100 dark:text-blue-950/30")} strokeWidth={2} />
                      <Activity className={clsx("absolute text-red-600 animate-pulse", isEligible ? "opacity-100" : "opacity-30")} size={24} strokeWidth={2} />
                      <div className="absolute -bottom-1 right-0 bg-white dark:bg-slate-800 shadow-lg border border-slate-50 dark:border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="text-base font-black text-slate-900 dark:text-slate-100">{Math.round(progressPercent)}%</span>
                      </div>
                   </div>
                   <div className="space-y-1.5 w-full">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Recovery Progress</p>
                     <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className={clsx("h-full transition-all duration-1000", isEligible ? "bg-green-500" : "bg-blue-500")} style={{ width: `${progressPercent}%` }} />
                     </div>
                   </div>
                   <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed max-w-[130px]">
                      মেডিকেল গাইডলাইন অনুযায়ী ৩ মাস বা ৯০ দিন পর পুনরায় রক্ত দেওয়া যায়।
                   </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {isManagement && (
            <Card className="p-3 lg:p-4 border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest flex items-center gap-2"><BellRing className="text-red-600 dark:text-red-400" size={18} /> Queue Updates</h3>
                {pendingItems.length > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm animate-pulse">{pendingItems.length}</span>}
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {pendingItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-red-100 dark:hover:border-red-900/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 overflow-hidden flex items-center justify-center">
                        {item.userAvatar || item.avatar ? <img src={item.userAvatar || item.avatar} className="w-full h-full object-cover" /> : <Droplet className="text-red-600 dark:text-red-400" size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 truncate">{item.userName || item.name}</p>
                          <UserBadge user={item} size={10} />
                        </div>
                        <Badge color={item.type === 'DONATION' || item.accessType === 'Requested_Donor' ? 'red' : 'blue'} className="text-[8px] py-0 px-1">{item.accessType === 'IDCard' ? 'ID Card' : (item.accessType || '').replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAction(item.id, item.type, item.accessType, true)} className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all flex justify-center shadow-sm active:scale-90"><Check size={14} /></button>
                      <button onClick={() => handleAction(item.id, item.type, item.accessType, false)} className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all flex justify-center shadow-sm active:scale-90"><X size={14} /></button>
                    </div>
                  </div>
                ))}
                {pendingItems.length === 0 && <div className="text-center py-8 opacity-30 font-black uppercase text-[9px] dark:text-slate-500 transition-colors">Queue empty</div>}
              </div>
            </Card>
          )}
          
          <Card className="p-4 lg:p-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-0 shadow-2xl relative overflow-hidden rounded-xl group transition-colors">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent_70%)] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-0.5 rounded-full mb-4">
                <Trophy size={14} className="text-yellow-500" strokeWidth={2} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-600 dark:text-yellow-500">Top Contributor</span>
              </div>

              <div className="relative mb-3">
                <div className="absolute -inset-3 bg-gradient-to-tr from-yellow-500 to-red-500 rounded-xl opacity-10 dark:opacity-20 blur-lg group-hover:opacity-30 transition-opacity"></div>
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-3xl font-black border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden relative z-10 transition-colors">
                  {topHero?.avatar ? (
                    <img src={topHero.avatar} className="w-full h-full object-cover" alt={topHero.name} />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-500 text-xl">{topHero?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                {topRank && (
                  <div className={clsx("absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-xl z-20 ring-4 ring-white dark:ring-slate-900 transition-all", topRank.bg, topRank.color)}>
                    <topRank.icon size={14} />
                  </div>
                )}
              </div>

              <div className="space-y-0.5 mb-4">
                <div className="flex items-center justify-center gap-1">
                  <h4 className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-yellow-500 transition-colors">{topHero?.name || 'Loading...'}</h4>
                  <UserBadge user={topHero} size={14} />
                </div>
                <div className="flex items-center justify-center gap-2">
                   <Badge color="red" className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-black text-[9px] py-0 px-1.5 transition-colors">{topHero?.bloodGroup || 'N/A'}</Badge>
                   <span className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest transition-colors">{topHero?.location || 'Unknown'}</span>
                </div>
               </div>

              <div className="w-full grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 backdrop-blur-md p-2 rounded-lg border border-slate-100 dark:border-white/5 transition-colors">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Total</p>
                   <p className="text-base font-black text-slate-900 dark:text-white transition-colors">{topHeroCount}</p>
                   <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase">Donations</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 backdrop-blur-md p-2 rounded-lg border border-slate-100 dark:border-white/5 transition-colors">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Status</p>
                   <p className={clsx("text-base font-black transition-colors uppercase", topRank?.color || "text-yellow-600 dark:text-yellow-500")}>{topRank?.name || 'HERO'}</p>
                   <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase">Rank #1</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="p-2 sm:p-3 border-0 shadow-lg flex items-center gap-2 sm:gap-3 hover:shadow-2xl transition-all group rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full">
    <div className="w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 shadow-inner transition-transform group-hover:scale-105">
      <Icon className={clsx("w-4.5 h-4.5 sm:w-6 sm:h-6", color)} strokeWidth={2} />
    </div>
    <div className="flex flex-col min-w-0">
      <p className="text-[8px] sm:text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1 leading-none truncate transition-colors">
        {title}
      </p>
      <div className="flex items-baseline">
        <p className="text-[17px] sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter truncate leading-none transition-colors">
          {value}
        </p>
      </div>
    </div>
  </Card>
);
