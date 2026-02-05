
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getDonations, updateDonationStatus, deleteDonationRecord } from '../services/api';
import { Card, Badge, Toast, useToast, ConfirmModal } from '../components/UI';
import { DonationRecord, DonationStatus, BloodGroup } from '../types';
import { Check, X, User as UserIcon, Trash2, Calendar, Droplet, MapPin, History, Search, Filter } from 'lucide-react';
import clsx from 'clsx';

export const AdminDonations = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  const fetchData = async () => {
    const data = await getDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatus = async (id: string, status: DonationStatus) => {
    if (!user) return;
    try {
      await updateDonationStatus(id, status, user);
      showToast(`Donation ${status}.`);
      fetchData();
    } catch (e) { showToast("Operation failed.", "error"); }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    setActionLoading(true);
    try {
      await deleteDonationRecord(deleteId, user);
      showToast("Record archived.");
      setDeleteId(null);
      fetchData();
    } catch (e) { showToast("Delete failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const filteredDonations = donations.filter(d => {
    const matchesSearch = d.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesGroup = groupFilter === 'ALL' || d.userBloodGroup === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Syncing Records...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Archive Record?" message="This donation record will be moved to system archives." isLoading={actionLoading} />
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-100"><History size={28} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Donation Management</h1>
            <p className="text-sm text-slate-500 font-medium">Moderating community contributions and history.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={20} />
           <input 
             type="text" 
             placeholder="Search by donor or location..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none shadow-sm focus:ring-4 focus:ring-red-500/10 transition-all"
           />
        </div>

        {/* Status Filter */}
        <div className="relative group">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black uppercase tracking-widest outline-none shadow-sm focus:ring-4 focus:ring-red-500/10 cursor-pointer appearance-none text-slate-600"
           >
             <option value="ALL">All Status</option>
             <option value={DonationStatus.PENDING}>Pending</option>
             <option value={DonationStatus.COMPLETED}>Completed</option>
             <option value={DonationStatus.REJECTED}>Rejected</option>
           </select>
        </div>

        {/* Blood Group Filter */}
        <div className="relative group">
           <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <select 
             value={groupFilter}
             onChange={(e) => setGroupFilter(e.target.value)}
             className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black uppercase tracking-widest outline-none shadow-sm focus:ring-4 focus:ring-red-500/10 cursor-pointer appearance-none text-slate-600"
           >
             <option value="ALL">All Groups</option>
             {Object.values(BloodGroup).map(bg => (
               <option key={bg} value={bg}>{bg}</option>
             ))}
           </select>
        </div>
      </div>
      
      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr><th className="px-8 py-6">Donor Identity</th><th className="px-8 py-6">Blood Group</th><th className="px-8 py-6">Volume</th><th className="px-8 py-6">Status</th><th className="px-8 py-6 text-right">Moderation</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDonations.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        {d.userAvatar ? (
                          <img src={d.userAvatar} className="w-full h-full object-cover" alt={d.userName} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><UserIcon className="p-3 text-slate-300" /></div>
                        )}
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-base">{d.userName}</span>
                        <div className="flex items-center gap-2 mt-1">
                           <MapPin size={12} className="text-slate-400" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px]">{d.location}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                     <Badge color="red" className="text-[10px] px-3 py-1 ring-2 ring-red-50">{d.userBloodGroup}</Badge>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-600">{d.units}ml</td>
                  <td className="px-8 py-5"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')}>{d.status}</Badge></td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.status === DonationStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm" title="Approve"><Check size={18}/></button>
                          <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm" title="Reject"><X size={18}/></button>
                        </>
                      )}
                      <button onClick={() => setDeleteId(d.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm" title="Archive Record"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic bg-slate-50/30">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6 pb-20">
         {filteredDonations.length > 0 ? filteredDonations.map(d => (
           <Card key={d.id} className="p-6 border-0 shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
                     {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300" />}
                   </div>
                   <div className="min-w-0">
                     <p className="font-black text-slate-900 text-lg leading-tight truncate">{d.userName}</p>
                     <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(d.donationDate).toLocaleDateString()}</p>
                     </div>
                   </div>
                </div>
                <div className="absolute top-4 right-4">
                   <Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="px-3 py-1 ring-4 ring-slate-50">
                      {d.status}
                   </Badge>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-[1.5rem] flex flex-col gap-1 border border-slate-100">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Donation Spec</span>
                   <div className="flex items-center gap-2">
                     <Droplet size={16} className="text-red-500 fill-current" />
                     <span className="text-sm font-black text-slate-700">{d.userBloodGroup} ({d.units}ml)</span>
                   </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-[1.5rem] flex flex-col gap-1 border border-slate-100">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Point of Care</span>
                   <div className="flex items-center gap-2">
                     <MapPin size={16} className="text-blue-500" />
                     <span className="text-[11px] font-bold text-slate-600 truncate">{d.location}</span>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                {d.status === DonationStatus.PENDING ? (
                  <>
                    <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="flex-1 bg-green-50 text-green-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform border border-green-100">
                       <Check size={16} /> Approve
                    </button>
                    <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="flex-1 bg-red-50 text-red-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform border border-red-100">
                       <X size={16} /> Reject
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteId(d.id)} className="w-full bg-slate-50 text-slate-400 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all">
                     <Trash2 size={16} /> Archive Record
                  </button>
                )}
             </div>
           </Card>
         )) : (
           <div className="py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] bg-white rounded-[3rem] border-2 border-dashed border-slate-100 italic">
              No matching records found
           </div>
         )}
      </div>
    </div>
  );
};
    