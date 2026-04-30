
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Donation History</h1>
          <div className="flex gap-2 mt-2">
            <Badge color="green" className="text-[10px] ring-1 ring-green-100 dark:ring-green-900/50">Completed: {completed}</Badge>
            <Badge color="yellow" className="text-[10px] ring-1 ring-yellow-100 dark:ring-yellow-900/50">Pending: {pending}</Badge>
            <Badge color="red" className="text-[10px] ring-1 ring-red-100 dark:ring-red-900/50">Rejected: {rejected}</Badge>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="shadow-lg shadow-red-100 dark:shadow-red-900/20"><Plus className="w-4 h-4 mr-2" /> Request Donation</Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/30 shadow-lg border-t-4 border-t-red-500 animate-in slide-in-from-top-4 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 transition-colors">Submit New Request</h3>
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
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowForm(false)} className="dark:border-slate-700 dark:text-slate-400">Cancel</Button><Button type="submit" isLoading={loading}>Submit</Button></div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">
              <tr>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {donations.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors">
                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-300 dark:text-slate-600" size={14} />}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-200 transition-colors">{user?.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-600 dark:text-slate-400 transition-colors">{new Date(d.donationDate).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400 transition-colors">{d.location}</td>
                  <td className="px-5 py-4"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="ring-1 ring-current">{d.status}</Badge></td>
                  <td className="px-5 py-4 text-right"><button onClick={() => setDeleteId(d.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={18} /></button></td>
                </tr>
              ))}
              {donations.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-[10px]">No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete History?" message="This action will remove the record from your history." />
    </div>
  );
};
