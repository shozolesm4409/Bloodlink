import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getLandingConfig, updateLandingConfig } from '../services/api';
import { Card, Button, Input, Toast, useToast } from '../components/UI';
import { LandingPageConfig } from '../types';
import { Monitor, Save, Globe, LogIn, UserPlus, List, BarChart, MessageSquare, Layout, Megaphone, Key, MailCheck, ShieldCheck, Database, Lock, Eye, Share2, UserCheck } from 'lucide-react';
import clsx from 'clsx';

export const AdminPageCustomizer = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'landing' | 'auth' | 'privacy' | 'footer'>('landing');

  useEffect(() => {
    getLandingConfig().then(data => {
      const defaults: LandingPageConfig = {
        // Hero Defaults
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
        
        // Login Screen Defaults
        loginTitle: "Sign In",
        loginSubtitle: "LOG IN TO ACCESS YOUR DONOR DASHBOARD",
        loginHeadline: "WELCOME",
        loginDescription: "রক্তের প্রতিটি ফোঁটা একটি জীবনের সম্ভাবনা। আজই আমাদের কমিউনিটিতে যোগ দিন এবং জীবন বাঁচানোর মহান উদ্যোগে অংশ নিন।",
        loginButtonLabel: "SIGN IN",
        
        // Registration Screen Defaults
        registerTitle: "Join Now",
        registerSubtitle: "রক্তদাতা হিসেবে নিবন্ধন করুন এবং জীবন বাঁচান",
        registerHeadline: "JOIN US",
        registerDescription: "রক্তের প্রতিটি ফোঁটা একটি জীবনের সম্ভাবনা। আজই আমাদের কমিউনিটিতে যোগ দিন এবং জীবন বাঁচানোর মহান উদ্যোগে অংশ নিন।",
        registerButtonLabel: "CREATE ACCOUNT",
        
        // Reset Password Screen Defaults
        resetTitle: "পাসওয়ার্ড ভুলে গেছেন?",
        resetSubtitle: "আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠান",
        resetHeadline: "RECOVERY",
        resetDescription: "আমাদের সিকিউরিটি সিস্টেম ব্যবহার করে আপনার পাসওয়ার্ড রিসেট করুন। আপনার নিবন্ধিত ইমেইল এড্রেসটি নিচে প্রদান করুন। আমরা একটি সিকিউর লিংক পাঠাব।",
        resetButtonLabel: "রিসেট লিংক পাঠান",
        
        // Email Sent Screen Defaults
        sentTitle: "ইমেইল চেক করুন",
        sentSubtitle: "আমরা একটি লিংক {email} এ পাঠিয়েছি",
        sentHeadline: "EMAIL SENT",
        sentDescription: "আপনার জিমেইলের ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন। সেখানে একটি বাটন পাবেন যা আপনাকে পাসওয়ার্ড পরিবর্তন করতে সাহায্য করবে।",
        sentGoToLoginLabel: "লগইন পেজে ফিরে যান",
        sentTryAgainLabel: "ভুল ইমেইল দিয়েছেন? আবার চেষ্টা করুন",

        // Privacy Policy Defaults
        privacyTitle: "Privacy Policy",
        privacyEffectiveDate: "January 01, 2026",
        privacySection1Title: "Data Collection",
        privacySection1TitleBn: "তথ্য সংগ্রহ",
        privacySection1Content: "আমরা আপনার থেকে নিম্নলিখিত তথ্যগুলো সংগ্রহ করি যা আপনাকে একজন রক্তদাতা হিসেবে চিহ্নিত করতে সহায়তা করে:\n• ব্যক্তিগত পরিচয় (নাম, ইমেইল এবং ফোন নম্বর)।\n• মেডিকেল তথ্য (রক্তের গ্রুপ এবং সর্বশেষ রক্তদানের তারিখ)।\n• ভৌগোলিক অবস্থান (আপনার এলাকা)।",
        privacySection2Title: "How We Use Your Info",
        privacySection2TitleBn: "তথ্যের ব্যবহার",
        privacySection2Content: "আপনার তথ্যগুলো শুধুমাত্র নিম্নলিখিত উদ্দেশ্যে ব্যবহৃত হয়:\n• রক্তদাতা এবং রক্ত গ্রহীতার মধ্যে সংযোগ স্থাপন।\n• ডিজিটাল আইডি কার্ড জেনারেট করা।\n• সিস্টেমের নিরাপত্তা নিশ্চিত করা।",
        privacySection3Title: "Visibility & Access",
        privacySection3TitleBn: "দৃশ্যমানতা এবং এক্সেস",
        privacySection3Content: "আপনার ব্যক্তিগত ফোন নম্বর এবং ইমেইল ডিফল্টভাবে গোপন থাকে। শুধুমাত্র আমাদের ভেরিফাইড এ্যাডমিন এবং যাদের আপনি অনুমতি দেবেন তারাই আপনার যোগাযোগের তথ্য দেখতে পাবে।",
        privacySection4Title: "Third-Party Sharing",
        privacySection4TitleBn: "তৃতীয় পক্ষের সাথে শেয়ার",
        privacySection4Content: "আমরা আপনার ব্যক্তিগত তথ্য কোনো বাণিজ্যিক প্রতিষ্ঠানের কাছে বিক্রি করি না। আমরা Google Gemini AI এবং Firebase-এর মতো বিশ্বস্ত সার্ভিস ব্যবহার করি।",
        privacySection5Title: "Your Rights",
        privacySection5TitleBn: "আপনার অধিকার",
        privacySection5Content: "আপনার প্রোফাইল যেকোনো সময় আপডেট করার বা ডিলিট করার পূর্ণ অধিকার আপনার আছে। আপনি চাইলে আমাদের এ্যাডমিন প্যানেলে রিকোয়েস্ট পাঠিয়ে আপনার ডাটা পুরোপুরি রিমুভ করে নিতে পারেন।",
        privacyContactTitle: "Contact Privacy Team",
        privacyContactSubtitle: "আমাদের প্রাইভেসি পলিসি নিয়ে কোনো প্রশ্ন থাকলে ইমেইল করুন:",
        privacyContactEmail: "privacy@bloodlink.com",

        footerCopyright: '© ২০২৬ BLOODLINK MANAGER',
        footerTagline: 'প্রতিটি ফোঁটা একটি জীবনের আশা।'
      };

      if (data) {
        const mergedConfig = { ...defaults };
        Object.keys(defaults).forEach((key) => {
          const k = key as keyof LandingPageConfig;
          if (data[k] !== undefined && data[k] !== null && data[k] !== "") {
            (mergedConfig as any)[k] = data[k];
          }
        });
        setConfig(mergedConfig);
      } else {
        setConfig(defaults);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !config) return;
    setSaving(true);
    try {
      await updateLandingConfig(config, user);
      showToast("Settings synchronized.");
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Syncing configuration...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Page Customizer</h1>
          <p className="text-sm text-slate-500 font-medium">Rebrand every visual and text element of the platform.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('landing')} className={clsx("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === 'landing' ? "bg-white shadow-md text-red-600" : "text-slate-500")}><Globe size={16} className="inline mr-2" /> Landing</button>
          <button onClick={() => setActiveTab('auth')} className={clsx("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === 'auth' ? "bg-white shadow-md text-red-600" : "text-slate-500")}><LogIn size={16} className="inline mr-2" /> Auth</button>
          <button onClick={() => setActiveTab('privacy')} className={clsx("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === 'privacy' ? "bg-white shadow-md text-red-600" : "text-slate-500")}><ShieldCheck size={16} className="inline mr-2" /> Privacy</button>
          <button onClick={() => setActiveTab('footer')} className={clsx("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === 'footer' ? "bg-white shadow-md text-red-600" : "text-slate-500")}><Layout size={16} className="inline mr-2" /> Footer</button>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="px-8 rounded-2xl shadow-xl"><Save className="mr-2" size={18} /> Sync Settings</Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'landing' && (
          <>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Monitor className="text-red-600" /> Hero Section</h3>
              <Input label="Main Hero Title" value={config?.heroTitle || ''} onChange={e => setConfig(p => p ? {...p, heroTitle: e.target.value} : null)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hero Subtitle</label>
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] shadow-inner" value={config?.heroSubtitle || ''} onChange={e => setConfig(p => p ? {...p, heroSubtitle: e.target.value} : null)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Primary Button Text" value={config?.heroButtonPrimary || ''} onChange={e => setConfig(p => p ? {...p, heroButtonPrimary: e.target.value} : null)} />
                <Input label="Secondary Button Text" value={config?.heroButtonSecondary || ''} onChange={e => setConfig(p => p ? {...p, heroButtonSecondary: e.target.value} : null)} />
              </div>
            </Card>
            <div className="space-y-8">
              <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><BarChart className="text-blue-600" /> Stats Section</h3>
                <Input label="Stats Title" value={config?.statsSectionTitle || ''} onChange={e => setConfig(p => p ? {...p, statsSectionTitle: e.target.value} : null)} />
              </Card>
              <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><MessageSquare className="text-green-600" /> Feedback Section</h3>
                <Input label="Title" value={config?.feedbackSectionTitle || ''} onChange={e => setConfig(p => p ? {...p, feedbackSectionTitle: e.target.value} : null)} />
                <Input label="Subtitle" value={config?.feedbackSectionSubtitle || ''} onChange={e => setConfig(p => p ? {...p, feedbackSectionSubtitle: e.target.value} : null)} />
              </Card>
            </div>
          </>
        )}

        {activeTab === 'auth' && (
          <>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><LogIn className="text-red-600" /> Login Screen</h3>
              <Input label="Form Title" value={config?.loginTitle || ''} onChange={e => setConfig(p => p ? {...p, loginTitle: e.target.value} : null)} />
              <Input label="Form Subtitle" value={config?.loginSubtitle || ''} onChange={e => setConfig(p => p ? {...p, loginSubtitle: e.target.value} : null)} />
              <Input label="Sidebar Headline" value={config?.loginHeadline || ''} onChange={e => setConfig(p => p ? {...p, loginHeadline: e.target.value} : null)} />
              <Input label="Button Label" value={config?.loginButtonLabel || ''} onChange={e => setConfig(p => p ? {...p, loginButtonLabel: e.target.value} : null)} />
            </Card>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><UserPlus className="text-blue-600" /> Registration Screen</h3>
              <Input label="Form Title" value={config?.registerTitle || ''} onChange={e => setConfig(p => p ? {...p, registerTitle: e.target.value} : null)} />
              <Input label="Form Subtitle" value={config?.registerSubtitle || ''} onChange={e => setConfig(p => p ? {...p, registerSubtitle: e.target.value} : null)} />
              <Input label="Sidebar Headline" value={config?.registerHeadline || ''} onChange={e => setConfig(p => p ? {...p, registerHeadline: e.target.value} : null)} />
              <Input label="Button Label" value={config?.registerButtonLabel || ''} onChange={e => setConfig(p => p ? {...p, registerButtonLabel: e.target.value} : null)} />
            </Card>
          </>
        )}

        {activeTab === 'privacy' && (
          <>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white lg:col-span-1">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><ShieldCheck className="text-red-600" /> Header & Date</h3>
              <Input label="Main Title" value={config?.privacyTitle || ''} onChange={e => setConfig(p => p ? {...p, privacyTitle: e.target.value} : null)} />
              <Input label="Effective Date" value={config?.privacyEffectiveDate || ''} onChange={e => setConfig(p => p ? {...p, privacyEffectiveDate: e.target.value} : null)} />
              
              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900 mb-4"><Database className="text-blue-600" /> Section 1: Data Collection</h3>
                <Input label="Title (En)" value={config?.privacySection1Title || ''} onChange={e => setConfig(p => p ? {...p, privacySection1Title: e.target.value} : null)} />
                <Input label="Title (Bn)" value={config?.privacySection1TitleBn || ''} onChange={e => setConfig(p => p ? {...p, privacySection1TitleBn: e.target.value} : null)} className="mt-2" />
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] mt-2" value={config?.privacySection1Content || ''} onChange={e => setConfig(p => p ? {...p, privacySection1Content: e.target.value} : null)} />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900 mb-4"><Lock className="text-purple-600" /> Section 2: Use of Info</h3>
                <Input label="Title (En)" value={config?.privacySection2Title || ''} onChange={e => setConfig(p => p ? {...p, privacySection2Title: e.target.value} : null)} />
                <Input label="Title (Bn)" value={config?.privacySection2TitleBn || ''} onChange={e => setConfig(p => p ? {...p, privacySection2TitleBn: e.target.value} : null)} className="mt-2" />
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px] mt-2" value={config?.privacySection2Content || ''} onChange={e => setConfig(p => p ? {...p, privacySection2Content: e.target.value} : null)} />
              </div>
            </Card>

            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
              <div>
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900 mb-4"><Eye className="text-green-600" /> Section 3: Visibility</h3>
                <Input label="Title (En)" value={config?.privacySection3Title || ''} onChange={e => setConfig(p => p ? {...p, privacySection3Title: e.target.value} : null)} />
                <Input label="Title (Bn)" value={config?.privacySection3TitleBn || ''} onChange={e => setConfig(p => p ? {...p, privacySection3TitleBn: e.target.value} : null)} className="mt-2" />
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none min-h-[100px] mt-2" value={config?.privacySection3Content || ''} onChange={e => setConfig(p => p ? {...p, privacySection3Content: e.target.value} : null)} />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900 mb-4"><Share2 className="text-orange-600" /> Section 4: Sharing</h3>
                <Input label="Title (En)" value={config?.privacySection4Title || ''} onChange={e => setConfig(p => p ? {...p, privacySection4Title: e.target.value} : null)} />
                <Input label="Title (Bn)" value={config?.privacySection4TitleBn || ''} onChange={e => setConfig(p => p ? {...p, privacySection4TitleBn: e.target.value} : null)} className="mt-2" />
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px] mt-2" value={config?.privacySection4Content || ''} onChange={e => setConfig(p => p ? {...p, privacySection4Content: e.target.value} : null)} />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900 mb-4"><UserCheck className="text-blue-600" /> Section 5: Rights</h3>
                <Input label="Title (En)" value={config?.privacySection5Title || ''} onChange={e => setConfig(p => p ? {...p, privacySection5Title: e.target.value} : null)} />
                <Input label="Title (Bn)" value={config?.privacySection5TitleBn || ''} onChange={e => setConfig(p => p ? {...p, privacySection5TitleBn: e.target.value} : null)} className="mt-2" />
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] mt-2" value={config?.privacySection5Content || ''} onChange={e => setConfig(p => p ? {...p, privacySection5Content: e.target.value} : null)} />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900 mb-4"><Megaphone className="text-red-600" /> Contact Info</h3>
                <Input label="Card Title" value={config?.privacyContactTitle || ''} onChange={e => setConfig(p => p ? {...p, privacyContactTitle: e.target.value} : null)} />
                <Input label="Subtitle" value={config?.privacyContactSubtitle || ''} onChange={e => setConfig(p => p ? {...p, privacyContactSubtitle: e.target.value} : null)} className="mt-2" />
                <Input label="Support Email" value={config?.privacyContactEmail || ''} onChange={e => setConfig(p => p ? {...p, privacyContactEmail: e.target.value} : null)} className="mt-2" />
              </div>
            </Card>
          </>
        )}

        {activeTab === 'footer' && (
          <>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Globe className="text-slate-400" /> Footer Details</h3>
              <Input label="Copyright Notice" value={config?.footerCopyright || ''} onChange={e => setConfig(p => p ? {...p, footerCopyright: e.target.value} : null)} />
              <Input label="Footer Tagline" value={config?.footerTagline || ''} onChange={e => setConfig(p => p ? {...p, footerTagline: e.target.value} : null)} />
            </Card>
          </>
        )}
      </form>
    </div>
  );
};