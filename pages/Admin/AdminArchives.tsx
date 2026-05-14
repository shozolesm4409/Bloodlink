
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { 
  getDeletedUsers, restoreDeletedUser, permanentlyDeleteArchivedUser,
  getDeletedDonations, restoreDeletedDonation, permanentlyDeleteArchivedDonation,
  getDeletedFeedbacks, restoreDeletedFeedback, permanentlyDeleteArchivedFeedback,
  getDeletedNotices, restoreDeletedNotice, permanentlyDeleteArchivedNotice,
  getDeletedNews, restoreDeletedNews, permanentlyDeleteArchivedNews, purgeAllArchivedNews,                
  getDeletedHelpRequests, restoreDeletedHelpRequest, permanentlyDeleteArchivedHelpRequest,
  getDeletedLogs, restoreDeletedLog, permanentlyDeleteArchivedLog,
  getDeletedVerificationLogs, restoreDeletedVerificationLog, permanentlyDeleteArchivedVerificationLog,
  getDeletedFundExpenses, restoreDeletedFundExpense, permanentlyDeleteArchivedFundExpense,
  getDeletedFunding, restoreDeletedFunding, permanentlyDeleteArchivedFunding,
  purgeAllArchivedUsers, purgeAllArchivedDonations, purgeAllArchivedFeedbacks,
  purgeAllArchivedNotices, purgeAllArchivedHelpRequests, purgeAllArchivedLogs,
  purgeAllArchivedVerificationLogs, purgeAllArchivedFundExpenses, purgeAllArchivedFunding,
  getDeletedBloodRequests, restoreDeletedBloodRequest, permanentlyDeleteArchivedBloodRequest, purgeAllArchivedBloodRequests,
  getDeletedAds, restoreDeletedAd, permanentlyDeleteArchivedAd, purgeAllArchivedAds,
  getDeletedSystemAssets, restoreDeletedSystemAsset, permanentlyDeleteArchivedSystemAsset, purgeAllArchivedSystemAssets
} from '../../services/api';
import { Card, Button, Toast, useToast, ConfirmModal } from '../../components/UI';
import { 
  Trash2, RotateCcw, Clock, Archive, User as UserIcon, FileText, MessageSquare, 
  AlertCircle, Database, Megaphone, Activity, ClipboardList, Receipt, DollarSign, Droplet, ImageIcon
} from 'lucide-react';
import clsx from 'clsx';

