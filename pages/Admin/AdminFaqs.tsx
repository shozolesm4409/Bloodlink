
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getAllFaqs, addFaq, updateFaq, deleteFaq, toggleFaqVisibility } from '../../services/api';
import { Card, Button, Toast, useToast, ConfirmModal, Input } from '../../components/UI';
import { FAQ } from '../../types';
import { FileQuestion, Plus, Edit, Trash2, Eye, EyeOff, X, CornerDownRight, MessageCircle } from 'lucide-react';
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
          <Card className="w-full max-w-lg p-8 shadow-2xl bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-xl transition-colors">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                 {editItem ? <Edit className="text-blue-600 dark:text-blue-400" /> : <Plus className="text-green-600 dark:text-green-400" />} 
                 {editItem ? 'Edit FAQ' : 'Add New FAQ'}
               </h3>
               <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X size={20} className="text-slate-500 dark:text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Question" value={formQuestion} onChange={e => setFormQuestion(e.target.value)} required placeholder="e.g. How can I donate?" />
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1 transition-colors">Answer</label>
                <textarea 
                  value={formAnswer} 
                  onChange={e => setFormAnswer(e.target.value)} 
                  required 
                  rows={5} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 dark:border dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-colors dark:placeholder:text-slate-600"
                  placeholder="Enter the detailed answer..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <Button type="submit" isLoading={actionLoading} className="flex-1 py-4 rounded-lg shadow-xl transition-colors">
                  {editItem ? 'Save Changes' : 'Create FAQ'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-8 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 text-white rounded-lg shadow-xl shadow-purple-100 dark:shadow-purple-900/30 transition-colors">
            <FileQuestion size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Moderate FAQ's</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Manage public questions and answers.</p>
          </div>
        </div>
        <Button onClick={openAddModal} className="rounded-lg px-8 py-4 shadow-xl shadow-purple-100 dark:shadow-purple-900/20 bg-purple-600 hover:bg-purple-700 border-0 text-white transition-colors">
          <Plus className="mr-2" size={18} /> Add New FAQ
        </Button>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
              <tr>
                <th className="px-1 py-1 w-16 text-center">No.</th>
                <th className="px-1 py-1">Knowledge Base Content</th>
                <th className="px-1 py-1 text-right w-48">Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {faqs.map((faq, index) => (
                <tr key={faq.id} className={clsx("hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group", !faq.isVisible && "bg-slate-100 dark:bg-slate-950 opacity-75 grayscale transition-all")}>
                  <td className="px-1 py-1 text-center font-black text-slate-300 dark:text-slate-700 text-xs align-top pt-2 transition-colors">{index + 1}</td>
                  <td className="px-1 py-1 align-top">
                    <div className="flex gap-3">
                       {/* Q Icon */}
                       <div className="flex-shrink-0 mt-.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shadow-sm text-xs border border-blue-100 dark:border-blue-900/40 transition-colors">Q</div>
                       </div>
                       
                       <div className="space-y-4 w-full max-w-3xl">
                          <div>
                             <p className="text-base font-black text-slate-800 dark:text-white leading-snug transition-colors">{faq.question}</p>
                          </div>
                          
                          <div className="flex gap-3">
                             <div className="flex-shrink-0 mt-.5">
                                <CornerDownRight size={12} className="text-slate-300 dark:text-slate-600" />
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 w-full relative transition-all group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm">
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium transition-colors">{faq.answer}</p>
                                <div className="absolute -top-2 -left-2 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600 rounded-full p-0.5 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                                   <MessageCircle size={10} fill="currentColor" className="opacity-50" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-1 py-1 text-right align-top pt-1.5">
                    <div className="flex flex-col items-end gap-2">
                       <div className={clsx("px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border mb-1 transition-colors", faq.isVisible ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700")}>
                          {faq.isVisible ? 'Published' : 'Draft'}
                       </div>
                       
                       <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 rounded-lg shadow-sm transition-colors">
                          <button 
                            onClick={() => openEditModal(faq)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <div className="w-px h-4 bg-slate-100 dark:bg-slate-700 transition-colors"></div>
                          <button 
                            onClick={() => handleToggle(faq.id, faq.isVisible)} 
                            className={clsx(
                              "p-1.5 rounded-lg transition-all",
                              faq.isVisible ? "text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/50" : "text-orange-500 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                            )}
                            title={faq.isVisible ? "Hide" : "Show"}
                          >
                            {faq.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <div className="w-px h-4 bg-slate-100 dark:bg-slate-700 transition-colors"></div>
                          <button 
                            onClick={() => setDeleteId(faq.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] italic border-2 border-dashed border-slate-100 dark:border-slate-800 m-8 rounded-xl transition-colors">
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
