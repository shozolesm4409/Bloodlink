
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { submitFeedback, getAllFeedbacks, updateFeedbackStatus, updateFeedbackMessage, toggleFeedbackVisibility, deleteFeedback, subscribeToApprovedFeedbacks, getCachedFeedbacks, requestFeedbackAccess } from '../services/api';
import { Card, Button, Badge, Toast, useToast, ConfirmModal } from '../components/UI';
import { MessageSquareQuote, Check, X, User as UserIcon, Eye, EyeOff, Trash2, Calendar, ArrowLeft, Activity, Edit3, Lock, ShieldAlert, Quote, MoreVertical } from 'lucide-react';
import { DonationFeedback, FeedbackStatus, UserRole } from '../types';
// Fix: Use double quotes for react-router-dom to resolve module resolution issues in some environments
import { Link } from "react-router-dom";
import { PublicLayout } from '../components/PublicLayout';
import clsx from 'clsx';

export const PublicFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>(getCachedFeedbacks());
  const [loading, setLoading] = useState(feedbacks.length === 0);

  useEffect(() => {
    const unsubscribe = subscribeToApprovedFeedbacks((data) => {
      setFeedbacks(data);
      setLoading(false);
    }, (err) => {
      console.debug("Public feedback subscription restricted:", err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <PublicLayout>
      <div className="py-10 px-[5%] bg-[#fcfdfe]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-5 gap-4">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-red-50 rounded-2xl">
                 <MessageSquareQuote className="text-red-600" size={24} />
               </div>
               <div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">ফিডব্যাক ওয়াল</h1>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">রক্তদাতাদের শেয়ার করা বাস্তব অভিজ্ঞতা</p>
               </div>
             </div>
             <div className="w-24 h-1.5 bg-red-600 rounded-full hidden md:block"></div>
          </div>

          {feedbacks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              {feedbacks.map(f => (
                <div key={f.id} className="bg-white p-5 rounded-[1.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col justify-between hover:shadow-xl transition-all group">
                  <div>
                    <div className="mb-4">
                      <Quote size={40} className="text-red-100 fill-current opacity-50" />
                    </div>
                    <p className="text-slate-700 font-bold text-lg leading-relaxed mb-10 min-h-[100px]">
                      "{f.message}"
                    </p>
                  </div>
                  
                  <div className="pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                        {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" alt={f.userName} /> : <UserIcon className="p-3.5 text-slate-300 w-full h-full" />}
                      </div>
                      <div>
                        <span className="block font-black text-slate-900 text-lg leading-tight">{f.userName}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(f.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-40 opacity-30">
              <Activity className="animate-spin text-red-600 mb-6" size={56} />
              <div className="text-center font-black text-slate-400 uppercase tracking-[0.3em] text-sm">
                অভিজ্ঞতাগুলো লোড হচ্ছে...
              </div>
            </div>
          ) : (
            <div className="py-40 text-center text-slate-400 font-bold italic bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-sm">
              এখনো কোনো ফিডব্যাক পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export const DonationFeedbackPage = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setLoading(true);
    try {
      await submitFeedback(message, user);
      setSuccess(true);
      setMessage('');
      showToast("ফিডব্যাক সাবমিট হয়েছে।");
    } catch (e) {
      showToast("সাবমিশন ব্যর্থ হয়েছে।", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await requestFeedbackAccess(user);
      updateUser({ ...user, feedbackAccessRequested: true });
      showToast("এক্সেস রিকোয়েস্ট পাঠানো হয়েছে।");
    } catch (e) {
      showToast("রিকোয়েস্ট ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const hasAccess = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.hasFeedbackAccess;

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
        <Toast {...toastState} onClose={hideToast} />
        <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white rounded-[1.5rem]">
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <Lock size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              আপনি এখনো ফিডব্যাক সেকশনে এক্সেস পাননি। রক্তদানের অভিজ্ঞতা শেয়ার করতে বা অন্যদের অভিজ্ঞতা দেখতে এক্সেস রিকোয়েস্ট পাঠান।
            </p>
          </div>
          
          {user?.feedbackAccessRequested ? (
            <div className="p-6 bg-yellow-50 text-yellow-700 rounded-2xl border border-yellow-100 flex items-center justify-center gap-3">
              <ShieldAlert size={20} />
              <span className="font-black text-sm uppercase tracking-widest">Request Pending Approval</span>
            </div>
          ) : (
            <Button onClick={handleRequestAccess} isLoading={isRequesting} className="w-full py-5 rounded-2xl text-lg">Request Access Now</Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-50 rounded-2xl">
          <MessageSquareQuote className="text-red-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">রক্তদানের অভিজ্ঞতা শেয়ার করুন</h1>
          <p className="text-sm text-slate-500 font-medium">আপনার একটি গল্প অন্য কাউকে রক্তদানে উদ্বুদ্ধ করতে পারে।</p>
        </div>
      </div>

      <Card className="p-8 border-0 shadow-lg">
        {success ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900">অনুপ্রেরণা শেয়ার করার জন্য ধন্যবাদ!</h3>
            <p className="text-slate-500 text-sm">আপনার ফিডব্যাকটি এ্যাডমিন এপ্রুভ করার পর ল্যান্ডিং পেজে শো করবে।</p>
            <Button onClick={() => setSuccess(false)} variant="outline">আবার লিখুন</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">আপনার অভিজ্ঞতা</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="কোথায় রক্ত দিয়েছেন? কেমন লেগেছে? নতুন ডোনারদের জন্য আপনার বার্তা কি?" required rows={5} className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none" />
            </div>
            <Button type="submit" isLoading={loading} className="w-full py-4 rounded-2xl">ফিডব্যাক সাবমিট করুন</Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export const FeedbackApprovalPage = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [editingFeedback, setEditingFeedback] = useState<DonationFeedback | null>(null);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      const data = await getAllFeedbacks();
      setFeedbacks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleStatusUpdate = async (id: string, status: FeedbackStatus) => {
    try {
      await updateFeedbackStatus(id, status, true);
      showToast(`ফিডব্যাক ${status === FeedbackStatus.APPROVED ? 'এপ্রুভড' : 'রিজেক্টেড'} হয়েছে।`);
      fetchFeedbacks();
    } catch (e) {
      showToast("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।", "error");
    }
  };

  const handleToggleVisibility = async (id: string, currentVal: boolean) => {
    try {
      await toggleFeedbackVisibility(id, !currentVal);
      showToast(`ভিজিবিলিটি আপডেট হয়েছে।`);
      fetchFeedbacks();
    } catch (e) {
      showToast("ভিজিবিলিটি আপডেট ব্যর্থ হয়েছে।", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteFeedbackId) return;
    try {
      await deleteFeedback(deleteFeedbackId, user);
      showToast("ফিডব্যাক ডিলিট করা হয়েছে।");
      setDeleteFeedbackId(null);
      fetchFeedbacks();
    } catch (e) {
      showToast("ডিলিট ব্যর্থ হয়েছে।", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !editingFeedback) return;
    setSavingEdit(true);
    try {
      await updateFeedbackMessage(editingFeedback.id, editMessage, user);
      showToast("ফিডব্যাক আপডেট হয়েছে।");
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (e) {
      showToast("আপডেট ব্যর্থ হয়েছে।", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => filter === 'ALL' || f.status === filter);

  if (loading) return <div className="p-5 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading feedback queue...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!deleteFeedbackId} 
        onClose={() => setDeleteFeedbackId(null)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Experience Feedback?" 
        message="This feedback will be archived and removed from management and public display."
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ফিডব্যাক ম্যানেজমেন্ট</h1>
          <p className="text-sm text-slate-500 font-medium">Review and publish donor experiences.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl focus:ring-4 focus:ring-red-500/10 shadow-sm outline-none cursor-pointer appearance-none min-w-[160px]">
          <option value="ALL">সব ফিডব্যাক</option>
          <option value={FeedbackStatus.PENDING}>পেন্ডিং</option>
          <option value={FeedbackStatus.APPROVED}>এপ্রুভড</option>
          <option value={FeedbackStatus.REJECTED}>রিজেক্টেড</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-xl bg-white rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">ডোনার</th>
                <th className="px-8 py-6">অভিজ্ঞতা / মেসেজ</th>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">স্ট্যাটাস</th>
                <th className="px-8 py-6">ল্যান্ডিং পেজ</th>
                <th className="px-8 py-6 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFeedbacks.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2.5 text-slate-300" />}
                      </div>
                      <span className="font-black text-slate-900">{f.userName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 max-w-sm">
                    <p className="text-slate-600 line-clamp-2 italic font-medium">"{f.message}"</p>
                  </td>
                  <td className="px-8 py-5 text-slate-400 font-bold whitespace-nowrap text-xs">
                    {new Date(f.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5">
                    <Badge color={f.status === FeedbackStatus.APPROVED ? 'green' : (f.status === FeedbackStatus.REJECTED ? 'red' : 'yellow')}>
                      {f.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleVisibility(f.id, f.isVisible)} 
                      disabled={f.status !== FeedbackStatus.APPROVED}
                      className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        f.isVisible ? "bg-blue-50 text-blue-600 shadow-sm ring-4 ring-blue-50" : "bg-slate-50 text-slate-300 opacity-50 grayscale"
                      )}
                      title={f.isVisible ? "Visible on landing page" : "Hidden from landing page"}
                    >
                      {f.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.status === FeedbackStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.APPROVED)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Approve">
                            <Check size={20} />
                          </button>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Reject">
                            <X size={20} />
                          </button>
                        </>
                      )}
                      <button onClick={() => { setEditingFeedback(f); setEditMessage(f.message); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit message">
                        <Edit3 size={20} />
                      </button>
                      <button onClick={() => setDeleteFeedbackId(f.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors" title="Delete feedback">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6 pb-20">
         {filteredFeedbacks.length > 0 ? filteredFeedbacks.map(f => (
           <Card key={f.id} className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem] relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                       {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-4 text-slate-300 w-full h-full" />}
                    </div>
                    <div>
                       <h3 className="font-black text-slate-900 text-lg leading-tight">{f.userName}</h3>
                       <div className="flex items-center gap-2 mt-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(f.timestamp).toLocaleDateString()}</span>
                       </div>
                    </div>
                 </div>
                 <div className="absolute top-6 right-6">
                    <Badge color={f.status === FeedbackStatus.APPROVED ? 'green' : (f.status === FeedbackStatus.REJECTED ? 'red' : 'yellow')}>
                       {f.status}
                    </Badge>
                 </div>
              </div>

              <div className="bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100 mb-8 relative">
                 <Quote size={24} className="absolute -top-3 -left-1 text-red-100 fill-current" />
                 <p className="text-slate-700 font-medium italic leading-relaxed text-sm">
                    "{f.message}"
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center border-t border-slate-100 pt-6">
                 <div className="flex items-center gap-3">
                    <button 
                       onClick={() => handleToggleVisibility(f.id, f.isVisible)} 
                       disabled={f.status !== FeedbackStatus.APPROVED}
                       className={clsx(
                         "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md",
                         f.isVisible ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-300"
                       )}
                    >
                       {f.isVisible ? <Eye size={22} /> : <EyeOff size={22} />}
                    </button>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Public</span>
                       <span className="text-[10px] font-bold text-slate-700">{f.isVisible ? 'LIVE' : 'HIDDEN'}</span>
                    </div>
                 </div>

                 <div className="flex justify-end gap-2">
                    {f.status === FeedbackStatus.PENDING && (
                      <>
                        <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.APPROVED)} className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm border border-green-100 active:scale-90 transition-transform">
                           <Check size={22} />
                        </button>
                        <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.REJECTED)} className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm border border-red-100 active:scale-90 transition-transform">
                           <X size={22} />
                        </button>
                      </>
                    )}
                    <button onClick={() => { setEditingFeedback(f); setEditMessage(f.message); }} className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100 active:scale-90 transition-transform">
                       <Edit3 size={22} />
                    </button>
                    <button onClick={() => setDeleteFeedbackId(f.id)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-transform">
                       <Trash2 size={22} />
                    </button>
                 </div>
              </div>
           </Card>
         )) : (
           <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] bg-white rounded-[3rem] border-2 border-dashed border-slate-100 italic">
              No feedback found
           </div>
         )}
      </div>

      {editingFeedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white border-0 rounded-[2.5rem]">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Edit Experience</h3>
            <textarea value={editMessage} onChange={(e) => setEditMessage(e.target.value)} className="w-full bg-slate-50 border-0 rounded-[1.5rem] p-6 text-base font-medium focus:ring-4 focus:ring-red-500/10 transition-all outline-none min-h-[180px] shadow-inner" />
            <div className="flex gap-4 mt-8">
              <Button onClick={handleSaveEdit} isLoading={savingEdit} className="flex-1 py-5 rounded-2xl text-base shadow-xl shadow-red-100">Synchronize Update</Button>
              <Button variant="outline" onClick={() => setEditingFeedback(null)} className="flex-1 py-5 rounded-2xl text-slate-400 border-slate-100">Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
