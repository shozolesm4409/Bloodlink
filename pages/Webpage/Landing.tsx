
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, subscribeToApprovedFeedbacks, getLandingConfig, getCachedFeedbacks, getUsers } from '../../services/api';
import { DonationStatus, DonationFeedback, LandingPageConfig, User, BloodGroup, UserRole } from '../../types';
import { Droplet, Users, HeartPulse, Activity, User as UserIcon, Calendar, ArrowRight, ShieldCheck, Quote, Trophy, Sparkles, Search, BadgeCheck, Facebook, Twitter, Instagram, Linkedin, Youtube, Github, MessageCircle, Send, Globe } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { getRankBadge, getVerificationBadge } from '../Users/Profile';
import { useSettings } from '../../SettingsContext';
import { Card, RoleBadge } from '../../components/UI';
import clsx from 'clsx';



export const Landing = () => {
  const { badgeConfig } = useSettings();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolume: 0
  });
  
  const [bloodStats, setBloodStats] = useState<Record<string, { count: number, volume: number }>>({});
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>(getCachedFeedbacks());
  const [topThree, setTopThree] = useState<any[]>([]);
  
  const [config, setConfig] = useState<LandingPageConfig>({
    heroTitle: 'এক ফোঁটা রক্ত\nহাজারো জীবনের আশা',
    heroSubtitle: 'রক্তদাতা ও প্রয়োজনের মাঝে সবচেয়ে দ্রুত ও নিরাপদ সেতু। আজই আমাদের কমিউনিটিতে যোগ দিন — একটি জীবন বাঁচানোর মহান সুযোগ নিন।',
    heroButtonPrimary: 'রক্তদাতা হিসেবে নিবন্ধন',
    heroButtonSecondary: 'রক্তের অনুসন্ধান করুন',
    statsSectionTitle: 'আমাদের লাইভ পরিসংখ্যান',
    feedbackSectionTitle: 'ডোনারদের বাস্তব অভিজ্ঞতা',
    feedbackSectionSubtitle: 'সফল রক্তদাতাদের শেয়ার করা অনুপ্রেরণামূলক গল্পসমূহ',
    ctaTitle: 'রক্তের জরুরি প্রয়োজন?',
    ctaSubtitle: 'আমাদের শক্তিশালী ডিরেক্টরি ব্যবহার করে মুহূর্তের মধ্যে নিকটস্থ রক্তদাতাদের সাথে যোগাযোগ করুন।',
    ctaButtonText: 'এখনই শুরু করুন',
    footerCopyright: '© ২০২৬ BLOODLINK MANAGER',
    footerTagline: 'প্রতিটি ফোঁটা একটি জীবনের আশা।'
  });
  
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(prev => ({ ...prev, ...data }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      const unsubDonsRealtime = onSnapshot(collection(db, 'donations'), (donSnap) => {
        const dons = donSnap.docs.map(d => d.data());
        const completedDons = dons.filter(d => d.status === DonationStatus.COMPLETED);
        
        const counts: Record<string, number> = {};
        completedDons.forEach(d => {
          counts[d.userId] = (counts[d.userId] || 0) + 1;
        });

        const sorted = usersList
          .map(u => ({ ...u, donationCount: counts[u.id] || 0 }))
          .sort((a, b) => b.donationCount - a.donationCount)
          .slice(0, 3)
          .filter(u => u.donationCount > 0);
          
        setTopThree(sorted);
        
        const totalVolume = completedDons.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
        const uniqueDonorIds = new Set(completedDons.map(d => d.userId));
        
        setStats({ 
          totalUsers: snapshot.size, 
          totalDonors: uniqueDonorIds.size, 
          totalVolume: totalVolume 
        });
        setLoadingStats(false);

        const bStats: Record<string, { count: number, volume: number }> = {};
        Object.values(BloodGroup).forEach(bg => { bStats[bg] = { count: 0, volume: 0 }; });
        completedDons.forEach(d => {
          if (bStats[d.userBloodGroup]) {
            bStats[d.userBloodGroup].count += 1;
            bStats[d.userBloodGroup].volume += (Number(d.units) || 0);
          }
        });
        setBloodStats(bStats);
      });

      return () => unsubDonsRealtime();
    }, (error) => {
      console.debug("Users stats restricted:", error);
    });

    const unsubscribeFeedbacks = subscribeToApprovedFeedbacks(async (data) => {
      const users = await getUsers();
      const userMap = new Map(users.map(u => [u.id, u]));
      const enrichedData = data.map(f => {
        const u = userMap.get(f.userId);
        return {
          ...f,
          userApprovedBadge: f.userApprovedBadge || u?.approvedBadge || (u?.role === UserRole.SUPERADMIN ? 'blue' : null)
        };
      });
      setFeedbacks(enrichedData);
    });

    return () => {
      unsubUsers();
      unsubscribeFeedbacks();
    };
  }, []);

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#c1121f] to-[#e63946] text-white text-center py-24 lg:py-30 px-[5%] flex flex-col items-center relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
          <Droplet className="absolute top-10 left-[10%] rotate-12" size={120} />
          <Droplet className="absolute bottom-20 right-[15%] -rotate-12" size={160} />
        </div>
        <div className="relative z-10 max-w-5xl">
          <h1 className="font-galada text-4xl lg:text-7xl font-black leading-[1.3] mb-6 animate-fade-in-up whitespace-pre-line">
            {config.heroTitle}
          </h1>
          <p className="text-lg lg:text-2xl opacity-90 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {config.heroSubtitle}
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center w-full animate-fade-in-up mt-8 items-stretch" style={{ animationDelay: '0.4s' }}>
            <Link to="/register" className="bg-white text-[#c1121f] px-8 py-4 rounded-xl font-black text-base lg:text-lg shadow-2xl hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-2 group flex-1 md:flex-none min-w-[220px]">
              {config.heroButtonPrimary} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <Link to="/donors" className="bg-slate-900/40 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-black text-base lg:text-lg hover:bg-slate-900/60 transition-all text-center flex items-center justify-center gap-2 flex-1 md:flex-none min-w-[220px]">
              <Search size={20} /> {config.heroButtonSecondary}
            </Link>

            <Link to="/verify" className="bg-slate-900/40 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-black text-base lg:text-lg hover:bg-slate-900/60 transition-all text-center flex items-center justify-center gap-2 flex-1 md:flex-none min-w-[220px]">
              <ShieldCheck size={20} /> Verify Users
            </Link>
          </div>

        </div>
      </section>

      <section className="py-10 lg:py-16 px-[5%] bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-4 py-1.5 rounded-full mb-4">
              <div className={`w-2 h-2 rounded-full ${!loadingStats ? 'bg-green-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{!loadingStats ? 'Live Data Sync Active' : 'Connecting to Database...'}</span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              {config.statsSectionTitle}
            </h2>
            <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8 lg:gap-12 mb-20">
            <StatCard 
              value={loadingStats ? 0 : stats.totalUsers} 
              label="মোট মেম্বার" 
              icon={Users} 
              colorClass="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" 
              decorationClass="bg-blue-500"
            />
            <StatCard 
              value={loadingStats ? 0 : stats.totalDonors} 
              label="সফল ডোনার" 
              icon={Activity} 
              colorClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
              decorationClass="bg-emerald-500"
            />
            <StatCard 
              value={loadingStats ? '0' : `${stats.totalVolume.toLocaleString()} ml`} 
              label="সংগৃহীত রক্ত" 
              icon={HeartPulse} 
              colorClass="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" 
              decorationClass="bg-red-500"
              className="col-span-2 md:col-span-1"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {(Object.entries(bloodStats) as [string, { count: number; volume: number }][])
              .filter(([_, data]) => data.count > 0)
              .map(([bg, data]) => (
              <div key={bg} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.15)] hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                 
                 <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:rotate-6 transition-all duration-300 shadow-inner">
                    <span className="text-xl font-black text-red-600 dark:text-red-400 group-hover:text-white transition-colors duration-300">{bg}</span>
                 </div>
                 
                 <div className="space-y-0.5">
                   <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Donations</p>
                   <p className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{data.count}</p>
                 </div>
                 
                 <div className="mt-3 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:border-red-100 dark:group-hover:border-red-900/50 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {data.volume < 1000 ? `${data.volume} ML` : `${(data.volume / 1000).toFixed(2).replace(/\.00$/, '')} L`}
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py10 lg:py-12 px-[5%] bg-[#fcfdfe] dark:bg-slate-950/50 overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 px-4 py-1.5 rounded-full mb-4">
              <Trophy size={14} className="fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Heroes of the Community</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
              সেরা ৩ রক্তদাতা
            </h2>
            <div className="w-20 h-2 bg-yellow-500 mx-auto rounded-full mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            {topThree.length > 0 ? topThree.map((hero, idx) => {
              const rank = getRankBadge(hero, badgeConfig, hero.donationCount);
              const vb = getVerificationBadge(hero, badgeConfig);
              return (
                <div key={hero.id} className={clsx(
                  "relative bg-white dark:bg-slate-900 rounded-sm p-6 border-2 transition-all hover:shadow-2xl group text-center",
                  idx === 0 ? "md:order-2 md:scale-110 md:-translate-y-4 border-yellow-200 dark:border-yellow-900/50 z-10" : 
                  idx === 1 ? "md:order-1 border-slate-100 dark:border-slate-800" : "md:order-3 border-slate-100 dark:border-slate-800"
                )}>
                  <div className="relative mb-8 mx-auto w-32 h-32">
                    <div className={clsx(
                      "w-full h-full rounded-sm bg-slate-50 dark:bg-slate-800 overflow-hidden border-4 shadow-xl transition-all",
                      rank ? rank.color.replace('text-', 'border-').replace('bg-', 'border-') : "border-white dark:border-slate-800",
                      idx === 0 && "ring-4 ring-yellow-400 dark:ring-yellow-600 ring-offset-2 dark:ring-offset-slate-900 shadow-yellow-500/20"
                    )}>
                      {hero.avatar ? <img src={hero.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-8 text-slate-300 dark:text-slate-600" size={64} />}
                    </div>
                    {rank && (
                      <div className={clsx(
                        "absolute -top-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 z-20",
                        rank.bg, rank.color
                      )} title={rank.name}>
                        {(() => {
                          const Icon = rank.icon;
                          return <Icon size={20} />;
                        })()}
                      </div>
                    )}
                    <div className={clsx(
                      "absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-black text-white text-xs shadow-lg",
                      idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-400" : "bg-orange-400"
                    )}>
                      #{idx + 1}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                      {hero.name}
                    </h3>
                    {vb && (
                      <BadgeCheck size={20} className={clsx(
                        hero.approvedBadge === 'pink' ? badgeConfig.silver?.color || 'text-slate-400' :
                        hero.approvedBadge === 'red' ? badgeConfig.gold?.color || 'text-amber-500' :
                        hero.approvedBadge === 'green' ? badgeConfig.platinum?.color || 'text-emerald-500' :
                        hero.approvedBadge === 'blue' ? badgeConfig.diamond?.color || 'text-cyan-500' :
                        vb.color,
                        "flex-shrink-0"
                      )} />
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{hero.location}</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-800 mb-4">
                    <div className="text-left">
                       <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none mb-1">Rank Title</p>
                       <p className={clsx("text-sm font-black", rank?.color)}>{rank?.name || 'Newbie'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none mb-1">Donations</p>
                       <p className="text-sm font-black text-slate-900 dark:text-white">{hero.donationCount} বার</p>
                    </div>
                  </div>

                  {hero.socialLinks && Object.keys(hero.socialLinks).length > 0 && (
                    <div className="flex justify-center gap-2 mb-2">
                      {Object.entries(hero.socialLinks).map(([platform, url]) => {
                        const Icon = {
                          facebook: Facebook,
                          twitter: Twitter,
                          instagram: Instagram,
                          linkedin: Linkedin,
                          youtube: Youtube,
                          github: Github,
                          whatsapp: MessageCircle,
                          telegram: Send,
                        }[platform as keyof typeof hero.socialLinks] || Globe;
                        
                        return (
                          <a 
                            key={platform}
                            href={url as string} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                            title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                          >
                            <Icon size={14} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="col-span-full py-10 text-center opacity-30 italic dark:text-slate-400">সেরা ডোনারদের তথ্য পাওয়া যাচ্ছে না...</div>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-12 px-[5%] bg-white dark:bg-slate-950 min-h-[400px] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
              {config.feedbackSectionTitle}
            </h2>
            <div className="w-20 h-2 bg-red-600 mx-auto rounded-full mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-sm opacity-60">
              {config.feedbackSectionSubtitle}
            </p>
          </div>

          {feedbacks.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {feedbacks.slice(0, 6).map(f => (
                  <div key={f.id} className="bg-white dark:bg-slate-900 p-4 rounded-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] border border-slate-50 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl dark:hover:shadow-red-900/10 transition-all group">
                    <div>
                      <div className="mb-2">
                        <Quote size={32} className="text-red-100 dark:text-red-900/30 fill-current opacity-50" />
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-bold text-lg leading-relaxed mb-4 min-h-[80px]">
                        "{f.message.length > 200 ? `${f.message.substring(0, 200)}...` : f.message}"
                      </p>
                      {f.message.length > 200 && (
                        <Link to={`/public-feedbacks/${f.id}`} state={{ from: 'landing' }} className="text-red-600 dark:text-red-400 font-bold hover:underline mb-6 block">Read More</Link>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-800 shadow-md flex-shrink-0">
                          {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" alt={f.userName} /> : <UserIcon className="p-3.5 text-slate-300 dark:text-slate-600 w-full h-full" />}
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 dark:text-white text-lg leading-tight flex items-center gap-2">
                            {f.userName}
                            {f.userApprovedBadge && <BadgeCheck size={18} className={clsx(
                              f.userApprovedBadge === 'pink' ? badgeConfig.silver?.color || 'text-slate-400' :
                              f.userApprovedBadge === 'red' ? badgeConfig.gold?.color || 'text-amber-500' :
                              f.userApprovedBadge === 'green' ? badgeConfig.platinum?.color || 'text-emerald-500' :
                              f.userApprovedBadge === 'blue' ? badgeConfig.diamond?.color || 'text-cyan-500' :
                              badgeConfig.verificationBadgeColor || 'text-blue-500'
                            )} />}
                          </span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {new Date(f.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 text-center">
                <Link to="/public-feedbacks" className="inline-flex items-center gap-3 text-red-600 dark:text-red-400 font-black uppercase tracking-[0.3em] text-xs hover:gap-5 transition-all px-10 py-5 rounded-full bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40">
                  সবগুলো অভিজ্ঞতা দেখুন <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Activity className="animate-spin text-red-600" size={32} />
              <p className="font-bold text-slate-400 italic dark:text-slate-500">অভিজ্ঞতাগুলো লোড হচ্ছে...</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white px-[5%] relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-5xl font-black mb-6 tracking-tight">
              {config.ctaTitle}
            </h2>
            <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-xl">
              {config.ctaSubtitle}
            </p>
          </div>
          <Link to="/register" className="bg-red-600 text-white px-8 py-4 rounded-xl font-black text-xl shadow-2xl hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 group">
            {config.ctaButtonText} <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

const StatCard = ({ value, label, icon: Icon, colorClass, decorationClass, className }: any) => (
  <div className={clsx("relative overflow-hidden p-3 border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] flex items-center gap-3 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-900 rounded-sm group", className)}>
    <div className={clsx("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-150", decorationClass)}></div>
    
    <div className={clsx("relative z-10 p-2 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner", colorClass)}>
      <Icon size={24} strokeWidth={2.5} />
    </div>
    
    <div className="relative z-10">
      <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none">{label}</p>
    </div>
  </div>
);