export const AdminArchives = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<'USERS' | 'DONATIONS' | 'FUNDING' | 'FEEDBACKS' | 'NOTICES' | 'NEWS' | 'HELP' | 'LOGS' | 'VERIFICATION' | 'EXPENSES' | 'BLOOD_REQUESTS' | 'ADVERTISEMENTS' | 'ASSETS'>('USERS');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let data = [];
      switch(activeTab) {
        case 'USERS': data = await getDeletedUsers(); break;
        case 'DONATIONS': data = await getDeletedDonations(); break;
        case 'FEEDBACKS': data = await getDeletedFeedbacks(); break;
        case 'NOTICES': data = await getDeletedNotices(); break;
        case 'NEWS': data = await getDeletedNews(); break;
        case 'HELP': data = await getDeletedHelpRequests(); break;
        case 'LOGS': data = await getDeletedLogs(); break;
        case 'VERIFICATION': data = await getDeletedVerificationLogs(); break;
        case 'EXPENSES': data = await getDeletedFundExpenses(); break;
        case 'FUNDING': data = await getDeletedFunding(); break;
        case 'BLOOD_REQUESTS': data = await getDeletedBloodRequests(); break;
        case 'ADVERTISEMENTS': data = await getDeletedAds(); break;
        case 'ASSETS': data = await getDeletedSystemAssets(); break;
      }
      setItems(data);
    } catch (e) {
      showToast("Failed to fetch archives", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [activeTab]);

  const handleRestore = async (id: string) => {
    if (!user) return;
    try {
      switch(activeTab) {
        case 'USERS': await restoreDeletedUser(id, user); break;
        case 'DONATIONS': await restoreDeletedDonation(id, user); break;
        case 'FEEDBACKS': await restoreDeletedFeedback(id, user); break;
        case 'NOTICES': await restoreDeletedNotice(id, user); break;
        case 'NEWS': await restoreDeletedNews(id, user); break;
        case 'HELP': await restoreDeletedHelpRequest(id, user); break;
        case 'LOGS': await restoreDeletedLog(id, user); break;
        case 'VERIFICATION': await restoreDeletedVerificationLog(id, user); break;
        case 'EXPENSES': await restoreDeletedFundExpense(id, user); break;
        case 'FUNDING': await restoreDeletedFunding(id, user); break;
        case 'BLOOD_REQUESTS': await restoreDeletedBloodRequest(id, user); break;
        case 'ADVERTISEMENTS': await restoreDeletedAd(id, user); break;
        case 'ASSETS': await restoreDeletedSystemAsset(id, user); break;
      }
      showToast("Item restored successfully");
      fetchItems();
    } catch (e) {
      showToast("Restore failed", "error");
    }
  };

  const handlePermanentDelete = async () => {
    if (!user || !confirmId) return;
    setActionLoading(true);
    try {
      if (activeTab === 'USERS') await permanentlyDeleteArchivedUser(confirmId, user);
      else if (activeTab === 'DONATIONS') await permanentlyDeleteArchivedDonation(confirmId, user);
      else if (activeTab === 'FEEDBACKS') await permanentlyDeleteArchivedFeedback(confirmId, user);
      else if (activeTab === 'NOTICES') await permanentlyDeleteArchivedNotice(confirmId, user);
      else if (activeTab === 'NEWS') await permanentlyDeleteArchivedNews(confirmId, user);
      else if (activeTab === 'HELP') await permanentlyDeleteArchivedHelpRequest(confirmId, user);
      else if (activeTab === 'LOGS') await permanentlyDeleteArchivedLog(confirmId, user);
      else if (activeTab === 'VERIFICATION') await permanentlyDeleteArchivedVerificationLog(confirmId, user);
      else if (activeTab === 'EXPENSES') await permanentlyDeleteArchivedFundExpense(confirmId, user);
      else if (activeTab === 'FUNDING') await permanentlyDeleteArchivedFunding(confirmId, user);
      else if (activeTab === 'BLOOD_REQUESTS') await permanentlyDeleteArchivedBloodRequest(confirmId, user);
      else if (activeTab === 'ADVERTISEMENTS') await permanentlyDeleteArchivedAd(confirmId, user);
      else if (activeTab === 'ASSETS') await permanentlyDeleteArchivedSystemAsset(confirmId, user);
      
      showToast("Item permanently deleted");
      fetchItems();
      setConfirmId(null);
    } catch (e) {
      showToast("Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurgeAll = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      switch(activeTab) {
        case 'USERS': await purgeAllArchivedUsers(user); break;
        case 'DONATIONS': await purgeAllArchivedDonations(user); break;
        case 'FEEDBACKS': await purgeAllArchivedFeedbacks(user); break;
        case 'NOTICES': await purgeAllArchivedNotices(user); break;
        case 'NEWS': await purgeAllArchivedNews(user); break;
        case 'HELP': await purgeAllArchivedHelpRequests(user); break;
        case 'LOGS': await purgeAllArchivedLogs(user); break;
        case 'VERIFICATION': await purgeAllArchivedVerificationLogs(user); break;
        case 'EXPENSES': await purgeAllArchivedFundExpenses(user); break;
        case 'FUNDING': await purgeAllArchivedFunding(user); break;
        case 'BLOOD_REQUESTS': await purgeAllArchivedBloodRequests(user); break;
        case 'ADVERTISEMENTS': await purgeAllArchivedAds(user); break;
        case 'ASSETS': await purgeAllArchivedSystemAssets(user); break;
      }
      showToast(`All archived ${activeTab.toLowerCase()} purged`);
      fetchItems();
      setConfirmAll(false);
    } catch (e) {
      showToast("Purge failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const TabButton = ({ tab, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={clsx(
        "flex items-center gap-2.5 px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all lg:w-full text-left group shrink-0 whitespace-nowrap lg:whitespace-normal",
        activeTab === tab 
          ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 shadow-sm" 
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200"
      )}
    >
      <Icon size={16} className={clsx(
        "transition-colors",
        activeTab === tab ? "text-red-600 dark:text-red-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
      )} /> 
      <span className="truncate">{label}</span>
      {activeTab === tab && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>}
    </button>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 transition-colors">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handlePermanentDelete} title="Permanently Delete?" message="This action cannot be undone. The record will be wiped from the database." isLoading={actionLoading} />
      <ConfirmModal isOpen={confirmAll} onClose={() => setConfirmAll(false)} onConfirm={handlePurgeAll} title={`Purge All Archived ${activeTab}?`} message="This will permanently delete EVERY record in this archive tab. This action is irreversible!" isLoading={actionLoading} />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">System Archives</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">Recover or purge deleted records.</p>
        </div>
        {items.length > 0 && (
          <Button onClick={() => setConfirmAll(true)} className="bg-red-600 hover:bg-red-700 text-white rounded-sm shadow-xl shadow-red-100 dark:shadow-red-900/20 text-xs font-black px-6">
            <Trash2 size={16} className="mr-2" /> ALL DELETE
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sub Menu Sidebar */}
        <div className="w-full lg:w-52 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm sticky top-4">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Archives Menu</h3>
            </div>
            <div className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-x-visible pb-1.5 lg:pb-0 custom-scrollbar">
              <TabButton tab="USERS" label="Users" icon={UserIcon} />
              <TabButton tab="DONATIONS" label="Donations" icon={Droplet} />
              <TabButton tab="FUNDING" label="Funding" icon={DollarSign} />
              <TabButton tab="BLOOD_REQUESTS" label="Req Donors" icon={Droplet} />
              <TabButton tab="FEEDBACKS" label="Feedback" icon={MessageSquare} />
              <TabButton tab="NOTICES" label="Notices" icon={Megaphone} />
              <TabButton tab="NEWS" label="News" icon={FileText} />
              <TabButton tab="ADVERTISEMENTS" label="Adds" icon={Megaphone} />
              <TabButton tab="ASSETS" label="Assets" icon={ImageIcon} />
              <TabButton tab="HELP" label="Help Desk" icon={AlertCircle} />
              <TabButton tab="LOGS" label="Audit Logs" icon={Activity} />
              <TabButton tab="VERIFICATION" label="Verification" icon={ClipboardList} />
              <TabButton tab="EXPENSES" label="Expenses" icon={Receipt} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {loading ? (
            <div className="p-20 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800">
              Scanning Archives...
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                  <tr>
                    <th className="px-1 py-1">Record Info</th>
                    <th className="px-1 py-1">Deleted By</th>
                    <th className="px-1 py-1">Deleted At</th>
                    <th className="px-1 py-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-1 py-1">
                        <div className="font-bold text-slate-700 dark:text-slate-300 transition-colors text-xs">
                          {activeTab === 'USERS' && item.name}
                          {activeTab === 'DONATIONS' && `Donation: ${item.userName} (${item.units}ml)`}
                          {activeTab === 'FEEDBACKS' && `Feedback: "${item.message?.substring(0,30)}..."`}
                          {activeTab === 'NOTICES' && item.subject}
                          {activeTab === 'NEWS' && item.subject}
                          {activeTab === 'HELP' && `Help: ${item.name} (${item.phone})`}
                          {activeTab === 'LOGS' && `Log: ${item.action}`}
                          {activeTab === 'VERIFICATION' && `Verification: ${item.memberName}`}
                          {activeTab === 'EXPENSES' && `Expense: ${item.purpose} (৳${item.amount})`}
                          {activeTab === 'FUNDING' && `Funding: ${item.userName} (৳${item.amount})`}
                          {activeTab === 'BLOOD_REQUESTS' && `Blood Req: ${item.requesterName} (${item.bloodGroup})`}
                          {activeTab === 'ADVERTISEMENTS' && `Ad: ${item.title}`}
                          {activeTab === 'ASSETS' && `Asset: ${item.name} (${item.originalCollection})`}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono mt-1 transition-colors">ID: {item.id}</div>
                      </td>
                      <td className="px-1 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 transition-colors">{item.deletedBy || 'Unknown'}</td>
                      <td className="px-1 py-1 text-slate-400 dark:text-slate-500 text-[10px] font-bold transition-colors">
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="opacity-50" />
                           {new Date(item.deletedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-1 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleRestore(item.id)} className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="Restore"><RotateCcw size={14}/></button>
                          <button onClick={() => setConfirmId(item.id)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all rounded-lg shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="Purge"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.2em] italic">No {activeTab === 'USERS' ? 'User' : activeTab === 'DONATIONS' ? 'Blood Donation' : activeTab === 'FUNDING' ? 'Funding' : activeTab === 'FEEDBACKS' ? 'Feedback' : activeTab === 'NOTICES' ? 'Notices' : activeTab === 'HELP' ? 'Help Desk' : activeTab === 'LOGS' ? 'Audit Logs' : activeTab === 'VERIFICATION' ? 'Verification' : activeTab === 'BLOOD_REQUESTS' ? 'Blood Request' : activeTab === 'ADVERTISEMENTS' ? 'Advertisement' : 'Found Expenses'} archives found</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {items.map(item => (
              <Card key={item.id} className="p-6 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-sm relative overflow-hidden transition-colors border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-black text-slate-800 dark:text-white text-lg mb-1 transition-colors">
                      {activeTab === 'USERS' && item.name}
                      {activeTab === 'DONATIONS' && `Donation from ${item.userName}`}
                      {activeTab === 'FEEDBACKS' && "Feedback Entry"}
                      {activeTab === 'NOTICES' && item.subject}
                      {activeTab === 'NEWS' && item.subject}
                      {activeTab === 'HELP' && item.name}
                      {activeTab === 'LOGS' && item.action}
                      {activeTab === 'VERIFICATION' && `Verification: ${item.memberName}`}
                      {activeTab === 'EXPENSES' && item.purpose}
                      {activeTab === 'FUNDING' && item.userName}
                      {activeTab === 'BLOOD_REQUESTS' && `Request by ${item.requesterName}`}
                      {activeTab === 'ADVERTISEMENTS' && item.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">
                      {activeTab === 'USERS' && item.role}
                      {activeTab === 'DONATIONS' && `${item.units}ml • ${item.userBloodGroup}`}
                      {activeTab === 'FEEDBACKS' && `"${item.message?.substring(0, 50)}..."`}
                      {activeTab === 'NOTICES' && `Type: ${item.type}`}
                      {activeTab === 'NEWS' && `Details: ${item.details?.replace(/<[^>]*>?/gm, '').substring(0, 50)}...`}
                      {activeTab === 'HELP' && item.phone}
                      {activeTab === 'LOGS' && item.details}
                      {activeTab === 'VERIFICATION' && `ID: ${item.memberId}`}
                      {activeTab === 'EXPENSES' && `৳${item.amount} • ${item.addedBy?.name}`}
                      {activeTab === 'FUNDING' && `৳${item.amount} • ${item.paymentMethod}`}
                      {activeTab === 'BLOOD_REQUESTS' && `${item.bloodGroup} • ${item.location}`}
                      {activeTab === 'ADVERTISEMENTS' && `${item.url}`}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
                    {activeTab === 'USERS' && <UserIcon size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'DONATIONS' && <Droplet size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'FUNDING' && <DollarSign size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'FEEDBACKS' && <MessageSquare size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'NOTICES' && <Megaphone size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'NEWS' && <FileText size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'HELP' && <AlertCircle size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'LOGS' && <Activity size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'VERIFICATION' && <ClipboardList size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'EXPENSES' && <Receipt size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'BLOOD_REQUESTS' && <Droplet size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'ADVERTISEMENTS' && <Megaphone size={20} className="text-slate-400 dark:text-slate-500" />}
                    {activeTab === 'ASSETS' && <ImageIcon size={20} className="text-slate-400 dark:text-slate-500" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                   <div className="flex-1">
                      <span className="block text-[8px] text-slate-300 dark:text-slate-600 mb-0.5">Deleted By</span>
                      {item.deletedBy || 'System'}
                   </div>
                   <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                   <div className="flex-1 text-right">
                      <span className="block text-[8px] text-slate-300 dark:text-slate-600 mb-0.5">Deleted At</span>
                      {new Date(item.deletedAt).toLocaleDateString()}
                   </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleRestore(item.id)} 
                    className="flex-1 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} /> Restore
                  </button>
                  <button 
                    onClick={() => setConfirmId(item.id)} 
                    className="flex-1 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Purge
                  </button>
                </div>
              </Card>
            ))}
            {items.length === 0 && (
              <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-sm border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
                <Archive size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-xs">No {activeTab === 'USERS' ? 'User' : activeTab === 'DONATIONS' ? 'Blood Donation' : activeTab === 'FUNDING' ? 'Funding' : activeTab === 'FEEDBACKS' ? 'Feedback' : activeTab === 'NOTICES' ? 'Notices' : activeTab === 'NEWS' ? 'News' : activeTab === 'HELP' ? 'Help Desk' : activeTab === 'LOGS' ? 'Audit Logs' : activeTab === 'VERIFICATION' ? 'Verification' : activeTab === 'BLOOD_REQUESTS' ? 'Blood Request' : activeTab === 'ADVERTISEMENTS' ? 'Advertisement' : 'Found Expenses'} archives found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
</div>
  );
};
