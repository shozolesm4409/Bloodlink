import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFeedbackById } from '../../services/api';
import { PublicLayout } from '../../components/PublicLayout';
import { Card, Button } from '../../components/UI';
import { DonationFeedback } from '../../types';
import { Calendar, User as UserIcon, ArrowLeft, Tag, BadgeCheck, Check } from 'lucide-react';
import clsx from 'clsx';
import { useSettings } from '../../SettingsContext';

export const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { from } = location.state || { from: 'feedbacks' };
  const { badgeConfig } = useSettings();
  const [feedback, setFeedback] = useState<DonationFeedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getFeedbackById(id).then((data) => {
        setFeedback(data);
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
          <p className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-xs">Loading Feedback...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!feedback) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-white dark:bg-slate-950 transition-colors">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 transition-colors">Feedback Not Found</h2>
          <Button onClick={() => navigate('/public-feedbacks')} variant="outline" className="rounded-xl">
            <ArrowLeft size={18} className="mr-2" /> Back to Feedbacks
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
            onClick={() => navigate(from === 'landing' ? '/' : '/public-feedbacks')} 
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-red-600 dark:hover:text-red-400 transition-colors mb-4 text-sm"
          >
            <ArrowLeft size={18} /> {from === 'landing' ? 'Back to Home' : 'Back to Voices'}
          </button>

          <Card className="p-4 lg:p-6 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[1.5rem] lg:rounded-[2rem] relative overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md flex-shrink-0 transition-colors">
                {feedback.userAvatar ? (
                  <img src={feedback.userAvatar} className="w-full h-full object-cover" alt={feedback.userName} />
                ) : (
                  <UserIcon className="p-3 text-slate-300 dark:text-slate-600 w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1 transition-colors flex items-center gap-1">
                  {feedback.userName}
                                    {feedback.userApprovedBadge && (
                    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 14, height: 14 }}>
                      <BadgeCheck 
                        size={14} 
                        className={clsx(
                          feedback.userApprovedBadge === 'pink' ? badgeConfig.silver?.color || 'text-slate-400' :
                          feedback.userApprovedBadge === 'red' ? badgeConfig.gold?.color || 'text-amber-500' :
                          feedback.userApprovedBadge === 'green' ? badgeConfig.platinum?.color || 'text-emerald-500' :
                          feedback.userApprovedBadge === 'blue' ? badgeConfig.diamond?.color || 'text-cyan-500' :
                          badgeConfig.verificationBadgeColor || 'text-blue-500',
                          "fill-current"
                        )} 
                      />
                      <Check 
                        size={14 * 0.65} 
                        className="absolute text-white" 
                        strokeWidth={6} 
                      />
                    </div>
                  )}
                </p>
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {new Date(feedback.timestamp).toLocaleDateString([], { dateStyle: 'long' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none font-medium leading-relaxed text-slate-700 dark:text-slate-300 transition-colors">
                <p>"{feedback.message}"</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
               <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 transition-colors">
                  <Tag size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Community Voice</span>
               </div>
               <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest transition-colors">
                 {new Date(feedback.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};
