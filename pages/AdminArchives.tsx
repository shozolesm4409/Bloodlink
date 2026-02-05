import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getDeletedUsers, getDeletedDonations, getDeletedLogs, getDeletedFeedbacks, getDeletedNotices, restoreDeletedUser, restoreDeletedDonation, restoreDeletedLog, restoreDeletedFeedback, restoreDeletedNotice, permanentlyDeleteArchivedFeedback } from '../services/api';
import { Card, Toast, useToast, ConfirmModal, Badge } from '../components/UI';
import { Trash2, RotateCcw, User as UserIcon, Archive, Calendar, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export const AdminArchives = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'donations' | 'logs' | 'feedbacks' | 'notices'>('users');
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    let res = [];
    try {
      if (tab === 'users') res = await getDeletedUsers();
      else if (tab === 'donations') res = await getDeletedDonations();
      else if (tab === 'logs') res = await getDeletedLogs();
      else if (tab === 'feedbacks') res = await getDeletedFeedbacks();
      else if (tab === 'notices') res = await getDeletedNotices();
      setData(res);
    } catch (err) {
      showToast("Data sync failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleRestore = async (id: string) => {
    if (!user) return;
    try {
      if (tab === 'users') await restoreDeletedUser(id, user);
      else if (tab === 'donations') await restoreDeletedDonation(id, user);
      else if (tab === 'logs') await restoreDeletedLog(id, user);
      else if (tab === 'feedbacks') await restoreDeletedFeedback(id, user);
      else if (tab === 'notices') await restoreDeletedNotice(id, user);
      showToast("Restored to active database.");
      fetchData();
    } catch (e) { showToast("Failed.", "error"); }
  };

  const handlePermanentDelete = async () => {
    if (!user || !confirmId) return;
    try {
      if (tab === 'feedbacks') await permanentlyDeleteArchivedFeedback(confirmId, user);
      showToast("Data permanently purged.");
      setConfirmId(null);
      fetchData();
    } catch (e) { showToast("Purge failed.", "error"); }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Scanning Vault...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handlePermanentDelete} title="Erase Permanently?" message="This action is irreversible and will erase the data from our global nodes." />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl"><Archive size={28} /></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Archives</h1>
              <p className="text-sm text-slate-500 font-medium">Vault for decommissioned records.</p>
           </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full shadow-inner">
          {['users', 'donations', 'logs', 'feedbacks', 'notices'].map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t as any)} 
              className={clsx(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", 
                tab === t ? "bg-white shadow-md text-red-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-2xl bg-white rounded-[3rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-10 py-6">Identity / Description</th>
                <th className="px-10 py-6">Moderator</th>
                <th className="px-10 py-6">Deleted At</th>
                <th className="px-10 py-6 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-4">
                      {(item.avatar || item.userAvatar) ? (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                          <img src={item.avatar || item.userAvatar} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                          <UserIcon size={18} className="text-slate-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900">{item.name || item.userName || item.subject || item.action || 'Archived Entry'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                     <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">{item.deletedBy || 'System'}</span>
                  </td>
                  <td className="px-10 py-5 text-slate-400 text-xs font-bold">
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="opacity-50" />
                       {new Date(item.deletedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRestore(item.id)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm bg-white" title="Restore"><RotateCcw size={20}/></button>
                      <button onClick={() => setConfirmId(item.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl shadow-sm bg-white" title="Purge"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic opacity-50">Archive category is empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6 pb-20 px-1">
         {data.length > 0 ? data.map(item => (
           <Card key={item.id} className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem] relative overflow-hidden group">
              <div className="flex items-start justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
                       {(item.avatar || item.userAvatar) ? (
                         <img src={item.avatar || item.userAvatar} className="w-full h-full object-cover" />
                       ) : (
                         <UserIcon size={24} className="text-slate-200" />
                       )}
                    </div>
                    <div className="min-w-0">
                       <h3 className="font-black text-slate-900 text-lg leading-tight truncate">
                          {item.name || item.userName || item.subject || item.action || 'Archived Entry'}
                       </h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                          <Clock size={12} /> {new Date(item.deletedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                       </p>
                    </div>
                 </div>
                 <div className="absolute top-6 right-6">
                    <Badge color="gray" className="text-[8px] px-2 py-0.5 tracking-tighter">ARCHIVED</Badge>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Moderated By</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase truncate block">{item.deletedBy || 'System'}</span>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Reference ID</span>
                    <span className="text-[9px] font-bold text-slate-600 font-mono truncate block">{item.id.substring(0, 8)}...</span>
                 </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                 <button 
                    onClick={() => handleRestore(item.id)} 
                    className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all border border-blue-100"
                 >
                    <RotateCcw size={18} /> Restore Record
                 </button>
                 <button 
                    onClick={() => setConfirmId(item.id)} 
                    className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-md border border-red-100 active:scale-95 transition-all"
                    title="Purge Permanently"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
           </Card>
         )) : (
           <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] bg-white rounded-[3rem] border-2 border-dashed border-slate-100 italic">
              Vault is empty
           </div>
         )}
      </div>

      <div className="p-8 bg-orange-50/50 rounded-[2.5rem] border border-orange-100 flex items-start gap-5">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-600 flex-shrink-0">
            <AlertCircle size={24} />
         </div>
         <p className="text-xs font-bold text-orange-700 leading-relaxed">
            ADMIN NOTICE: Restoring a record will immediately return it to the active database with its original status. Permanently purging a record is final and non-recoverable across all system nodes.
         </p>
      </div>
    </div>
  );
};
