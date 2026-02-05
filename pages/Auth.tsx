
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../AuthContext';
import { login as apiLogin, register as apiRegister, getLandingConfig, initiatePasswordResetLink } from '../services/api';
import { Button } from '../components/UI';
import { Droplet, AlertCircle, ArrowLeft, User, Lock, Mail, Phone, MapPin, CheckCircle, Eye, EyeOff, ShieldAlert, Send } from 'lucide-react';
import { BLOOD_GROUPS } from '../constants';
import { LandingPageConfig } from '../types';
import { PublicLayout } from '../components/PublicLayout';
import clsx from 'clsx';

const AuthLayout = ({ children, title, subtitle, headline, description, styles }: any) => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center p-3 lg:p-6 font-sans">
    <div 
      className="w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row h-auto border border-slate-100"
      style={{ marginTop: styles?.margin ?? 20, marginBottom: styles?.margin ?? 20 }}
    >
      <div className="lg:w-[38%] bg-gradient-to-br from-[#c1121f] to-[#780116] p-8 lg:p-10 text-white flex flex-col justify-center order-2 lg:order-1 relative overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[250px] h-[250px] bg-red-400 rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center mb-2 border border-white/20 shadow-inner">
            <Droplet className="text-white fill-current" size={28} />
          </div>
          <h2 className="text-3xl lg:text-5xl font-black uppercase leading-none">{headline || "WELCOME"}</h2>
          <p className="text-red-50 text-xs lg:text-sm leading-relaxed max-w-sm font-medium opacity-80">{description || "জীবন বাঁচানোর মহান উদ্যোগে অংশ নিন।"}</p>
        </div>
      </div>
      <div className="lg:w-[62%] flex flex-col justify-center bg-white order-1 lg:order-2 p-10 lg:p-20 relative">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-1 tracking-tight">{title}</h1>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  </div>
);

const CustomInput = ({ icon: Icon, type = "text", name, placeholder, value, onChange, showPasswordToggle, onToggleShow }: any) => (
  <div className="mb-4">
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors pointer-events-none">
        <Icon size={18} />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full pl-11 pr-16 py-4 bg-[#f8fafc] border-2 border-transparent rounded-[1.25rem] text-slate-900 font-bold focus:bg-white focus:border-red-600/30 outline-none transition-all placeholder:text-slate-300"
      />
      {showPasswordToggle && (
        <button type="button" onClick={onToggleShow} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600">
          {type === 'password' ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  useEffect(() => { getLandingConfig().then(setConfig); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userData = await apiLogin(email, password);
      login(userData);
      navigate('/');
    } catch (err: any) { setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।"); }
    finally { setLoading(false); }
  };

  return (
    <PublicLayout>
      <AuthLayout 
        title={config?.loginTitle || "Sign In"}
        subtitle={config?.loginSubtitle || "LOG IN TO YOUR DASHBOARD"}
        headline={config?.loginHeadline || "WELCOME"}
        description={config?.loginDescription}
        styles={config?.loginStyles}
      >
        <form onSubmit={handleSubmit}>
          <CustomInput icon={User} type="email" name="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} showPasswordToggle onToggleShow={() => setShowPassword(!showPassword)} />
          {error && <div className="mb-4 p-3.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-4 rounded-[1.25rem] font-black uppercase tracking-widest hover:bg-[#a0101a] transition-all disabled:opacity-50">
            {loading ? "Signing In..." : (config?.loginButtonLabel || "SIGN IN")}
          </button>
          <div className="mt-8 text-center"><Link to="/register" className="text-red-600 font-black hover:underline">Create Account</Link></div>
        </form>
      </AuthLayout>
    </PublicLayout>
  );
};

export const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  useEffect(() => { getLandingConfig().then(setConfig); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    if (data.password !== data.confirmPassword) { setError("পাসওয়ার্ড মেলেনি।"); setLoading(false); return; }
    try {
      const userData = await apiRegister(data);
      login(userData);
      navigate('/');
    } catch (err: any) { setError(err.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।"); }
    finally { setLoading(false); }
  };

  return (
    <PublicLayout>
      <AuthLayout title={config?.registerTitle || "Join Now"} headline={config?.registerHeadline || "JOIN US"}>
        <form onSubmit={handleSubmit} className="space-y-1">
          <CustomInput icon={User} name="name" placeholder="Full Name" />
          <CustomInput icon={Mail} type="email" name="email" placeholder="Email" />
          <div className="grid grid-cols-2 gap-3 mb-2">
            <select name="bloodGroup" required className="w-full px-4 py-4 bg-[#f8fafc] border-2 border-transparent rounded-[1.25rem] text-slate-900 font-bold text-sm outline-none">
              <option value="">Blood Group</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input name="phone" placeholder="Phone" required className="w-full px-4 py-4 bg-[#f8fafc] rounded-[1.25rem] text-sm font-bold border-2 border-transparent" />
          </div>
          <CustomInput icon={MapPin} name="location" placeholder="Location" />
          <div className="grid grid-cols-2 gap-3">
            <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" showPasswordToggle onToggleShow={() => setShowPassword(!showPassword)} />
            <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm" />
          </div>
          {error && <div className="p-3.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-4 rounded-[1.25rem] font-black uppercase tracking-widest hover:bg-[#a0101a] transition-all disabled:opacity-50 mt-4">
            {loading ? "Creating..." : "CREATE ACCOUNT"}
          </button>
        </form>
      </AuthLayout>
    </PublicLayout>
  );
};

export const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try { await initiatePasswordResetLink(email); setStep('sent'); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (step === 'email') {
    return (
      <PublicLayout>
        <AuthLayout title="Recovery" headline="SECURITY">
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <CustomInput icon={Mail} type="email" name="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            {error && <div className="p-3.5 bg-red-50 text-red-600 text-[10px] font-black uppercase border border-red-100 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-4 rounded-[1.25rem] font-black uppercase">Send Link</button>
            <div className="pt-6 text-center"><Link to="/login" className="text-slate-400 font-black uppercase text-[11px]"><ArrowLeft size={14} className="inline mr-1" /> Back to Login</Link></div>
          </form>
        </AuthLayout>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <AuthLayout title="Check Inbox" headline="SENT">
        <div className="text-center py-10 space-y-8 animate-in zoom-in-95">
           <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto"><Send size={48} /></div>
           <p className="text-slate-500 font-medium">We sent a recovery link to {email}. Please check your inbox.</p>
           <Link to="/login" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase block">Go to Login</Link>
        </div>
      </AuthLayout>
    </PublicLayout>
  );
};
