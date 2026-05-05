import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoticeById } from '../../services/api';
import { PublicLayout } from '../../components/PublicLayout';
import { Card, Badge, Button } from '../../components/UI';
import { Notice } from '../../types';
import { Calendar, User as UserIcon, Pin, ArrowLeft, Tag, BadgeCheck, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { useSettings } from '../../SettingsContext';
import { BADGE_COLOR_MAP } from '../../constants';

export const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { badgeConfig } = useSettings();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getNoticeById(id).then((data) => {
        setNotice(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-slate-950 transition-colors">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-xs">Loading Notice...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!notice) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-white dark:bg-slate-950 transition-colors">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 transition-colors">Notice Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 transition-colors">The notice you are looking for may have been removed or archived.</p>
          <Button onClick={() => navigate('/public-notices')} variant="outline" className="rounded-xl">
            <ArrowLeft size={18} className="mr-2" /> Back to Notices
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="py-6 px-4 lg:py-10 bg-[#f8f9fa] dark:bg-slate-950 min-h-screen transition-colors">
        <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
          <button 
            onClick={() => navigate('/public-notices')} 
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-red-600 dark:hover:text-red-400 transition-colors mb-4 text-sm"
          >
            <ArrowLeft size={18} /> Back to Board
          </button>

          <Card className="p-3 lg:p-5 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[1.5rem] lg:rounded-[2rem] relative overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
            {notice.pinned && (
              <div className="absolute top-0 right-0 bg-yellow-400 dark:bg-yellow-500 text-white dark:text-slate-900 px-6 py-2 rounded-bl-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-colors">
                <Pin size={14} className="fill-current" /> Pinned
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md flex-shrink-0 transition-colors">
                {notice.authorAvatar ? (
                  <img src={notice.authorAvatar} className="w-full h-full object-cover" alt={notice.authorName} />
                ) : (
                  <UserIcon className="p-3 text-slate-300 dark:text-slate-600 w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1 transition-colors flex items-center gap-1">
                  {notice.authorName}
                  {notice.authorApprovedBadge ? <ShieldCheck size={14} className={BADGE_COLOR_MAP[notice.authorApprovedBadge]} /> :
                   notice.authorRole === 'SUPERADMIN' ? <ShieldCheck size={14} className={BADGE_COLOR_MAP['blue']} /> :
                   notice.authorRole === 'ADMIN' ? <ShieldCheck size={14} className={BADGE_COLOR_MAP['green']} /> :
                   notice.authorRole === 'EDITOR' ? <ShieldCheck size={14} className={BADGE_COLOR_MAP['red']} /> : null}
                </p>
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {new Date(notice.timestamp).toLocaleDateString([], { dateStyle: 'long' })}
                    </span>
                  </div>
                  <Badge color="blue" className="text-[8px] py-0 px-2 uppercase tracking-tight">REF-{notice.id.substring(0,5)}</Badge>
                </div>
              </div>
            </div>

            <h1 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight transition-colors">
              {notice.subject
            }</h1>

            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none font-medium leading-relaxed text-slate-600 dark:text-slate-400 transition-colors detail-view-content">
               <div dangerouslySetInnerHTML={{ __html: notice.details }} />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
               <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 transition-colors">
                  <Tag size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Official Announcement</span>
               </div>
               <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest transition-colors">
                 {new Date(notice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
          </Card>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-view-content { font-family: "Inter", "Hind Siliguri", sans-serif; }
        .detail-view-content * { max-width: 100%; height: auto; }
        /* Allow explicit font-family in content */
        .detail-view-content [style*="font-family"] { font-family: inherit; }
        
        .dark .detail-view-content { color: #cbd5e1; }
        .dark .detail-view-content * { 
          border-color: #334155 !important;
        }
        /* Ensure justification is respected */
        .detail-view-content [style*="text-align: justify"],
        .detail-view-content [align="justify"] {
          text-align: justify !important;
          text-justify: inter-word !important;
          display: block;
        }
        /* Force inherit color for elements with inline colors in dark mode to ensure readability */
        .dark .detail-view-content span[style*="color"],
        .dark .detail-view-content font[color],
        .dark .detail-view-content p[style*="color"],
        .dark .detail-view-content div[style*="color"],
        .dark .detail-view-content p[style*="color: rgb(0, 0, 0)"],
        .dark .detail-view-content div[style*="color: rgb(0, 0, 0)"] {
          color: inherit !important;
        }
        /* Handle explicitly dark text saved in HTML */
        .dark .detail-view-content [style*="color: rgb(0, 0, 0)"],
        .dark .detail-view-content [style*="color:#000000"],
        .dark .detail-view-content [style*="color:black"],
        .dark .detail-view-content [style*="background-color: white"],
        .dark .detail-view-content [style*="background-color: #ffffff"],
        .dark .detail-view-content [style*="background-color: rgb(255, 255, 255)"] {
          color: #cbd5e1 !important;
          background-color: transparent !important;
        }
      `}} />
    </PublicLayout>
  );
};