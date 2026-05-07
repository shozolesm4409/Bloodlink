
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { useSettings } from '../../SettingsContext';
import { 
  getFundingContributions, 
  updateFundingStatus, 
  deleteFundingContribution,
  getFundingConfig,
  updateFundingConfig,
  getFundExpenses
} from '../../services/api';
import { FundingContribution, FundingStatus, FundingConfig, UserRole, FundExpense } from '../../types';
import { Card, Badge, ConfirmModal } from '../../components/UI';
import { 
  DollarSign, 
  Check, 
  X, 
  Trash2, 
  Settings, 
  TrendingUp, 
  Users, 
  Clock, 
  MessageSquare,
  AlertCircle,
  Save,
  ChevronRight,
  Search,
  Filter,
  Receipt,
  Wallet
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

export const AdminFundingManage = () => {
  const { user: currentUser } = useAuth();
  const { refreshFundingConfig } = useSettings();
  const [contributions, setContributions] = useState<FundingContribution[]>([]);
  const [config, setConfig] = useState<FundingConfig | null>(null);
  const [expenses, setExpenses] = useState<FundExpense[]>([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Requests' | 'Approved'>('Requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Remark for rejection
  const [remarkModal, setRemarkModal] = useState<{ id: string, status: FundingStatus } | null>(null);
  const [adminRemark, setAdminRemark] = useState('');

  // config edit state
  const [editConfig, setEditConfig] = useState<FundingConfig | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [all, cfg, expenses] = await Promise.all([
        getFundingContributions(),
        getFundingConfig(),
        getFundExpenses()
      ]);
      setContributions(all);
      setConfig(cfg);
      setEditConfig(cfg);
      setExpenses(expenses);
      const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
      setTotalExpenseAmount(totalAmount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, status: FundingStatus, remark?: string) => {
    if (!currentUser) return;
    setProcessingId(id);
    try {
      await updateFundingStatus(id, status, currentUser, remark);
      await fetchData();
      await refreshFundingConfig();
      setRemarkModal(null);
      setAdminRemark('');
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await deleteFundingContribution(deleteConfirmId, currentUser);
      await fetchData();
      await refreshFundingConfig();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editConfig) return;
    try {
      await updateFundingConfig(editConfig, currentUser);
      await refreshFundingConfig();
      setConfig(editConfig);
      alert("Configuration updated successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = contributions.filter(c => {
    const matchesSearch = c.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'Requests') return matchesSearch && c.status === FundingStatus.PENDING;
    if (activeTab === 'Approved') return matchesSearch && c.status === FundingStatus.APPROVED;
    return matchesSearch;
  });

  const monthlyData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; raised: number; expense: number; monthName: string }> = {};

    const formatMonthKey = (dateStr: string | number) => {
      const d = new Date(dateStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}`;
    };

    const formatMonthName = (dateStr: string | number) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    contributions.forEach(c => {
      if (c.status === FundingStatus.APPROVED) {
        const key = formatMonthKey(c.timestamp);
        if (!monthlyMap[key]) {
          monthlyMap[key] = { month: key, raised: 0, expense: 0, monthName: formatMonthName(c.timestamp) };
        }
        monthlyMap[key].raised += c.amount;
      }
    });

    expenses.forEach(e => {
      const key = formatMonthKey(e.date);
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: key, raised: 0, expense: 0, monthName: formatMonthName(e.date) };
      }
      monthlyMap[key].expense += e.amount;
    });

    return Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));
  }, [contributions, expenses]);

  const stats = {
    pending: contributions.filter(c => c.status === FundingStatus.PENDING).length,
    approvedCount: contributions.filter(c => c.status === FundingStatus.APPROVED).length,
    totalRaised: contributions.filter(c => c.status === FundingStatus.APPROVED).reduce((acc, curr) => acc + curr.amount, 0),
    uniqueDonors: new Set(contributions.filter(c => c.status === FundingStatus.APPROVED).map(c => c.userId)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-2 lg:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 md:space-y-6 lg:space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {[
          { label: 'Pending Requests', value: stats.pending, sub: 'Needs Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Total Raised', value: `৳${stats.totalRaised.toLocaleString()}`, sub: 'Approved Funds', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Total Expense', value: `৳${totalExpenseAmount.toLocaleString()}`, sub: 'Spent Funds', icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
          { label: 'Total Available', value: `৳${(stats.totalRaised - totalExpenseAmount).toLocaleString()}`, sub: 'Remaining', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
          { label: 'Donation Count', value: stats.approvedCount, sub: 'Success Payments', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Unique Donors', value: stats.uniqueDonors, sub: 'Platform Supporters', icon: Users, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-2.5 lg:p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 lg:gap-3 w-full">
            <div className={clsx("w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex-shrink-0 flex items-center justify-center", stat.bg)}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">{stat.value}</h3>
              <p className="text-[8px] lg:text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-none">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Main Content Areas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs & Search */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-4 gap-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl gap-1">
                  {['Requests', 'Approved'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={clsx(
                        "px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === tab 
                          ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                
                <div className="relative flex-1 lg:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search name or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                  />
                </div>
             </div>

             <div className="p-0">
               <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredItems.length === 0 ? (
                    <div className="p-16 text-center">
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic text-xs">No records found matching criteria</p>
                    </div>
                  ) : (
                    filteredItems.map((c) => (
                      <div key={c.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <div className="flex items-start lg:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                           <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-sm">
                             {c.userAvatar ? (
                               <img src={c.userAvatar} className="w-full h-full object-cover" alt={c.userName} />
                             ) : (
                               c.userName.charAt(0)
                             )}
                           </div>
                           <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                               <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{c.userName}</h4>
                               {c.status === FundingStatus.PENDING && (
                                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                               )}
                             </div>
                             <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                               <span className="text-[10px] sm:text-[11px] font-black text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/50 tracking-tight">৳{c.amount.toLocaleString()}</span>
                               <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">{c.paymentMethod} • {c.transactionId}</span>
                             </div>
                           </div>
                         </div>

                         <div className="flex justify-between items-end lg:items-center gap-3 lg:flex-1 lg:min-w-0 mt-1 lg:mt-0">
                            <div className="hidden lg:block w-px h-8 bg-slate-100 dark:bg-slate-800 shrink-0" />
                            <div className="flex flex-col gap-1 lg:gap-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <MessageSquare size={14} className="shrink-0 text-slate-400 dark:text-slate-500 shadow-none border-none stroke-[2px]" />
                                <p className="text-[11px] sm:text-xs font-medium leading-tight truncate text-slate-500 dark:text-slate-400">{c.purpose}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-tight">{new Date(c.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                               {c.status === FundingStatus.PENDING ? (
                                 <>
                                   <button 
                                     onClick={() => handleStatusChange(c.id, FundingStatus.APPROVED)}
                                     disabled={processingId === c.id}
                                     className="p-2 sm:p-2.5 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg shadow-sm transition-all active:scale-95"
                                     title="Approve"
                                   >
                                     <Check size={16} className="sm:w-5 sm:h-5" />
                                   </button>
                                   <button 
                                     onClick={() => setRemarkModal({ id: c.id, status: FundingStatus.REJECTED })}
                                     disabled={processingId === c.id}
                                     className="p-2 sm:p-2.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg shadow-sm transition-all active:scale-95"
                                     title="Reject"
                                   >
                                     <X size={16} className="sm:w-5 sm:h-5" />
                                   </button>
                                 </>
                               ) : (
                                 <button 
                                   onClick={() => setDeleteConfirmId(c.id)}
                                   disabled={processingId === c.id}
                                   className="p-2 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-all rounded"
                                   title="Delete Record"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                               )}
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
             </div>
          </div>

          {/* Monthly Summary Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Monthly Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-3 sm:py-4 sm:px-6 w-10 sm:w-16 text-center">Sl</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6">Month Name</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-right">Total Raised</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-right">Total Expense</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-right">Available Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] sm:text-sm">
                  {monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((data, idx) => (
                      <tr key={data.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-3 sm:py-4 sm:px-6 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-3 sm:py-4 sm:px-6 font-black text-slate-900 dark:text-white uppercase tracking-tight">{data.monthName}</td>
                        <td className="py-3 px-3 sm:py-4 sm:px-6 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          ৳{data.raised.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 sm:py-4 sm:px-6 text-right text-rose-600 dark:text-rose-400 font-bold">
                          ৳{data.expense.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 sm:py-4 sm:px-6 text-right font-black text-indigo-600 dark:text-indigo-400">
                          ৳{(data.raised - data.expense).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar help / Status */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                Guidelines
              </h4>
              <ul className="space-y-4">
                 {[
                   { t: 'Review Carefully', d: 'Always verify the transaction ID in your bank or payment app before approving.' },
                   { t: 'Immutable Records', d: 'Once approved, the amount is added to the total goal. Deleting approved record subtracts the amount.' },
                   { t: 'Transparent Management', d: 'Users can see all approved contributions and their own request status.' }
                 ].map((item, idx) => (
                   <li key={idx} className="flex gap-3">
                     <div className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-700">
                       {idx + 1}
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase mb-1 tracking-tight">{item.t}</p>
                       <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{item.d}</p>
                     </div>
                   </li>
                 ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                 <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 shadow-inner">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Platform Health</p>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 italic">Funding Active</span>
                       <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this funding contribution? This will archive the record in System Archives."
        isLoading={isDeleting}
      />

      <AnimatePresence>
        {remarkModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setRemarkModal(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 overflow-hidden"
             >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                    <X className="text-red-600" size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Reject Contribution</h3>
                </div>
                
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 ml-1">Reason for rejection (Optional)</p>
                <textarea 
                  rows={3}
                  value={adminRemark}
                  onChange={(e) => setAdminRemark(e.target.value)}
                  placeholder="e.g. Invalid Transaction ID"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all dark:text-white resize-none"
                />

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setRemarkModal(null)}
                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleStatusChange(remarkModal.id, remarkModal.status, adminRemark)}
                    className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                  >
                    Reject Now
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
