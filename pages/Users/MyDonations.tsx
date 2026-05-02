
import React, { useEffect, useState } from 'react';
import { getUserDonations, addDonation, deleteDonationRecord } from '../../services/api';
import { useAuth } from '../../AuthContext';
import { DonationRecord, DonationStatus } from '../../types';
import { Card, Button, Input, Badge, ConfirmModal, Toast, useToast } from '../../components/UI';
import { Plus, History as HistoryIcon, Clock, Check, Calendar, Trash2, Users, Shuffle } from 'lucide-react';
import clsx from 'clsx';

export const MyDonations = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reqDate, setReqDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (user) {
      try {
        const data = await getUserDonations(user.id);
        setDonations(data);
      } catch (err) {}
    }
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addDonation({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar || '',
        userBloodGroup: user.bloodGroup,
        donationDate: reqDate ? new Date(reqDate).toISOString() : new Date().toISOString(),
        location: formData.get('location') as string,
        units: 450, 
        notes: formData.get('notes') as string
      }, user);
      showToast("Donation request submitted successfully. Awaiting verification.");
      setShowForm(false);
      fetchHistory();
    } catch (err) {
      showToast("Failed to submit request.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRandomDate = () => {
    // Generate a random date within the last 6 months
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 180));
    setReqDate(d.toISOString().split('T')[0]);
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteDonationRecord(deleteId, user);
      showToast("History record deleted successfully.");
      fetchHistory();
      setDeleteId(null);
    } catch (err) {
      showToast("Failed to delete record.", "error");
    }
  };

  const completed = donations.filter(d => d.status === DonationStatus.COMPLETED).length;
  const pending = donations.filter(d => d.status === DonationStatus.PENDING).length;
  const rejected = donations.filter(d => d.status === DonationStatus.REJECTED).length;

  return (
    <div className="space-y-6 transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Donation History</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge color="green" className="text-[9px] font-black uppercase tracking-wider ring-1 ring-green-100 dark:ring-green-900/50">Completed: {completed}</Badge>
            <Badge color="yellow" className="text-[9px] font-black uppercase tracking-wider ring-1 ring-yellow-100 dark:ring-yellow-900/50">Pending: {pending}</Badge>
            <Badge color="red" className="text-[9px] font-black uppercase tracking-wider ring-1 ring-red-100 dark:ring-red-900/50">Rejected: {rejected}</Badge>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto shadow-lg shadow-red-100 dark:shadow-red-900/20 rounded-2xl py-3 px-6"><Plus className="w-4 h-4 mr-2" /> Request Donation</Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/30 shadow-lg border-t-4 border-t-red-500 animate-in slide-in-from-top-4 transition-colors md:rounded-3xl">
          <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs transition-colors">Submit New Request</h3>
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="relative">
               <Input label="Donation Date" type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} required />
               <button 
                 type="button" 
                 onClick={handleRandomDate}
                 className="absolute right-2 top-[30px] p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                 title="Pick Random Date"
               >
                 <Shuffle size={16} />
               </button>
            </div>
            <Input label="Location" name="location" required placeholder="Hospital or Blood Bank" />
            <Input label="Notes" name="notes" placeholder="Optional notes..." />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl px-6">Cancel</Button>
              <Button type="submit" isLoading={loading} className="rounded-xl px-8">Submit</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                <tr>
                  <th className="p-1">Subject</th>
                  <th className="p-1">Date</th>
                  <th className="p-1">Location</th>
                  <th className="p-1 text-center">Status</th>
                  <th className="p-1 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {donations.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors">
                          {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-300 dark:text-slate-600" size={14} />}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-200 transition-colors truncate max-w-[100px]">{user?.name}</span>
                      </div>
                    </td>
                    <td className="p-1 font-bold text-slate-600 dark:text-slate-400 transition-colors">{new Date(d.donationDate).toLocaleDateString()}</td>
                    <td className="p-1 text-slate-600 dark:text-slate-400 transition-colors font-medium truncate max-w-[120px]">{d.location}</td>
                    <td className="p-1 text-center">
                      <Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="font-black text-[8px] uppercase tracking-wider ring-1 ring-current">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="p-1 text-right">
                      <button onClick={() => setDeleteId(d.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-1">
        {donations.map(d => (
          <Card key={d.id} className="p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-lg relative transition-all">
            <div className="flex justify-between items-start mb-1 px-1 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-300 dark:text-slate-600" size={16} />}
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white leading-tight text-xs">{user?.name}</p>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(d.donationDate).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="font-black text-[7px] uppercase tracking-tighter ring-1 ring-current">
                {d.status}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar size={12} className="text-slate-300" />
                <span className="text-[10px] font-bold">{new Date(d.donationDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock size={12} className="text-slate-300" />
                <span className="text-[10px] font-bold underline underline-offset-2 decoration-slate-100 truncate">{d.location}</span>
              </div>
              {d.notes && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-2 line-clamp-2">"{d.notes}"</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-800">
              <button 
                onClick={() => setDeleteId(d.id)} 
                className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

      {donations.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="text-slate-300 dark:text-slate-600" size={32} />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] transition-colors">No donation records found</p>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete History?" message="This action will remove the record from your history." />
    </div>
  );
};
