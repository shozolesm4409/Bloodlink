import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoticeById } from '../../services/api';
import { PublicLayout } from '../../components/PublicLayout';
import { Card, Badge, Button } from '../../components/UI';
import { Notice } from '../../types';
import { Calendar, User as UserIcon, Pin, ArrowLeft, Tag } from 'lucide-react';
import clsx from 'clsx';

export const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <div className="py-12 px-6 lg:py-20 bg-[#f8f9fa] dark:bg-slate-950 min-h-screen transition-colors">
        <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
          <button 
            onClick={() => navigate('/public-notices')} 
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-red-600 dark:hover:text-red-400 transition-colors mb-8 text-sm"
          >
            <ArrowLeft size={18} /> Back to Board
          </button>

          <Card className="p-8 lg:p-12 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] relative overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
            {notice.pinned && (
              <div className="absolute top-0 right-0 bg-yellow-400 dark:bg-yellow-500 text-white dark:text-slate-900 px-8 py-3 rounded-bl-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-colors">
                <Pin size={16} className="fill-current" /> Pinned
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md flex-shrink-0 transition-colors">
                {notice.authorAvatar ? (
                  <img src={notice.authorAvatar} className="w-full h-full object-cover" alt={notice.authorName} />
                ) : (
                  <UserIcon className="p-3 text-slate-300 dark:text-slate-600 w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1 transition-colors">{notice.authorName}</p>
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

            <h1 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white mb-8 leading-tight tracking-tight transition-colors">
              {notice.subject}
            </h1>

            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none font-medium leading-relaxed text-slate-600 dark:text-slate-400 transition-colors">
               <div dangerouslySetInnerHTML={{ __html: notice.details }} />
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
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
    </PublicLayout>
  );
};