import React, { useState, useEffect } from 'react';
import { Card, Button, Input, useToast, Toast, ConfirmModal } from '../../components/UI';
import { Receipt, Plus, Calendar, DollarSign, X, FileText, User, Edit2, Phone, Calendar as CalendarIcon, Droplet, UserCheck, BadgeCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFundExpenses, addFundExpense, updateFundExpense, deleteFundExpense, getUserProfile } from '../../services/api';
import { useAuth } from '../../AuthContext';
import { FundExpense, UserRole, User as AppUser } from '../../types';
import { BADGE_COLOR_MAP } from '../../constants';

export const FundExpenses = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  
  const [expenses, setExpenses] = useState<FundExpense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FundExpense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    purpose: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN;

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await getFundExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.purpose || !formData.amount || !formData.date) return;
    
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await updateFundExpense(editingExpense.id, {
          purpose: formData.purpose,
          amount: Number(formData.amount),
          date: formData.date,
          notes: formData.notes
        }, user);
        showToast('Expense updated successfully');
      } else {
        await addFundExpense({
          purpose: formData.purpose,
          amount: Number(formData.amount),
          date: formData.date,
          notes: formData.notes,
          addedBy: {
            uid: user.id,
            name: user.name,
            phone: user.phone
          }
        }, user);
        showToast('Expense added successfully');
      }
      
      closeForm();
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showToast('Failed to save expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData({
      purpose: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const openEditForm = (expense: FundExpense) => {
    setEditingExpense(expense);
    setFormData({
      purpose: expense.purpose,
      amount: expense.amount.toString(),
      date: expense.date,
      notes: expense.notes || ''
    });
    setShowForm(true);
  };

  const handleUserClick = async (uid: string) => {
    try {
      setLoadingUser(true);
      const userProfile = await getUserProfile(uid);
      setSelectedUser(userProfile);
    } catch (err) {
      showToast('Failed to load user details', 'error');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteConfirmId || !canManage) return;
    
    setIsDeleting(true);
    try {
      await deleteFundExpense(deleteConfirmId, user);
      showToast('Expense archived successfully');
      setDeleteConfirmId(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full h-full p-2 lg:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 lg:space-y-6">
      <Toast {...toastState} onClose={hideToast} />
      
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this expense? This action will archive the record in System Archives."
        isLoading={isDeleting}
      />
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center">
            <Receipt className="text-rose-600 dark:text-rose-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Fund Expenses</h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">Expense Tracking & Details</p>
          </div>
        </div>
        
        {canManage && (
          <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white min-h-[48px] rounded-xl font-black tracking-widest text-[10px] uppercase shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95">
            <Plus size={16} /> ADD EXPENSE
          </Button>
        )}
      </div>
      
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Log Expense</h3>
                <button 
                  onClick={closeForm}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Added By</label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{editingExpense ? editingExpense.addedBy.name : user?.name}</p>
                      <p className="text-xs text-slate-500">{editingExpense ? editingExpense.addedBy.uid : user?.id}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Input 
                    label="Amount (BDT)" 
                    type="number"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e: any) => setFormData({...formData, amount: e.target.value})}
                  />
                  <Input 
                    label="Date" 
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e: any) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <Input 
                  label="Purpose / Title" 
                  required
                  placeholder="E.g., Medical campaign banner"
                  value={formData.purpose}
                  onChange={(e: any) => setFormData({...formData, purpose: e.target.value})}
                />
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Notes (Optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-slate-50 dark:bg-slate-800 dark:text-slate-100 font-medium"
                    rows={3}
                    value={formData.notes}
                    onChange={(e: any) => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting} className="flex-1 bg-rose-600 hover:bg-rose-700">
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-0">
          {loading ? (
             <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Receipt className="text-slate-300 dark:text-slate-600" size={32} />
              </div>
              <p className="text-slate-900 dark:text-white font-black text-xl mb-2 uppercase tracking-tight">No expenses logged yet.</p>
              <p className="text-sm font-bold text-slate-500 max-w-md mx-auto leading-relaxed">আমাদের ফান্ডের টাকাগুলো যে সকল গঠনমূলক কাজে খরচ করা হয় তার তালিকা পরবর্তীতে এখানে আপডেট করা হবে।</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="hidden sm:flex w-10 sm:w-12 h-10 sm:h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/30 rounded-2xl items-center justify-center shadow-sm shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-lg uppercase tracking-tight truncate">{expense.purpose}</h3>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditForm(expense)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 p-1 rounded-lg transition-all" title="Edit Expense">
                              <Edit2 size={12} className="stroke-[3]" />
                            </button>
                            <button onClick={() => setDeleteConfirmId(expense.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded-lg transition-all" title="Delete Expense">
                              <Trash2 size={12} className="stroke-[3]" />
                            </button>
                          </div>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 sm:mb-4 bg-slate-50 dark:bg-slate-800/50 inline-block px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {expense.notes}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-slate-100 dark:border-slate-700">
                          <Calendar size={10} className="text-indigo-500" />
                          {new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <button onClick={() => handleUserClick(expense.addedBy.uid)} className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-slate-100 dark:border-slate-700 transition-colors group">
                          <User size={10} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="truncate max-w-[100px] sm:max-w-[120px] text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{expense.addedBy.name}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="text-rose-600 dark:text-rose-400 font-black text-lg sm:text-2xl tracking-tighter">
                      ৳{expense.amount.toLocaleString()}
                    </div>
                    <p className="hidden sm:block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Amount Spent</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setSelectedUser(null)} className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              {selectedUser.coverImage ? (
                <img src={selectedUser.coverImage} alt="Cover" className="h-24 w-full object-cover" />
              ) : (
                <div className="bg-gradient-to-br from-indigo-500 to-rose-500 h-24 w-full"></div>
              )}
              
              <div className="px-6 pb-6 relative pt-12">
                <div className="absolute -top-12 left-6">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-900 object-cover shadow-lg bg-white" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-900 bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shadow-lg">
                      <User size={32} className="text-emerald-500" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                  {selectedUser.name}
                  {selectedUser.approvedBadge && (selectedUser.approvedBadge as string) !== 'none' && (
                    <BadgeCheck size={20} className={BADGE_COLOR_MAP[selectedUser.approvedBadge as string] || "text-cyan-500"} />
                  )}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                    {selectedUser.role}
                  </span>
                  {selectedUser.bloodGroup && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded">
                      <Droplet size={10} /> {selectedUser.bloodGroup}
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  {selectedUser.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Phone size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedUser.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedUser.email && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <UserCheck size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{selectedUser.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
