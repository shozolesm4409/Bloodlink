
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { submitFeedback, getUserFeedbacks, getAllFeedbacks, updateFeedbackStatus, deleteFeedback, subscribeToApprovedFeedbacks, updateFeedbackMessage, toggleFeedbackVisibility } from '../../services/api';
import { Card, Button, Input, Toast, useToast, Badge, ConfirmModal } from '../../components/UI';
import { DonationFeedback, FeedbackStatus, UserRole } from '../../types';
import { MessageSquareQuote, Send, Clock, Check, X, Trash2, User, Quote, Edit3, Eye, EyeOff } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import clsx from 'clsx';

export const DonationFeedbackPage = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<DonationFeedback[]>([]);

  useEffect(() => {
    if (user) {
      getUserFeedbacks(user.id).then(setHistory);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
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

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="text-center space-y-4 py-8">
         <div className="w-16 h-16 bg-red-600 text-white rounded-sm flex items-center justify-center mx-auto shadow-xl shadow-red-200 dark:shadow-red-900/30">
            <MessageSquareQuote size={32} />
         </div>
         <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Share Your Journey</h1>
         <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto transition-colors">Your stories inspire others to save lives. Share your experience with the BloodLink community.</p>
      </div>

      <Card className="p-8 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
         <form onSubmit={handleSubmit}>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write about your donation experience..."
              className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl text-lg font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/40 outline-none resize-none min-h-[150px] transition-colors"
              required
            />
            <div className="flex justify-end mt-6">
               <Button type="submit" isLoading={loading} className="px-8 py-4 rounded-2xl text-base shadow-xl bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/20 transition-colors">
                  <Send size={18} className="mr-2" /> Post Feedback
               </Button>
            </div>
         </form>
      </Card>

      <div className="space-y-6">
         <h3 className="text-xl font-black text-slate-900 dark:text-white px-2 transition-colors">My History</h3>
         {history.length > 0 ? history.map(f => (
           <Card key={f.id} className="p-6 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-sm flex flex-col md:flex-row gap-6 items-start border border-slate-100 dark:border-slate-800 transition-colors">
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

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await getAllFeedbacks();
      setFeedbacks(data);
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteFeedbackId} onClose={() => setDeleteFeedbackId(null)} onConfirm={handleDelete} title="Archive Feedback?" message="This feedback will be moved to archives." />

      {editingFeedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
           <Card className="w-full max-w-lg p-8 shadow-2xl bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-sm">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Edit Feedback</h3>
              <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4 h-32 resize-none outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 text-slate-700 dark:text-slate-200" />
              <div className="flex gap-4">
                 <Button onClick={handleSaveEdit} className="flex-1 rounded-xl">Save</Button>
                 <Button variant="outline" onClick={() => setEditingFeedback(null)} className="flex-1 rounded-xl">Cancel</Button>
              </div>
           </Card>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors">
         <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Moderate Feedback</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Review community posts.</p>
         </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
              <tr>
                <th className="px-1 py-1">Author</th>
                <th className="px-1 py-1">Message</th>
                <th className="px-1 py-1">Status</th>
                <th className="px-1 py-1">Visibility</th>
                <th className="px-1 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {feedbacks.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs font-bold font-sans">
                  <td className="px-1 py-1">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700">
                          {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <User size={14} className="p-1 text-slate-300 dark:text-slate-600 w-full h-full" />}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 dark:text-white transition-colors leading-tight">{f.userName}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase transition-colors leading-tight">{new Date(f.timestamp).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    <p className="text-slate-600 dark:text-slate-300 font-medium italic line-clamp-2 max-w-xs transition-colors text-[10px]">"{f.message}"</p>
                  </td>
                  <td className="px-1 py-1"><Badge color={f.status === 'APPROVED' ? 'green' : (f.status === 'REJECTED' ? 'red' : 'yellow')} className="px-1.5 py-0.5 text-[8px] ring-1 ring-slate-100 dark:ring-slate-800 font-black">{f.status}</Badge></td>
                  <td className="px-1 py-1">
                    <button 
                      onClick={() => handleToggleVisibility(f.id, f.isVisible)} 
                      disabled={f.status !== FeedbackStatus.APPROVED}
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm border border-slate-100 dark:border-slate-800",
                        f.isVisible ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 opacity-50 grayscale"
                      )}
                      title={f.isVisible ? "Visible" : "Hidden"}
                    >
                      {f.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </td>
                  <td className="px-1 py-1 text-right">
                    <div className="flex justify-end gap-1">
                      {f.status === FeedbackStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.APPROVED)} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-all border border-green-100 dark:border-green-900/40" title="Approve">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.REJECTED)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all border border-red-100 dark:border-red-900/40" title="Reject">
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => { setEditingFeedback(f); setEditMessage(f.message); }} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all border border-blue-100 dark:border-blue-900/40" title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => setDeleteFeedbackId(f.id)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800" title="Archive">
                        <Trash2 size={16} />
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
  );
};

export const PublicFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToApprovedFeedbacks((data) => {
      setFeedbacks(data);
      setLoading(false);
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
                            {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <User className="p-3 text-slate-300 dark:text-slate-600 w-full h-full" />}
                         </div>
                         <div>
                            <p className="font-black text-slate-900 dark:text-white text-lg leading-tight transition-colors">{f.userName}</p>
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
