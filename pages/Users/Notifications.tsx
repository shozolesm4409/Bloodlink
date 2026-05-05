import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI';
import { useAuth } from '../../AuthContext';
import { subscribeToNotices, getUsers, ADMIN_EMAIL, subscribeToBloodRequests, subscribeToUserNotifications } from '../../services/api';
import { Notice, User, UserRole, NoticeType, BloodRequest, UserNotification } from '../../types';
import { BadgeCheck, Bell, ShieldCheck, User as UserIcon, Droplet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BADGE_COLOR_MAP } from '../../constants';

export const UserNotifications = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  const [readNotices, setReadNotices] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('readNotices');
      if (stored) {
        setReadNotices(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse readNotices', e);
    }
    
    getUsers().then(setUsers);
    
    const unsubscribeNotices = subscribeToNotices((data) => setNotices(data));
    const unsubscribeBloodRequests = subscribeToBloodRequests((data) => setBloodRequests(data));
    let unsubscribeUserNotices = () => {};
    if (user) {
      unsubscribeUserNotices = subscribeToUserNotifications(user.id, (data) => setUserNotifications(data));
    }
    
    return () => {
      unsubscribeNotices();
      unsubscribeBloodRequests();
      unsubscribeUserNotices();
    };
  }, [user]);

  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN || (user?.email || '').trim().toLowerCase() === ADMIN_EMAIL;

  const relevantNotices = notices.filter(n => {
    if (readNotices.includes(n.id)) return false;
    if (n.type === NoticeType.WEB) return true;
    if (n.type === NoticeType.PUBLIC) return true;
    if (n.type === NoticeType.PRIVATE) return isStaff;
    return false;
  }).map(n => ({ ...n, itemType: 'NOTICE' as const }));

  const relevantBloodRequests = bloodRequests.filter(br => {
    if (readNotices.includes(br.id)) return false;
    if (br.requesterId === user?.id) return false;
    
    // Check if user has already accepted
    const hasAccepted = br.acceptedBy?.some(a => a.userId === user?.id);
    if (hasAccepted) return false;
    
    // Check matching blood group
    if (br.bloodGroup !== user?.bloodGroup) return false;
    
    // Check location matching loosely
    const brLoc = br.location.toLowerCase();
    const uLoc = (user?.location || '').toLowerCase();
    if (!brLoc.includes(uLoc) && !uLoc.includes(brLoc) && brLoc !== uLoc) {
       return false;
    }
    
    return true;
  }).map(br => ({ ...br, itemType: 'BLOOD_REQUEST' as const }));

  const relevantUserNotifications = userNotifications.filter(n => !readNotices.includes(n.id))
    .map(n => ({ ...n, itemType: 'USER_NOTIFICATION' as const }));

  const allNotifications = [...relevantNotices, ...relevantBloodRequests, ...relevantUserNotifications]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleNoticeClick = (id: string, type: string, noticeType?: string) => {
    const updatedReadNotices = [...readNotices, id];
    setReadNotices(updatedReadNotices);
    localStorage.setItem('readNotices', JSON.stringify(updatedReadNotices));
    
    if (type === 'NOTICE') {
      navigate('/notices', { state: { viewNoticeId: id, tab: noticeType } });
    } else if (type === 'BLOOD_REQUEST') {
      navigate('/requested-donor');
    }
  };

  return (
    <div className="w-full px-4 lg:px-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Bell size={24} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Updates and notices</p>
        </div>
      </div>

      <div className="space-y-3">
        {allNotifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">No notifications available.</div>
        ) : (
          allNotifications.map((item) => {
            if (item.itemType === 'NOTICE') {
              const n = item as (Notice & { itemType: 'NOTICE' });
              const author = users.find(u => u.id === n.authorId);
              return (
                <Card 
                  key={n.id} 
                  onClick={() => handleNoticeClick(n.id, 'NOTICE', n.type)}
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                      {author?.avatar ? <img src={author.avatar} alt="avatar" className="w-full h-full object-cover" /> : <UserIcon className="p-2 text-slate-300 dark:text-slate-600 w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                          {n.authorName}
                          {author?.role === UserRole.SUPERADMIN ? (
                             <ShieldCheck size={14} className={BADGE_COLOR_MAP['blue']} />
                          ) : author?.role === UserRole.ADMIN ? (
                             <ShieldCheck size={14} className={BADGE_COLOR_MAP['green']} />
                          ) : author?.role === UserRole.EDITOR ? (
                             <ShieldCheck size={14} className={BADGE_COLOR_MAP['red']} />
                          ) : author?.approvedBadge ? (
                             <ShieldCheck size={14} className={BADGE_COLOR_MAP[author.approvedBadge] || 'text-slate-400'} />
                          ) : null}
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          BOARD NOTICE
                        </span>
                        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
                          {new Date(n.timestamp).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{n.subject}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 break-all" dangerouslySetInnerHTML={{ __html: n.details.replace(/<[^>]+>/g, ' ') }}></p>
                    </div>
                  </div>
                </Card>
              );
            } else if (item.itemType === 'USER_NOTIFICATION') {
              const n = item as (UserNotification & { itemType: 'USER_NOTIFICATION' });
              return (
                <Card 
                  key={n.id} 
                  onClick={() => handleNoticeClick(n.id, 'USER_NOTIFICATION')}
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-blue-100 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-900/5"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      <Bell size={20} />
                      {n.type === 'BADGE_APPROVED' && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                          <BadgeCheck size={14} className={(users.find(u => u.id === n.userId)?.approvedBadge && BADGE_COLOR_MAP[users.find(u => u.id === n.userId)!.approvedBadge!]) || "text-slate-400"} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {n.title}
                        </span>
                        {n.type === 'BADGE_APPROVED' && (
                          <BadgeCheck 
                            size={16} 
                            className={
                              (users.find(u => u.id === n.userId)?.approvedBadge && 
                              BADGE_COLOR_MAP[users.find(u => u.id === n.userId)!.approvedBadge!]) 
                              || "text-slate-400"
                            } 
                          />
                        )}
                        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
                          {new Date(n.timestamp).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                    </div>
                  </div>
                </Card>
              );
            } else {
              const br = item as (BloodRequest & { itemType: 'BLOOD_REQUEST' });
              return (
                <Card 
                  key={br.id} 
                  onClick={() => handleNoticeClick(br.id, 'BLOOD_REQUEST')}
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <Droplet size={20} className="fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Blood Request
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          {br.bloodGroup}
                        </span>
                        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
                          {new Date(br.timestamp).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{br.requesterName} needs blood at {br.location}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 truncate">Tap to accept request</p>
                    </div>
                  </div>
                </Card>
              );
            }
          })
        )}
      </div>
    </div>
  );
};
