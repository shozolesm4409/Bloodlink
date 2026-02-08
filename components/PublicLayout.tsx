
import React, { useEffect, useState } from 'react';
// Fix: Use double quotes for react-router-dom to resolve module resolution issues in some environments
import { Link, useLocation } from "react-router-dom";
import { getLandingConfig } from '../services/api';
import { LandingPageConfig } from '../types';
import { Droplet, LogIn, MessageSquareQuote, ShieldCheck, Megaphone, HelpCircle, UserCheck } from 'lucide-react';
import clsx from 'clsx';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();
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
    navbarLinks: [{ label: 'Feedback', path: '/public-feedbacks' }],
    footerLinks: [{ label: 'Privacy Policy', path: '/privacy' }],
    footerCopyright: '© ২০২৬ BLOODLINK MANAGER',
    footerTagline: 'প্রতিটি ফোঁটা একটি জীবনের আশা।'
  });

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(prev => ({
        ...prev,
        ...data,
        navbarLinks: data.navbarLinks || prev.navbarLinks,
        footerLinks: data.footerLinks || prev.footerLinks,
        footerCopyright: data.footerCopyright || prev.footerCopyright,
        footerTagline: data.footerTagline || prev.footerTagline
      }));
    });
  }, []);

  const NavIcon = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={clsx("flex flex-col items-center gap-1 p-2 transition-all", isActive ? "text-red-600" : "text-slate-400 hover:text-slate-600")}>
        <Icon size={20} className={isActive ? "fill-current" : ""} />
        <span className="text-[9px] font-black uppercase tracking-tight">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden pb-16 lg:pb-0">
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
          <Link to="/public-notices" className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors hidden sm:block">
            Notice
          </Link>
          <Link to="/help-center" className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors hidden sm:block">
            Help Center
          </Link>
          <div className="flex items-center">
            <Link 
              to="/login" 
              className="shimmer-effect relative flex items-center gap-2.5 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-black hover:scale-[1.03] hover:shadow-2xl hover:shadow-slate-400/30 transition-all duration-300 active:scale-95 group"
            >
              <LogIn size={18} className="relative z-10 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-500 ease-out" /> 
              <span className="relative z-10 tracking-tight">Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-10 lg:pt-14 min-h-[60vh]">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 px-[5%] flex flex-col items-center mb-16 lg:mb-0">
        <Link to="/" className="flex items-center gap-2 mb-4 group transition-all hover:brightness-110 active:scale-95">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md shadow-red-200 group-hover:rotate-12 transition-transform">
            <Droplet className="text-white fill-current" size={18} />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tighter">BloodLink</span>
        </Link>
        
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
          {config.footerLinks?.map((link, idx) => (
            <Link key={idx} to={link.path} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors">
              {link.label}
            </Link>
          ))}
          <Link to="/help-center" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors">
            Help Center
          </Link>
        </div>

        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">
          {config.footerCopyright} {config.footerTagline && `— ${config.footerTagline}`}
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center py-2 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
         <NavIcon to="/public-feedbacks" icon={MessageSquareQuote} label="Feedback" />
         <NavIcon to="/privacy" icon={ShieldCheck} label="Privacy" />
         <NavIcon to="/verify" icon={UserCheck} label="Verify" />
         <NavIcon to="/public-notices" icon={Megaphone} label="Notice" />
         <NavIcon to="/help-center" icon={HelpCircle} label="Help" />
      </div>
    </div>
  );
};
