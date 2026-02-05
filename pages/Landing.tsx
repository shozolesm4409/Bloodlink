import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where } from '@firebase/firestore';
import { db, subscribeToApprovedFeedbacks, getLandingConfig, getCachedFeedbacks } from '../services/api';
import { DonationStatus, DonationFeedback, LandingPageConfig, User } from '../types';
import { Droplet, Users, HeartPulse, Activity, User as UserIcon, Calendar, ArrowRight, ShieldCheck, Quote, Trophy, Sparkles } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { getRankData } from './Profile';
import clsx from 'clsx';

const StatCard = ({ value, label, icon: Icon }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] text-center hover:-translate-y-2 transition-transform group flex flex-col items-center">
    <div className="w-16 h-16 bg-red-50 text-[#c1121f] rounded-2xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
      <Icon size={32} />
    </div>
    <div className="text-4xl lg:text-5xl font-black text-[#c1121f] mb-2 tracking-tighter">
      {typeof value === 'number' && value > 0 ? `${value}+` : value}
    </div>
    <div className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{label}</div>
  </div>
);

export const Landing = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolume: 0
  });
  
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>(getCachedFeedbacks());
  const [topThree, setTopThree] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [config, setConfig] = useState<LandingPageConfig>({
    heroTitle: 'এক ফোঁটা রক্ত\nহাজারো জীবনের আশা',
    heroSubtitle: 'রক্তদাতা ও প্রয়োজনের মাঝে সবচেয়ে দ্রুত ও নিরাপদ সেতু। আজই আমাদের কমিউনিটিতে যোগ দিন — একটি জীবন বাঁচানোর মহান সুযোগ নিন।',
    heroButtonPrimary: 'রক্তদাতা হিসেবে নিবন্ধন',
    heroButtonSecondary: 'রক্তের অনুরোধ করুন',
    statsSectionTitle: 'আমাদের লাইভ পরিসংখ্যান',
    feedbackSectionTitle: 'ডোনারদের বাস্তব অভিজ্ঞতা',
    feedbackSectionSubtitle: 'সফল রক্তদাতাদের শেয়ার করা অনুপ্রেরণামূলক গল্পসমূহ',
    ctaTitle: 'রক্তের জরুরি প্রয়োজন?',
    ctaSubtitle: 'আমাদের শক্তিশালী ডিরেক্টরি ব্যবহার করে মুহূর্তের মধ্যে নিকটস্থ রক্তদাতাদের সাথে যোগাযোগ করুন।',
    ctaButtonText: 'এখনই শুরু করুন',
    footerCopyright: '© ২০২৬ BLOODLINK MANAGER',
    footerTagline: 'প্রতিটি ফোঁটা একটি জীবনের আশা।'
  });

  useEffect(() => {
    // Load Landing Config
    getLandingConfig().then(data => {
      if (data) setConfig(prev => ({ ...prev, ...data }));
    }).catch(err => console.debug("Config load failed", err));

    // Live Statistics Fetching
    const unsubUsers = onSnapshot(collection(db, 'users'), (userSnapshot) => {
      const allUsersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      const totalUsers = userSnapshot.size;

      // Internal Snapshot for Donations to calculate complex stats
      const unsubDonations = onSnapshot(collection(db, 'donations'), (donSnapshot) => {
        const allDons = donSnapshot.docs.map(d => d.data());
        const completedDons = allDons.filter(d => d.status === DonationStatus.COMPLETED);
        
        const donorCounts: Record<string, number> = {};
        completedDons.forEach(d => {
          donorCounts[d.userId] = (donorCounts[d.userId] || 0) + 1;
        });

        const totalVolume = completedDons.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
        const uniqueDonorsCount = new Set(completedDons.map(d => d.userId)).size;

        setStats({
          totalUsers,
          totalDonors: uniqueDonorsCount,
          totalVolume
        });

        // Top 3 Donors Logic
        const sortedHeroes = allUsersList
          .map(u => ({ ...u, donationCount: donorCounts[u.id] || 0 }))
          .sort((a, b) => b.donationCount - a.donationCount)
          .slice(0, 3)
          .filter(u => u.donationCount > 0);
          
        setTopThree(sortedHeroes);
        setLoadingStats(false);
      });

      return () => unsubDonations();
    }, (err) => {
      console.error("Stats subscription error:", err);
      setLoadingStats(false);
    });

    // Feedback Subscription
    const unsubFeedbacks = subscribeToApprovedFeedbacks(setFeedbacks);

    return () => {
      unsubUsers();
      unsubFeedbacks();
    };
  }, []);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#c1121f] to-[#e63946] text-white text-center py-24 lg:py-36 px-[5%] flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Droplet className="absolute top-10 left-[5%] rotate-12" size={120} />
          <Droplet className="absolute bottom-20 right-[10%] -rotate-12" size={160} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <h1 className="font-galada text-5xl lg:text-8xl font-black leading-[1.2] mb-8 animate-fade-in-up whitespace-pre-line drop-shadow-2xl">
            {config.heroTitle}
          </h1>
          <p className="text-lg lg:text-2xl opacity-90 max-w-2xl mx-auto mb-14 font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {config.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/register" className="bg-white text-[#c1121f] px-10 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-3 group active:scale-95">
              {config.heroButtonPrimary} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link to="/login" className="bg-transparent border-2 border-white/40 backdrop-blur-md text-white px-10 py-5 rounded-[1.5rem] font-black text-lg hover:bg-white/10 transition-all text-center flex items-center justify-center active:scale-95">
              {config.heroButtonSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-24 px-[5%] bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">Live System Statistics</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
              {config.statsSectionTitle}
            </h2>
            <div className="w-24 h-2 bg-red-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <StatCard 
              value={loadingStats ? "..." : stats.totalUsers} 
              label="মোট মেম্বার" 
              icon={Users} 
            />
            <StatCard 
              value={loadingStats ? "..." : stats.totalDonors} 
              label="সফল ডোনার" 
              icon={Activity} 
            />
            <StatCard 
              value={loadingStats ? "..." : `${stats.totalVolume.toLocaleString()} ml`} 
              label="সংগৃহীত রক্ত" 
              icon={HeartPulse} 
            />
          </div>
        </div>
      </section>

      {/* Heroes Section */}
      <section className="py-20 lg:py-24 px-[5%] bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-full mb-6 shadow-sm border border-yellow-100">
              <Trophy size={16} className="fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Community Lifesavers</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 mb-4 tracking-tight">
              সেরা ৩ রক্তদাতা
            </h2>
            <div className="w-24 h-2 bg-yellow-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
            {topThree.length > 0 ? topThree.map((hero, idx) => {
              const rank = getRankData(hero.donationCount);
              return (
                <div key={hero.id} className={clsx(
                  "relative bg-white rounded-[3rem] p-10 border-2 transition-all hover:shadow-2xl group text-center",
                  idx === 0 ? "md:order-2 md:scale-110 md:-translate-y-8 border-yellow-200 z-10 shadow-2xl" : 
                  idx === 1 ? "md:order-1 border-slate-100" : "md:order-3 border-slate-100"
                )}>
                  <div className="relative mb-8 mx-auto w-36 h-36">
                    <div className={clsx(
                      "w-full h-full rounded-[3rem] bg-slate-50 overflow-hidden border-4 border-white shadow-xl",
                      idx === 0 && "ring-8 ring-yellow-400/20"
                    )}>
                      {hero.avatar ? <img src={hero.avatar} className="w-full h-full object-cover" alt={hero.name} /> : <UserIcon className="p-10 text-slate-300 w-full h-full" />}
                    </div>
                    {rank && (
                      <div className={clsx(
                        "absolute -top-4 -right-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white animate-bounce",
                        rank.bg, rank.color
                      )}>
                        <rank.icon size={28} fill="currentColor" />
                      </div>
                    )}
                    <div className={clsx(
                      "absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-black text-white text-sm shadow-xl",
                      idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-400" : "bg-orange-400"
                    )}>
                      #{idx + 1}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-red-600 transition-colors leading-tight">{hero.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">{hero.location}</p>
                  
                  <div className="bg-slate-50 rounded-[2rem] p-6 flex justify-between items-center border border-slate-100">
                    <div className="text-left">
                       <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-2">Rank Title</p>
                       <p className={clsx("text-base font-black", rank?.color)}>{rank?.name || 'Newbie'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-2">Total Given</p>
                       <p className="text-base font-black text-slate-900">{hero.donationCount} বার</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-20 text-center opacity-30 italic font-bold">সেরা ডোনারদের তথ্য পাওয়া যাচ্ছে না...</div>
            )}
          </div>
        </div>
      </section>

      {/* Feedbacks */}
      <section className="py-24 px-[5%] bg-white min-h-[500px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              {config.feedbackSectionTitle}
            </h2>
            <div className="w-24 h-2 bg-red-600 mx-auto rounded-full mb-8"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-sm opacity-60">
              {config.feedbackSectionSubtitle}
            </p>
          </div>

          {feedbacks.length > 0 ? (
            <div className="animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {feedbacks.slice(0, 6).map(f => (
                  <div key={f.id} className="bg-white p-12 rounded-[3.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-50 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div>
                      <div className="mb-6">
                        <Quote size={48} className="text-red-100 fill-current opacity-50" />
                      </div>
                      <p className="text-slate-700 font-bold text-xl leading-relaxed mb-12 min-h-[120px]">
                        "{f.message}"
                      </p>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                          {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" alt={f.userName} /> : <UserIcon className="p-4 text-slate-300 w-full h-full" />}
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 text-xl leading-tight">{f.userName}</span>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(f.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-16 text-center">
                <Link to="/public-feedbacks" className="inline-flex items-center gap-4 text-red-600 font-black uppercase tracking-[0.4em] text-xs hover:gap-6 transition-all px-12 py-6 rounded-full bg-red-50 hover:bg-red-100 shadow-sm">
                  সবগুলো অভিজ্ঞতা দেখুন <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Activity className="animate-spin text-red-600 mb-6" size={48} />
              <p className="font-black text-slate-400 uppercase tracking-[0.2em] italic">অভিজ্ঞতাগুলো লোড হচ্ছে...</p>
            </div>
          )}
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="py-24 bg-slate-900 text-white px-[5%] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent"></div>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl lg:text-7xl font-black mb-8 tracking-tight leading-none">
              {config.ctaTitle}
            </h2>
            <p className="text-slate-400 text-xl lg:text-2xl font-medium max-w-2xl leading-relaxed">
              {config.ctaSubtitle}
            </p>
          </div>
          <Link to="/register" className="bg-red-600 text-white px-12 py-6 rounded-[2rem] font-black text-2xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:bg-red-700 transition-all active:scale-95 flex items-center gap-4 group">
            {config.ctaButtonText} <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};