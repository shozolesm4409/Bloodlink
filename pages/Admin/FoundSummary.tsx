
import React, { useEffect, useState } from 'react';
import { subscribeToFundingContributions, subscribeToFundExpenses, subscribeToFundingConfig } from '../../services/api';
import { FundingContribution, FundExpense, FundingConfig, FundingStatus } from '../../types';
import { Card, Badge } from '../../components/UI';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  HeartHandshake, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { useTheme } from '../../ThemeContext';

export const FoundSummary = () => {
  const { isDarkMode } = useTheme();
  const [contributions, setContributions] = useState<FundingContribution[]>([]);
  const [expenses, setExpenses] = useState<FundExpense[]>([]);
  const [config, setConfig] = useState<FundingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadedCount = 0;
    const checkLoading = () => {
      loadedCount++;
      if (loadedCount >= 3) setLoading(false);
    };

    const unsubConfig = subscribeToFundingConfig((data) => {
      setConfig(data);
      checkLoading();
    });

    const unsubContributions = subscribeToFundingContributions((data) => {
      setContributions(data);
      checkLoading();
    });

    const unsubExpenses = subscribeToFundExpenses((data) => {
      setExpenses(data);
      checkLoading();
    });

    return () => {
      unsubConfig();
      unsubContributions();
      unsubExpenses();
    };
  }, []);

  if (loading) return <div className="p-10 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse">Loading Found Summary...</div>;

  const approvedContributions = contributions.filter(c => c.status === FundingStatus.APPROVED);
  const totalReceived = approvedContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = totalReceived - totalSpent;

  const methodData = approvedContributions.reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.name === curr.paymentMethod);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.paymentMethod, value: curr.amount });
    }
    return acc;
  }, []);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  const recentActivities = [
    ...approvedContributions.map(c => ({
      type: 'contribution' as const,
      amount: c.amount,
      label: `Received from ${c.userName}`,
      date: c.timestamp,
      method: c.paymentMethod
    })),
    ...expenses.map(e => ({
      type: 'expense' as const,
      amount: e.amount,
      label: e.purpose,
      date: new Date(e.date).toISOString(),
      method: 'Expense'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <div className="space-y-4 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Found Summary</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Transparency and financial distribution of the community fund.</p>
        </div>
        <div className="flex items-center gap-3 bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-200 dark:shadow-red-900/20 text-white">
           <div className="text-right">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Total Balance</p>
              <p className="text-2xl font-black tracking-tighter">৳{currentBalance.toLocaleString()}</p>
           </div>
           <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Wallet size={20} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
              <ArrowUpRight size={14} />
              <span>TOTAL IN</span>
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Contributions</h3>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">৳{totalReceived.toLocaleString()}</p>
        </Card>

        <Card className="p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 transition-transform group-hover:scale-110">
              <TrendingDown size={24} />
            </div>
            <div className="flex items-center gap-1 text-rose-500 font-bold text-xs">
              <ArrowDownRight size={14} />
              <span>TOTAL OUT</span>
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Expenses</h3>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">৳{totalSpent.toLocaleString()}</p>
        </Card>

        <Card className="p-4 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110">
              <Activity size={24} />
            </div>
            <div className="flex items-center gap-1 text-blue-500 font-bold text-xs">
              <span>{approvedContributions.length} ENTRIES</span>
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Contribution Count</h3>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{approvedContributions.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <PieIcon size={20} className="text-red-500" />
              Source Distribution
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {methodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {methodData.map((m, i) => (
              <div key={m.name} className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-black text-slate-400 uppercase">{m.name}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">৳{m.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <History size={20} className="text-red-500" />
              Recent Activities
            </h3>
          </div>
          <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 scroll-smooth">
            {recentActivities.length > 0 ? recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-900/30 transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    act.type === 'contribution' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {act.type === 'contribution' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">{act.label}</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                      {new Date(act.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {act.method}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${
                    act.type === 'contribution' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {act.type === 'contribution' ? '+' : '-'}৳{act.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No recent activities</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
