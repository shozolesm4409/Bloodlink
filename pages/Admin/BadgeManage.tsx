import React, { useState, useEffect } from 'react';
import { Card, Button, useToast, Input } from '../../components/UI';
import { getUsers, getDonations, updateUser } from '../../services/api';
import { User, DonationRecord, DonationStatus, UserRole } from '../../types';
import { Medal, CheckCircle2, ShieldAlert, Award, Search, Trash2, ShieldCheck, UserX, Star, UserCheck, RotateCcw, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import clsx from 'clsx';
import { getBadgeData } from '../Users/Profile';

const getEligible = (c: number) => {
    if (c > 10) return 'blue';
    if (c > 7) return 'green';
    if (c > 5) return 'red';
    if (c > 3) return 'pink';
    return null;
};

const badgeColorMap: any = {
    blue: 'text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
    green: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    red: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    pink: 'text-slate-400 bg-slate-50 dark:bg-slate-800/20',
    none: 'text-slate-400 bg-slate-50 dark:bg-slate-800'
};

const badgeNameMap: any = {
    blue: 'Diamond',
    green: 'Platinum',
    red: 'Gold',
    pink: 'Silver',
    none: 'No Badge'
};

type BadgeType = 'pink' | 'red' | 'green' | 'blue';

export const BadgeManage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [donations, setDonations] = useState<DonationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [badgeFilter, setBadgeFilter] = useState('ALL');
    const { showToast } = useToast();

    const isSuperAdmin = currentUser?.role === UserRole.SUPERADMIN;

    useEffect(() => {
        const load = async () => {
            try {
                const [u, d] = await Promise.all([getUsers(), getDonations()]);
                setUsers(u);
                setDonations(d.filter(x => x.status === DonationStatus.COMPLETED));
            } catch(e) {
                console.error(e);
                showToast('Failed to load data.', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleUpdateBadge = async (userId: string, newBadge: BadgeType | null) => {
        try {
            await updateUser(userId, { approvedBadge: newBadge as any });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, approvedBadge: newBadge as any } : u));
            showToast(newBadge ? 'Badge updated successfully!' : 'Badge removed successfully!');
        } catch(e) {
            console.error(e);
            showToast('Error updating badge.', 'error');
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div></div>;

    const userDonationCounts = users.reduce((acc: any, u) => ({ ...acc, [u.id]: 0 }), {});
    donations.forEach(d => {
        if (userDonationCounts[d.userId] !== undefined) {
            userDonationCounts[d.userId]++;
        }
    });

    const badgeRanks: any = { none: 0, pink: 1, red: 2, green: 3, blue: 4 };

    const pendingRequests = users.map(u => {
        const count = userDonationCounts[u.id] || 0;
        const eligible = getEligible(count);
        return { user: u, count, eligible, current: u.approvedBadge || 'none' };
    }).filter(x => 
        x.user.role !== UserRole.SUPERADMIN && 
        x.eligible && 
        badgeRanks[x.current] < badgeRanks[x.eligible]
    );

    const filteredUsers = users.filter(u => 
        u.role !== UserRole.SUPERADMIN &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const activeBadgeHolders = users.filter(u => u.approvedBadge && u.role !== UserRole.SUPERADMIN && (badgeFilter === 'ALL' || u.approvedBadge === badgeFilter));

    return (
        <div className="space-y-6 pt-5 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto pb-20 px-2 sm:px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Badge Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest text-[10px]">Verify and award contribution badges</p>
                </div>
                {isSuperAdmin && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <select 
                        value={badgeFilter}
                        onChange={(e) => setBadgeFilter(e.target.value)}
                        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-sm p-3 outline-none"
                      >
                          <option value="ALL">All Badge</option>
                          <option value="pink">Silver</option>
                          <option value="red">Gold</option>
                          <option value="green">Platinum</option>
                          <option value="blue">Diamond</option>
                      </select>
                      <div className="relative w-full md:w-80 group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                          <Input 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search users to manage badges..."
                              className="pl-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                          />
                      </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert size={20} className="text-amber-500" />
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Pending Approvals</h2>
                </div>

                {pendingRequests.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-6 sm:p-12 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-slate-800 text-slate-100 dark:text-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                            <Medal size={32} />
                        </div>
                        <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">No pending badge requests</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingRequests.map(req => (
                            <BadgeCard 
                                key={req.user.id} 
                                user={req.user} 
                                count={req.count} 
                                badge={req.eligible as BadgeType} 
                                currentBadge={req.current}
                                onApprove={() => handleUpdateBadge(req.user.id, req.eligible as BadgeType)}
                                isPending
                            />
                        ))}
                    </div>
                )}
            </div>

            {isSuperAdmin && searchQuery && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <Star size={20} className="text-indigo-500" />
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Manual Management</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(u => (
                            <BadgeCard 
                                key={u.id} 
                                user={u} 
                                count={userDonationCounts[u.id] || 0} 
                                badge={u.approvedBadge} 
                                onSetBadge={(b: BadgeType) => handleUpdateBadge(u.id, b)}
                                onRemove={() => handleUpdateBadge(u.id, null)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <UserCheck size={20} className="text-green-500" />
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Active Badge Holders</h2>
                </div>

                {/* Desktop View */}
                <Card className="hidden md:block overflow-hidden border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="p-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                    <th className="p-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Donations</th>
                                    <th className="p-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Badge</th>
                                    <th className="p-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activeBadgeHolders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold italic">No active badge holders found.</td>
                                    </tr>
                                ) : (
                                    activeBadgeHolders.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                                                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <Award size={18}/>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-black text-slate-900 dark:text-white truncate text-sm uppercase">{u.name}</p>
                                                            {getBadgeData(u) && <BadgeCheck size={14} className={clsx(getBadgeData(u)?.color, "flex-shrink-0")} />}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase mt-0.5">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-1">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black">
                                                    {userDonationCounts[u.id] || 0}
                                                </span>
                                            </td>
                                            <td className="p-1">
                                                <div className="flex items-center gap-2">
                                                    <select 
                                                        value={u.approvedBadge} 
                                                        onChange={(e) => handleUpdateBadge(u.id, e.target.value as BadgeType)}
                                                        className={clsx(
                                                            "bg-transparent border-0 font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer appearance-none px-2 py-0.5 rounded-sm",
                                                            badgeColorMap[u.approvedBadge]
                                                        )}
                                                    >
                                                        {['pink', 'red', 'green', 'blue'].map(b => (
                                                            <option key={b} value={b} className="bg-white dark:bg-slate-900 border-0">{badgeNameMap[b]}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="p-1 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button 
                                                        onClick={() => handleUpdateBadge(u.id, null)}
                                                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all"
                                                        title="Make Pending"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateBadge(u.id, null)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                                        title="Remove Badge"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {activeBadgeHolders.length === 0 ? (
                        <Card className="p-6 text-center text-slate-400 font-bold italic border-dashed rounded-3xl">
                            No active badge holders found.
                        </Card>
                    ) : (
                        activeBadgeHolders.map(u => (
                            <Card key={u.id} className="p-2.5 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <Award size={18}/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <p className="font-black text-slate-900 dark:text-white truncate text-xs uppercase leading-tight">{u.name}</p>
                                            {getBadgeData(u) && <BadgeCheck size={12} className={clsx(getBadgeData(u)?.color, "flex-shrink-0")} />}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase mt-0.5">{u.email}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <select 
                                            value={u.approvedBadge} 
                                            onChange={(e) => handleUpdateBadge(u.id, e.target.value as BadgeType)}
                                            className={clsx(
                                                "bg-transparent border-0 font-black text-[8px] uppercase tracking-widest outline-none cursor-pointer appearance-none px-2 py-1 rounded-sm text-right",
                                                badgeColorMap[u.approvedBadge]
                                            )}
                                        >
                                            {['pink', 'red', 'green', 'blue'].map(b => (
                                                <option key={b} value={b} className="bg-white dark:bg-slate-900">{badgeNameMap[b]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Donations:</p>
                                        <span className="text-[10px] font-black text-slate-900 dark:text-white">{userDonationCounts[u.id] || 0}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button 
                                            onClick={() => handleUpdateBadge(u.id, null)}
                                            className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all"
                                        >
                                            <RotateCcw size={12} /> Pending
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateBadge(u.id, null)}
                                            className="px-2 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all"
                                        >
                                            <Trash2 size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const BadgeCard = ({ user, count, badge, currentBadge, onApprove, onSetBadge, onRemove, isPending }: { 
    user: User, 
    count: number, 
    badge: BadgeType | null | undefined, 
    currentBadge?: string, 
    onApprove?: () => void, 
    onSetBadge?: (b: BadgeType) => void, 
    onRemove?: () => void, 
    isPending?: boolean 
}) => {
    return (
        <Card className="p-3 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-md overflow-hidden flex items-center justify-center font-black text-slate-400 dark:text-slate-500">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Award size={22}/>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-black text-slate-900 dark:text-white truncate tracking-tight uppercase">{user.name}</h3>
                        {getBadgeData(user) && <BadgeCheck size={16} className={clsx(getBadgeData(user)?.color, "flex-shrink-0")} />}
                    </div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{user.email}</p>
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Donations</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">{count}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className={clsx("text-xs font-black uppercase tracking-tighter", user.approvedBadge ? "text-green-600" : "text-slate-400")}>
                            {user.approvedBadge ? `${badgeNameMap[user.approvedBadge]} Active` : 'No Badge'}
                        </p>
                    </div>
                </div>

                {isPending ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-600">
                            <div className="flex items-center gap-2">
                                <div className={clsx("p-1.5 rounded-lg", badge && badgeColorMap[badge].split(' ').slice(1).join(' '))}>
                                  <Trophy size={16} className={clsx(badge && badgeColorMap[badge].split(' ')[0])} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Eligible For</p>
                                    <p className={clsx("text-[10px] font-black uppercase tracking-widest", badge && badgeColorMap[badge].split(' ')[0])}>{badgeNameMap[badge]}</p>
                                </div>
                            </div>
                            <Button 
                                onClick={onApprove}
                                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-lg h-7 px-3 text-[9px] uppercase tracking-widest shadow-sm"
                            >
                                Approve
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                         <div className="flex flex-wrap gap-2">
                            {(['pink', 'red', 'green', 'blue'] as BadgeType[]).map(b => (
                                <button 
                                    key={b}
                                    onClick={() => onSetBadge?.(b)}
                                    className={clsx(
                                        "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                                        user.approvedBadge === b 
                                            ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white " + badgeColorMap[b]
                                            : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300"
                                    )}
                                >
                                    {badgeNameMap[b]}
                                </button>
                            ))}
                        </div>
                        {user.approvedBadge && (
                            <Button 
                                onClick={onRemove}
                                variant="outline"
                                className="w-full border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                                <Trash2 size={14} className="mr-2" /> Remove Badge
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

const Trophy = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 22V18" />
        <path d="M14 22V18" />
        <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
    </svg>
);
