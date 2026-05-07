import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { Card, Input, Button, useToast, Toast, Badge } from '../../../components/UI';
import { HelpCircle, CheckCircle2, RotateCcw, Send, ArrowLeft, Search, Clock, MessageCircle } from 'lucide-react';
import { submitHelpRequest, getUserHelpRequests, getHelpRequestsByPhone } from '../../../services/api';
import { HelpRequest, HelpStatus } from '../../../types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

export const HelpCenterView = ({ setActiveView }: { setActiveView: (view: string) => void }) => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // History State
  const [history, setHistory] = useState<HelpRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history' && user) {
      setHistoryLoading(true);
      getUserHelpRequests(user.id).then(data => {
        setHistory(data);
        setHistoryLoading(false);
      });
    }
  }, [activeTab, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
      userId: user?.id
    };

    try {
      await submitHelpRequest(data);
      setSubmitted(true);
    } catch (err) {
      showToast("Submission failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  const RequestList = ({ requests, emptyMsg }: { requests: HelpRequest[], emptyMsg: string }) => (
    <div className="space-y-4">
      {requests.length > 0 ? requests.map(req => (
        <div key={req.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <Clock size={12} />
              {new Date(req.timestamp).toLocaleDateString()}
            </div>
            <Badge color={req.status === HelpStatus.COMPLETE ? 'green' : (req.status === HelpStatus.REJECTED ? 'red' : 'yellow')}>
              {req.status}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 transition-colors">"{req.message}"</p>
          {req.remark && (
            <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex gap-3 items-start transition-colors">
              <MessageCircle size={16} className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Admin Response</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{req.remark}</p>
              </div>
            </div>
          )}
        </div>
      )) : (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
          {emptyMsg}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center animate-in fade-in duration-500 transition-colors pt-2">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="w-full max-w-2xl mb-4 flex justify-between items-center">
          <button onClick={() => setActiveView('hub')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm">
              <ArrowLeft size={18} /> Back to Support
          </button>
      </div>

      <Card className="max-w-2xl w-full p-3 lg:p-5 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] relative overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="text-center mb-5 relative z-10">
          <div className="w-16 h-16 bg-red-600 dark:bg-red-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-200 dark:shadow-red-900/20 transition-colors">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Help Center</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 transition-colors">আপনার জিজ্ঞাসা বা সমস্যার সমাধান এখানে।</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 overflow-x-auto transition-colors">
          <button 
            onClick={() => setActiveTab('new')} 
            className={clsx("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'new' ? "bg-white dark:bg-slate-700 shadow text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400")}
          >
            New Request
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={clsx("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'history' ? "bg-white dark:bg-slate-700 shadow text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400")}
          >
            My History
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'new' && (
            <motion.div 
              key="new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-green-50 dark:ring-green-900/20 transition-colors">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 transition-colors">Success!</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 transition-colors">Your message has been sent successfully.</p>
                  <Button onClick={handleReset} variant="outline" className="w-full py-4 rounded-xl gap-2 cursor-pointer">
                    <RotateCcw size={18} /> Send Message Again
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <Input 
                    label="Full Name" 
                    name="name" 
                    placeholder="Enter your name" 
                    defaultValue={user?.name || ''} 
                    required 
                  />
                  <Input 
                    label="Phone Number" 
                    name="phone" 
                    placeholder="Enter phone number" 
                    defaultValue={user?.phone || ''} 
                    required 
                  />
                  
                  <div className="w-full">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1 transition-colors">Your Message</label>
                    <textarea 
                      name="message" 
                      placeholder="Describe your issue or question..." 
                      required 
                      rows={5} 
                      className="w-full px-4 py-3.5 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  <Button type="submit" isLoading={loading} className="w-full py-4 rounded-xl text-base shadow-xl shadow-red-100 dark:shadow-red-900/20 cursor-pointer">
                    <Send size={18} className="mr-2" /> Submit Request
                  </Button>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {historyLoading ? (
                <div className="py-20 text-center text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest animate-pulse">Loading History...</div>
              ) : (
                <RequestList requests={history} emptyMsg="You haven't submitted any requests yet." />
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </Card>
    </div>
  );
};
