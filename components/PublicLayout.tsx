
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { getLandingConfig } from '../services/api';
import { LandingPageConfig } from '../types';
import { Droplet, LogIn } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
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
    navbarLinks: [{ label: 'ফিডব্যাক', path: '/public-feedbacks' }],
    footerLinks: [{ label: 'Privacy Policy', path: '/privacy' }],
    footerCopyright: '© ২০২৬ BLOODLINK MANAGER',
    footerTagline: 'প্রতিটি ফোঁটা একটি জীবনের আশা।'
  });

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(prev => ({
        ...prev,
        ...data,
        navbarLinks: (data.navbarLinks && data.navbarLinks.length > 0) ? data.navbarLinks : prev.navbarLinks,
        footerLinks: (data.footerLinks && data.footerLinks.length > 0) ? data.footerLinks : prev.footerLinks,
      }));
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 px-[5%] py-4 flex justify-between items-center h-16 lg:h-20 transition-all">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-105 transition-transform">
            <Droplet className="text-white fill-current" size={24} />
          </div>
          <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">BloodLink</span>
        </Link>
        <div className="flex items-center gap-4 lg:gap-8">
          {config.navbarLinks?.map((link, idx) => (
            <Link key={idx} to={link.path} className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors hidden sm:block">
              {link.label}
            </Link>
          ))}
          <Link 
            to="/login" 
            className="shimmer-effect relative flex items-center gap-2.5 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-black hover:scale-[1.03] shadow-lg transition-all active:scale-95 group"
          >
            <LogIn size={18} className="relative z-10 group-hover:translate-x-1 transition-all" /> 
            <span className="relative z-10 tracking-tight">সাইন ইন</span>
          </Link>
        </div>
      </header>

      <main className="pt-16 lg:pt-20 min-h-[60vh]">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 px-6 flex flex-col items-center">
        <Link to="/" className="flex items-center gap-2 mb-6 group">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
            <Droplet className="text-white fill-current" size={18} />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tighter">BloodLink</span>
        </Link>
        
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {config.footerLinks?.map((link, idx) => (
            <Link key={idx} to={link.path} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="w-full max-w-4xl pt-6 border-t border-slate-50 text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
             {config.footerCopyright} — <span className="opacity-70">{config.footerTagline}</span>
           </p>
        </div>
      </footer>
    </div>
  );
};
