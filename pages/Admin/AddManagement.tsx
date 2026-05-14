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
  const [targetPages, setTargetPages] = useState<string[]>(['dashboard']);
  const [saving, setSaving] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<any | null>(null);

  const PAGE_OPTIONS = [
    { value: 'add-management', label: 'Add Management' },
    { value: 'advertisements', label: 'Advertisements' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'directory', label: 'Donor Directory' },
    { value: 'notices', label: 'Board Notices' },
    { value: 'profile', label: 'Account Profile' },
    { value: 'my-donations', label: 'My Donations' },
    { value: 'requested-donor', label: 'Requested Donor' },
    { value: 'support', label: 'Support Center' },
    { value: 'feedback', label: 'Post Feedback' },
    { value: 'donation-found', label: 'Donation Found' },
    { value: 'found-expenses', label: 'Found Expenses' },
    { value: 'found-summary', label: 'Found Summary' },
    { value: 'users', label: 'Manage Users' },
    { value: 'manage-donations', label: 'Donation Records' },
    { value: 'approve-feedback', label: 'Moderate Feedback' },
    { value: 'help-center-manage', label: 'Help Center Manage' },
    { value: 'moderate-faqs', label: 'Moderate FAQs' },
    { value: 'notifications', label: 'Access Requests' },
    { value: 'badge-manage', label: 'Badge Manage' },
    { value: 'admin/verify', label: 'Verify Identity' },
    { value: 'verification-history', label: 'Verification History' },
    { value: 'team-id-cards', label: 'Team ID Cards' },
    { value: 'landing-settings', label: 'Global Customizer' },
    { value: 'server-status', label: 'Server Status' },
    { value: 'role-permissions', label: 'Role Permissions' },
    { value: 'avatar-manage', label: 'Avatar & Cover' },
    { value: 'deleted-users', label: 'System Archives' },
    { value: 'logs', label: 'Activity Logs' },
    { value: 'summary', label: 'System Summary' },
  ];

  const handleTogglePage = (page: string) => {
    setTargetPages(prev => 
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

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
    if (!adName || !videoLink || targetPages.length === 0) {
        showToast("Please fill all fields", "error");
        return;
    }
    setSaving(true);
    
    try {
      if (editingAd) {
        await updateDoc(doc(db, COLLECTIONS.ADVERTISEMENTS, editingAd.id), {
          adName,
          videoLink,
          targetPages,
          createdAt: editingAd.createdAt
        });
        showToast("Ad updated successfully.");
      } else {
        await addDoc(collection(db, COLLECTIONS.ADVERTISEMENTS), {
          adName,
          videoLink,
          targetPages,
          createdAt: new Date().toISOString()
        });
        showToast("Ad added successfully.");
      }
      setAdName('');
      setVideoLink('');
      setTargetPages(['dashboard']);
      setEditingAd(null);
      setIsPopupOpen(false);
    } catch (e: any) {
      console.error(e);
      showToast("Operation failed: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (ad: any) => {
      setEditingAd(ad);
      setAdName(ad.adName);
      setVideoLink(ad.videoLink);
      setTargetPages(ad.targetPages || [ad.targetPage] || []);
      setIsPopupOpen(true);
  };

  const deleteAd = async () => {
    if (!adToDelete) return;
    try {
      // Archive first
      await addDoc(collection(db, COLLECTIONS.DELETED_ADVERTISEMENTS), { 
        ...adToDelete, 
        deletedAt: new Date().toISOString(),
        deletedBy: user?.name || 'Unknown Admin',
        deletedById: user?.id || ''
      });
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
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 border rounded-lg">
                          {PAGE_OPTIONS.map((option) => (
                              <label key={option.value} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={targetPages.includes(option.value)}
                                    onChange={() => handleTogglePage(option.value)}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                  />
                                  {option.label}
                              </label>
                          ))}
                      </div>
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
            <Card key={ad.id} className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-slate-900 dark:text-white">{ad.adName}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => startEdit(ad)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => setAdToDelete(ad)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:scale-110 transition-transform">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Pages: {(ad.targetPages || []).map((p: string) => PAGE_OPTIONS.find(o => o.value === p)?.label || p).join(', ')}</p>
            </Card>
        ))}
      </div>
    </div>
  );
};
