
import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, logVerificationCheck } from '../../services/api';
import { User, DonationFeedback, FeedbackStatus, DonationStatus } from '../../types';
import { Card, Badge, Button } from '../../components/UI';
import { CheckCircle2, ShieldCheck, Droplet, MapPin, Calendar, AlertCircle, Search, User as UserIcon, MessageSquareQuote, Quote, QrCode, Clock, History, Award } from 'lucide-react';
import { getRankData } from '../Users/Profile';
import clsx from 'clsx';

const { useParams, useNavigate, useLocation } = ReactRouterDOM;

export const VerifyMember = () => {
  const { idNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [member, setMember] = useState<User | null>(null);
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [donationCount, setDonationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchId, setSearchId] = useState('');

  // Determine if we are in admin mode or public mode
  const isAdminView = location.pathname.startsWith('/admin');
  const baseRoute = isAdminView ? '/admin/verify' : '/verify';

  const fetchData = async (queryValue: string) => {
    setLoading(true);
    setError(false);
    try {
      // First try searching by ID Number
      const qId = query(collection(db, 'users'), where('idNumber', '==', queryValue.toUpperCase()));
      let snap = await getDocs(qId);
      
      // If not found, try searching by Phone Number
      if (snap.empty) {
        const qPhone = query(collection(db, 'users'), where('phone', '==', queryValue));
        snap = await getDocs(qPhone);
      }
      
      if (!snap.empty) {
        const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
        
        // Log the verification check
        await logVerificationCheck(userData.id, userData.name, userData.bloodGroup);
        
        // Fetch feedbacks
        const fq = query(
          collection(db, 'feedbacks'), 
          where('userId', '==', userData.id),
          where('status', '==', FeedbackStatus.APPROVED)
        );
        const fSnap = await getDocs(fq);
        const feedbackData = fSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationFeedback));
        setFeedbacks(feedbackData);

        // Fetch completed donation count
        const dq = query(
          collection(db, 'donations'),
          where('userId', '==', userData.id),
          where('status', '==', DonationStatus.COMPLETED)
        );
        const dSnap = await getDocs(dq);
        const count = dSnap.size;
        setDonationCount(count);
        setMember(userData);

      } else {
        setMember(null);
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idNumber) {
      fetchData(idNumber);
    } else {
      setMember(null);
      setError(false);
    }
  }, [idNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`${baseRoute}/${searchId.trim()}`);
    }
  };

  const checkEligibility = (lastDate?: string) => {
    if (!lastDate) return { eligible: true, daysLeft: 0 };
    const lastDonation = new Date(lastDate);
    const today = new Date();
    const nextEligible = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
    const diffTime = nextEligible.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      eligible: diffDays <= 0,
      daysLeft: Math.max(0, diffDays)
    };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Authenticating Identity...</p>
      </div>
    );
  }

  // No ID provided - Search UI
  if (!idNumber) {
    return (
      <div className={clsx("flex flex-col items-center justify-center transition-colors", !isAdminView && "py-20 px-6 bg-white dark:bg-slate-950 min-h-screen")}>
        <div className="max-w-xl w-full space-y-8 animate-in fade-in duration-500">
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-600 dark:bg-red-700 text-white rounded-[1rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-200 dark:shadow-red-900/20 transition-colors">
                <ShieldCheck size={40} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Identity Verification</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">পাবলিক ভেরিফিকেশন সিস্টেম। ডোনার আইডি অথবা ফোন নম্বর দিয়ে সত্যতা যাচাই করুন।</p>
           </div>

           <Card className="p-10 border-0 shadow-2xl rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors">
              <form onSubmit={handleSearch} className="space-y-6">
                 <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1 transition-colors">System ID or Phone Number</label>
                    <div className="relative group">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-red-600 dark:group-focus-within:text-red-400 transition-colors" size={20} />
                       <input 
                         type="text" 
                         placeholder="ID (e.g. BL-361013) or Phone Number" 
                         value={searchId}
                         onChange={(e) => setSearchId(e.target.value)}
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-red-600/30 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                         required
                       />
                    </div>
                 </div>
                 <Button type="submit" className="w-full py-5 rounded-xl text-lg shadow-xl shadow-red-100 dark:shadow-red-900/20">ভেরিফাই করুন</Button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center transition-colors">
                 <div className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors">
                   <QrCode size={14} /> Scan ID Card for Auto-Verify
                 </div>
              </div>
           </Card>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className={clsx("flex flex-col items-center justify-center p-6", !isAdminView && "py-20")}>
        <Card className="max-w-md w-full p-5 text-center border-0 shadow-2xl rounded-[1.5rem] bg-white">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[1rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">সদস্য খুঁজে পাওয়া যায়নি</h2>
          <p className="text-slate-500 font-medium mb-8">প্রদত্ত আইডি বা ফোন নম্বরের সাথে কোনো নিবন্ধিত রক্তদাতা পাওয়া যায়নি। দয়া করে তথ্য যাচাই করে আবার চেষ্টা করুন।</p>
          <Button onClick={() => navigate(baseRoute)} variant="outline" className="w-full py-4 rounded-xl border-slate-200">আবার খুঁজুন</Button>
        </Card>
      </div>
    );
  }

  const { eligible } = checkEligibility(member.lastDonationDate);
  const rank = getRankData(donationCount);

  return (
    <div className={clsx("animate-in fade-in zoom-in-95 duration-500 transition-colors", !isAdminView && "py-12 px-6 lg:py-20 bg-white dark:bg-slate-950 min-h-screen")}>
      <Card className="max-w-4xl mx-auto border-0 shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden relative border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="absolute top-0 left-0 w-full h-40 bg-[#001f3f] dark:bg-slate-950 z-0 transition-colors">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

        <div className="relative z-10 px-8 lg:px-12 pt-12 pb-12">
           <div className="flex flex-col lg:flex-row gap-10 items-start">
              {/* Left Column: Identity */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-auto">
                 <div className="w-40 h-40 rounded-[2.5rem] border-[6px] border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6 relative transition-colors">
                    {member.avatar ? (
                      <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
                    ) : (
                      <UserIcon className="p-8 text-slate-300 dark:text-slate-600 w-full h-full" />
                    )}
                    {rank && (
                      <div className={clsx("absolute bottom-0 right-0 w-12 h-12 bg-white dark:bg-slate-900 flex items-center justify-center rounded-tl-2xl shadow-inner transition-colors", rank.color)}>
                        <rank.icon size={24} fill="currentColor" />
                      </div>
                    )}
                 </div>
                 
                 <div>
                    <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 transition-colors">{member.name}</h2>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 transition-colors">Official Donor</p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                       <Badge color="blue" className="px-3 py-1 ring-1 ring-blue-100 dark:ring-blue-900/50 font-black">{member.idNumber || 'NO ID'}</Badge>
                       <Badge color={eligible ? 'green' : 'red'} className="px-3 py-1 ring-1 ring-current font-black">{eligible ? 'Active' : 'Resting'}</Badge>
                    </div>
                 </div>
              </div>

              {/* Right Column: Details */}
              <div className="flex-1 w-full space-y-8 mt-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                       <div className="w-12 h-12 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                          <Droplet size={24} className="fill-current" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Blood Group</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{member.bloodGroup}</p>
                       </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                       <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                          <MapPin size={24} className="fill-current" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Location</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white truncate transition-colors">{member.location}</p>
                       </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                       <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                          <Award size={24} className="fill-current" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Total Donated</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white transition-colors">{donationCount} Times</p>
                       </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                       <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                          <Calendar size={24} className="fill-current" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Last Donation</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white transition-colors">{member.lastDonationDate ? new Date(member.lastDonationDate).toLocaleDateString() : 'N/A'}</p>
                       </div>
                    </div>
                 </div>

                 {/* Feedbacks */}
                 {feedbacks.length > 0 && (
                   <div className="pt-8 border-t border-slate-100 dark:border-slate-800 transition-colors">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2 transition-colors">
                         <MessageSquareQuote size={16} /> Community Reviews
                      </h3>
                      <div className="space-y-4">
                         {feedbacks.slice(0, 3).map(f => (
                           <div key={f.id} className="p-4 bg-[#f8f9fa] dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 relative transition-colors">
                              <Quote size={16} className="absolute top-4 left-4 text-slate-300 dark:text-slate-700 fill-current transition-colors" />
                              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium pl-6 italic mb-2 transition-colors">"{f.message}"</p>
                              <div className="flex justify-end items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest transition-colors">
                                 <Clock size={12} />
                                 {new Date(f.timestamp).toLocaleDateString()}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
           </div>

           <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-center transition-colors">
              <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-6 py-3 rounded-full border border-green-200 dark:border-green-900/30 shadow-sm transition-colors">
                 <CheckCircle2 size={18} className="fill-current" />
                 <span className="text-xs font-black uppercase tracking-widest">Verified Member of BloodLink</span>
              </div>
           </div>
           
           <div className="mt-8 text-center">
              <Button onClick={() => navigate(baseRoute)} variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl px-8 transition-colors">
                 Verify Another ID
              </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};
