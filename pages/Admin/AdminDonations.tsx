
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getDonations, updateDonationStatus, deleteDonationRecord, getUsers, addDonation, updateDonation } from '../../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal, Input, Select } from '../../components/UI';
import { DonationRecord, DonationStatus, User } from '../../types';
import { Database, Check, X, Trash2, Search, Filter, User as UserIcon, MapPin, Clock, Plus, Pen, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export const AdminDonations = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<DonationRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donationsData, usersData] = await Promise.all([getDonations(), getUsers()]);
      setDonations(donationsData);
      setUsers(usersData);
    } catch (e) {
      showToast("Failed to load data", "error");
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
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Archive Record?" message="This donation record will be moved to archives." />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Donation Records</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1 transition-colors">Manage and verify blood donation history.</p>
        </div>
        <div className="flex flex-row items-center gap-3 w-full lg:w-auto">
           <Button variant="secondary" onClick={() => setIsAddModalOpen(true)} className="gap-0 lg:gap-2 shrink-0 h-[48px] px-4">
             <Plus size={16} /> <span className="hidden lg:inline">Add Record</span>
           </Button>
           <div className="relative group w-full lg:w-64 flex-1 h-[48px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor..." className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold w-full h-full outline-none focus:border-red-500/50 dark:text-white transition-all shadow-sm" />
           </div>
           <select value={filter} onChange={e => setFilter(e.target.value)} className="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer text-slate-700 dark:text-slate-300 transition-all shadow-sm focus:border-red-500/50 appearance-none h-[48px]">
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
           </select>
        </div>
      </div>
      
      {/* Add/Edit Donation Modal */}
      {(isAddModalOpen || editingDonation) && (
        <DonationModal 
          isOpen={isAddModalOpen || !!editingDonation} 
          onClose={() => {setIsAddModalOpen(false); setEditingDonation(null);}} 
          onConfirm={fetchData} 
          users={users} 
          currentUser={user!}
          donationToEdit={editingDonation}
          donations={donations}
        />
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                <tr>
                  <th className="p-1">Donor Name</th>
                  <th className="p-1 text-center">Blood</th>
                  <th className="p-1">Location & Date</th>
                  <th className="p-1">Status</th>
                  <th className="p-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold font-sans">
                    <td className="p-1">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors shadow-inner">
                            {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover"/> : <UserIcon size={14} className="text-slate-300 dark:text-slate-600"/>}
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="font-black text-slate-900 dark:text-white transition-colors">{d.userName}</p>
                           {users.find(u => u.id === d.userId)?.approvedBadge && (
                             <CheckCircle2 size={12} className={clsx({
                               'text-slate-400': users.find(u => u.id === d.userId)?.approvedBadge === 'pink',
                               'text-amber-500': users.find(u => u.id === d.userId)?.approvedBadge === 'red',
                               'text-emerald-500': users.find(u => u.id === d.userId)?.approvedBadge === 'green',
                               'text-cyan-400': users.find(u => u.id === d.userId)?.approvedBadge === 'blue',
                             })} />
                           )}
                           {users.find(u => u.id === d.userId)?.role === 'SUPERADMIN' && !users.find(u => u.id === d.userId)?.approvedBadge && (
                             <CheckCircle2 size={12} className="text-cyan-400" />
                           )}
                         </div>
                      </div>
                    </td>
                    <td className="p-1 text-center font-black">
                      {d.userBloodGroup}
                    </td>
                    <td className="p-1">
                      <div className="space-y-0.5">
                         <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold truncate max-w-[120px]"><MapPin size={10} className="text-red-400"/> {d.location}</div>
                         <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider"><Clock size={10}/> {new Date(d.donationDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="p-1"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="px-1.5 py-0.5 text-[8px] font-black tracking-widest ring-1 ring-current uppercase">{d.status}</Badge></td>
                    <td className="p-1 text-right">
                      <div className="flex justify-end gap-1">
                        {d.status === DonationStatus.PENDING && (
                          <>
                            <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="p-1.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-all shadow-sm border border-green-100 dark:border-white/5" title="Approve"><Check size={14}/></button>
                            <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm border border-red-100 dark:border-white/5" title="Reject"><X size={14}/></button>
                          </>
                        )}
                        <button onClick={() => setEditingDonation(d)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-lg transition-all border border-slate-100 dark:border-white/5" title="Edit Record"><Pen size={14}/></button>
                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-lg transition-all border border-slate-100 dark:border-white/5" title="Archive Record"><Trash2 size={14}/></button>
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
      <div className="md:hidden space-y-1 mt-2">
        {filtered.map(d => (
          <Card key={d.id} className="p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md rounded-lg transition-colors relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-1">
               <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                     {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover"/> : <UserIcon size={16} className="text-slate-300 dark:text-slate-600"/>}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-black text-slate-900 dark:text-white leading-tight text-xs">{d.userName}</h3>
                      {users.find(u => u.id === d.userId)?.approvedBadge && (
                        <CheckCircle2 size={12} className={clsx({
                          'text-slate-400': users.find(u => u.id === d.userId)?.approvedBadge === 'pink',
                          'text-amber-500': users.find(u => u.id === d.userId)?.approvedBadge === 'red',
                          'text-emerald-500': users.find(u => u.id === d.userId)?.approvedBadge === 'green',
                          'text-cyan-400': users.find(u => u.id === d.userId)?.approvedBadge === 'blue',
                        })} />
                      )}
                      {users.find(u => u.id === d.userId)?.role === 'SUPERADMIN' && !users.find(u => u.id === d.userId)?.approvedBadge && (
                        <CheckCircle2 size={12} className="text-cyan-400" />
                      )}
                     </div>
                    <Badge color="red" className="text-[7px] font-black tracking-widest mt-1 uppercase">{d.userBloodGroup}</Badge>
                  </div>
               </div>
               <div className="flex gap-1">
                 <button onClick={() => setEditingDonation(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pen size={14}/></button>
                 <Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="text-[7px] font-black uppercase tracking-tighter ring-1 ring-current">
                   {d.status}
                 </Badge>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 pt-3 border-t border-slate-50 dark:border-slate-800">
               <div className="space-y-0.5">
                  <p className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight truncate">{d.location}</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{new Date(d.donationDate).toLocaleDateString()}</p>
               </div>
            </div>

            <div className="flex gap-2">
              {d.status === DonationStatus.PENDING ? (
                <>
                  <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="flex-1 py-2 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-100 dark:shadow-none transition-all flex items-center justify-center gap-1.5">
                    <Check size={12} /> Approve
                  </button>
                  <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-red-100 dark:shadow-none transition-all flex items-center justify-center gap-1.5">
                    <X size={12} /> Reject
                  </button>
                </>
              ) : (
                <button onClick={() => setDeleteId(d.id)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all flex items-center justify-center gap-1.5">
                  <Trash2 size={12} /> Archive Record
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-24 text-center px-4">
           <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-slate-100 dark:ring-slate-800">
              <Database size={32} className="text-slate-200 dark:text-slate-700" />
           </div>
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic mb-2">No records discovered</p>
           <p className="text-xs text-slate-300 dark:text-slate-700 font-medium">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
};

const DonationModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, users: User[], currentUser: User, donationToEdit?: DonationRecord | null, donations: DonationRecord[] }> = ({ isOpen, onClose, onConfirm, users, currentUser, donationToEdit, donations }) => {
  const [formData, setFormData] = useState({
    userId: donationToEdit?.userId || '',
    donationDate: donationToEdit ? new Date(donationToEdit.donationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    location: donationToEdit?.location || '',
    units: donationToEdit?.units || 1,
    status: donationToEdit?.status || DonationStatus.PENDING,
    notes: donationToEdit?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const selectedDonor = users.find(u => u.id === formData.userId);
  const selectedDonorDonationCount = donations.filter(d => d.userId === formData.userId).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const donor = users.find(u => u.id === formData.userId);
    if (!donor) return;
    
    try {
      if (donationToEdit) {
        await updateDonation(donationToEdit.id, {
          ...formData,                
          userId: donor.id,
          userName: donor.name,
          userAvatar: donor.avatar,
          userBloodGroup: donor.bloodGroup,
        }, currentUser);
      } else {
        await addDonation({
          ...formData,
          userId: donor.id,
          userName: donor.name,
          userAvatar: donor.avatar,
          userBloodGroup: donor.bloodGroup,
        }, currentUser);
      }
      onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save donation");
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg p-4 shadow-2xl animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border-0 rounded-xl">
             <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">{donationToEdit ? 'Edit Donation' : 'Add New Donation'}</h3>
             <form onSubmit={handleSubmit} className="space-y-3">
                <Select label="Select Donor" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} required>
                  <option value="">-- Select Donor --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.bloodGroup})</option>)}
                </Select>
                {selectedDonor && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                     <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                      {selectedDonor.avatar ? <img src={selectedDonor.avatar} className="w-full h-full object-cover"/> : <UserIcon size={16} className="text-slate-300 dark:text-slate-600"/>}
                     </div>
                     <div>
                       <div className="flex items-center gap-1">
                         <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedDonor.name}</p>
                         {selectedDonor.approvedBadge && (
                           <CheckCircle2 size={14} className={clsx({
                             'text-slate-400': selectedDonor.approvedBadge === 'pink',
                             'text-amber-500': selectedDonor.approvedBadge === 'red',
                             'text-emerald-500': selectedDonor.approvedBadge === 'green',
                             'text-cyan-400': selectedDonor.approvedBadge === 'blue',
                           })} />
                         )}
                         {selectedDonor.role === 'SUPERADMIN' && !selectedDonor.approvedBadge && (
                           <CheckCircle2 size={14} className="text-cyan-400" />
                         )}
                       </div>
                       <p className="text-xs text-slate-500 font-medium">{selectedDonor.bloodGroup} • {selectedDonorDonationCount} Past Donations</p>
                     </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date" type="date" value={formData.donationDate} onChange={e => setFormData({...formData, donationDate: e.target.value})} required />
                  <Input label="Units" type="number" min={1} value={formData.units} onChange={e => setFormData({...formData, units: parseInt(e.target.value)})} required />
                </div>
                <Input label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                <Select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as DonationStatus})}>
                   <option value={DonationStatus.PENDING}>Pending</option>
                   <option value={DonationStatus.COMPLETED}>Completed</option>
                   <option value={DonationStatus.REJECTED}>Rejected</option>
                </Select>
                <Input label="Notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
                <div className="flex gap-4 mt-6">
                  <Button type="submit" isLoading={loading} className="flex-1">{donationToEdit ? 'Save' : 'Add Record'}</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                </div>
             </form>
          </Card>
        </div>
  );
};
