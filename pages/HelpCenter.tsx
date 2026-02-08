
import React, { useState } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { Card, Input, Button, useToast, Toast } from '../components/UI';
import { HelpCircle, CheckCircle2, RotateCcw, Send } from 'lucide-react';
import { submitHelpRequest } from '../services/api';

export const HelpCenter = () => {
  const { toastState, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
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

  return (
    <PublicLayout>
      <div className="py-12 px-6 lg:py-20 flex justify-center">
        <Toast {...toastState} onClose={hideToast} />
        <Card className="max-w-xl w-full p-8 lg:p-12 border-0 shadow-2xl bg-white rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>
          
          <div className="text-center mb-10 relative z-10">
            <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
              <HelpCircle size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Help Center</h1>
            <p className="text-slate-500 font-medium mt-2">আপনার যেকোনো জিজ্ঞাসা বা সমস্যা আমাদের জানান।</p>
          </div>

          {submitted ? (
            <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-green-50">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Success!</h2>
              <p className="text-slate-500 font-bold mb-8">Your message has been sent successfully.</p>
              <Button onClick={handleReset} variant="outline" className="w-full py-4 rounded-xl gap-2">
                <RotateCcw size={18} /> Send Message Again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <Input label="Full Name" name="name" placeholder="Enter your name" required />
              <Input label="Phone Number" name="phone" placeholder="Enter phone number" required />
              
              <div className="w-full">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Your Message</label>
                <textarea 
                  name="message" 
                  placeholder="Describe your issue or question..." 
                  required 
                  rows={5} 
                  className="w-full px-4 py-3.5 border border-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-slate-50 font-medium placeholder:text-slate-300 resize-none"
                />
              </div>

              <Button type="submit" isLoading={loading} className="w-full py-4 rounded-xl text-base shadow-xl shadow-red-100">
                <Send size={18} className="mr-2" /> Submit Request
              </Button>
            </form>
          )}
        </Card>
      </div>
    </PublicLayout>
  );
};
