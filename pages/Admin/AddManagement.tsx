import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Card, Button, Input, Toast, useToast, ConfirmModal } from '../../components/UI';
import { Megaphone, Plus, Trash2, Save, Edit, X } from 'lucide-react';
import { addDoc, collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../services/api';
import clsx from 'clsx';

export const AddManagement = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adName, setAdName] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [targetPage, setTargetPage] = useState('dashboard');
  const [saving, setSaving] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.ADVERTISEMENTS), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [editingAd, setEditingAd] = useState<any | null>(null);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName || !videoLink || !targetPage) {
        showToast("Please fill all fields", "error");
        return;
    }
    setSaving(true);
    try {
      if (editingAd) {
        await updateDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, editingAd.id), {
          adName,
          videoLink,
          targetPage,
          createdAt: editingAd.createdAt
        });
        showToast("Ad updated successfully.");
      } else {
        await addDoc(collection(db, COLLECTIONS.ADVERTISEMENTS), {
          adName,
          videoLink,
          targetPage,
          createdAt: new Date().toISOString()
        });
        showToast("Ad added successfully.");
      }
      setAdName('');
      setVideoLink('');
      setEditingAd(null);
      setIsPopupOpen(false);
    } catch (e) {
      showToast("Operation failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (ad: any) => {
      setEditingAd(ad);
      setAdName(ad.adName);
      setVideoLink(ad.videoLink);
      setTargetPage(ad.targetPage);
      setIsPopupOpen(true);
  };

  const deleteAd = async () => {
    if (!adToDelete) return;
    try {
      // Archive first
      await addDoc(collection(db, 'ad_archives'), { ...adToDelete, deletedAt: new Date().toISOString() });
      await deleteDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, adToDelete.id));
      showToast("Ad archived.");
      setAdToDelete(null);
    } catch (e) {
      showToast("Delete failed.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!adToDelete} 
        onClose={() => setAdToDelete(null)} 
        onConfirm={deleteAd} 
        title="Delete Advertisement"
        message="Are you sure you want to delete and archive this advertisement?"
      />
      
      {isPopupOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <Card className="w-full max-w-md p-6 shadow-2xl bg-white dark:bg-slate-900 border-0 rounded-3xl relative">
              <button onClick={() => setIsPopupOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Plus size={20} className="text-red-600" /> {editingAd ? 'Edit' : 'New'} Advertisement
              </h2>
              <form onSubmit={handleAddOrUpdate} className="space-y-4">
                  <Input label="Ad Name" value={adName} onChange={(e: any) => setAdName(e.target.value)} />
                  <Input label="Video URL" value={videoLink} onChange={(e: any) => setVideoLink(e.target.value)} />
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Page</label>
                      <select value={targetPage} onChange={(e) => setTargetPage(e.target.value)} className="w-full h-10 bg-slate-50 border rounded-lg px-3 text-sm font-bold">
                          <option value="dashboard">Dashboard</option>
                          <option value="directory">Donor Directory</option>
                          <option value="notices">Board Notices</option>
                          <option value="profile">Account Profile</option>
                          <option value="my-donations">My Donations</option>
                          <option value="requested-donor">Requested Donor</option>
                          <option value="support">Support Center</option>
                          <option value="feedback">Post Feedback</option>
                          <option value="donation-found">Donation Found</option>
                          <option value="found-expenses">Found Expenses</option>
                          <option value="found-summary">Found Summary</option>
                          <option value="users">Manage Users</option>
                          <option value="manage-donations">Donation Records</option>
                          <option value="approve-feedback">Moderate Feedback</option>
                          <option value="help-center-manage">Help Center Manage</option>
                          <option value="moderate-faqs">Moderate FAQs</option>
                          <option value="notifications">Access Requests</option>
                          <option value="badge-manage">Badge Manage</option>
                          <option value="admin/verify">Verify Identity</option>
                          <option value="verification-history">Verification History</option>
                          <option value="team-id-cards">Team ID Cards</option>
                          <option value="landing-settings">Global Customizer</option>
                          <option value="server-status">Server Status</option>
                          <option value="role-permissions">Role Permissions</option>
                          <option value="avatar-manage">Avatar & Cover</option>
                          <option value="deleted-users">System Archives</option>
                          <option value="logs">Activity Logs</option>
                          <option value="summary">System Summary</option>
                      </select>
                  </div>
                  <Button type="submit" isLoading={saving} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-black">
                     {editingAd ? 'Update' : 'Save'} AD
                  </Button>
              </form>
           </Card>
        </div>
      )}
      
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Add Management</h1>
           <p className="text-slate-500 font-medium">Configure global advertisements and placement.</p>
        </div>
        <Button onClick={() => { setEditingAd(null); setIsPopupOpen(true); }} className="bg-red-600">
           <Plus size={18} className="mr-2" /> New Ad
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map(ad => (
            <Card key={ad.id} className="p-4 rounded-3xl border border-slate-200 shadow-lg bg-white">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-slate-900">{ad.adName}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => startEdit(ad)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:scale-110 transition-transform">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => setAdToDelete(ad)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:scale-110 transition-transform">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-2">Page: {ad.targetPage}</p>
            </Card>
        ))}
      </div>
    </div>
  );
};
