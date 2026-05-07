
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useSettings } from '../../SettingsContext';
import { 
  getFundingContributions, 
  getUserFundingContributions, 
  addFundingContribution, 
  getFundingConfig,
  requestDonationFoundAccess,
  getFundExpenses,
  getUserProfile
} from '../../services/api';
import { FundingContribution, FundingStatus, FundingConfig, FundExpense, User as AppUser } from '../../types';
import { 
  HeartHandshake, 
  Plus, 
  History, 
  DollarSign, 
  CreditCard, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Trophy,
  Receipt,
  User,
  Phone,
  Droplet,
  UserCheck,
  X,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { BADGE_COLOR_MAP } from '../../constants';

export const FundingPage = () => {
  const { user } = useAuth();
  const { refreshFundingConfig } = useSettings();
  const [contributions, setContributions] = useState<FundingContribution[]>([]);
  const [myContributions, setMyContributions] = useState<FundingContribution[]>([]);
  const [fundExpenses, setFundExpenses] = useState<FundExpense[]>([]);
  const [config, setConfig] = useState<FundingConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    paymentMethod: 'Bkash',
    transactionId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [all, mine, cfg, expenses] = await Promise.all([
        getFundingContributions(),
        user ? getUserFundingContributions(user.id) : [],
        getFundingConfig(),
        getFundExpenses()
      ]);
      setContributions(all.filter(c => c.status === FundingStatus.APPROVED));
      setMyContributions(mine);
      setConfig(cfg);
      setFundExpenses(expenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) throw new Error("অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।");
      if (!formData.transactionId) throw new Error("ট্রানজেকশন আইডি প্রদান করুন।");
      if (!formData.purpose) throw new Error("উদ্দেশ্য উল্লেখ করুন।");

      await addFundingContribution({
        amount,
        purpose: formData.purpose,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId
      }, user);

      setSuccess("আপনার অনুদান অনুরোধটি সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করার পর এটি যুক্ত করা হবে।");
      setFormData({ amount: '', purpose: '', paymentMethod: 'Bkash', transactionId: '' });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "কিছু ভুল হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserClick = async (uid: string) => {
    try {
      setLoadingUser(true);
      const userProfile = await getUserProfile(uid);
      setSelectedUser(userProfile);
    } catch (err) {
      setError('Failed to load user details');
    } finally {
      setLoadingUser(false);
    }
  };

  if (user && user.role === 'USER' && !user.hasDonationFoundAccess) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xl"
        >
          <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <HeartHandshake size={40} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Donation Fund Access Required</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-10">
            এই বিভাগটি দেখার জন্য আপনার বিশেষ অনুমতি প্রয়োজন। আপনি যদি অনুদান দিতে ইচ্ছুক হন বা এই বিষয় সম্পর্কিত তথ্য জানতে চান, তবে নিচের বাটনটি ক্লিক করে আবেদন করুন।
          </p>
          
          {user.donationFoundAccessRequested ? (
            <div className="flex items-center justify-center gap-3 py-4 px-8 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/30 font-black uppercase text-xs tracking-widest animate-pulse">
               <Clock size={18} />
               Request Pending Approval
            </div>
          ) : (
            <button 
              onClick={async () => {
                try {
                  await requestDonationFoundAccess(user);
                  window.location.reload();
                } catch (e) {
                  alert("আবেদন করতে ব্যর্থ হয়েছে।");
                }
              }}
              className="w-full py-5 bg-red-600 dark:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-red-100 dark:shadow-red-900/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Request Fund Access
            </button>
          )}
          
          <p className="mt-8 text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">
            Admin will review your request shortly
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium font-black animate-pulse">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const goalAmount = config?.goalAmount ?? 1;
  const currentAmount = config?.currentAmount ?? 0;
  const progress = Math.min(100, (currentAmount / goalAmount) * 100);

  return (
    <div className="w-full h-full p-2 lg:p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 max-w-7xl mx-auto">
      {/* Header & Stats */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-10 flex flex-col lg:flex-row gap-8">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none hidden lg:block">
          <HeartHandshake size={160} className="text-red-600" />
        </div>
        
        <div className="relative z-10 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 border border-red-100 dark:border-red-900/50">
            <TrendingUp size={14} />
            Community Funding
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            {config?.title || "Donation Fund"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base leading-relaxed mb-8">
            {config?.description || "Help us save lives by supporting our platform costs and emergency assistance."}
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-red-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Goal: </span>
                <span className="text-slate-900 dark:text-white font-black">৳{goalAmount.toLocaleString()}</span>
              </div>
              <div className="text-slate-900 dark:text-white font-black">
                {progress.toFixed(1)}% Completed
              </div>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
              </motion.div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Raised: </span>
                <span className="text-red-600 dark:text-red-400 font-black text-2xl lg:text-3xl">৳{currentAmount.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest shadow-lg shadow-red-200 dark:shadow-red-900/20 transition-all active:scale-95 group"
              >
                <Plus size={18} className="transition-transform group-hover:rotate-90" />
                Contribute Now
              </button>
            </div>
          </div>
        </div>

        {/* Payment Info Sidebar */}
        <div className="relative z-10 lg:w-80 flex-shrink-0">
          <div className="h-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-red-500" />
              Payment Methods
            </h3>
            <div className="space-y-4">
               {config?.paymentInfo?.split('\n').map((line, idx) => (
                 <div key={idx} className="flex gap-3 items-start">
                   <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                   </div>
                   <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                     {line}
                   </p>
                 </div>
               ))}
               {!config?.paymentInfo && (
                 <p className="text-[10px] text-slate-400 italic">No payment instructions provided yet.</p>
               )}
            </div>

            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-red-600" />
                <p className="text-[10px] font-black text-red-600 uppercase tracking-tight">Security Caution</p>
              </div>
              <p className="text-[9px] text-red-700/70 dark:text-red-400/70 font-medium leading-relaxed">
                অনুদান পাঠানোর পর অবশ্যই ট্রানজেকশন আইডি সহ নিচের ফর্মটি পূরণ করুন যাতে আমরা আপনার সহযোগিতাটি তালিকাভুক্ত করতে পারি।
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* All Contributions List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={20} className="text-blue-500" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Recent Contributions</h2>
              </div>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {contributions.length} TOTAL
              </span>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
              {contributions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HeartHandshake className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">এখনো কোনো অনুদান জমা হয়নি।</p>
                </div>
              ) : (
                contributions.map((c) => (
                  <div key={c.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                      {c.userAvatar ? (
                        <img src={c.userAvatar} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-slate-400">{c.userName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                          {c.userName}
                        </p>
                        <span className="text-xs font-black text-red-600 dark:text-red-400">৳{c.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <p className="text-slate-500 dark:text-slate-500 truncate italic">
                           "{c.purpose}"
                        </p>
                        <span className="text-slate-400">
                          {new Date(c.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* My Contributions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-500" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">My History</h2>
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
              {myContributions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No activities yet</p>
                </div>
              ) : (
                myContributions.map((c) => (
                  <div key={c.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">৳{c.amount.toLocaleString()}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                        <CreditCard size={10} />
                        <span>{c.paymentMethod} • {c.transactionId}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {c.purpose}
                      </p>
                      {c.adminRemark && (
                         <div className="mt-1 p-2 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg">
                           <p className="text-[9px] text-red-600 font-medium">REMARK: {c.adminRemark}</p>
                         </div>
                      )}
                      <span className="text-[8px] text-slate-400 block text-right">
                        {new Date(c.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fund Expenses Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/30 rounded-xl flex items-center justify-center">
              <Receipt size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">Fund Expenses</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Where the money was spent</p>
            </div>
          </div>
        </div>
        
        <div className="p-0">
          {fundExpenses.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Receipt className="text-slate-300 dark:text-slate-600" size={28} />
              </div>
              <p className="text-slate-900 dark:text-white font-black text-lg mb-1 uppercase tracking-tight">No expenses logged yet</p>
              <p className="text-[11px] font-bold text-slate-500 max-w-sm mx-auto leading-relaxed">আমাদের ফান্ডের টাকাগুলো যে সকল গঠনমূলক কাজে খরচ করা হয় তার তালিকা পরবর্তীতে এখানে আপডেট করা হবে।</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[400px] overflow-y-auto custom-scrollbar">
              {fundExpenses.map((expense) => (
                <div key={expense.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate">{expense.purpose}</p>
                    {expense.notes && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-sm truncate group-hover:whitespace-normal group-hover:text-clip">{expense.notes}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700 whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <button onClick={() => handleUserClick(expense.addedBy.uid)} className="flex items-center gap-1 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700 transition-colors text-left shrink-0">
                        <User size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[80px] sm:max-w-none">
                          {expense.addedBy.name}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 whitespace-nowrap">
                      ৳{expense.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contribution Drawer/Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            >
              <div className="bg-[#e40000] px-6 py-5 text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 flex items-center justify-center shrink-0">
                  <Send className="text-white" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight mb-0.5">নতুন অনুদান জমা দিন</h3>
                  <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">Submit new contribution</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 rounded-xl">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">টাকার পরিমাণ (BDT)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <DollarSign size={18} />
                    </div>
                    <input 
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="Enter amount"
                      className="w-full bg-slate-50/80 dark:bg-slate-800/80 border-none py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#e40000] focus:ring-inset outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">পেমেন্ট মাধ্যম</label>
                    <div className="relative">
                      <select 
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="w-full bg-slate-50/80 dark:bg-slate-800/80 border-none py-3.5 px-4 pr-10 text-sm font-bold focus:ring-2 focus:ring-[#e40000] focus:ring-inset outline-none transition-all dark:text-white appearance-none"
                      >
                        <option value="Bkash">Bkash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Bank">Bank Transfer</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronDown size={16} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">উদ্দেশ্য</label>
                    <input 
                      type="text"
                      required
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                      placeholder="e.g. Server Cost"
                      className="w-full bg-slate-50/80 dark:bg-slate-800/80 border-none py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#e40000] focus:ring-inset outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ট্রানজেকশন আইডি (TxID)</label>
                  <input 
                    type="text"
                    required
                    value={formData.transactionId}
                    onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                    placeholder="Enter TxID"
                    className="w-full bg-slate-50/80 dark:bg-slate-800/80 border-none py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#e40000] focus:ring-inset outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-[1.5] py-3.5 bg-[#e40000] hover:bg-[#cc0000] text-white font-extrabold text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-10 right-10 z-[110] max-w-sm"
          >
            <div className="bg-green-600 p-4 rounded-2xl shadow-xl shadow-green-200 dark:shadow-green-900/20 text-white flex gap-3">
              <CheckCircle2 size={24} className="flex-shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1">সফল হয়েছে!</p>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">{success}</p>
                <button 
                  onClick={() => setSuccess('')}
                  className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Details Popup */}
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

const StatusBadge = ({ status }: { status: FundingStatus }) => {
  switch (status) {
    case FundingStatus.PENDING:
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/50">
          <Clock size={10} /> PENDING
        </span>
      );
    case FundingStatus.APPROVED:
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100 dark:border-green-900/50">
          <CheckCircle2 size={10} /> SUCCESS
        </span>
      );
    case FundingStatus.REJECTED:
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-100 dark:border-red-900/50">
          <XCircle size={10} /> REJECTED
        </span>
      );
  }
};
