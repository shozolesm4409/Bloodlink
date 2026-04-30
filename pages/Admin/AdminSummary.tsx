
import React, { useEffect, useState } from 'react';
import { getUsers, getDonations } from '../../services/api';
import { Card, Badge } from '../../components/UI';
import { User, UserRole, DonationRecord, BloodGroup } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Shield, Edit, User as UserIcon, Activity, Droplet, Fingerprint } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

export const AdminSummary = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = isDarkMode;

  useEffect(() => {
    Promise.all([getUsers(), getDonations()]).then(([u, d]) => {
      setUsers(u);
      setDonations(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse transition-colors">Calculating Summary...</div>;

  const superAdmins = users.filter(u => u.role === UserRole.SUPERADMIN).length;
  const admins = users.filter(u => u.role === UserRole.ADMIN).length;
  const editors = users.filter(u => u.role === UserRole.EDITOR).length;
  const generalUsers = users.filter(u => u.role === UserRole.USER).length;

  const roleData = [
    { name: 'Super Admin', value: superAdmins, color: '#7c3aed' }, // Violet
    { name: 'Admin', value: admins, color: '#ef4444' },      // Red
    { name: 'Editor', value: editors, color: '#3b82f6' },    // Blue
    { name: 'User', value: generalUsers, color: '#10b981' }, // Green
  ];

  // Fix: Accurate and robust Blood Group Spread calculation
  const groupData = Object.values(BloodGroup).map(bg => ({
    group: bg,
    count: users.filter(u => u.bloodGroup === bg).length
  }));

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-8 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">System Summary</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Real-time population and contribution distribution.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none transition-colors">Total Registered</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">{users.length}</p>
           </div>
           <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center text-white dark:text-slate-300 shadow-lg transition-colors">
              <Users size={20} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={Fingerprint} title="Super Admins" value={superAdmins} color="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400" />
        <SummaryCard icon={Shield} title="Administrators" value={admins} color="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" />
        <SummaryCard icon={Edit} title="Content Editors" value={editors} color="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" />
        <SummaryCard icon={UserIcon} title="General Users" value={generalUsers} color="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-10 border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-sm transition-colors">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-10 flex items-center gap-3 uppercase tracking-widest transition-colors"><Activity size={24} className="text-red-600" /> Role Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-4">
             {roleData.map(r => <div key={r.name} className="flex items-center gap-2 transition-colors"><div className="w-3 h-3 rounded-full" style={{backgroundColor: r.color}}></div><span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">{r.name} ({r.value})</span></div>)}
          </div>
        </Card>

        <Card className="p-10 border border-slate-100 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 rounded-sm transition-colors">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-10 flex items-center gap-3 uppercase tracking-widest transition-colors"><Droplet size={24} className="text-blue-600" /> Blood Group Spread</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="group" fontSize={12} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b'}} />
                <YAxis fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: isDark ? '#475569' : '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: isDark ? '#334155' : '#f8fafc', opacity: 0.1, radius: 12}} 
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#1e293b', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, color }: any) => (
  <Card className="p-6 border border-slate-100 dark:border-slate-800 shadow-md flex items-center gap-5 hover:shadow-lg transition-all bg-white dark:bg-slate-900 rounded-sm group transition-colors">
    <div className={`p-5 rounded-2xl ${color} transition-transform group-hover:scale-110 shadow-inner`}><Icon size={24} /></div>
    <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 leading-none transition-colors">{title}</p><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">{value}</p></div>
  </Card>
);
