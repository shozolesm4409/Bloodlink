import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../../../SettingsContext';
import { ArrowLeft, ArrowRight, ExternalLink, Share2, Facebook, Twitter, Instagram, Linkedin, Youtube, Github, MessageCircle, MessageSquare, Globe2 } from 'lucide-react';
import { SocialMediaLink } from '../../../types';

export const SocialHubView = ({ setActiveView }: { setActiveView: (view: string) => void }) => {
  const { socialMediaConfig } = useSettings();

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col space-y-6 lg:space-y-8 animate-in fade-in duration-500 transition-colors">
       <div className="flex items-center gap-4 lg:gap-6">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveView('hub')} 
            className="p-3 lg:p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-slate-400 hover:text-indigo-600"
          >
            <ArrowLeft size={20} className="lg:hidden" />
            <ArrowLeft size={24} className="hidden lg:block" />
          </motion.button>
          <div>
            <h1 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Social Hub</h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] lg:text-base transition-colors uppercase tracking-widest lg:normal-case lg:tracking-normal">Official Verified Platforms</p>
          </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {socialMediaConfig.links.map((link: SocialMediaLink, idx: number) => (
               <motion.a 
                 key={link.id}
                 href={link.url}
                 target="_blank"
                 rel="noreferrer"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 whileHover={{ y: -8 }}
                 className="group relative flex flex-col p-4 lg:p-6 bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all overflow-hidden"
               >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {(() => {
                      const Icon = { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Messenger: MessageCircle, Whatsapp: MessageSquare, Globe2 }[link.icon] || Globe2;
                      return <Icon size={100} className="text-indigo-600 dark:text-indigo-400" />;
                    })()}
                 </div>

                 <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-inner group-hover:scale-110 transition-transform duration-500 mb-4 lg:mb-5">
                       {(() => {
                          const Icon = { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Messenger: MessageCircle, Whatsapp: MessageSquare, Globe2 }[link.icon] || Globe2;
                          return <Icon size={24} className="text-indigo-600 dark:text-indigo-400 lg:hidden" />;
                       })()}
                       {(() => {
                          const Icon = { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Messenger: MessageCircle, Whatsapp: MessageSquare, Globe2 }[link.icon] || Globe2;
                          return <Icon size={28} className="text-indigo-600 dark:text-indigo-400 hidden lg:block" />;
                       })()}
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2">
                        {link.name}
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 lg:hidden" />
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hidden lg:block" />
                      </h2>
                      <p className="text-[9px] lg:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 lg:px-3 py-1 rounded-full w-fit">
                        {link.type || 'Group'}
                      </p>
                    </div>

                    <div className="mt-6 lg:mt-7 flex items-center justify-between">
                      <span className="text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Join Now</span>
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={16} className="lg:hidden" />
                        <ArrowRight size={20} className="hidden lg:block" />
                      </div>
                    </div>
                 </div>
               </motion.a>
            ))}
          </AnimatePresence>
          
          {socialMediaConfig.links.length === 0 && (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-sm">
               <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-800">
                 <Share2 size={48} />
               </div>
               <h3 className="text-xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-tight">No Platforms Connected</h3>
               <p className="text-slate-400 dark:text-slate-600 font-medium text-sm mt-1">Please check back later or contact admin.</p>
            </div>
          )}
       </div>
    </div>
  );
};
