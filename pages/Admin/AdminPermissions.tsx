
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getUsers, handleDirectoryAccess, handleSupportAccess, handleFeedbackAccess, handleIDCardAccess, getAllFeedbacks, updateFeedbackStatus } from '../../services/api';
import { Card, Button, Badge, Toast, useToast } from '../../components/UI';
import { User, DonationFeedback, FeedbackStatus } from '../../types';
import { ShieldAlert, Check, X, User as UserIcon, MessageSquareQuote, Users, Search, LifeBuoy, MessageSquare, IdCard } from 'lucide-react';
import clsx from 'clsx';

export const AdminPermissions = () => {
  const { user: admin } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [requests, setRequests] = useState<User[]>([]);
  const [pendingFeedbacks, setPendingFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allUsers, allFeedbacks] = await Promise.all([getUsers(), getAllFeedbacks()]);
      setRequests(allUsers.filter(u => u.directoryAccessRequested || u.supportAccessRequested || u.feedbackAccessRequested || u.idCardAccessRequested));
      setPendingFeedbacks(allFeedbacks.filter(f => f.status === FeedbackStatus.PENDING));
    } catch (e) {
      showToast("Data fetch failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (uid: string, type: 'directory' | 'support' | 'feedback' | 'idcard', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(uid, approve, admin);
      else if (type === 'support') await handleSupportAccess(uid, approve, admin);
      else if (type === 'feedback') await handleFeedbackAccess(uid, approve, admin);
      else if (type === 'idcard') await handleIDCardAccess(uid, approve, admin);
      showToast(`Access ${approve ? 'Granted' : 'Denied'}.`);
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
  };

  const handleFeedbackApproval = async (id: string, approve: boolean) => {
    if (!admin) return;
    try {
      await updateFeedbackStatus(id, approve ? FeedbackStatus.APPROVED : FeedbackStatus.REJECTED, true);
      showToast("Feedback Moderated.");
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse uppercase tracking-widest transition-colors">Scanning Requests...</div>;

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700 transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="space-y-8">
        <div className="flex items-center gap-4 transition-colors">
          <div className="p-4 bg-red-600 text-white rounded-sm shadow-xl shadow-red-100 dark:shadow-none"><ShieldAlert size={28} /></div>
          <div><h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Access Requests</h1><p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-[10px] transition-colors">Verification Pending</p></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-h-[700px] overflow-y-auto custom-scrollbar p-2 transition-colors">
          {requests.map(u => (
            <Card key={u.id} className="p-8 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-sm overflow-hidden group transition-colors">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 rounded-sm bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-md overflow-hidden flex items-center justify-center font-black text-slate-400 dark:text-slate-500 transition-colors">
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white truncate tracking-tight transition-colors">{u.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{u.email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {u.directoryAccessRequested && (
                  <RequestItem title="Directory Access" type="directory" uid={u.id} onAction={handleAction} icon={Search} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/20" />
                )}
                {u.supportAccessRequested && (
                  <RequestItem title="Support Access" type="support" uid={u.id} onAction={handleAction} icon={LifeBuoy} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/20" />
                )}
                {u.feedbackAccessRequested && (
                  <RequestItem title="Feedback Access" type="feedback" uid={u.id} onAction={handleAction} icon={MessageSquare} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-950/20" />
                )}
                {u.idCardAccessRequested && (
                  <RequestItem title="Digital ID Card" type="idcard" uid={u.id} onAction={handleAction} icon={IdCard} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-950/20" />
                )}
              </div>
            </Card>
          ))}
          {requests.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 italic transition-colors">No pending requests</div>}
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-4 transition-colors">
          <div className="p-4 bg-blue-600 text-white rounded-sm shadow-xl shadow-blue-100 dark:shadow-none"><MessageSquareQuote size={28} /></div>
          <div><h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Content Moderation</h1><p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-[10px] transition-colors">Feedback Approval Queue</p></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[700px] overflow-y-auto custom-scrollbar p-2 transition-colors">
          {pendingFeedbacks.map(f => (
            <Card key={f.id} className="p-8 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-sm flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                    {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-3 text-slate-300 dark:text-slate-600" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white transition-colors">{f.userName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest transition-colors">{new Date(f.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -top-4 -left-2 text-6xl text-slate-50 dark:text-slate-800/50 font-serif leading-none select-none group-hover:text-red-50 dark:group-hover:text-red-950 transition-colors">“</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-8 relative z-10 bg-slate-50 dark:bg-slate-950 p-6 rounded-sm border border-slate-100/50 dark:border-slate-800 leading-relaxed font-medium transition-colors">"{f.message}"</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => handleFeedbackApproval(f.id, true)} className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg border-0 transition-colors">Approve</Button>
                <Button onClick={() => handleFeedbackApproval(f.id, false)} variant="outline" className="flex-1 py-4 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40 rounded-2xl transition-colors">Reject</Button>
              </div>
            </Card>
          ))}
          {pendingFeedbacks.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 italic transition-colors">Queue is clear</div>}
        </div>
      </div>
    </div>
  );
};

const RequestItem = ({ title, type, uid, onAction, icon: Icon, color, bg }: any) => (
  <div className={clsx("flex items-center justify-between p-4 rounded-2xl border border-transparent shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all bg-slate-50/50 dark:bg-slate-950/50 group transition-colors")}>
    <div className="flex items-center gap-3">
      <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm", bg, color)}>
        <Icon size={18} />
      </div>
      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest transition-colors">{title}</span>
    </div>
    <div className="flex gap-2 opacity-100 transition-opacity">
      <button onClick={() => onAction(uid, type, true)} className="p-1.5 bg-white dark:bg-slate-900 text-green-600 dark:text-green-500 rounded-lg border border-green-100 dark:border-green-900 transition-all shadow-sm hover:bg-green-600 hover:text-white transition-colors"><Check size={16}/></button>
      <button onClick={() => onAction(uid, type, false)} className="p-1.5 bg-white dark:bg-slate-900 text-red-600 dark:text-red-500 rounded-lg border border-red-100 dark:border-red-900 transition-all shadow-sm hover:bg-red-600 hover:text-white transition-colors"><X size={16}/></button>
    </div>
  </div>
);
