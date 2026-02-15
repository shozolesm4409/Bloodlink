
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getAllFaqs, addFaq, updateFaq, deleteFaq, toggleFaqVisibility } from '../services/api';
import { Card, Button, Toast, useToast, ConfirmModal, Input } from '../components/UI';
import { FAQ } from '../types';
import { FileQuestion, Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react';
import clsx from 'clsx';

export const AdminFaqs = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FAQ | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await getAllFaqs();
      setFaqs(data);
    } catch (e) {
      showToast("Failed to fetch FAQs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openAddModal = () => {
    setEditItem(null);
    setFormQuestion('');
    setFormAnswer('');
    setShowModal(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditItem(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    try {
      if (editItem) {
        await updateFaq(editItem.id, { question: formQuestion, answer: formAnswer }, user);
        showToast("FAQ Updated.");
      } else {
        await addFaq({ question: formQuestion, answer: formAnswer }, user);
        showToast("FAQ Created.");
      }
      setShowModal(false);
      fetchFaqs();
    } catch (e) {
      showToast("Operation failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    setActionLoading(true);
    try {
      await deleteFaq(deleteId, user);
      showToast("FAQ Deleted.");
      setDeleteId(null);
      fetchFaqs();
    } catch (e) {
      showToast("Delete failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleFaqVisibility(id, !currentStatus);
      showToast(`FAQ is now ${!currentStatus ? 'Visible' : 'Hidden'}.`);
      fetchFaqs();
    } catch (e) {
      showToast("Toggle failed.", "error");
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Loading FAQ's...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete FAQ?" 
        message="This action will permanently remove this Question and Answer."
        isLoading={actionLoading}
      />

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-lg p-8 shadow-2xl bg-white border-0 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 {editItem ? <Edit className="text-blue-600" /> : <Plus className="text-green-600" />} 
                 {editItem ? 'Edit FAQ' : 'Add New FAQ'}
               </h3>
               <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Question" value={formQuestion} onChange={e => setFormQuestion(e.target.value)} required placeholder="e.g. How can I donate?" />
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Answer</label>
                <textarea 
                  value={formAnswer} 
                  onChange={e => setFormAnswer(e.target.value)} 
                  required 
                  rows={5} 
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  placeholder="Enter the detailed answer..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <Button type="submit" isLoading={actionLoading} className="flex-1 py-4 rounded-2xl shadow-xl">
                  {editItem ? 'Save Changes' : 'Create FAQ'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-xl shadow-purple-100">
            <FileQuestion size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Moderate FAQ's</h1>
            <p className="text-sm text-slate-500 font-medium">Manage public questions and answers.</p>
          </div>
        </div>
        <Button onClick={openAddModal} className="rounded-2xl px-8 py-4 shadow-xl shadow-purple-100 bg-purple-600 hover:bg-purple-700 border-0 text-white">
          <Plus className="mr-2" size={18} /> Add New FAQ
        </Button>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-5 w-16 text-center">SL</th>
                <th className="px-6 py-5">FAQ Details</th>
                <th className="px-6 py-5 text-right w-40">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {faqs.map((faq, index) => (
                <tr key={faq.id} className={clsx("hover:bg-slate-50 transition-colors group", !faq.isVisible && "bg-slate-50/50 opacity-60")}>
                  <td className="px-6 py-6 text-center font-black text-slate-300 text-xs">{index + 1}</td>
                  <td className="px-6 py-6">
                    <div className="space-y-4">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                             <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Question</span>
                          </div>
                          <p className="font-bold text-slate-900 text-sm pl-4">{faq.question}</p>
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="w-2 h-2 rounded-full bg-green-500"></span>
                             <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Answer</span>
                          </div>
                          <p className="text-slate-600 font-medium text-sm leading-relaxed pl-4">{faq.answer}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right align-middle">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(faq)} 
                        className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggle(faq.id, faq.isVisible)} 
                        className={clsx(
                          "p-2.5 rounded-xl transition-all shadow-sm",
                          faq.isVisible ? "bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600" : "bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white"
                        )}
                        title={faq.isVisible ? "Hide" : "Show"}
                      >
                        {faq.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => setDeleteId(faq.id)} 
                        className="p-2.5 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic">
                    No FAQs found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
