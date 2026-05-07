import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Search, Filter, MessageCircle, User as UserIcon } from 'lucide-react';
import { User } from '../../../types';

interface Props {
  allUsers: User[];
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: any) => void;
  setSelectedRecipient: (user: User) => void;
  unreadCounts: Record<string, number>;
}

export const MessengerDirectory = ({
  allUsers, user, searchQuery, setSearchQuery, setActiveView, setSelectedRecipient, unreadCounts
}: Props) => {
  const [bloodGroupFilter, setBloodGroupFilter] = React.useState<string>('All');
  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredUsers = allUsers.filter(u => 
    u.id !== user?.id && 
    (bloodGroupFilter === 'All' || u.bloodGroup === bloodGroupFilter) &&
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
         <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('hub')} className="p-3 lg:p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-blue-600">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Messenger</h1>
              <p className="hidden sm:block text-slate-500 dark:text-slate-400 font-medium text-sm transition-colors mt-0.5">Direct private messaging with the community.</p>
            </div>
         </div>
         
         <div className="flex items-center gap-3 w-full lg:w-auto">
           <div className="relative flex-1 lg:w-80 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={20} />
             <input 
               type="text" 
               placeholder="Search members..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-bold shadow-xl shadow-slate-200/50 dark:shadow-none outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all text-slate-900 dark:text-white placeholder:text-slate-300"
             />
           </div>
           <button className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all">
             <select 
                value={bloodGroupFilter} 
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white cursor-pointer w-full h-full"
              >
                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
           </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          <AnimatePresence mode="popLayout">
            {filteredUsers.length > 0 ? filteredUsers.map((u, idx) => (
              <motion.div 
                key={u.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => { setSelectedRecipient(u); setActiveView('private-chat'); }} 
                className="group relative flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <MessageCircle size={80} />
                </div>
                
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden transition-all group-hover:scale-105 group-hover:rotate-3">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={32} className="text-blue-300" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-110 transition-all">{u.bloodGroup}</div>
                  {unreadCounts[u.id] > 0 && (
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-slate-800 animate-bounce">{unreadCounts[u.id]}</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-800 dark:text-white text-lg truncate leading-tight group-hover:text-blue-600 transition-colors">{u.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{u.location || 'BloodLink User'}</span>
                     <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                     <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Lifesaver</span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={20} />
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-20 text-center">
                 <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                   <Search size={48} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">No members found</h3>
                 <p className="font-medium">Try searching with a different name or group.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
