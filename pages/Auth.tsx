
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { login as apiLogin, register as apiRegister, getLandingConfig, initiatePasswordResetLink } from '../services/api';
import { Button } from '../components/UI';
import { Droplet, AlertCircle, ArrowLeft, User, Lock, Mail, Phone, MapPin, CheckCircle, Eye, EyeOff, ShieldCheck, Send, ShieldAlert, X, Crop as CropIcon } from 'lucide-react';
import { BLOOD_GROUPS } from '../constants';
import { LandingPageConfig } from '../types';
import { PublicLayout } from '../components/PublicLayout';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/cropImage';
// Added missing import for clsx
import clsx from 'clsx';

const { useNavigate, Link, useLocation } = ReactRouterDOM;

const AuthLayout = ({ children, title, subtitle, headline, description, styles }: any) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-2 lg:p-6 font-sans selection:bg-red-100 dark:selection:bg-red-900 transition-colors">
      <div 
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row h-auto relative border border-slate-100 dark:border-slate-800 transition-colors"
        style={{ marginTop: styles?.margin ?? 20, marginBottom: styles?.margin ?? 20 }}
      >
        <div className="lg:w-[38%] bg-gradient-to-br from-[#c1121f] to-[#780116] relative overflow-hidden flex flex-col justify-center p-8 lg:p-10 text-white order-2 lg:order-1">
          <div className="absolute top-[-5%] left-[-5%] w-[250px] h-[250px] bg-red-400 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/10 backdrop-blur-2xl rounded-lg flex items-center justify-center mb-2 border border-white/20 shadow-inner">
              <Droplet className="text-white fill-current" size={28} />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none drop-shadow-xl">
                {headline || "WELCOME"}
              </h2>
              <h3 className="text-sm lg:text-base font-bold opacity-90 uppercase tracking-[0.15em] text-red-100">
                BloodLink Manager
              </h3>
            </div>
            
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
            
            <p className="text-red-50 text-xs lg:text-sm leading-relaxed max-w-sm font-medium opacity-80 whitespace-pre-wrap">
              {description || "রক্তের প্রতিটি ফোঁটা একটি জীবনের সম্ভাবনা। আজই আমাদের কমিউনিটিতে যোগ দিন এবং জীবন বাঁচানোর মহান উদ্যোগে অংশ নিন।"}
            </p>
          </div>
        </div>

        <div className="lg:w-[62%] flex flex-col justify-center bg-white dark:bg-slate-900 order-1 lg:order-2 relative transition-colors p-2 sm:p-6 lg:p-10" style={styles?.padding ? { padding: styles.padding } : {}}>
          <div className="max-w-md mx-auto w-full relative z-10">
            <div className="mb-4 lg:mb-6">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight transition-colors">{title}</h1>
              <p className="text-slate-400 dark:text-slate-500 font-bold text-[9px] lg:text-[10px] uppercase tracking-[0.2em] opacity-60 transition-colors">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomInput = ({ icon: Icon, type = "text", name, placeholder, value, onChange, showPasswordToggle, onToggleShow }: any) => (
  <div className="mb-2 lg:mb-3">
    <div className="relative group">
      <input
        type={type}
        name={name}
        placeholder={placeholder || " "}
        value={value}
        onChange={onChange}
        required
        className={`peer w-full pl-9 sm:pl-11 ${showPasswordToggle ? 'pr-10 sm:pr-12 lg:pr-16' : 'pr-3'} py-1.5 lg:py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-2 border-transparent rounded-lg text-slate-900 dark:text-white font-bold text-sm lg:text-base focus:bg-white dark:focus:bg-slate-950 focus:border-red-600/30 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-medium shadow-sm transition-all`}
      />
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-0.5 text-slate-300 peer-focus:text-red-600 peer-[:not(:placeholder-shown)]:text-green-500 peer-valid:text-green-500 transition-colors pointer-events-none">
        <Icon size={18} />
      </div>
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-600 transition-colors"
        >
          {type === 'password' ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  useEffect(() => {
    getLandingConfig().then(setConfig);
    
    // Load remembered credentials
    const savedEmail = localStorage.getItem('bloodlink_remember_email');
    const savedPassword = localStorage.getItem('bloodlink_remember_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await apiLogin(email, password);
      
      // Handle Remember Me persistence
      if (rememberMe) {
        localStorage.setItem('bloodlink_remember_email', email);
        localStorage.setItem('bloodlink_remember_password', password);
      } else {
        localStorage.removeItem('bloodlink_remember_email');
        localStorage.removeItem('bloodlink_remember_password');
      }

      login(user);
      
      // Navigate back to where they came from or default to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true, state: location.state });
    } catch (err: any) {
      setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <AuthLayout 
        title={config?.loginTitle || "Sign In"}
        subtitle={config?.loginSubtitle || "LOG IN TO ACCESS YOUR DONOR DASHBOARD"}
        headline={config?.loginHeadline || "WELCOME"}
        description={config?.loginDescription}
        styles={config?.loginStyles}
      >
        <form onSubmit={handleSubmit}>
          <CustomInput 
            icon={User} 
            type="email" 
            name="email" 
            placeholder="User Name / Email" 
            value={email} 
            onChange={(e: any) => setEmail(e.target.value)} 
          />
          <CustomInput 
            icon={Lock} 
            type={showPassword ? 'text' : 'password'} 
            name="password" 
            placeholder="Password" 
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            showPasswordToggle 
            onToggleShow={() => setShowPassword(!showPassword)} 
          />
          <div className="flex items-center justify-between mb-6 lg:mb-8 px-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer w-4.5 h-4.5 opacity-0 absolute cursor-pointer" 
                />
                <div className={clsx(
                  "w-5 h-5 border-2 rounded transition-all shadow-sm flex items-center justify-center",
                  rememberMe ? "bg-red-600 border-red-600" : "border-slate-200 bg-white"
                )}>
                  {rememberMe && <CheckCircle size={14} className="text-white" />}
                </div>
              </div>
              <span className="text-xs lg:text-sm font-bold text-slate-500 group-hover:text-slate-700">Remember me</span>
            </label>
            <button type="button" onClick={() => navigate('/reset')} className="text-sm lg:text-base font-black text-red-600 dark:text-red-500 hover:underline transition-colors">Forgot Password?</button>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2 transition-colors">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-2 lg:py-3.5 rounded-lg font-black uppercase tracking-[0.25em] text-base lg:text-lg shadow-xl shadow-red-900/20 hover:bg-[#a0101a] transition-all disabled:opacity-50">
            {loading ? "Signing In..." : (config?.loginButtonLabel || "SIGN IN")}
          </button>
          <p className="text-center text-sm lg:text-base font-bold text-slate-400 dark:text-slate-500 mt-6 lg:mt-8 transition-colors">
            Don't have an account? <Link to="/register" className="text-red-600 dark:text-red-500 font-black hover:underline ml-1 text-base lg:text-lg">Sign Up</Link>
          </p>
        </form>
      </AuthLayout>
    </PublicLayout>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="10" height="8" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 5.5L4.5 9L11 1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLandingConfig().then(setConfig);
  }, []);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("ছবির সাইজ ২ মেগাবাইটের বেশি হওয়া যাবে না।");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const showCroppedImage = async () => {
    try {
      if (tempImage && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels);
        setAvatar(croppedImage);
        setShowCropModal(false);
        setTempImage(null);
      }
    } catch (e) {
      console.error(e);
      setError("ছবি ক্রপ করতে সমস্যা হয়েছে।");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (!avatar) {
      setError("দয়া করে আপনার একটি ছবি আপলোড করুন।");
      setLoading(false);
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError("পাসওয়ার্ড মেলেনি।");
      setLoading(false);
      return;
    }
    try {
      const user = await apiRegister({ ...data, avatar });
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <AuthLayout 
        title={config?.registerTitle || "Join Now"}
        subtitle={config?.registerSubtitle || "রক্তদাতা হিসেবে নিবন্ধন করুন এবং জীবন বাঁচান"}
        headline={config?.registerHeadline || "JOIN US"}
        description={config?.registerDescription}
        styles={config?.signupStyles}
      >
        <form onSubmit={handleSubmit} className="space-y-0">
          <div className="flex gap-2 sm:gap-2 mb-0.5 items-stretch">
            <div className="flex-1">
              <CustomInput icon={User} name="name" placeholder="আপনার পূর্ণ নাম" />
              <CustomInput icon={Mail} type="email" name="email" placeholder="ইমেইল এড্রেস" />
            </div>
            <div className="w-20 sm:w-28 flex-shrink-0 flex flex-col mb-2 lg:mb-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 relative rounded-sm border-2 ${avatar ? 'border-green-500 shadow-green-500/10' : 'border-slate-100 dark:border-slate-800'} bg-[#f8fafc] dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all hover:border-red-600/30 shadow-sm`}
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300 group-hover:text-red-500 transition-colors">
                    <User size={32} className="opacity-30 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Upload</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white text-[10px] font-bold uppercase tracking-widest">Edit</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2 lg:mb-3">
            <div className="relative group">
              <select name="bloodGroup" required className="peer w-full pl-9 sm:pl-11 pr-3 py-1.5 lg:py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-2 border-transparent rounded-lg text-slate-900 dark:text-white font-bold text-sm focus:bg-white dark:focus:bg-slate-950 focus:border-red-600/30 outline-none appearance-none cursor-pointer shadow-sm transition-all">
                <option value="">রক্তের গ্রুপ</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg} className="dark:bg-slate-900">{bg}</option>)}
              </select>
              <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-0.5 text-slate-300 peer-focus:text-red-600 peer-valid:text-green-500 transition-colors pointer-events-none">
                <Droplet size={18} />
              </div>
            </div>
            <div className="relative group">
              <input name="phone" placeholder="ফোন নম্বর" required className="peer w-full pl-9 sm:pl-11 pr-3 py-1.5 lg:py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-2 border-transparent rounded-lg text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-slate-950 outline-none shadow-sm transition-all placeholder:text-slate-300" />
              <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-0.5 text-slate-300 peer-focus:text-red-600 peer-valid:text-green-500 transition-colors pointer-events-none">
                <Phone size={18} />
              </div>
            </div>
          </div>
          <CustomInput icon={MapPin} name="location" placeholder="বর্তমান এলাকা/শহর" />
          <div className="grid grid-cols-2 gap-2">
            <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="password" placeholder="পাসওয়ার্ড" showPasswordToggle onToggleShow={() => setShowPassword(!showPassword)} />
            <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="নিশ্চিত করুন" />
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2 transition-colors">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-2 lg:py-3.5 rounded-lg font-black uppercase tracking-[0.25em] text-sm lg:text-base shadow-xl shadow-red-900/20 hover:bg-[#a0101a] transition-all disabled:opacity-50 mt-4">
            {loading ? "Creating Account..." : (config?.registerButtonLabel || "CREATE ACCOUNT")}
          </button>
          <p className="text-center text-sm lg:text-base font-bold text-slate-400 dark:text-slate-500 pt-6 lg:pt-8 transition-colors">
            Already have an account? <Link to="/login" className="text-red-600 dark:text-red-500 font-black hover:underline text-base lg:text-lg ml-1">Sign In</Link>
          </p>
        </form>

        {/* Crop Modal */}
        {showCropModal && tempImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-[95%] sm:max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="p-4 sm:p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl">
                    <CropIcon size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm sm:text-lg leading-none">Crop Photo</h3>
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Adjust your profile picture</p>
                  </div>
                </div>
                <button onClick={() => setShowCropModal(false)} className="p-1 sm:p-2 text-slate-400 hover:text-red-600 transition-colors">
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="relative h-60 sm:h-80 bg-slate-100 dark:bg-slate-950">
                <Cropper
                  image={tempImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={true}
                />
              </div>

              <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <span>Zoom Level</span>
                    <span className="text-red-600 dark:text-red-400">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                  <button 
                    onClick={() => setShowCropModal(false)}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={showCroppedImage}
                    className="flex-[2] px-4 sm:px-6 py-3 sm:py-4 bg-[#c1121f] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-red-900/20 hover:bg-[#a0101a] transition-all transform active:scale-95"
                  >
                    Save Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AuthLayout>
    </PublicLayout>
  );
};

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  useEffect(() => {
    getLandingConfig().then(setConfig);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await initiatePasswordResetLink(email);
      setStep('sent');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <PublicLayout>
        <AuthLayout 
          title={config?.resetTitle || "পাসওয়ার্ড ভুলে গেছেন?"}
          subtitle={config?.resetSubtitle || "আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠান"}
          headline={config?.resetHeadline || "RECOVERY"}
          description={config?.resetDescription || "আমাদের সিকিউরিটি সিস্টেম ব্যবহার করে আপনার পাসওয়ার্ড রিসেট করুন। আপনার নিবন্ধিত ইমেইল এড্রেসটি নিচে প্রদান করুন। আমরা একটি সিকিউর লিংক পাঠাব।"}
        >
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <CustomInput icon={Mail} type="email" name="email" placeholder="আপনার জিমেইল এড্রেস" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2 transition-colors">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-2 lg:py-3.5 rounded-lg font-black uppercase tracking-[0.25em] text-base lg:text-lg shadow-xl shadow-red-900/20 hover:bg-[#a0101a] transition-all disabled:opacity-50">
              {loading ? "প্রসেসিং..." : (config?.resetButtonLabel || "রিসেট লিংক পাঠান")}
            </button>
            
            <div className="pt-6 text-center">
              <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> ফিরে যান
              </Link>
            </div>
          </form>
        </AuthLayout>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <AuthLayout 
        title={config?.sentTitle || "ইমেইল চেক করুন"}
        subtitle={config?.sentSubtitle || `আমরা একটি লিংক ${email} এ পাঠিয়েছি`}
        headline={config?.sentHeadline || "EMAIL SENT"}
        description={config?.sentDescription || "আপনার জিমেইলের ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন। সেখানে একটি বাটন পাবেন যা আপনাকে পাসওয়ার্ড পরিবর্তন করতে সাহায্য করবে।"}
      >
        <div className="text-center py-10 space-y-8 animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto shadow-inner">
              <Send size={48} className="animate-pulse" />
           </div>
           <div className="space-y-4">
              <p className="text-slate-500 font-medium leading-relaxed">
                 আমরা সরাসরি Google-এর মাধ্যমে আপনাকে একটি ইমেইল পাঠিয়েছি। মেইলের লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
              </p>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3">
                 <ShieldAlert size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                 <p className="text-[10px] text-orange-700 font-bold leading-tight text-left">
                    পাসওয়ার্ড পরিবর্তন করার পর আপনি পুনরায় অ্যাপে ফিরে এসে নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
                 </p>
              </div>
           </div>
           <div className="flex flex-col gap-3">
             <Link to="/login" className="w-full bg-slate-900 text-white py-4 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-black transition-all">
                {config?.sentGoToLoginLabel || "লগইন পেজে ফিরে যান"}
             </Link>
             <button onClick={() => setStep('email')} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition-colors">
                {config?.sentTryAgainLabel || "ভুল ইমেইল দিয়েছেন? আবার চেষ্টা করুন"}
             </button>
           </div>
        </div>
      </AuthLayout>
    </PublicLayout>
  );
};
