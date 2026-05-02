
import React, { useEffect, useState } from 'react';
import { getVerificationLogs, archiveVerificationLog, purgeAllArchivedVerificationLogs } from '../../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal } from '../../components/UI';
import { ClipboardList, RotateCcw, Clock, User as UserIcon, ShieldCheck, Droplet, Trash2 } from 'lucide-react';
import { BloodGroup } from '../../types';

export const AdminVerificationHistory = () => {
  const { toastState, showToast, hideToast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isFinalDeleteConfirmOpen, setIsFinalDeleteConfirmOpen] = useState(false);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getVerificationLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveVerificationLog(id);
      showToast("Verification log archived successfully");
      fetchLogs();
      setLogToDelete(null);
    } catch (e) {
      showToast("Failed to archive log", "error");
    }
  };

  const handleInitialConfirm = () => {
    if (selectedBloodGroups.length === 0) {
      showToast("Please select at least one blood group", "error");
      return;
    }
    setIsDeleteAllOpen(false);
    setIsFinalDeleteConfirmOpen(true);
  };

  const handleDeleteAll = async () => {
    setIsProcessing(true);
    try {
        // Need to filter logs based on selectedBloodGroups
        const logsToArchive = logs.filter(log => selectedBloodGroups.includes(log.bloodGroup || 'Unknown'));
        for(const log of logsToArchive) {
            await archiveVerificationLog(log.id);
        }
        showToast(`Archived ${logsToArchive.length} logs successfully`);
        fetchLogs();
        setIsFinalDeleteConfirmOpen(false);
        setSelectedBloodGroups([]);
    } catch(e) {
        showToast("Failed to archive logs", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Calculate Blood Group Stats
  const groupCounts = logs.reduce((acc, log) => {
    const bg = log.bloodGroup || 'Unknown';
    acc[bg] = (acc[bg] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const toggleBloodGroup = (bg: string) => {
    setSelectedBloodGroups(prev => 
        prev.includes(bg) ? prev.filter(g => g !== bg) : [...prev, bg]
    );
  };

  if (loading) return (
    <div className="p-10 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.2em]">
      Retrieving History...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      
      <ConfirmModal 
        isOpen={!!logToDelete} 
        onClose={() => setLogToDelete(null)}
        onConfirm={() => logToDelete && handleArchive(logToDelete)}
        title="Archive Record"
        message="Are you sure you want to archive this verification record? It will be moved to System Archives."
      />

      <ConfirmModal 
        isOpen={isDeleteAllOpen} 
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleInitialConfirm}
        title="Archive All"
        message="Select blood groups to archive:"
      >
        <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.values(BloodGroup).map(bg => (
                <label key={bg} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedBloodGroups.includes(bg)} onChange={() => toggleBloodGroup(bg)} className="accent-red-600" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{bg}</span>
                    </div>
                    <span className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-full">{groupCounts[bg] || 0}</span>
                </label>
            ))}
        </div>
      </ConfirmModal>

      <ConfirmModal 
        isOpen={isFinalDeleteConfirmOpen} 
        onClose={() => setIsFinalDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        title="Confirm Delete"
        message={`Are you sure you want to delete verification logs for ${selectedBloodGroups.join(', ')}? This action cannot be undone.`}
        isLoading={isProcessing}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-100">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Verification History</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Log of public identity searches and authenticity checks.</p>
          </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2 rounded-xl">
              <RotateCcw size={18} /> Refresh Log
            </Button>
            <Button onClick={() => setIsDeleteAllOpen(true)} variant="danger" className="flex items-center gap-2 rounded-xl">
              <Trash2 size={18} /> Delete All
            </Button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.values(BloodGroup).map((bg) => (
          <div key={bg} className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
             <span className="text-red-600 dark:text-red-500 font-black text-lg">{bg}</span>
             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{groupCounts[bg] || 0} Checks</span>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[2.5rem]">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
              <tr>
                <th className="p-1.5 px-6">Timestamp</th>
                <th className="p-1.5 px-6">Member Searched</th>
                <th className="p-1.5 px-6">Blood Group</th>
                <th className="p-1.5 px-6 text-right">System ID</th>
                <th className="p-1.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-1.5 px-6">
                    <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-bold">
                      <Clock size={14} />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-1.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
                        <UserIcon size={14} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{log.memberName}</span>
                    </div>
                  </td>
                  <td className="p-1.5 px-6">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-black">
                       <Droplet size={14} className="fill-current" />
                       {log.bloodGroup}
                    </div>
                  </td>
                  <td className="p-1.5 px-6 text-right font-mono text-xs text-slate-400 dark:text-slate-500 font-bold">
                    {log.memberId}
                  </td>
                  <td className="p-1.5 px-6 text-center">
                    <button onClick={() => setLogToDelete(log.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Archive">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest italic opacity-50">
                    No verification records found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {logs.length > 0 ? logs.map(log => (
          <Card key={log.id} className="p-2.5 border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] flex flex-col gap-3 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-inner">
                      <UserIcon size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">{log.memberName}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">{log.memberId}</p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-900/50">
                       <Droplet size={14} className="fill-current" />
                       <span className="text-[10px] font-black">{log.bloodGroup}</span>
                    </div>
                    <button onClick={() => setLogToDelete(log.id)} className="text-red-600 text-[10px] font-bold uppercase tracking-widest px-2">Delete</button>
                </div>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                <Clock size={12} />
                <span>Checked on {new Date(log.timestamp).toLocaleString()}</span>
             </div>
          </Card>
        )) : (
          <div className="py-20 text-center text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest italic bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             No verification records found.
          </div>
        )}
      </div>
      
      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
         <ShieldCheck size={24} className="text-blue-600 dark:text-blue-400" />
         <p className="text-xs font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
           This menu stores tracking data from the public verification page. It helps monitors understand how often and which donor identities are being validated by external parties.
         </p>
      </div>
    </div>
  );
};
