
import React, { useEffect, useState } from 'react';
import { getLogs, deleteLogEntry, purgeAllLogs } from '../../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal } from '../../components/UI';
import { useAuth } from '../../AuthContext';
import { AuditLog } from '../../types';
import { RotateCcw, User as UserIcon, Trash2, Clock, Activity, ShieldCheck, Filter } from 'lucide-react';
import clsx from 'clsx';

export const AdminSystemLogs = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [selectedActionsForPurge, setSelectedActionsForPurge] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filtering state
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (err) {
      showToast("Log retrieval failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    setActionLoading(true);
    try {
      await deleteLogEntry(deleteId, user);
      showToast("Log entry archived.");
      setDeleteId(null);
      fetchLogs();
    } catch (e) { showToast("Failed to delete log.", "error"); }
    finally { setActionLoading(false); }
  };

  const handlePurgeAll = async () => {
    if (!user) return;
    if (selectedActionsForPurge.length === 0) {
      showToast("Please select at least one action to purge.", "info");
      return;
    }
    setActionLoading(true);
    try {
      await purgeAllLogs(user, selectedActionsForPurge);
      showToast(`${selectedActionsForPurge.length} log action types archived to system archives.`);
      setConfirmAll(false);
      setSelectedActionsForPurge([]);
      fetchLogs();
    } catch (e) {
      showToast("Failed to archive logs.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActionSelection = (action: string) => {
    setSelectedActionsForPurge(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action) 
        : [...prev, action]
    );
  };

  // Get unique action codes for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();

  // Apply filtering
  const filteredLogs = actionFilter === 'ALL' 
    ? logs 
    : logs.filter(log => log.action === actionFilter);

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-xs animate-pulse">Syncing Security Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Archive Log Entry?" 
        message="This entry will be moved to system archives and removed from active logs." 
        isLoading={actionLoading} 
      />
      <ConfirmModal 
        isOpen={confirmAll} 
        onClose={() => setConfirmAll(false)} 
        onConfirm={handlePurgeAll} 
        title="Selective Audit Archive" 
        message="Select the event types you wish to move to system archives. These will no longer be visible in the active logs." 
        isLoading={actionLoading} 
      >
        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 custom-scrollbar">
          {uniqueActions.map(action => (
            <label key={action} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedActionsForPurge.includes(action)}
                onChange={() => toggleActionSelection(action)}
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer transition-all"
              />
              <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 group-hover:text-red-500 transition-colors truncate">{action}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-between items-center px-1">
          <button 
            onClick={() => setSelectedActionsForPurge(uniqueActions)} 
            className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
          >
            Select All
          </button>
          <button 
            onClick={() => setSelectedActionsForPurge([])} 
            className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:underline"
          >
            Clear Selected
          </button>
        </div>
      </ConfirmModal>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
             <Activity className="text-red-600" /> Security Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 transition-colors">Monitoring global administrative events.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
           {/* ALL DELETE button */}
           {logs.length > 0 && (
             <Button onClick={() => setConfirmAll(true)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-sm px-6 py-3.5 shadow-xl shadow-red-100 dark:shadow-red-900/10 text-[10px] font-black uppercase tracking-widest transition-all">
               <Trash2 size={16} className="mr-2" /> ALL DELETE
             </Button>
           )}

           {/* Action Filter */}
           <div className="relative group w-full sm:w-auto transition-colors">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-red-600 transition-colors pointer-events-none">
                <Filter size={16} />
              </div>
              <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full sm:w-60 pl-11 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-red-500/10 shadow-sm appearance-none cursor-pointer transition-colors"
              >
                <option value="ALL">All Event Types</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action} className="bg-white dark:bg-slate-900">{action}</option>
                ))}
              </select>
           </div>

           <Button onClick={fetchLogs} variant="outline" className="w-full sm:w-auto flex items-center gap-3 rounded-sm px-8 py-3.5 border-slate-200 dark:border-slate-800 shadow-sm hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest transition-colors">
             <RotateCcw size={16} className={clsx(loading && "animate-spin")} /> 
             Refresh Feed
           </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 rounded-sm transition-colors">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
              <tr>
                <th className="px-1 py-1">Timestamp</th>
                <th className="px-1 py-1">Actor</th>
                <th className="px-1 py-1">Action Code</th>
                <th className="px-1 py-1">Event Details</th>
                <th className="px-1 py-1 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group text-xs font-bold font-sans">
                  <td className="px-1 py-1">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-[10px] transition-colors">
                      <Clock size={12} className="opacity-50" />
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0 transition-colors">
                          {log.userAvatar ? (
                             <img src={log.userAvatar} className="w-full h-full object-cover" alt={log.userName} />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center">
                                <UserIcon size={14} className="text-slate-300 dark:text-slate-600" />
                             </div>
                          )}
                       </div>
                       <span className="font-black text-slate-900 dark:text-white transition-colors leading-tight">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    <Badge color="blue" className="px-2 py-0.5 text-[8px] ring-1 ring-blue-50 dark:ring-blue-900/20 uppercase tracking-widest">{log.action}</Badge>
                  </td>
                  <td className="px-1 py-1 text-slate-600 dark:text-slate-300 font-medium max-w-xs transition-colors text-[10px] italic">{log.details}</td>
                  <td className="px-1 py-1 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                         onClick={() => setDeleteId(log.id)} 
                         className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors" 
                         title="Archive Entry"
                      >
                         <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] italic opacity-50 transition-colors">No logs matching filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6 pb-20 px-1">
        {filteredLogs.length > 0 ? filteredLogs.map(log => (
          <Card key={log.id} className="p-8 border border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-sm relative overflow-hidden group active:scale-[0.98] transition-colors transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center flex-shrink-0 transition-colors">
                  {log.userAvatar ? (
                    <img src={log.userAvatar} className="w-full h-full object-cover" alt={log.userName} />
                  ) : (
                    <UserIcon className="text-slate-200 dark:text-slate-600" size={24} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 dark:text-white text-lg leading-tight truncate transition-colors">{log.userName}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock size={12} className="text-slate-300 dark:text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <Badge color="blue" className="text-[8px] px-2 py-0.5 ring-4 ring-blue-50/50 dark:ring-blue-900/20 uppercase tracking-tighter">{log.action}</Badge>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/50 p-6 rounded-sm border border-slate-100 dark:border-slate-700 mb-6 transition-colors">
               <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic transition-colors">
                 "{log.details}"
               </p>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setDeleteId(log.id)} 
                className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm border border-red-100 dark:border-red-900/30 transition-colors"
              >
                <Trash2 size={16} /> Archive Event
              </button>
            </div>
          </Card>
        )) : (
          <div className="py-24 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] bg-white dark:bg-slate-900 rounded-sm border-2 border-dashed border-slate-100 dark:border-slate-800 italic transition-colors">
            No activity records found
          </div>
        )}
      </div>

      <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-sm border border-blue-100 dark:border-blue-900/30 flex items-start lg:items-center gap-6 transition-colors">
         <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-sm flex items-center justify-center shadow-lg text-blue-600 dark:text-blue-400 flex-shrink-0 transition-colors border dark:border-slate-800">
            <ShieldCheck size={28} />
         </div>
         <div>
            <p className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-1 transition-colors">Blockchain Security Protocol</p>
            <p className="text-[11px] font-medium text-blue-700 dark:text-blue-500 leading-relaxed transition-colors">
              SECURITY ADVISORY: Audit logs are recorded on an immutable ledger. Filtering allows administrators to perform rapid incident response. Please report any unauthorized access codes to the System Architect immediately.
            </p>
         </div>
      </div>
    </div>
  );
};
