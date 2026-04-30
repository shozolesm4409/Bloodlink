
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getHelpRequests, updateHelpRequest, deleteHelpRequest } from '../../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal, Select, Input } from '../../components/UI';
import { HelpRequest, HelpStatus, UserRole } from '../../types';
import { HelpCircle, Save, Trash2, Edit2, CheckCircle2, AlertCircle, XCircle, Search, Filter } from 'lucide-react';
import clsx from 'clsx';

export const AdminHelpCenter = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HelpStatus>(HelpStatus.PENDING);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action States
  const [editItem, setEditItem] = useState<HelpRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, { status: HelpStatus, text: string }>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getHelpRequests();
      setRequests(data);
      // Initialize local state for inline editing
      const initialRemarks: any = {};
      data.forEach(req => {
        initialRemarks[req.id] = { status: req.status, text: req.remark || '' };
      });
      setRemarks(initialRemarks);
    } catch (e) {
      showToast("Failed to fetch requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRemarkChange = (id: string, field: 'status' | 'text', value: string) => {
    setRemarks(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = async (id: string) => {
    if (!user || !remarks[id]) return;
    setSavingId(id);
    try {
      await updateHelpRequest(id, {
        status: remarks[id].status,
        remark: remarks[id].text
      }, user);
      showToast("Request updated successfully.");
      fetchData();
    } catch (e) {
      showToast("Update failed.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteHelpRequest(deleteId, user);
      showToast("Request deleted.");
      setDeleteId(null);
      fetchData();
    } catch (e) {
      showToast("Delete failed.", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !editItem) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
    };
    
    try {
      await updateHelpRequest(editItem.id, updates, user);
      showToast("Details updated.");
      setEditItem(null);
      fetchData();
    } catch (e) {
      showToast("Update failed.", "error");
    }
  };

  const isSuperAdmin = user?.role === UserRole.SUPERADMIN;

  const filteredRequests = requests.filter(req => {
    const matchesFilter = req.status === filter;
    const matchesSearch = req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.phone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const TabButton = ({ status, label, icon: Icon, color }: any) => (
    <button 
      onClick={() => setFilter(status)}
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transition-colors",
        filter === status ? `bg-white dark:bg-slate-900 shadow-lg ${color}` : "text-slate-400 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50"
      )}
    >
      <Icon size={16} /> {label}
      <span className={clsx("ml-1 px-1.5 py-0.5 rounded-md text-[9px]", filter === status ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-200 dark:bg-slate-700 text-slate-500")}>
        {requests.filter(r => r.status === status).length}
      </span>
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete Request?" 
        message="This action cannot be undone." 
      />

      {editItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-lg p-8 shadow-2xl bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 transition-colors">Edit Request Details</h3>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <Input label="Name" name="name" defaultValue={editItem.name} required />
              <Input label="Phone" name="phone" defaultValue={editItem.phone} required />
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1 transition-colors">Message</label>
                <textarea name="message" defaultValue={editItem.message} rows={4} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 dark:border dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-colors" required />
              </div>
              <div className="flex gap-4 pt-2">
                <Button type="submit" className="flex-1 rounded-xl">Update</Button>
                <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1 rounded-xl">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-8 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 text-white rounded-sm shadow-xl shadow-purple-100 dark:shadow-purple-900/30">
            <HelpCircle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Help Center Manage</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Support tickets and inquiries.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar border border-slate-200 dark:border-slate-700 transition-colors">
          <TabButton status={HelpStatus.PENDING} label="Pending" icon={AlertCircle} color="text-yellow-600" />
          <TabButton status={HelpStatus.COMPLETE} label="Complete" icon={CheckCircle2} color="text-green-600 dark:text-green-400" />
          <TabButton status={HelpStatus.REJECTED} label="Rejected" icon={XCircle} color="text-red-600 dark:text-red-400" />
        </div>
        <div className="relative w-full md:w-80">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
           <input 
             type="text" 
             placeholder="Search by name or phone..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-colors"
           />
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-20 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse">Loading Requests...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                <tr>
                  <th className="px-1 py-1 w-12 text-center">SL</th>
                  <th className="px-1 py-1">Name & Phone</th>
                  <th className="px-1 py-1 max-w-xs">Message</th>
                  <th className="px-1 py-1 w-48">Remark / Status</th>
                  {isSuperAdmin && <th className="px-1 py-1 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredRequests.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs font-bold font-sans">
                    <td className="px-1 py-1 text-center text-slate-400 dark:text-slate-600 font-bold transition-colors">{idx + 1}</td>
                    <td className="px-1 py-1">
                      <p className="font-black text-slate-900 dark:text-white transition-colors leading-tight">{req.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 transition-colors leading-tight">{req.phone}</p>
                    </td>
                    <td className="px-1 py-1">
                      <p className="text-slate-600 dark:text-slate-300 font-medium line-clamp-1 text-[10px] transition-colors" title={req.message}>{req.message}</p>
                    </td>
                    <td className="px-1 py-1">
                      <div className="space-y-1">
                        <select 
                          value={remarks[req.id]?.status || HelpStatus.PENDING}
                          onChange={(e) => handleRemarkChange(req.id, 'status', e.target.value)}
                          className={clsx(
                            "w-full px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-transparent dark:border-slate-700 outline-none cursor-pointer appearance-none transition-colors",
                            remarks[req.id]?.status === HelpStatus.COMPLETE ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/40" :
                            remarks[req.id]?.status === HelpStatus.REJECTED ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40" :
                            "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40"
                          )}
                        >
                          <option value={HelpStatus.PENDING} className="bg-white dark:bg-slate-900">Pending</option>
                          <option value={HelpStatus.COMPLETE} className="bg-white dark:bg-slate-900">Complete</option>
                          <option value={HelpStatus.REJECTED} className="bg-white dark:bg-slate-900">Rejected</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="Remark..." 
                          value={remarks[req.id]?.text || ''}
                          onChange={(e) => handleRemarkChange(req.id, 'text', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-medium focus:border-blue-400 dark:focus:border-blue-700 outline-none transition-colors"
                        />
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-1 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleSave(req.id)} disabled={savingId === req.id} className="p-1 px-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-900/10" title="Save">
                            <Save size={12} className={clsx(savingId === req.id && "animate-pulse")} />
                          </button>
                          <button onClick={() => setEditItem(req)} className="p-1 px-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-all shadow-sm border border-slate-100 dark:border-slate-700" title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => setDeleteId(req.id)} className="p-1 px-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/10" title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} className="px-6 py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.2em] italic transition-colors">No requests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
