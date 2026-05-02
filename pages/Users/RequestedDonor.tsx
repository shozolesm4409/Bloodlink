import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Badge, Toast, useToast } from '../../components/UI';
import { useAuth } from '../../AuthContext';
import { BloodRequest, UserRole, User, FeedbackStatus, DonationRecord, DonationFeedback } from '../../types';
import { createBloodRequest as apiCreateBloodRequest, subscribeToBloodRequests as apiSubscribeToBloodRequests, acceptBloodRequest, deleteBloodRequest, getUsers, requestRequestedDonorAccess, getDonations, getUserFeedbacks } from '../../services/api';
import { MapPin, Droplet, Clock, CheckCircle, BadgeCheck, CheckCircle2, Lock, ShieldAlert, X, User as UserIcon, Phone, Activity, Calendar, Trash2 } from 'lucide-react';
import { getBadgeData } from './Profile';
import clsx from 'clsx';

export const RequestedDonor = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const isPrivileged = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN || user?.role === UserRole.EDITOR;
  const hasAccess = isPrivileged || user?.hasRequestedDonorAccess;
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_REQUESTS'>(isPrivileged ? 'ALL' : 'MY_REQUESTS');
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<DonationFeedback[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  
  // Form state
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemUsers, setSystemUsers] = useState<Record<string, User>>({});

  useEffect(() => {
    getUsers().then(users => {
      const userMap: Record<string, User> = {};
      users.forEach(u => userMap[u.id] = u);
      setSystemUsers(userMap);
    }).catch(console.error);

    getDonations().then(setDonations).catch(console.error);

    const unsubscribe = apiSubscribeToBloodRequests((data) => {
      setRequests(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (viewUser) {
      getUserFeedbacks(viewUser.id).then(data => {
        setUserFeedbacks(data.filter(f => f.status === FeedbackStatus.APPROVED));
      });
    } else {
      setUserFeedbacks([]);
    }
  }, [viewUser]);

  const checkEligibility = (lastDate?: string) => {
    if (!lastDate) return { eligible: true, daysLeft: 0 };
    const lastDonation = new Date(lastDate);
    const today = new Date();
    const nextEligible = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
    const diffTime = nextEligible.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      eligible: diffDays <= 0,
      daysLeft: Math.max(0, diffDays)
    };
  };

  const getDonationCount = (userId: string) => {
    return donations.filter(d => d.userId === userId && d.status === 'COMPLETED').length;
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
      showToast('Please provide blood group and location', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiCreateBloodRequest({ bloodGroup, location, details }, user!);
      showToast('Blood request created successfully', 'success');
      setBloodGroup('');
      setLocation('');
      setDetails('');
      setActiveTab('MY_REQUESTS');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await acceptBloodRequest(id, user!);
      showToast('Request accepted successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getUserDisplay = (uid: string, defaultName: string) => {
    const u = systemUsers[uid];
    if (!u) return { name: defaultName, avatar: null, badge: null, role: 'USER' };
    
    let badge = null;
    const isStaff = u.role === UserRole.SUPERADMIN || u.role === UserRole.ADMIN || u.role === UserRole.EDITOR;
    
    if (u.approvedBadge && (u.approvedBadge as string) !== 'none') {
      const colorClass = u.approvedBadge === 'pink' ? 'text-slate-400' :
                         u.approvedBadge === 'red' ? 'text-amber-500' :
                         u.approvedBadge === 'green' ? 'text-emerald-500' : 'text-cyan-400';
      badge = <CheckCircle2 size={14} className={colorClass} fill="currentColor" stroke="white" />;
    }

    return { name: u.name, avatar: u.avatar, badge, role: u.role };
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      await deleteBloodRequest(id, user!);
      showToast('Request deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const myRequests = requests.filter(r => r.requesterId === user?.id);
  const openRequests = requests.filter(r => r.requesterId !== user?.id);

  if (user && !hasAccess) {
    return (
      <div className="w-full max-w-5xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500">
        <Toast {...toastState} onClose={hideToast} />
        <div className="max-w-2xl mx-auto py-12 px-4 transition-colors">
          <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-sm flex items-center justify-center mx-auto shadow-inner transition-colors">
              <Lock size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Requested Donor Access Restricted</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-colors">
                রিকোয়েস্টেড ডোনার ফিচারটি বর্তমানে লক করা আছে। অ্যাক্সেস পেতে এ্যাডমিনের কাছে রিকোয়েস্ট পাঠান। আপনার রিকোয়েস্টটি এ্যাডমিন এপ্রুভ করলে আপনি এই সার্ভিসটি ব্যবহার করতে পারবেন।
              </p>
            </div>
            
            {user.requestedDonorAccessRequested ? (
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-2xl flex items-center justify-center gap-3 border border-yellow-100 dark:border-yellow-900/30 font-black uppercase tracking-widest text-xs transition-colors">
                <ShieldAlert size={18} /> Request Pending Approval
              </div>
            ) : (
              <Button onClick={handleRequestAccess} isLoading={isRequesting} className="w-full py-5 rounded-sm text-lg shadow-xl shadow-red-100 dark:shadow-none bg-red-600 hover:bg-red-700">
                Request Access to Feature
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8 px-4 lg:px-0">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
          <Droplet size={24} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Requested Donor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Request blood and see who accepted</p>
        </div>
      </div>

      <Toast {...toastState} onClose={hideToast} />

      {/* View Profile Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 transition-colors">
            <button onClick={() => setViewUser(null)} className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-sm">
              <X size={20} />
            </button>
            <div className="h-40 relative">
              {viewUser.coverImage ? <img src={viewUser.coverImage} className="w-full h-full object-cover" alt="Cover" /> : <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600"></div>}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                <div className={clsx("w-32 h-32 rounded-full border-[6px] shadow-xl overflow-hidden bg-white dark:bg-slate-800 transition-colors", checkEligibility(viewUser.lastDonationDate).eligible ? "border-green-500" : "border-red-500")}>
                  {viewUser.avatar ? <img src={viewUser.avatar} className="w-full h-full object-cover" alt={viewUser.name} /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 font-bold text-4xl">{viewUser.name.charAt(0)}</div>}
                </div>
              </div>
            </div>
            <div className="pt-20 pb-8 px-8 text-center space-y-8">
               <div className="space-y-2">
                 <div className="flex items-center justify-center gap-2">
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{viewUser.name}</h2>
                   {getBadgeData(viewUser) && <BadgeCheck className={clsx(getBadgeData(viewUser)?.color, "flex-shrink-0")} size={24} />}
                 </div>
                 <Badge color="blue" className="text-[10px] uppercase tracking-widest px-3">{viewUser.role}</Badge>
               </div>
               <div className="space-y-3 text-left">
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Droplet size={20} className="text-red-600" />
                        <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Group</p><p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">{viewUser.bloodGroup}</p></div>
                     </div>
                     <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 truncate">
                        <MapPin size={20} className="text-slate-600" />
                        <div className="truncate"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p><p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-none mt-1">{viewUser.location}</p></div>
                     </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-sm shrink-0"><Phone size={20} /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                        <a href={`tel:${viewUser.phone}`} className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors leading-none">{viewUser.phone}</a>
                     </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-600 shadow-sm shrink-0"><Activity size={20} /></div>
                     <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Donations</p><p className="text-lg font-bold text-slate-900 dark:text-white leading-none mt-1">{getDonationCount(viewUser.id)} Times</p></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {isPrivileged && (
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 font-bold text-sm px-4 lg:px-0">
          <button className={clsx("pb-4 px-6 relative transition-colors", activeTab === 'ALL' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')} onClick={() => setActiveTab('ALL')}>
            All Requests {activeTab === 'ALL' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 dark:bg-red-400 rounded-t-full" />}
          </button>
          <button className={clsx("pb-4 px-6 relative transition-colors", activeTab === 'MY_REQUESTS' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')} onClick={() => setActiveTab('MY_REQUESTS')}>
            My Requests {activeTab === 'MY_REQUESTS' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 dark:bg-red-400 rounded-t-full" />}
          </button>
        </div>
      )}

      <div className={clsx("grid grid-cols-1 gap-6 px-4 lg:px-0", activeTab === 'MY_REQUESTS' ? 'lg:grid-cols-3' : 'w-full')}>
        {activeTab === 'MY_REQUESTS' && (
          <Card className="p-4 lg:col-span-1 h-fit border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-3">Post a Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Blood Group *</label>
                <Select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full py-2" required>
                  <option value="">Select Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </Select>
              </div>
              <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Location *</label><Input placeholder="Hospital/City Area" value={location} onChange={(e) => setLocation(e.target.value)} className="py-2" required /></div>
              <div><label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Details</label><textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm min-h-[80px] resize-y" placeholder="Specific needs?" value={details} onChange={(e) => setDetails(e.target.value)} /></div>
              <Button type="submit" disabled={isSubmitting} className="w-full py-2.5 font-bold">{isSubmitting ? 'Posting...' : 'Post Request'}</Button>
            </form>
          </Card>
        )}

        <div className={clsx("space-y-4", activeTab === 'MY_REQUESTS' ? 'lg:col-span-2' : '')}>
          {activeTab === 'ALL' ? (
            openRequests.length === 0 ? <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center text-slate-500 border border-slate-100 dark:border-slate-800">No requests available.</div> : (
              <>
                <Card className="hidden md:block overflow-hidden border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr><th className="p-1 px-3 py-2">Requester</th><th className="p-1 px-3 py-2">Group</th><th className="p-1 px-3 py-2 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {openRequests.map(req => {
                        const hasAccepted = (req.acceptedBy || []).some(a => a.userId === user?.id);
                        const requester = getUserDisplay(req.requesterId, req.requesterName);
                        return (
                          <tr key={req.id} className="p-1">
                            <td className="p-1 px-3 py-2">
                              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewUser(systemUsers[req.requesterId])}>
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                                  {requester.avatar ? <img src={requester.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-slate-500">{requester.name.charAt(0)}</span>}
                                </div>
                                <div><div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">{requester.name} {requester.badge}</div><div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">{new Date(req.timestamp).toLocaleString()}</div></div>
                              </div>
                            </td>
                            <td className="p-1 px-3 py-2"><Badge color={hasAccepted ? 'green' : 'red'} className="text-[10px] font-bold">{req.bloodGroup}</Badge></td>
                            <td className="p-1 px-3 py-2 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  {hasAccepted ? <Badge color="green">Accepted</Badge> : <Button onClick={() => handleAcceptRequest(req.id)} className="text-[10px] py-1 font-black uppercase tracking-widest">Accept</Button>}
                                  {isPrivileged && <Button onClick={() => handleDeleteRequest(req.id)} variant="danger" className="text-[10px] py-1 font-black uppercase tracking-widest">Delete</Button>}
                               </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </Card>
                <div className="md:hidden space-y-4">
                  {openRequests.map(req => {
                    const hasAccepted = (req.acceptedBy || []).some(a => a.userId === user?.id);
                    const requester = getUserDisplay(req.requesterId, req.requesterName);
                    return (
                      <Card key={req.id} className="p-3 space-y-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3" onClick={() => setViewUser(systemUsers[req.requesterId])}>
                             <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0">
                                {requester.avatar ? (
                                  <img src={requester.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  requester.name.charAt(0)
                                )}
                             </div>
                             <div>
                               <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1 leading-none pt-0.5">
                                 {requester.name} {requester.badge}
                               </p>
                               <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1">{new Date(req.timestamp).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <Badge color="red" className="font-black ring-1 ring-red-100 dark:ring-red-900/50 text-[10px] py-0 px-2">{req.bloodGroup}</Badge>
                        </div>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] font-bold flex flex-col gap-1 border border-slate-100 dark:border-slate-800 transition-colors">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <MapPin size={12} className="text-red-500"/>{req.location}
                          </div>
                          {req.details && <p className="text-slate-500 dark:text-slate-400 font-normal pl-5 leading-tight">{req.details}</p>}
                        </div>
                        <div className="flex gap-2">
                           {hasAccepted ? (
                             <div className="flex-1 text-center py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-green-100 dark:border-green-900/30">
                               Accepted
                             </div>
                           ) : (
                             <Button onClick={() => handleAcceptRequest(req.id)} className="flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">Accept Request</Button>
                           )}
                           {isPrivileged && (
                             <Button onClick={() => handleDeleteRequest(req.id)} variant="danger" className="px-3 rounded-xl">
                               <Trash2 size={16}/>
                             </Button>
                           )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )
          ) : (
            myRequests.length === 0 ? <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center text-slate-500 border border-slate-100 dark:border-slate-800">You haven't posted any requests.</div> : (
              <>
                <Card className="hidden md:block overflow-hidden border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr><th className="p-1 px-3 py-2">Info</th><th className="p-1 px-3 py-2">Accepted By</th><th className="p-1 px-3 py-2 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {myRequests.map(req => (
                        <tr key={req.id} className="p-1 align-top">
                          <td className="p-1 px-3 py-2">
                            <div className="flex items-center gap-2 mb-1"><Badge color="blue" className="text-[10px] py-0 px-2">{req.bloodGroup}</Badge><span className="text-[10px] font-bold text-slate-500">{new Date(req.timestamp).toLocaleDateString()}</span></div>
                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><MapPin size={10}/>{req.location}</div>
                          </td>
                          <td className="p-1 px-3 py-2">
                            {(req.acceptedBy || []).length === 0 ? <span className="text-xs text-slate-400 italic">Pending...</span> : (
                              <div className="flex flex-wrap gap-2">
                                {(req.acceptedBy || []).map((acc, i) => {
                                  const display = getUserDisplay(acc.userId, acc.name);
                                  return (
                                    <div key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2" onClick={() => setViewUser(systemUsers[acc.userId])}>
                                      <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0">
                                         {display.avatar ? (
                                           <img src={display.avatar} alt="avatar" className="w-full h-full object-cover" />
                                         ) : (
                                           <span className="text-[10px]">{display.name.charAt(0)}</span>
                                         )}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 leading-none">
                                          {display.name} {display.badge}
                                        </span>
                                        <span className="text-[8px] font-black text-blue-500 dark:text-blue-400 leading-none mt-0.5">{acc.phone}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="p-1 px-3 py-2 text-right"><Button onClick={() => handleDeleteRequest(req.id)} variant="danger" className="text-[10px] py-0.5 font-black uppercase">Remove</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                <div className="md:hidden space-y-4">
                   {myRequests.map(req => (
                      <Card key={req.id} className="p-3 space-y-3 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                         <div className="flex justify-between items-start">
                            <Badge color="blue" className="font-black px-3 py-0 ring-1 ring-blue-100 dark:ring-blue-900/50 text-[10px]">{req.bloodGroup}</Badge>
                            <Button onClick={() => handleDeleteRequest(req.id)} variant="danger" className="p-1.5 h-auto rounded-lg shadow-md">
                               <Trash2 size={14}/>
                            </Button>
                         </div>
                         <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] font-bold flex items-center gap-2 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                            <MapPin size={14} className="text-red-500 shrink-0"/>{req.location}
                         </div>
                         <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Accepted By ({(req.acceptedBy || []).length})</p>
                            <div className="space-y-1.5">
                               {(req.acceptedBy || []).length === 0 ? (
                                 <div className="p-3 text-center text-[10px] text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border-dashed border border-slate-200 dark:border-slate-700">No one yet</div>
                               ) : (
                                 (req.acceptedBy || []).map((acc, i) => {
                                   const acceptor = getUserDisplay(acc.userId, acc.name);
                                   return (
                                     <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setViewUser(systemUsers[acc.userId])}>
                                        <div className="flex items-center gap-2">
                                           <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                                              {acceptor.avatar ? (
                                                <img src={acceptor.avatar} className="w-full h-full object-cover" />
                                              ) : (
                                                <UserIcon size={12} className="text-slate-400" />
                                              )}
                                           </div>
                                           <div>
                                              <p className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-1 leading-none">
                                                {acceptor.name} {acceptor.badge}
                                              </p>
                                              <p className="text-[9px] font-bold text-blue-500 dark:text-blue-400 mt-0.5">{acc.phone}</p>
                                           </div>
                                        </div>
                                        <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">{new Date(acc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
            )
          )}
        </div>
      </div>
    </div>
  );
};
