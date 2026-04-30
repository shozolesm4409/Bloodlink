import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWebNotices } from '../../services/api';
import { PublicLayout } from '../../components/PublicLayout';
import { Card, Badge, Button } from '../../components/UI';
import { Notice } from '../../types';
import { Megaphone, Calendar, User as UserIcon, Pin, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export const PublicNotices = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWebNotices().then((data) => {
      // Sort pinned first, then by date
      const sorted = data.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setNotices(sorted);
      setLoading(false);
    });
  }, []);

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <PublicLayout>
      <div className="py-12 px-6 lg:py-20 bg-[#f8f9fa] dark:bg-slate-950 min-h-screen transition-colors">
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 dark:bg-red-700 text-white rounded-sm flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200 dark:shadow-red-900/20 transition-colors">
              <Megaphone size={32} />
            </div>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 transition-colors">Official Notices</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto transition-colors">
              Stay updated with the latest announcements, events, and important information from the BloodLink administration.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Megaphone className="animate-pulse mb-4 text-slate-400 dark:text-slate-600" size={48} />
              <p className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-xs">Loading Updates...</p>
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-6">
              {notices.map((note) => (
                <Card key={note.id} className={clsx(
                  "p-6 lg:p-8 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-sm relative overflow-hidden transition-all hover:shadow-2xl group border border-slate-100 dark:border-slate-800",
                  note.pinned && "ring-4 ring-yellow-50 dark:ring-yellow-900/20"
                )}>
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-50 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700 transition-colors">
                        {note.authorAvatar ? <img src={note.authorAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2 text-slate-300 dark:text-slate-600 w-full h-full" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white leading-none transition-colors">{note.authorName}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-slate-400 dark:text-slate-500 transition-colors">
                          <Calendar size={12} />
                          <p className="text-[10px] font-bold uppercase tracking-widest">
                            {new Date(note.timestamp).toLocaleDateString([], { dateStyle: 'long' }).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {note.pinned && (
                      <div className="bg-yellow-400 dark:bg-yellow-500 text-white dark:text-slate-900 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors">
                        <Pin size={12} className="fill-current" /> Pinned
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight lg:w-1/4 flex-shrink-0 transition-colors">
                      {note.subject}
                    </h3>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed transition-colors">
                        {stripHtml(note.details)}
                      </p>
                    </div>

                    <div className="flex-shrink-0 mt-4 lg:mt-0 w-full lg:w-auto">
                      <Button 
                        onClick={() => navigate(`/public-notices/${note.id}`)}
                        variant="outline"
                        className="w-full lg:w-auto rounded-xl border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 text-xs font-black uppercase tracking-widest py-3 px-6 gap-2 transition-all"
                      >
                        View <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-sm border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
              <p className="text-slate-400 dark:text-slate-600 font-bold italic">No notices published yet.</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};