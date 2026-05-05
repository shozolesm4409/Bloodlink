
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { getLandingConfig, updateLandingConfig, getBadgeConfig, updateBadgeConfig, getSocialMediaConfig, updateSocialMediaConfig } from '../../services/api';
import { Card, Button, Input, Toast, useToast } from '../../components/UI';
import { LandingPageConfig, BadgeConfig, SocialMediaConfig, SocialMediaLink } from '../../types';
import { Monitor, Save, Globe, LogIn, UserPlus, List, BarChart, MessageSquare, Layout, Megaphone, Key, MailCheck, ShieldCheck, Database, Lock, Eye, Share2, UserCheck, Mail, Send, History, Info, Type, AlertTriangle, X, Bot, Settings, HelpCircle, Home, RefreshCw, Award, Palette, Hash, Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Plus, Trash2, ExternalLink, Globe2, MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '../../SettingsContext';
import clsx from 'clsx';

export const AdminPageCustomizer = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [showErrorPreview, setShowErrorPreview] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig>({
    heroTitle: '', heroSubtitle: '', heroButtonPrimary: '', heroButtonSecondary: '',
    statsSectionTitle: '', feedbackSectionTitle: '', feedbackSectionSubtitle: '',
    ctaTitle: '', ctaSubtitle: '', ctaButtonText: '',
    loginTitle: '', loginSubtitle: '', loginHeadline: '', loginDescription: '', loginButtonLabel: '',
    registerTitle: '', registerSubtitle: '', registerHeadline: '', registerDescription: '', registerButtonLabel: '',
    resetTitle: '', resetSubtitle: '', resetHeadline: '', resetDescription: '', resetButtonLabel: '',
    sentTitle: '', sentSubtitle: '', sentHeadline: '', sentDescription: '', sentButtonLabel: '',
    sentGoToLoginLabel: '', sentTryAgainLabel: '',
    softwareVersion: '',
    footerCopyright: '', footerTagline: '',
    errorTitle: '', errorSubtitle: '', errorMessage: '', errorTryAgainLabel: '', errorHomeLabel: '', errorFooterText: '',
    privacyTitle: '', privacyEffectiveDate: '', privacyContactEmail: '',
    privacySection1Title: '', privacySection1TitleBn: '', privacySection1Content: '',
    privacySection2Title: '', privacySection2TitleBn: '', privacySection2Content: '',
    privacySection3Title: '', privacySection3TitleBn: '', privacySection3Content: '',
    privacySection4Title: '', privacySection4TitleBn: '', privacySection4Content: '',
    privacySection5Title: '', privacySection5TitleBn: '', privacySection5Content: '',
    privacyContactTitle: '', privacyContactSubtitle: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Define sections structure for navigation
  const SECTIONS = {
    landing: [
      { id: 'hero', title: 'Hero Experience', icon: Monitor, iconColor: 'text-red-600' },
      { id: 'feedback', title: 'Donor Feedbacks', icon: MessageSquare, iconColor: 'text-green-600' },
      { id: 'cta', title: 'Emergency CTA', icon: Megaphone, iconColor: 'text-orange-600' },
      { id: 'stats', title: 'Data Statistics', icon: BarChart, iconColor: 'text-blue-600' },
      { id: 'footer', title: 'Global Footer', icon: Layout, iconColor: 'text-slate-600' },
    ],
    auth: [
      { id: 'login', title: 'Login Screen', icon: LogIn, iconColor: 'text-red-600' },
      { id: 'register', title: 'Registration', icon: UserPlus, iconColor: 'text-blue-600' },
      { id: 'reset', title: 'Recovery Screen', icon: History, iconColor: 'text-purple-600' },
      { id: 'sent', title: 'Success Screen', icon: Send, iconColor: 'text-green-600' },
    ],
    privacy: [
      { id: 'header', title: 'Policy Header', icon: ShieldCheck, iconColor: 'text-red-600' },
      { id: 'contact', title: 'Privacy Contact', icon: Mail, iconColor: 'text-orange-600' },
      { id: 'collection', title: 'Data Collection', icon: Database, iconColor: 'text-blue-600' },
      { id: 'usage', title: 'Information Usage', icon: Lock, iconColor: 'text-purple-600' },
      { id: 'visibility', title: 'Visibility Protocols', icon: Eye, iconColor: 'text-green-600' },
      { id: 'sharing', title: 'Third-Party Sharing', icon: Share2, iconColor: 'text-indigo-600' },
      { id: 'rights', title: 'User Rights', icon: UserCheck, iconColor: 'text-pink-600' },
    ],
    system: [
      { id: 'social_media', title: 'Social Media', icon: Share2, iconColor: 'text-indigo-600' },
      { id: 'error', title: 'Error Page', icon: AlertTriangle, iconColor: 'text-red-500' },
      { id: 'version', title: 'Software Version', icon: Hash, iconColor: 'text-slate-600' },
    ]
  };

  const { refreshLandingConfig, refreshSocialMediaConfig } = useSettings();
  const [activeCategory, setActiveCategory] = useState<keyof typeof SECTIONS>('landing');
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTIONS.landing[0].id);
  const [socialMediaConfig, setSocialMediaConfig] = useState<SocialMediaConfig>({ links: [] });


  // Read section from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const section = params.get('section');
    if (section) {
      // Find category for the section
      for (const [cat, items] of Object.entries(SECTIONS)) {
        if (items.some(i => i.id === section)) {
          setActiveCategory(cat as keyof typeof SECTIONS);
          setActiveSectionId(section);
          break;
        }
      }
    }
  }, []);

  // Data fetcher
  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) {
        setConfig(prev => {
          const updated = { ...prev, ...data };
          // Populate defaults for error page if missing
          if (!updated.errorTitle) updated.errorTitle = 'কিছু ভুল হয়েছে';
          if (!updated.errorSubtitle) updated.errorSubtitle = 'ওহ না! আপনার অনুরোধটি সম্পন্ন করতে একটি সমস্যা হয়েছে।';
          if (!updated.errorMessage) updated.errorMessage = 'দয়া করে কয়েক মুহূর্ত অপেক্ষা করুন এবং আবার চেষ্টা করুন।';
          if (!updated.errorTryAgainLabel) updated.errorTryAgainLabel = 'আবার চেষ্টা করুন';
          if (!updated.errorHomeLabel) updated.errorHomeLabel = 'হোম পেজে ফিরে যান';
          if (!updated.errorFooterText) updated.errorFooterText = 'আপনি এই পেজে ফিরে আসতে পারেন বা সার্চ চেষ্টা করতে পারেন।';
          return updated;
        });
      }
      setLoading(false);
    });

    getSocialMediaConfig().then(data => {
      if (data) setSocialMediaConfig(data);
    });
  }, []);

  // When category changes, reset active section to first of that category
  useEffect(() => {
    setActiveSectionId(SECTIONS[activeCategory][0].id);
  }, [activeCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !config) return;
    setSaving(true);
    try {
      await Promise.all([
        updateLandingConfig(config, user),
        updateSocialMediaConfig(socialMediaConfig, user)
      ]);
      await Promise.all([refreshLandingConfig(), refreshSocialMediaConfig()]);
      showToast("All settings synchronized across system nodes.");
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setSaving(false); }
  };

  const updateField = (key: keyof LandingPageConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addSocialLink = () => {
    const newLink: SocialMediaLink = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      url: '',
      icon: 'Globe2',
      status: 'active',
      type: 'Group'
    };
    setSocialMediaConfig(prev => ({ links: [...prev.links, newLink] }));
  };

  const updateSocialLink = (id: string, field: keyof SocialMediaLink, value: any) => {
    setSocialMediaConfig(prev => ({
      links: prev.links.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  };

  const deleteSocialLink = (id: string) => {
    setSocialMediaConfig(prev => ({ links: prev.links.filter(l => l.id !== id) }));
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse transition-colors">Synchronizing Visual Engine...</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="flex flex-col lg:flex-row justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 px-4 lg:px-0 transition-colors">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">System Customizer</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Control every visual element, text broadcast, and legal disclosure.</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="px-6 py-4 rounded-[1.2rem] shadow-2xl bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-all border-0 transition-colors">
          <Save className="mr-2" size={20} /> Sync Global UI
        </Button>
      </div>

      <div className="lg:flex gap-3 mt-4">
        <div className="lg:w-1/4 space-y-4 px-1 lg:px-1 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
           {/* Mobile: Flat list 8 icons across */}
           <div className="grid grid-cols-8 lg:hidden gap-1">
             {Object.entries(SECTIONS).flatMap(([cat, subs]) => subs.map(sub => ({...sub, cat}))).map(sub => (
                 <button
                   key={sub.id}
                   onClick={() => { setActiveCategory(sub.cat as keyof typeof SECTIONS); setActiveSectionId(sub.id); }}                
                   className={clsx(
                     "w-full p-2 rounded-xl text-sm font-bold flex items-center justify-center transition-colors",
                     activeSectionId === sub.id ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                   )}
                 >
                   <sub.icon size={20} />
                 </button>
             ))}
           </div>

           {/* Desktop: Categorical list */}
           <div className="hidden lg:block space-y-4">
             {Object.keys(SECTIONS).map((category) => (
               <div key={category} className="space-y-1">
                 <h4 className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">{category}</h4>
                 <div className="grid grid-cols-1 gap-2">
                   {SECTIONS[category as keyof typeof SECTIONS].map(sub => (
                     <button
                       key={sub.id}
                       onClick={() => { setActiveCategory(category as keyof typeof SECTIONS); setActiveSectionId(sub.id); }}
                       className={clsx(
                         "w-full px-2 py-2 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors",
                         activeSectionId === sub.id ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                       )}
                     >
                       <sub.icon size={20} />
                       <span>{sub.title}</span>
                     </button>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>
        
        <div className="lg:w-3/4 px-2 lg:px-2 mt-2 lg:mt-0">
           <SectionRenderer 
             sectionId={activeSectionId} 
             config={config} 
             updateField={updateField} 
             socialMediaConfig={socialMediaConfig}
             addSocialLink={addSocialLink}
             updateSocialLink={updateSocialLink}
             deleteSocialLink={deleteSocialLink}
             onPreview={() => setShowErrorPreview(true)} 
           />
        </div>
      </div>

      {/* Error Page Preview Modal */}
      {showErrorPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowErrorPreview(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-colors border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner">
                   <Monitor size={20} />
                 </div>
                 <div>
                   <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">System Error Page UI</h3>
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-time Interface Preview</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowErrorPreview(false)}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#E6F3FF] dark:bg-slate-950 transition-colors">
              <div className="max-w-xl mx-auto flex flex-col items-center">
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 text-center drop-shadow-sm transition-colors">
                  {config.errorTitle || 'কিছু ভুল হয়েছে'}
                </h1>

                {/* Illustration Area */}
                <div className="relative w-full aspect-[16/10] max-w-sm mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 rounded-[1.5rem] transform -rotate-1 skew-x-1 transition-colors"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="relative z-20 w-28 h-28 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl border-4 border-[#B8E2FF] dark:border-slate-700 overflow-hidden transition-colors">
                        <Bot size={70} className="text-slate-400 dark:text-slate-500 transition-colors" />
                      </div>
                      <Settings size={24} className="absolute -top-2 -left-6 text-slate-400 dark:text-slate-600 opacity-60 transition-colors" />
                      <Settings size={18} className="absolute bottom-4 -right-8 text-slate-400 dark:text-slate-600 opacity-40 transition-colors" />
                      
                      {/* 404 Text - Enhanced visibility */}
                      <div className="absolute top-1/2 -right-12 -translate-y-1/2 text-6xl font-black text-[#5CC48C]/40 dark:text-emerald-500/25 select-none tracking-tighter transition-colors">
                        404
                      </div>
                      
                      <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-700 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-500/20 transition-colors">
                         <HelpCircle size={22} className="text-[#5CC48C] dark:text-emerald-400 transition-colors" />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                       <div className="h-1 w-6 bg-slate-300 dark:bg-slate-700 rounded-full transition-colors"></div>
                       <div className="h-1 w-10 bg-slate-300 dark:bg-slate-700 rounded-full transition-colors"></div>
                       <div className="h-1 w-5 bg-slate-300 dark:bg-slate-700 rounded-full transition-colors"></div>
                    </div>
                  </div>
                </div>

                {/* Error Messages */}
                <div className="text-center space-y-2 mb-8 w-full px-4 transition-colors">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white transition-colors">
                    {config.errorSubtitle || 'ওহ না! আপনার অনুরোধটি সম্পন্ন করতে একটি সমস্যা হয়েছে।'}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-xs sm:text-sm max-w-sm mx-auto leading-relaxed transition-colors">
                    {config.errorMessage || 'দয়া করে কয়েক মুহূর্ত অপেক্ষা করুন এবং আবার চেষ্টা করুন।'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md transition-colors">
                  <button className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1B9E5A] text-white py-2.5 px-5 rounded-xl font-bold text-sm whitespace-nowrap shadow-lg cursor-default">
                    <RefreshCw size={18} />
                    {config.errorTryAgainLabel || 'আবার চেষ্টা করুন'}
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-600 text-white py-2.5 px-5 rounded-xl font-bold text-sm whitespace-nowrap shadow-lg cursor-default">
                    <Home size={18} />
                    {config.errorHomeLabel || 'হোম পেজে ফিরে যান'}
                  </button>
                </div>

                {/* Footer Text */}
                <p className="mt-6 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-500 text-center px-6 transition-colors">
                  {config.errorFooterText || 'আপনি এই পেজে ফিরে আসতে পারেন বা সার্চ চেষ্টা করতে পারেন।'}
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center transition-colors">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">This is a simulation of the end-user experience.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionRenderer = ({ sectionId, config, updateField, socialMediaConfig, addSocialLink, updateSocialLink, deleteSocialLink, onPreview }: any) => {
  switch (sectionId) {
    case 'social_media': return (
      <div className="space-y-6">
        <SectionCard 
          title="Social Media Links" 
          icon={Share2} 
          iconColor="text-indigo-600"
          headerAction={
            <Button onClick={addSocialLink} className="rounded-xl px-4 py-2 bg-indigo-600 text-white border-0 shadow-lg font-black text-[10px] uppercase tracking-widest">
              <Plus className="mr-2" size={14} /> Add Link
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4">
            {socialMediaConfig.links.map((link: SocialMediaLink) => (
              <div key={link.id} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-800">
                        {(() => {
                           const Icon = { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Messenger: MessageCircle, Whatsapp: MessageSquare, Globe2 }[link.icon] || Globe2;
                           return <Icon size={20} />;
                        })()}
                     </div>
                     <span className="font-black text-xs text-slate-500 uppercase tracking-widest">Link Identity</span>
                  </div>
                  <button onClick={() => deleteSocialLink(link.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 hover:scale-110 transition-transform">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Site Name" value={link.name} onChange={(e: any) => updateSocialLink(link.id, 'name', e.target.value)} placeholder="e.g. Facebook" />
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Select Icon</label>
                      <select 
                        value={link.icon} 
                        onChange={(e) => updateSocialLink(link.id, 'icon', e.target.value)}
                        className="w-full h-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[0.8rem] px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="Messenger">Messenger</option>
                        <option value="Whatsapp">WhatsApp</option>
                        <option value="Twitter">Twitter</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Linkedin">LinkedIn</option>
                        <option value="Youtube">YouTube</option>
                        <option value="Github">GitHub</option>
                        <option value="Globe2">Website / General</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Platform Type</label>
                      <select 
                        value={link.type || 'Group'} 
                        onChange={(e) => updateSocialLink(link.id, 'type', e.target.value)}
                        className="w-full h-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[0.8rem] px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Group">Group</option>
                        <option value="Page">Page</option>
                        <option value="Channel">Channel</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                   <Input label="Full URL Link" value={link.url} onChange={(e: any) => updateSocialLink(link.id, 'url', e.target.value)} placeholder="https://..." className="flex-1" />
                   <div className="pt-7">
                     <a href={link.url} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-indigo-600">
                       <ExternalLink size={18} />
                     </a>
                   </div>
                </div>
              </div>
            ))}
            
            {socialMediaConfig.links.length === 0 && (
              <div className="py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-center">
                 <p className="text-sm font-bold text-slate-400 italic">No social media links configured yet.</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    );
    case 'hero': return (
      <div className="space-y-4">
        <SectionCard title="Hero Experience" icon={Monitor} iconColor="text-red-600">
          <Input label="Main Headline" value={config.heroTitle} onChange={(e: any) => updateField('heroTitle', e.target.value)} />
          <TextArea label="Sub-headline Description" value={config.heroSubtitle} onChange={(e: any) => updateField('heroSubtitle', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Primary Button" value={config.heroButtonPrimary} onChange={(e: any) => updateField('heroButtonPrimary', e.target.value)} />
            <Input label="Secondary Button" value={config.heroButtonSecondary} onChange={(e: any) => updateField('heroButtonSecondary', e.target.value)} />
          </div>
        </SectionCard>
      </div>
    );
    case 'feedback': return (
      <SectionCard title="Donor Feedbacks" icon={MessageSquare} iconColor="text-green-600">
        <Input label="Section Title" value={config.feedbackSectionTitle} onChange={(e: any) => updateField('feedbackSectionTitle', e.target.value)} />
        <Input label="Section Subtitle" value={config.feedbackSectionSubtitle} onChange={(e: any) => updateField('feedbackSectionSubtitle', e.target.value)} />
      </SectionCard>
    );
    case 'cta': return (
      <SectionCard title="Emergency CTA" icon={Megaphone} iconColor="text-orange-600">
        <Input label="CTA Title" value={config.ctaTitle} onChange={(e: any) => updateField('ctaTitle', e.target.value)} />
        <Input label="CTA Button Label" value={config.ctaButtonText} onChange={(e: any) => updateField('ctaButtonText', e.target.value)} />
        <TextArea label="CTA Subtitle" value={config.ctaSubtitle} onChange={(e: any) => updateField('ctaSubtitle', e.target.value)} />
      </SectionCard>
    );
    case 'stats': return (
      <SectionCard title="Data Statistics" icon={BarChart} iconColor="text-blue-600">
        <Input label="Section Title" value={config.statsSectionTitle} onChange={(e: any) => updateField('statsSectionTitle', e.target.value)} />
      </SectionCard>
    );
    case 'footer': return (
      <SectionCard title="Global Footer Signature" icon={Layout} iconColor="text-slate-600">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input label="Copyright Content" value={config.footerCopyright} onChange={(e: any) => updateField('footerCopyright', e.target.value)} />
          <Input label="Brand Tagline" value={config.footerTagline} onChange={(e: any) => updateField('footerTagline', e.target.value)} />
        </div>
      </SectionCard>
    );
    case 'version': return (
      <SectionCard title="Software Version" icon={Hash} iconColor="text-slate-600">
        <Input label="Current Version (e.g. v2.4.1)" value={config.softwareVersion} onChange={(e: any) => updateField('softwareVersion', e.target.value)} />
        <p className="text-[10px] text-slate-500 font-bold ml-1">This version precisely identifies the current deployment build in the sidebar.</p>
      </SectionCard>
    );
    case 'error': return (
      <SectionCard 
        title="Something Went Wrong Page" 
        icon={AlertTriangle} 
        iconColor="text-red-600"
        headerAction={
          <Button onClick={onPreview} className="rounded-xl px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-0 shadow-lg group-hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest">
            <Eye className="mr-2" size={14} /> View
          </Button>
        }
      >
        <Input label="Page Title (e.g. কিছু ভুল হয়েছে)" value={config.errorTitle} onChange={e => updateField('errorTitle', e.target.value)} placeholder="কিছু ভুল হয়েছে" />
        <TextArea label="Main Message" value={config.errorSubtitle} onChange={e => updateField('errorSubtitle', e.target.value)} placeholder="ওহ না! আপনার অনুরোধটি সম্পন্ন করতে একটি সমস্যা হয়েছে।" />
        <TextArea label="Sub Message" value={config.errorMessage} onChange={e => updateField('errorMessage', e.target.value)} placeholder="দয়া করে কয়েক মুহূর্ত অপেক্ষা করুন এবং আবার চেষ্টা করুন।" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input label="Try Again Button Label" value={config.errorTryAgainLabel} onChange={e => updateField('errorTryAgainLabel', e.target.value)} placeholder="আবার চেষ্টা করুন" />
          <Input label="Home Button Label" value={config.errorHomeLabel} onChange={e => updateField('errorHomeLabel', e.target.value)} placeholder="হোম পেজে ফিরে যান" />
        </div>
        <Input label="Footer Text" value={config.errorFooterText} onChange={e => updateField('errorFooterText', e.target.value)} placeholder="আপনি এই পেজে ফিরে আসতে পারেন বা সার্চ চেষ্টা করতে পারেন।" />
      </SectionCard>
    );
    case 'login': return (
      <SectionCard title="Login Screen (Sign In)" icon={LogIn} iconColor="text-red-600">
        <Input label="Form Title" value={config.loginTitle} onChange={e => updateField('loginTitle', e.target.value)} />
        <Input label="Form Subtitle" value={config.loginSubtitle} onChange={e => updateField('loginSubtitle', e.target.value)} />
        <Input label="Sidebar Headline" value={config.loginHeadline} onChange={e => updateField('loginHeadline', e.target.value)} />
        <TextArea label="Sidebar Description" value={config.loginDescription || ''} onChange={e => updateField('loginDescription', e.target.value)} />
        <Input label="Action Button Label" value={config.loginButtonLabel} onChange={e => updateField('loginButtonLabel', e.target.value)} />
      </SectionCard>
    );
    case 'register': return (
      <SectionCard title="Registration Screen (Join Now)" icon={UserPlus} iconColor="text-blue-600">
        <Input label="Form Title" value={config.registerTitle} onChange={e => updateField('registerTitle', e.target.value)} />
        <Input label="Form Subtitle" value={config.registerSubtitle} onChange={e => updateField('registerSubtitle', e.target.value)} />
        <Input label="Sidebar Headline" value={config.registerHeadline} onChange={e => updateField('registerHeadline', e.target.value)} />
        <TextArea label="Sidebar Description" value={config.registerDescription || ''} onChange={e => updateField('registerDescription', e.target.value)} />
        <Input label="Action Button Label" value={config.registerButtonLabel} onChange={e => updateField('registerButtonLabel', e.target.value)} />
      </SectionCard>
    );
    case 'reset': return (
      <SectionCard title="Recovery Screen (Forgot Pin)" icon={History} iconColor="text-purple-600">
        <Input label="Form Title" value={config.resetTitle} onChange={e => updateField('resetTitle', e.target.value)} />
        <Input label="Form Subtitle" value={config.resetSubtitle} onChange={e => updateField('resetSubtitle', e.target.value)} />
        <Input label="Sidebar Headline" value={config.resetHeadline} onChange={e => updateField('resetHeadline', e.target.value)} />
        <TextArea label="Sidebar Description" value={config.resetDescription || ''} onChange={e => updateField('resetDescription', e.target.value)} />
        <Input label="Action Button Label" value={config.resetButtonLabel} onChange={e => updateField('resetButtonLabel', e.target.value)} />
      </SectionCard>
    );
    case 'sent': return (
      <SectionCard title="Success Screen (Email Sent)" icon={Send} iconColor="text-green-600">
        <Input label="Success Title" value={config.sentTitle} onChange={e => updateField('sentTitle', e.target.value)} />
        <Input label="Success Subtitle" value={config.sentSubtitle} onChange={e => updateField('sentSubtitle', e.target.value)} />
        <Input label="Sidebar Headline" value={config.sentHeadline} onChange={e => updateField('sentHeadline', e.target.value)} />
        <TextArea label="Sidebar Description" value={config.sentDescription || ''} onChange={e => updateField('sentDescription', e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input label="Go To Login Label" value={config.sentGoToLoginLabel || ''} onChange={e => updateField('sentGoToLoginLabel', e.target.value)} />
            <Input label="Try Again Label" value={config.sentTryAgainLabel || ''} onChange={e => updateField('sentTryAgainLabel', e.target.value)} />
        </div>
      </SectionCard>
    );
    case 'header': return (
      <SectionCard title="Policy Header" icon={ShieldCheck} iconColor="text-red-600">
        <Input label="Main Policy Title" value={config.privacyTitle} onChange={e => updateField('privacyTitle', e.target.value)} />
        <Input label="Last Effective Date" value={config.privacyEffectiveDate} onChange={e => updateField('privacyEffectiveDate', e.target.value)} />
      </SectionCard>
    );
    case 'contact': return (
      <SectionCard title="Privacy Contact" icon={Mail} iconColor="text-orange-600">
        <Input label="Contact Section Title" value={config.privacyContactTitle || ''} onChange={e => updateField('privacyContactTitle', e.target.value)} />
        <Input label="Contact Section Subtitle" value={config.privacyContactSubtitle || ''} onChange={e => updateField('privacyContactSubtitle', e.target.value)} />
        <Input label="Privacy Email" value={config.privacyContactEmail} onChange={e => updateField('privacyContactEmail', e.target.value)} />
      </SectionCard>
    );
    case 'collection': return (
      <SectionCard title="Data Collection" icon={Database} iconColor="text-blue-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input label="Title (En)" value={config.privacySection1Title} onChange={e => updateField('privacySection1Title', e.target.value)} />
          <Input label="Title (Bn)" value={config.privacySection1TitleBn} onChange={e => updateField('privacySection1TitleBn', e.target.value)} />
        </div>
        <TextArea label="Legal Content" value={config.privacySection1Content} onChange={e => updateField('privacySection1Content', e.target.value)} />
      </SectionCard>
    );
    case 'usage': return (
      <SectionCard title="Information Usage" icon={Lock} iconColor="text-purple-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input label="Title (En)" value={config.privacySection2Title} onChange={e => updateField('privacySection2Title', e.target.value)} />
          <Input label="Title (Bn)" value={config.privacySection2TitleBn} onChange={e => updateField('privacySection2TitleBn', e.target.value)} />
        </div>
        <TextArea label="Legal Content" value={config.privacySection2Content} onChange={e => updateField('privacySection2Content', e.target.value)} />
      </SectionCard>
    );
    case 'visibility': return (
      <SectionCard title="Visibility Protocols" icon={Eye} iconColor="text-green-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input label="Title (En)" value={config.privacySection3Title} onChange={e => updateField('privacySection3Title', e.target.value)} />
          <Input label="Title (Bn)" value={config.privacySection3TitleBn} onChange={e => updateField('privacySection3TitleBn', e.target.value)} />
        </div>
        <TextArea label="Legal Content" value={config.privacySection3Content} onChange={e => updateField('privacySection3Content', e.target.value)} />
      </SectionCard>
    );
    case 'sharing': return (
      <SectionCard title="Third-Party Sharing" icon={Share2} iconColor="text-indigo-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input label="Title (En)" value={config.privacySection4Title} onChange={e => updateField('privacySection4Title', e.target.value)} />
          <Input label="Title (Bn)" value={config.privacySection4TitleBn} onChange={e => updateField('privacySection4TitleBn', e.target.value)} />
        </div>
        <TextArea label="Legal Content" value={config.privacySection4Content} onChange={e => updateField('privacySection4Content', e.target.value)} />
      </SectionCard>
    );
    case 'rights': return (
      <SectionCard title="User Rights" icon={UserCheck} iconColor="text-pink-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input label="Title (En)" value={config.privacySection5Title} onChange={e => updateField('privacySection5Title', e.target.value)} />
          <Input label="Title (Bn)" value={config.privacySection5TitleBn} onChange={e => updateField('privacySection5TitleBn', e.target.value)} />
        </div>
        <TextArea label="Legal Content" value={config.privacySection5Content} onChange={e => updateField('privacySection5Content', e.target.value)} />
      </SectionCard>
    );
    default: return null;
  }
};

const SectionCard = ({ title, icon: Icon, iconColor, children, headerAction }: any) => (
  <Card className="p-4 space-y-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 relative overflow-hidden group transition-colors">
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-red-50 dark:group-hover:bg-red-950 transition-colors"></div>
    <div className="flex items-center justify-between transition-colors mb-1 pr-2">
      <div className="flex items-center gap-3">
        <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 shadow-inner transition-colors", iconColor)}>
          <Icon size={20} />
        </div>
        <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight uppercase transition-colors">{title}</h3>
      </div>
      {headerAction}
    </div>
    <div className="space-y-3 relative z-10">
      {children}
    </div>
  </Card>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={clsx(
      "px-6 lg:px-8 py-3 rounded-xl lg:rounded-[1.5rem] text-[10px] lg:text-[11px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 transition-colors", 
      active ? "bg-white dark:bg-slate-800 shadow-xl text-red-600 dark:text-red-400 scale-[1.02]" : "text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
    )}
  >
    <Icon size={16} /> {label}
  </button>
);

const TextArea = ({ label, value, onChange }: any) => (
  <div className="space-y-2 transition-colors">
    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest transition-colors">{label}</label>
    <textarea 
      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-4 focus:ring-red-500/10 outline-none min-h-[120px] shadow-inner transition-all resize-none transition-colors" 
      value={value} 
      onChange={onChange} 
    />
  </div>
);
