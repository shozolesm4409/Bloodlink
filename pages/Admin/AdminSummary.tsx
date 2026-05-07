
import React, { useEffect, useState } from 'react';
import { getUsers, getDonations, getAllFaqs, getHelpRequests, getAllFeedbacks } from '../../services/api';
import { Card, Badge } from '../../components/UI';
import { User, UserRole, DonationRecord, BloodGroup, FAQ, HelpRequest, DonationFeedback, HelpStatus, FeedbackStatus, DonationStatus } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Users, Shield, Edit, User as UserIcon, Activity, Droplet, Fingerprint, Award, HelpCircle, LifeBuoy, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

export const AdminSummary = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = isDarkMode;

  useEffect(() => {
    Promise.all([
      getUsers(), 
      getDonations(),
      getAllFaqs(),
      getHelpRequests(),
      getAllFeedbacks()
    ]).then(([u, d, f, h, fb]) => {
      setUsers(u);
      setDonations(d);
      setFaqs(f);
      setHelpRequests(h);
      setFeedbacks(fb);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse transition-colors">Calculating Summary...</div>;

  const superAdmins = users.filter(u => u.role === UserRole.SUPERADMIN).length;
  const admins = users.filter(u => u.role === UserRole.ADMIN).length;
  const editors = users.filter(u => u.role === UserRole.EDITOR).length;
  const generalUsers = users.filter(u => u.role === UserRole.USER).length;
  const badgedUsers = users.filter(u => u.approvedBadge && (u.approvedBadge as string) !== 'none').length;

  const roleData = [
    { name: 'Super Admin', value: superAdmins, color: '#7c3aed' }, // Violet
    { name: 'Admin', value: admins, color: '#ef4444' },      // Red
    { name: 'Editor', value: editors, color: '#3b82f6' },    // Blue
    { name: 'User', value: generalUsers, color: '#10b981' }, // Green
  ];

  const groupData = Object.values(BloodGroup).map(bg => ({
    group: bg,
    count: users.filter(u => u.bloodGroup === bg).length
  }));

  const donationGroupData = Object.values(BloodGroup).map(bg => ({
    group: bg,
    count: donations.filter(d => d.userBloodGroup === bg).length
  }));

  const donationTrendData = (() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        timestamp: date.getTime()
      };
    }).reverse();

    return last6Months.map(m => {
      const count = donations.filter(d => {
        const dDate = new Date(d.donationDate);
        return dDate.getMonth() === new Date(m.timestamp).getMonth() && 
               dDate.getFullYear() === m.year;
      }).length;
      return { name: m.month, count };
    });
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">System Summary</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors text-sm">Real-time population and contribution distribution.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none transition-colors">Total Registered</p>
              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">{users.length}</p>
           </div>
           <div className="w-8 h-8 bg-slate-900 dark:bg-slate-800 rounded-lg flex items-center justify-center text-white dark:text-slate-300 shadow-lg transition-colors">
              <Users size={16} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <SummaryCard icon={Fingerprint} title="Super Admins" value={superAdmins} color="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400" />
        <SummaryCard icon={Shield} title="Administrators" value={admins} color="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" />
        <SummaryCard icon={Edit} title="Content Editors" value={editors} color="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" />
        <SummaryCard icon={UserIcon} title="General Users" value={generalUsers} color="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400" />
        <SummaryCard 
          icon={Award} 
          title="Badge Management" 
          value={badgedUsers} 
          subtitle="Active Badges"
          color="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          icon={HelpCircle} 
          title="Moderate FAQ's" 
          value={faqs.length} 
          subtitle={`${faqs.filter(f => f.isVisible).length} Visible`}
          color="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" 
          isActionable
        />
        <SummaryCard 
          icon={LifeBuoy} 
          title="Help Center Manage" 
          value={helpRequests.length} 
          subtitle={`${helpRequests.filter(h => h.status === HelpStatus.PENDING).length} Pending`}
          color="bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400" 
          isActionable
        />
        <SummaryCard 
          icon={MessageSquare} 
          title="Moderate Feedback" 
          value={feedbacks.length} 
          subtitle={`${feedbacks.filter(f => f.status === FeedbackStatus.PENDING).length} Review`}
          color="bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400" 
          isActionable
        />
        <SummaryCard 
          icon={Heart} 
          title="Donation Records" 
          value={donations.length} 
          subtitle={`${donations.filter(d => d.status === DonationStatus.PENDING).length} New`}
          color="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400" 
          isActionable
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-xl transition-colors">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest transition-colors"><Activity size={20} className="text-red-600" /> Role Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} innerRadius={50} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                  {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2">
             {roleData.map(r => <div key={r.name} className="flex items-center gap-1.5 transition-colors"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: r.color}}></div><span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">{r.name} ({r.value})</span></div>)}
          </div>
        </Card>

        <Card className="p-6 border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-xl transition-colors">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest transition-colors"><Droplet size={20} className="text-blue-600" /> Blood Group Spread</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="group" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b'}} />
                <YAxis fontSize={9} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#475569' : '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: isDark ? '#334155' : '#f8fafc', opacity: 0.1, radius: 12}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#1e293b', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-xl transition-colors">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest transition-colors">
            <TrendingUp size={20} className="text-rose-600" /> Donation Trend
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donationTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b'}} />
                <YAxis fontSize={9} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#475569' : '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#1e293b', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-xl transition-colors">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest transition-colors">
            <Heart size={20} className="text-rose-500" /> Donation Groups
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationGroupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="group" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b'}} />
                <YAxis fontSize={9} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#475569' : '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: isDark ? '#334155' : '#f8fafc', opacity: 0.1, radius: 12}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#1e293b', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, color, subtitle, isActionable }: any) => (
  <Card className={`p-2 md:p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:shadow-md transition-all bg-white dark:bg-slate-900 rounded-xl group transition-colors overflow-hidden relative ${isActionable ? 'ring-1 ring-slate-100 dark:ring-slate-800' : ''}`}>
    {isActionable && <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rotate-45 translate-x-6 -translate-y-6 opacity-50 group-hover:opacity-100 transition-opacity" />}
    <div className={`p-2 md:p-3.5 rounded-xl ${color} transition-transform group-hover:scale-110 shadow-inner flex-shrink-0 z-10`}>
      <Icon size={16} className="md:w-5 md:h-5" strokeWidth={2} />
    </div>
    <div className="min-w-0 flex-1 z-10">
      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-0.5 leading-none transition-colors truncate">{title}</p>
      <p className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors leading-tight">{value}</p>
      {subtitle && (
        <div className="flex items-center gap-1 mt-1">
          <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse ${subtitle.includes('Pending') || subtitle.includes('Review') || subtitle.includes('New') ? 'bg-red-500' : 'bg-green-500'}`} />
          <p className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors truncate">{subtitle}</p>
        </div>
      )}
    </div>
  </Card>
);
