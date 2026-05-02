
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
        "flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transition-colors",
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
    <div className="space-y-4 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 transition-colors">
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

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-100 dark:shadow-purple-900/30 transition-colors">
            <HelpCircle size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Help Center</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-1 transition-colors">Manage support tickets and inquiries.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 lg:pb-1.5 border border-slate-200 dark:border-slate-700 transition-colors">
          <TabButton status={HelpStatus.PENDING} label="Pending" icon={AlertCircle} color="text-yellow-600" />
          <TabButton status={HelpStatus.COMPLETE} label="Complete" icon={CheckCircle2} color="text-green-600" />
          <TabButton status={HelpStatus.REJECTED} label="Rejected" icon={XCircle} color="text-red-600" />
        </div>
        <div className="relative w-full md:w-80">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
           <input 
             type="text" 
             placeholder="Search by name or phone..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-purple-500/50 shadow-sm transition-all"
           />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                <tr>
                  <th className="p-1 w-8 text-center">No</th>
                  <th className="p-1">Requester</th>
                  <th className="p-1 max-w-xs">Details</th>
                  <th className="p-1">Status / Action</th>
                  {isSuperAdmin && <th className="p-1 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredRequests.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs">
                    <td className="p-1 text-center text-slate-300 dark:text-slate-700 font-black">{idx + 1}</td>
                    <td className="p-1">
                      <p className="font-black text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">{req.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{req.phone}</p>
                    </td>
                    <td className="p-1">
                      <p className="text-slate-600 dark:text-slate-300 font-medium line-clamp-1 text-[10px]" title={req.message}>{req.message}</p>
                    </td>
                    <td className="p-1">
                      <div className="flex items-center gap-1">
                        <select 
                          value={remarks[req.id]?.status || HelpStatus.PENDING}
                          onChange={(e) => handleRemarkChange(req.id, 'status', e.target.value)}
                          className={clsx(
                            "px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border outline-none cursor-pointer appearance-none transition-all",
                            remarks[req.id]?.status === HelpStatus.COMPLETE ? "bg-green-50 text-green-700 border-green-100" :
                            remarks[req.id]?.status === HelpStatus.REJECTED ? "bg-red-50 text-red-700 border-red-100" :
                            "bg-yellow-50 text-yellow-700 border-yellow-100"
                          )}
                        >
                          <option value={HelpStatus.PENDING}>PEND</option>
                          <option value={HelpStatus.COMPLETE}>DONE</option>
                          <option value={HelpStatus.REJECTED}>REJT</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="Note..." 
                          value={remarks[req.id]?.text || ''}
                          onChange={(e) => handleRemarkChange(req.id, 'text', e.target.value)}
                          className="flex-1 px-1 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded text-[9px] font-bold outline-none focus:border-blue-400 transition-all"
                        />
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="p-1 text-right">
                        <div className="flex justify-end gap-0.5">
                          <button onClick={() => handleSave(req.id)} disabled={savingId === req.id} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all" title="Save">
                            <Save size={12} className={clsx(savingId === req.id && "animate-pulse")} />
                          </button>
                          <button onClick={() => setEditItem(req)} className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 rounded transition-all" title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => setDeleteId(req.id)} className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded transition-all" title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-1 pb-20 mt-1">
        {filteredRequests.map((req) => (
          <Card key={req.id} className="p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md rounded-lg transition-colors">
            <div className="flex justify-between items-start mb-1">
               <div className="px-1 pt-1">
                  <h3 className="font-black text-slate-900 dark:text-white leading-tight text-xs truncate max-w-[120px]">{req.name}</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{req.phone}</p>
               </div>
               <Badge className="text-[7px] font-black mt-1 mr-1" color={req.status === HelpStatus.COMPLETE ? 'green' : (req.status === HelpStatus.REJECTED ? 'red' : 'yellow')}>
                  {req.status}
               </Badge>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg mb-1 border border-slate-100 dark:border-slate-800 mx-1">
               <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-tight italic line-clamp-1">"{req.message}"</p>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-50 dark:border-slate-800 px-1 pb-1">
               <div className="flex gap-1">
                 <select 
                    value={remarks[req.id]?.status || HelpStatus.PENDING}
                    onChange={(e) => handleRemarkChange(req.id, 'status', e.target.value)}
                    className="flex-shrink-0 px-1 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[8px] font-black uppercase tracking-widest border-0 outline-none"
                 >
                    <option value={HelpStatus.PENDING}>PENDING</option>
                    <option value={HelpStatus.COMPLETE}>RESOLVE</option>
                    <option value={HelpStatus.REJECTED}>REJECT</option>
                 </select>
                 <input 
                    type="text" 
                    placeholder="Remark..." 
                    value={remarks[req.id]?.text || ''}
                    onChange={(e) => handleRemarkChange(req.id, 'text', e.target.value)}
                    className="flex-1 px-1 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md text-[9px] font-bold"
                 />
               </div>
               
               <div className="flex gap-1">
                  <button onClick={() => handleSave(req.id)} className="flex-1 py-1 bg-blue-600 text-white rounded-md font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm">
                     <Save size={10}/> Save
                  </button>
                  <button onClick={() => setEditItem(req)} className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">
                     <Edit2 size={10}/>
                  </button>
                  <button onClick={() => setDeleteId(req.id)} className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-md">
                     <Trash2 size={10}/>
                  </button>
               </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="py-10 text-center">
           <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <HelpCircle size={32} className="text-slate-200" />
           </div>
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic">No support tickets found</p>
        </div>
      )}
    </div>
  );
};
