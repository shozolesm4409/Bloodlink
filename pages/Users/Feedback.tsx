
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { submitFeedback, getUserFeedbacks, getAllFeedbacks, updateFeedbackStatus, deleteFeedback, subscribeToApprovedFeedbacks, updateFeedbackMessage, toggleFeedbackVisibility, requestFeedbackAccess, getUsers } from '../../services/api';
import { Card, Button, Input, Toast, useToast, Badge, ConfirmModal } from '../../components/UI';
import { DonationFeedback, FeedbackStatus, UserRole, User } from '../../types';
import { MessageSquareQuote, Send, Clock, Check, X, Trash2, User as UserIcon, Quote, Edit3, Eye, EyeOff, Lock, ShieldAlert, BadgeCheck } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import clsx from 'clsx';

export const DonationFeedbackPage = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<DonationFeedback[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (user) {
      getUserFeedbacks(user.id).then(data => {
        const enrichedData = data.map(f => ({
          ...f,
          userApprovedBadge: f.userApprovedBadge || user.approvedBadge || (user.role === UserRole.SUPERADMIN ? 'blue' : null)
        }));
        setHistory(enrichedData);
      });
    }
  }, [user]);

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await requestFeedbackAccess(user);
      updateUser({ ...user, feedbackAccessRequested: true });
      showToast("Access requested successfully.");
    } catch (e) {
      showToast("Request failed.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const hasAccess = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN || user?.hasFeedbackAccess;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    if (!hasAccess) {
       showToast("Access Restricted. Please request permission.", "error");
       return;
    }
    setLoading(true);
    try {
      await submitFeedback(message, user);
      showToast("Feedback submitted for review.");
      setMessage('');
      getUserFeedbacks(user.id).then(setHistory);
    } catch (e) {
      showToast("Submission failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (user && !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500 transition-colors">
        <Toast {...toastState} onClose={hideToast} />
        <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="w-24 h-24 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-sm flex items-center justify-center mx-auto shadow-inner transition-colors">
            <Lock size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Feedback Posting Locked</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-colors">
              ফিডব্যাক পোস্ট করার অপশনটি শুধুমাত্র ভেরিফাইড ইউজারদের জন্য। এ্যাডমিনের কাছে এক্সেস রিকোয়েস্ট পাঠান।
            </p>
          </div>
          
          {user.feedbackAccessRequested ? (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-2xl flex items-center justify-center gap-3 border border-yellow-100 dark:border-yellow-900/30 font-black uppercase tracking-widest text-xs transition-colors">
              <ShieldAlert size={18} /> Request Pending Approval
            </div>
          ) : (
            <Button onClick={handleRequestAccess} isLoading={isRequesting} className="w-full py-5 rounded-2xl text-lg shadow-xl shadow-green-100 dark:shadow-none bg-green-600 hover:bg-green-700">
              Request Access to Post Feedback
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-5 transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="text-center space-y-2 py-4">
         <div className="w-16 h-16 bg-red-600 text-white rounded-sm flex items-center justify-center mx-auto shadow-xl shadow-red-200 dark:shadow-red-900/30">
            <MessageSquareQuote size={32} />
         </div>
         <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Share Your Journey</h1>
         <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto transition-colors">Your stories inspire others to save lives. Share your experience with the BloodLink community.</p>
      </div>

      <Card className="p-4 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
         <form onSubmit={handleSubmit}>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write about your donation experience..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl text-lg font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/40 outline-none resize-none min-h-[150px] transition-colors"
              required
            />
            <div className="flex justify-end mt-4">
               <Button type="submit" isLoading={loading} className="px-8 py-4 rounded-2xl text-base shadow-xl bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/20 transition-colors">
                  <Send size={18} className="mr-2" /> Post Feedback
               </Button>
            </div>
         </form>
      </Card>

      <div className="space-y-2">
         <h3 className="text-xl font-black text-slate-900 dark:text-white transition-colors">My History</h3>
         {history.length > 0 ? history.map(f => (
           <Card key={f.id} className="p-3 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-sm flex flex-col md:flex-row gap-6 items-start border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                    <Badge color={f.status === 'APPROVED' ? 'green' : (f.status === 'REJECTED' ? 'red' : 'yellow')} className="ring-1 ring-slate-100 dark:ring-slate-800">{f.status}</Badge>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest flex items-center gap-1 transition-colors"><Clock size={12}/> {new Date(f.timestamp).toLocaleDateString()}</span>
                 </div>
                 <p className="text-slate-600 dark:text-slate-300 font-medium italic transition-colors">"{f.message}"</p>
              </div>
           </Card>
         )) : <div className="text-center py-10 text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest">No history yet</div>}
      </div>
    </div>
  );
};

export const FeedbackApprovalPage = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  
  const [editingFeedback, setEditingFeedback] = useState<DonationFeedback | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [viewingFeedback, setViewingFeedback] = useState<DonationFeedback | null>(null);
  const [activeTab, setActiveTab] = useState<FeedbackStatus>(FeedbackStatus.PENDING);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const authUsers = await getUsers();
      const userMap = new Map(authUsers.map(u => [u.id, u]));

      const data = await getAllFeedbacks();
      const enrichedData = data.map(f => {
        const u = userMap.get(f.userId);
        return {
          ...f,
          userApprovedBadge: f.userApprovedBadge || u?.approvedBadge || (u?.role === UserRole.SUPERADMIN ? 'blue' : null)
        };
      });
      setFeedbacks(enrichedData);
    } catch (e) {
      showToast("Failed to fetch feedbacks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleStatusUpdate = async (id: string, status: FeedbackStatus) => {
    try {
      await updateFeedbackStatus(id, status, true); // visible by default on approve
      showToast(`Feedback ${status.toLowerCase()}.`);
      fetchFeedbacks();
    } catch (e) { showToast("Action failed", "error"); }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      await toggleFeedbackVisibility(id, !current);
      showToast(`Visibility toggled.`);
      fetchFeedbacks();
    } catch (e) { showToast("Action failed", "error"); }
  };

  const handleDelete = async () => {
    if (!user || !deleteFeedbackId) return;
    try {
      await deleteFeedback(deleteFeedbackId, user);
      showToast("Feedback archived.");
      setDeleteFeedbackId(null);
      fetchFeedbacks();
    } catch (e) { showToast("Delete failed", "error"); }
  };

  const handleSaveEdit = async () => {
    if (!user || !editingFeedback) return;
    try {
      await updateFeedbackMessage(editingFeedback.id, editMessage, user);
      showToast("Content updated.");
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (e) { showToast("Update failed", "error"); }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse">Loading Feedbacks...</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteFeedbackId} onClose={() => setDeleteFeedbackId(null)} onConfirm={handleDelete} title="Archive Feedback?" message="This feedback will be moved to archives." />

      {editingFeedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
           <Card className="w-full max-w-lg p-6 shadow-2xl bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-sm">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Edit Feedback</h3>
              <textarea autoFocus value={editMessage} onChange={e => setEditMessage(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-sm mb-4 h-32 resize-none outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 text-slate-700 dark:text-slate-200 text-sm leading-relaxed" />
              <div className="flex gap-4">
                 <Button onClick={handleSaveEdit} className="flex-1 rounded-sm !py-2.5">Save</Button>
                 <Button variant="outline" onClick={() => setEditingFeedback(null)} className="flex-1 rounded-sm !py-2.5">Cancel</Button>
              </div>
           </Card>
        </div>
      )}

      {viewingFeedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200" onClick={() => setViewingFeedback(null)}>
           <Card className="w-full max-w-lg p-6 shadow-2xl bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-sm" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white">Submission Message</h3>
                 <div className="flex gap-1">
                    <button onClick={() => { setEditingFeedback(viewingFeedback); setEditMessage(viewingFeedback.message); setViewingFeedback(null); }} className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-500 hover:text-blue-600 rounded-md transition-colors" title="Edit Message">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => setViewingFeedback(null)} className="text-slate-400 hover:text-slate-600 p-1.5" title="Close">
                      <X size={16} />
                    </button>
                 </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-sm text-slate-700 dark:text-slate-200 text-sm leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                 {viewingFeedback.message.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0 min-h-[1em]">{line}</p>
                 ))}
              </div>
           </Card>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 transition-colors">
         <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Moderate Feedback</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1 transition-colors">Review and publish community stories.</p>
         </div>
      </div>
      
      <div className="">
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {[FeedbackStatus.PENDING, FeedbackStatus.APPROVED, FeedbackStatus.REJECTED].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={clsx(
                "px-4 py-2 font-black text-xs uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                activeTab === status
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {status} {activeTab === status && `(${feedbacks.filter(f => f.status === status).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block">
        <Card className="overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                <tr>
                  <th className="p-1">Story Author</th>
                  <th className="p-1">Submission Message</th>
                  <th className="p-1">Status</th>
                  <th className="p-1">Live</th>
                  <th className="p-1 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {feedbacks.filter(f => f.status === activeTab).map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs font-bold font-sans">
                    <td className="p-1">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700 shadow-inner">
                            {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="p-1.5 text-slate-300 dark:text-slate-600 w-full h-full" />}
                         </div>
                         <div>
                            <p className="font-black text-slate-900 dark:text-white transition-colors leading-tight flex items-center gap-1">
                               {f.userName}
                               {f.userApprovedBadge && <BadgeCheck size={14} className={
                                 f.userApprovedBadge === 'pink' ? 'text-pink-500' :
                                 f.userApprovedBadge === 'red' ? 'text-red-500' :
                                 f.userApprovedBadge === 'green' ? 'text-green-500' :
                                 'text-blue-500'
                               } />}
                            </p>
                            <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{new Date(f.timestamp).toLocaleDateString()}</p>
                         </div>
                      </div>
                    </td>
                    <td className="p-1">
                      <p className="text-slate-600 dark:text-slate-300 font-medium italic line-clamp-2 min-w-[250px] max-w-[400px] transition-colors text-[10px] leading-relaxed">"{f.message}"</p>
                    </td>
                    <td className="p-1">
                      <Badge color={f.status === 'APPROVED' ? 'green' : (f.status === 'REJECTED' ? 'red' : 'yellow')} className="px-1.5 py-0.5 text-[8px] ring-1 ring-current font-black tracking-widest uppercase">{f.status}</Badge>
                    </td>
                    <td className="p-1">
                      <button 
                        onClick={() => handleToggleVisibility(f.id, f.isVisible)} 
                        disabled={f.status !== FeedbackStatus.APPROVED}
                        className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm border",
                          f.isVisible ? "bg-blue-600 text-white border-blue-500" : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 opacity-50 grayscale"
                        )}
                        title={f.isVisible ? "Published & Live" : "Private Draft"}
                      >
                        {f.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </td>
                    <td className="p-1 text-right">
                      <div className="flex justify-end gap-1">
                        {f.status === FeedbackStatus.PENDING && (
                          <>
                            <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.APPROVED)} className="p-1.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-all border border-green-100 dark:border-green-900/40" title="Approve Story">
                              <Check size={14} />
                            </button>
                            <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.REJECTED)} className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-100 dark:border-red-900/40" title="Reject Story">
                              <X size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => setViewingFeedback(f)} className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-100 dark:border-blue-900/40" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setDeleteFeedbackId(f.id)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 transition-all rounded-lg border border-slate-100 dark:border-slate-700" title="Archive Post">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-1 pb-5 mt-2">
        {feedbacks.filter(f => f.status === activeTab).map(f => (
           <Card key={f.id} className="p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md rounded-lg transition-colors relative overflow-hidden">
             <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                      {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="p-2 text-slate-300 dark:text-slate-600 w-full h-full" />}
                   </div>
                   <div>
                      <h3 className="font-black text-slate-900 dark:text-white leading-tight text-xs flex items-center gap-1">
                         {f.userName}
                         {f.userApprovedBadge && <BadgeCheck size={12} className={
                           f.userApprovedBadge === 'pink' ? 'text-pink-500' :
                           f.userApprovedBadge === 'red' ? 'text-red-500' :
                           f.userApprovedBadge === 'green' ? 'text-green-500' :
                           'text-blue-500'
                         } />}
                      </h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(f.timestamp).toLocaleDateString()}</p>
                   </div>
                </div>
                <Badge color={f.status === 'APPROVED' ? 'green' : (f.status === 'REJECTED' ? 'red' : 'yellow')} className="text-[7px] font-black uppercase tracking-tighter ring-1 ring-current">
                   {f.status}
                </Badge>
             </div>

             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mb-3 relative group transition-all border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-600 dark:text-slate-200 font-medium leading-relaxed italic line-clamp-2">"{f.message}"</p>
             </div>

             <div className="flex items-center gap-1.5 mt-3 flex-nowrap">
                <button 
                   onClick={() => handleToggleVisibility(f.id, f.isVisible)} 
                   disabled={f.status !== FeedbackStatus.APPROVED}
                   className={clsx(
                     "px-3 py-2 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                     f.isVisible ? "bg-blue-600 text-white shadow-sm" : "bg-slate-200 dark:bg-slate-700 text-slate-400 grayscale opacity-50"
                   )}
                   title={f.isVisible ? "Published & Live" : "Private Draft"}
                 >
                   {f.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <div className="flex gap-1.5 flex-1 flex-nowrap">
                   {f.status === FeedbackStatus.PENDING && (
                     <>
                        <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.APPROVED)} className="px-3 py-2 bg-green-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center shadow-sm">
                           <Check size={12} />
                        </button>
                        <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.REJECTED)} className="px-3 py-2 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center shadow-sm">
                           <X size={12} />
                        </button>
                     </>
                   )}
                   <button onClick={() => setViewingFeedback(f)} className="flex-1 py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 border border-blue-100 transition-all">
                      <Eye size={12}/> View
                   </button>
                   <button onClick={() => setDeleteFeedbackId(f.id)} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center" title="Archive Post">
                      <Trash2 size={14}/>
                   </button>
                </div>
             </div>
          </Card>
        ))}
      </div>

      {feedbacks.length === 0 && (
         <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
               <MessageSquareQuote size={32} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic">No feedback discovered</p>
         </div>
      )}
    </div>
  );
};

export const PublicFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    getUsers().then(users => {
      const userMap = new Map(users.map(u => [u.id, u]));
      unsub = subscribeToApprovedFeedbacks((data) => {
        const enrichedData = data.map(f => {
          const u = userMap.get(f.userId);
          return {
            ...f,
            userApprovedBadge: f.userApprovedBadge || u?.approvedBadge || (u?.role === UserRole.SUPERADMIN ? 'blue' : null)
          };
        });
        setFeedbacks(enrichedData);
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  return (
    <PublicLayout>
      <div className="py-20 px-6 lg:px-10 bg-[#f8f9fa] dark:bg-slate-950 min-h-screen transition-colors">
         <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="text-center">
               <div className="w-20 h-20 bg-red-600 text-white rounded-sm flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-200 dark:shadow-red-900/30">
                  <MessageSquareQuote size={40} />
               </div>
               <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 transition-colors">Donor Voices</h1>
               <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-2xl mx-auto transition-colors">Real stories from real heroes who are making a difference in the community.</p>
            </div>

            {loading ? <div className="text-center py-20 opacity-30 font-black uppercase text-slate-400 dark:text-slate-600">Loading Stories...</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {feedbacks.map(f => (
                   <div key={f.id} className="bg-white dark:bg-slate-900 p-10 rounded-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800 flex flex-col hover:transform hover:-translate-y-2 transition-all duration-300">
                      <Quote size={48} className="text-red-100 dark:text-red-900/20 fill-current mb-6" />
                      <p className="text-slate-700 dark:text-slate-200 font-bold text-lg leading-relaxed mb-10 flex-1 transition-colors">"{f.message}"</p>
                      
                      <div className="flex items-center gap-4 pt-8 border-t border-slate-50 dark:border-slate-800">
                         <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                            {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-3 text-slate-300 dark:text-slate-600 w-full h-full" />}
                         </div>
                         <div>
                            <p className="font-black text-slate-900 dark:text-white text-lg leading-tight transition-colors flex items-center gap-2">
                               {f.userName}
                               {f.userApprovedBadge && <BadgeCheck size={18} className={
                                 f.userApprovedBadge === 'pink' ? 'text-pink-500' :
                                 f.userApprovedBadge === 'red' ? 'text-red-500' :
                                 f.userApprovedBadge === 'green' ? 'text-green-500' :
                                 'text-blue-500'
                               } />}
                            </p>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 transition-colors">{new Date(f.timestamp).toLocaleDateString()}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            )}
         </div>
      </div>
    </PublicLayout>
  );
};
