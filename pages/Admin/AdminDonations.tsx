
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getDonations, updateDonationStatus, deleteDonationRecord } from '../../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal } from '../../components/UI';
import { DonationRecord, DonationStatus } from '../../types';
import { Database, Check, X, Trash2, Search, Filter, User, MapPin, Clock } from 'lucide-react';
import clsx from 'clsx';

export const AdminDonations = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDonations();
      setDonations(data);
    } catch (e) {
      showToast("Failed to load donations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatus = async (id: string, status: DonationStatus) => {
    if (!user) return;
    try {
      await updateDonationStatus(id, status, user);
      showToast(`Donation marked as ${status}`);
      fetchData();
    } catch (e) {
      showToast("Update failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteDonationRecord(deleteId, user);
      showToast("Record archived");
      setDeleteId(null);
      fetchData();
    } catch (e) {
      showToast("Delete failed", "error");
    }
  };

  const filtered = donations.filter(d => {
    const matchesFilter = filter === 'ALL' || d.status === filter;
    const matchesSearch = (d.userName || '').toLowerCase().includes(search.toLowerCase()) || 
                          (d.location || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Loading Records...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Archive Record?" message="This donation record will be moved to archives." />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-8 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Donation Records</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Manage and verify blood donation history.</p>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="relative group flex-1 lg:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor or location..." className="pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold w-full lg:w-64 outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white transition-colors" />
           </div>
           <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black uppercase tracking-widest outline-none cursor-pointer text-slate-700 dark:text-slate-300 transition-colors">
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
           </select>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
              <tr>
                <th className="px-1 py-1">Donor</th>
                <th className="px-1 py-1">Details</th>
                <th className="px-1 py-1">Status</th>
                <th className="px-1 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold">
                  <td className="px-1 py-1">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                          {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover"/> : <User size={14} className="text-slate-300 dark:text-slate-600"/>}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 dark:text-white transition-colors leading-tight">{d.userName}</p>
                          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{d.userBloodGroup}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    <div className="space-y-0.5">
                       <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-[10px]"><MapPin size={10} className="text-slate-400 dark:text-slate-500"/> {d.location}</div>
                       <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[8px] font-bold uppercase tracking-widest"><Clock size={10}/> {new Date(d.donationDate).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-1 py-1"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="px-1.5 py-0.5 text-[8px] ring-1 ring-slate-100 dark:ring-slate-800 transition-all">{d.status}</Badge></td>
                  <td className="px-1 py-1 text-right">
                    <div className="flex justify-end gap-1">
                      {d.status === DonationStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="p-1.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-all shadow-sm border border-green-100 dark:border-green-900/50" title="Approve"><Check size={14}/></button>
                          <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm border border-red-100 dark:border-red-900/50" title="Reject"><X size={14}/></button>
                        </>
                      )}
                      <button onClick={() => setDeleteId(d.id)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all shadow-sm border border-slate-100 dark:border-slate-700" title="Archive Record"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest italic">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
