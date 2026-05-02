
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getAllFaqs, addFaq, updateFaq, deleteFaq, toggleFaqVisibility } from '../../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal, Input } from '../../components/UI';
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
    <div className="space-y-2 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
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
          <Card className="w-full max-w-lg p-5 lg:p-6 shadow-2xl bg-white dark:bg-slate-900 border-0 dark:border dark:border-slate-800 rounded-xl transition-colors">
            <div className="flex justify-between items-center mb-5">
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

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-100 dark:shadow-purple-900/30 transition-colors">
            <FileQuestion size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Moderate FAQ's</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest transition-colors">Manage public questions and answers.</p>
          </div>
        </div>
        <Button onClick={openAddModal} className="w-full lg:w-auto rounded-2xl px-8 py-4 shadow-xl shadow-purple-100 dark:shadow-purple-900/20 bg-purple-600 hover:bg-purple-700 border-0 text-white font-black text-xs uppercase tracking-widest transition-colors">
          <Plus className="mr-2" size={18} /> Add New FAQ
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                <tr>
                  <th className="p-1 w-12 text-center">No.</th>
                  <th className="p-1">Content</th>
                  <th className="p-1 text-right w-32">Status & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {faqs.map((faq, index) => (
                  <tr key={faq.id} className={clsx("hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group", !faq.isVisible && "opacity-75 grayscale transition-all")}>
                    <td className="p-1 text-center font-black text-slate-300 dark:text-slate-700 text-[10px] align-top pt-2">{index + 1}</td>
                    <td className="p-1 align-top">
                      <div className="flex gap-2">
                         <div className="flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[10px] border border-blue-100">Q</div>
                         </div>
                         
                         <div className="space-y-1 w-full">
                            <p className="text-xs font-black text-slate-800 dark:text-white leading-tight">{faq.question}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{faq.answer}"</p>
                         </div>
                      </div>
                    </td>
                    <td className="p-1 text-right align-top pt-1 text-[10px]">
                      <div className="flex flex-col items-end gap-1">
                         <Badge color={faq.isVisible ? 'green' : 'gray'} className="px-1 text-[7px] font-black uppercase ring-1 ring-current">
                            {faq.isVisible ? 'Live' : 'Draft'}
                         </Badge>
                         <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-0.5 rounded-lg shadow-sm">
                            <button onClick={() => openEditModal(faq)} className="p-1 text-slate-400 hover:text-blue-600 rounded-sm" title="Edit"><Edit size={12} /></button>
                            <button onClick={() => handleToggle(faq.id, faq.isVisible)} className={clsx("p-1 rounded-sm transition-all", faq.isVisible ? "text-slate-400 hover:text-orange-500" : "text-orange-500 bg-orange-50")} title={faq.isVisible ? "Hide" : "Show"}>{faq.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                            <button onClick={() => setDeleteId(faq.id)} className="p-1 text-slate-400 hover:text-red-600 rounded-sm" title="Delete"><Trash2 size={12} /></button>
                         </div>
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
        {faqs.map((faq, index) => (
          <Card key={faq.id} className={clsx("p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md rounded-lg transition-all relative overflow-hidden", !faq.isVisible && "opacity-70 grayscale-[0.5]")}>
            <div className="flex justify-between items-start mb-1">
               <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-slate-300 dark:text-slate-600">#{index + 1}</span>
                  <Badge color={faq.isVisible ? 'green' : 'gray'} className="text-[7px] font-black uppercase tracking-widest">
                    {faq.isVisible ? 'Live' : 'Draft'}
                  </Badge>
               </div>
               <div className="flex gap-1">
                  <button onClick={() => openEditModal(faq)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-blue-600 rounded-lg border border-slate-100" title="Edit"><Edit size={12} /></button>
                  <button onClick={() => handleToggle(faq.id, faq.isVisible)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-orange-500 rounded-lg border border-slate-100">{faq.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                  <button onClick={() => setDeleteId(faq.id)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-red-600 rounded-lg border border-slate-100"><Trash2 size={12} /></button>
               </div>
            </div>

            <div className="space-y-2">
               <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                     <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center font-black text-[7px]">Q</div>
                     <p className="text-xs font-black text-slate-900 dark:text-white transition-colors leading-tight">{faq.question}</p>
                  </div>
                  <div className="pl-5 relative">
                     <CornerDownRight size={10} className="absolute left-0 top-1 text-slate-300" />
                     <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic line-clamp-1">"{faq.answer}"</p>
                  </div>
               </div>
            </div>
          </Card>
        ))}
      </div>

      {faqs.length === 0 && (
        <div className="py-24 text-center">
           <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-slate-100">
              <FileQuestion size={32} className="text-slate-200" />
           </div>
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic transition-colors">Knowledge base is empty</p>
        </div>
      )}
    </div>
  );
};
