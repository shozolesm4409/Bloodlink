
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { 
  requestSupportAccess, 
  sendMessage, 
  subscribeToRoomMessages, 
  subscribeToAllSupportRooms, 
  subscribeToAllIncomingMessages, 
  markMessagesAsRead,
  getUsers,
  getAppPermissions,
  setTypingStatus,
  subscribeToTypingStatus
} from '../../services/api';
import { getSmartReplies } from '../../services/geminiService';
import { Card, Button, Input, Badge, Toast, useToast } from '../../components/UI';
import { 
  LifeBuoy, Lock, BookOpen, MessageSquare, PhoneCall, HelpCircle, 
  CheckCircle, Send, ArrowLeft, Search, User as UserIcon, 
  AlertCircle, ArrowRight, ShieldAlert, Paperclip, Smile, 
  MoreHorizontal, MessageCircle, X, Share2, Facebook, Twitter, 
  Instagram, Linkedin, Youtube, Github, Globe2, ExternalLink,
  Filter, UserPlus, Zap
} from 'lucide-react';
import { ChatMessage, UserRole, User, AppPermissions, SocialMediaLink } from '../../types';
import { useSettings } from '../../SettingsContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { SocialHubView } from './SupportViews/SocialHubView';
import { MessengerDirectory } from './SupportViews/MessengerDirectory';
import { HelpCenterView } from './SupportViews/HelpCenterView';



const EMOJIS = ['❤️', '🩸', '🙏', '😊', '👍', '💪', '🏥', '🚑', '💉', '🙌', '✨', '🔥', '🤝', '👋', '🌟', '💝'];

export const SupportCenter = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { socialMediaConfig } = useSettings();
  const { toastState, showToast, hideToast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  
  const [activeView, setActiveView] = useState<'hub' | 'system-list' | 'system-chat' | 'user-list' | 'private-chat' | 'social-hub'>('hub');
  
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{userId: string, userName: string}[]>([]);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [supportRooms, setSupportRooms] = useState<Record<string, { user: User, lastMsg: string, timestamp: string, unread: number }>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAppPermissions().then(setPerms);
    if (user) {
      getUsers().then(users => {
        setAllUsers(users);
      }).catch(() => {});
      
      const isStaffUser = user.role === UserRole.ADMIN || user.role === UserRole.EDITOR || user.role === UserRole.SUPERADMIN;
      const unsubscribeUnread = subscribeToAllIncomingMessages(user.id, isStaffUser, (msgs) => {
        const counts: Record<string, number> = {};
        msgs.forEach(m => {
          if (m.roomId.startsWith('SUPPORT_')) {
            if (user.role === UserRole.USER) {
              const key = 'SYSTEM';
              counts[key] = (counts[key] || 0) + 1;
            } else {
              // For staff, differentiate support from private for same user
              const key = `SUPPORT_${m.senderId}`;
              counts[key] = (counts[key] || 0) + 1;
              // Also keep track of total SYSTEM unreads for the hub card
              counts['SYSTEM'] = (counts['SYSTEM'] || 0) + 1;
            }
          } else {
            // Private message
            counts[m.senderId] = (counts[m.senderId] || 0) + 1;
          }
        });
        setUnreadCounts(counts);
      }, (err) => {
        console.debug("Unread incoming subscription restricted:", err.message);
      });
      
      return () => unsubscribeUnread();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN) {
      const unsubscribeRooms = subscribeToAllSupportRooms((msgs) => {
        // Fix: Explicitly type the temporary rooms record to avoid 'unknown' errors
        const rooms: Record<string, { user: User, lastMsg: string, timestamp: string, unread: number }> = {};
        msgs.forEach(m => {
          if (m.roomId.startsWith('SUPPORT_')) {
            const userId = m.roomId.replace('SUPPORT_', '');
            const targetUser = allUsers.find(u => u.id === userId);
            if (targetUser) {
              // Fix: Added null checks and typed access for timestamp comparison
              if (!rooms[userId] || m.timestamp > rooms[userId].timestamp) {
                rooms[userId] = {
                  user: targetUser,
                  lastMsg: m.text,
                  timestamp: m.timestamp,
                  unread: 0
                };
              }
            }
          }
        });
        setSupportRooms(prev => {
          // Fix: Correctly update state with new rooms while preserving unread counts
          Object.keys(rooms).forEach(id => {
            if (prev[id]) rooms[id].unread = prev[id].unread;
          });
          return rooms;
        });
      }, (err) => {
        console.debug("Support rooms subscription restricted:", err.message);
      });
      return () => unsubscribeRooms();
    }
  }, [allUsers, user]);

  useEffect(() => {
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.EDITOR || user.role === UserRole.SUPERADMIN)) {
      const unsubscribeUnreads = subscribeToAllIncomingMessages(user.id, true, (unreads) => {
        setSupportRooms(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(uid => {
            // Fix: Cast updated[uid] or use any to allow spreading when inferred as unknown
            const existing = updated[uid];
            if (existing) {
              updated[uid] = {
                ...existing,
                unread: unreads.filter(m => m.senderId === uid && m.roomId.startsWith('SUPPORT_')).length
              };
            }
          });
          return updated;
        });
      }, (err) => {
        console.debug("Admin thread counts restricted:", err.message);
      });
      return () => unsubscribeUnreads();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setPermissionError(null);
    let unsubscribe: () => void = () => {};

    const handleError = (err: any) => {
      if (err.code === 'permission-denied') {
        setPermissionError("Access denied by security policy. Verification required.");
      }
    };

    // Helper to determine the correct receiver ID to mark as read based on context
    // If I'm Admin in Support Chat, I read messages sent to 'SYSTEM'.
    // If I'm User in Support Chat, I read messages sent to ME (from Admin).
    // If I'm in Private Chat, I read messages sent to ME.
    const isStaffUser = user.role === UserRole.ADMIN || user.role === UserRole.EDITOR || user.role === UserRole.SUPERADMIN;
    const myReceiverId = (activeView === 'system-chat' && isStaffUser) ? 'SYSTEM' : user.id;

    const attemptMarkRead = (rid: string, targetUid?: string) => {
       markMessagesAsRead(rid, myReceiverId).catch((err) => console.error("Mark read failed:", err));
       if (targetUid) {
         setUnreadCounts(prev => ({ ...prev, [targetUid]: 0 }));
       }
    };

    if (activeView === 'system-chat') {
      const targetRoomId = user.role === UserRole.USER ? `SUPPORT_${user.id}` : `SUPPORT_${selectedRecipient?.id}`;
      
      unsubscribe = subscribeToRoomMessages(targetRoomId, (msgs) => {
        setMessages(msgs);
        // Real-time check: If there are unread messages for ME while chat is open, mark read immediately
        const hasUnread = msgs.some(m => !m.read && m.receiverId === myReceiverId);
        if (hasUnread) {
           attemptMarkRead(targetRoomId, selectedRecipient?.id);
        }
      }, handleError);

      // Initial read check on open
      if (selectedRecipient || user.role === UserRole.USER) {
        attemptMarkRead(targetRoomId, selectedRecipient?.id);
      }

    } else if (activeView === 'private-chat' && selectedRecipient) {
      const roomId = [user.id, selectedRecipient.id].sort().join('_');
      
      unsubscribe = subscribeToRoomMessages(roomId, (msgs) => {
        setMessages(msgs);
        // Real-time check for private chat
        const hasUnread = msgs.some(m => !m.read && m.receiverId === user.id);
        if (hasUnread) {
           attemptMarkRead(roomId, selectedRecipient.id);
        }
      }, handleError);

      // Initial read check on open
      attemptMarkRead(roomId, selectedRecipient.id);
    }

    return () => unsubscribe();
  }, [activeView, selectedRecipient, user]);

  // Typing status effect
  useEffect(() => {
    if (!user || !selectedRecipient) return;
    
    let roomId = '';
    if (activeView === 'system-chat') {
       roomId = user.role === UserRole.USER ? `SUPPORT_${user.id}` : `SUPPORT_${selectedRecipient.id}`;
    } else if (activeView === 'private-chat') {
       roomId = [user.id, selectedRecipient.id].sort().join('_');
    }
    
    if (!roomId) return;

    // Track isTyping with setTypingStatus
    setTypingStatus(roomId, user.id, user.name, isTyping).catch(() => {});
    
    // Subscribe to others typing
    const unsubscribe = subscribeToTypingStatus(roomId, (users) => {
      setTypingUsers(users.filter(u => u.userId !== user.id));
    });

    return () => {
      unsubscribe();
      // Reset typing on unmount/room change
      setTypingStatus(roomId, user.id, user.name, false);
    };
  }, [isTyping, user, selectedRecipient, activeView]);

  // Smart Replies effect
  useEffect(() => {
    if (activeView === 'private-chat' || activeView === 'system-chat') {
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        // Only fetch if last message is from someone else
        if (lastMsg.senderId !== user?.id) {
          setIsAiLoading(true);
          getSmartReplies(messages, user?.name || 'User')
            .then(setSmartReplies)
            .finally(() => setIsAiLoading(false));
        } else {
          setSmartReplies([]);
        }
      }
    } else {
      setSmartReplies([]);
    }
  }, [messages.length, activeView, user]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  useEffect(() => {
    if (activeView === 'system-chat' || activeView === 'private-chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeView]);

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await requestSupportAccess(user);
      updateUser({ ...user, supportAccessRequested: true });
      showToast("Access requested successfully.");
    } catch (e) {
      showToast("Request failed.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const hasAccess = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN || user?.hasSupportAccess;

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500 transition-colors">
        <Toast {...toastState} onClose={hideToast} />
        <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-sm flex items-center justify-center mx-auto shadow-inner transition-colors">
            <Lock size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Support Center Locked</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-colors">
              সাপোর্ট সেন্টার এবং মেসেঞ্জার শুধুমাত্র ভেরিফাইড ইউজারদের জন্য। এ্যাডমিনের সাথে যোগাযোগ করতে এক্সেস রিকোয়েস্ট পাঠান।
            </p>
          </div>
          
          {user?.supportAccessRequested ? (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-2xl flex items-center justify-center gap-3 border border-yellow-100 dark:border-yellow-900/30 font-black uppercase tracking-widest text-xs transition-colors">
              <ShieldAlert size={18} /> Request Pending Approval
            </div>
          ) : (
            <Button onClick={handleRequestAccess} isLoading={isRequesting} className="w-full py-5 rounded-2xl text-lg shadow-xl shadow-blue-100 dark:shadow-none bg-blue-600 hover:bg-blue-700">
              Request Access to Support
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.role === UserRole.SUPERADMIN;

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>, overrideText?: string) => {
    e.preventDefault();
    const textToSend = overrideText || newMessage;
    if (!user || !textToSend.trim() || isSending) return;

    setIsSending(true);
    let roomId = '';
    let receiverId = '';

    if (activeView === 'system-chat') {
      if (user.role === UserRole.USER) {
        roomId = `SUPPORT_${user.id}`;
        receiverId = 'SYSTEM';
      } else if (selectedRecipient) {
        roomId = `SUPPORT_${selectedRecipient.id}`;
        receiverId = selectedRecipient.id;
      }
    } else if (activeView === 'private-chat' && selectedRecipient) {
      roomId = [user.id, selectedRecipient.id].sort().join('_');
      receiverId = selectedRecipient.id;
    }

    const msg = {
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar || '',
      receiverId,
      roomId,
      text: textToSend,
      isAdminReply: isStaff
    };

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: any = {
      ...msg,
      id: tempId,
      timestamp: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await sendMessage(msg);
      if (!overrideText) setNewMessage('');
      setIsTyping(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
    } catch (e: any) {
      showToast("Message could not be sent.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleBackNavigation = () => {
    if (activeView === 'private-chat') {
      setActiveView('user-list');
      setSelectedRecipient(null);
    } else if (activeView === 'system-chat' && isStaff) {
      setActiveView('system-list');
      setSelectedRecipient(null);
    } else {
      setActiveView('hub');
      setSelectedRecipient(null);
    }
    setPermissionError(null);
  };

  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(threadSearchQuery.toLowerCase()) ||
    m.senderName.toLowerCase().includes(threadSearchQuery.toLowerCase())
  );

  const renderChat = (title: string, icon: any, targetUser?: User) => (
    <div className="h-[calc(100vh-140px)] flex gap-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Desktop Sidebar (Users/Active Threads) */}
      <div className={clsx(
        "hidden lg:flex w-80 flex-col bg-white dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800 shadow-sm transition-all overflow-hidden",
        !showSidebar && "lg:w-0 lg:opacity-0 lg:pointer-events-none"
      )}>
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between mb-4">
             <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-[10px]">Active Threads</h2>
             <button onClick={() => setActiveView('user-list')} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-blue-600 transition-colors">
               <UserPlus size={16} />
             </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={14} />
            <input 
              type="text" 
              placeholder="Search by name or blood group..."
              value={sidebarSearchQuery}
              onChange={(e) => setSidebarSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {activeView === 'private-chat' && allUsers.filter(u => 
            u.id !== user?.id &&
            (u.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) || 
             u.bloodGroup?.toLowerCase().includes(sidebarSearchQuery.toLowerCase()))
          ).map(u => (
            <button 
              key={u.id}
              onClick={() => { setSelectedRecipient(u); }}
              className={clsx(
                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                targetUser?.id === u.id ? "bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden">
                   {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-300 dark:text-slate-600" />}
                </div>
                {unreadCounts[u.id] > 0 && targetUser?.id !== u.id && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[8px] font-black">{unreadCounts[u.id]}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className={clsx("font-black text-xs truncate transition-colors", targetUser?.id === u.id ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>{u.name}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{u.location || 'BloodLink User'}</p>
              </div>
            </button>
          ))}

          {activeView === 'system-chat' && isStaff && Object.values(supportRooms).filter(r => 
            r.user.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
          ).map(({ user: su, unread }) => (
            <button 
              key={su.id}
              onClick={() => { setSelectedRecipient(su); setActiveView('system-chat'); }}
              className={clsx(
                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                targetUser?.id === su.id ? "bg-red-50 dark:bg-red-900/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden">
                   {su.avatar ? <img src={su.avatar} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-300 dark:text-slate-600" />}
                </div>
                {unread > 0 && targetUser?.id !== su.id && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-black">{unread}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className={clsx("font-black text-xs truncate transition-colors", targetUser?.id === su.id ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200")}>{su.name}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">Support request</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 lg:p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-4 transition-colors">
          <div className="flex items-center gap-2 lg:gap-4 truncate">
              <button onClick={handleBackNavigation} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors lg:hidden">
                <ArrowLeft size={20} className="text-slate-400" />
              </button>
              <button onClick={() => setShowSidebar(!showSidebar)} className="hidden lg:flex p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                <MessageSquare size={20} className={clsx(showSidebar ? "text-blue-600" : "text-slate-400")} />
              </button>
              <div className="flex items-center gap-3 truncate">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-md transition-colors">
                    {targetUser?.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" /> : React.createElement(icon, { size: 24, className: "text-blue-600 dark:text-blue-400" })}
                  </div>
                  {typingUsers.length > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                  )}
                </div>
                <div className="min-w-0 pr-4">
                  <h1 className="text-sm lg:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none truncate transition-colors">{title}</h1>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {typingUsers.length > 0 ? (
                      <p className="text-[8px] lg:text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Typing...</p>
                    ) : (
                      <p className="text-[8px] lg:text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Secure Connection
                      </p>
                    )}
                  </div>
                </div>
              </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex relative group mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 focus-within:text-blue-500" size={14} />
              <input 
                type="text" 
                placeholder="Search messages..."
                value={threadSearchQuery}
                onChange={(e) => setThreadSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/30 rounded-full text-[10px] font-bold outline-none w-32 focus:w-48 transition-all"
              />
            </div>
            <button className="p-2 lg:p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-300 dark:text-slate-700">
                <PhoneCall size={18} />
            </button>
            <button className="p-2 lg:p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-300 dark:text-slate-700">
                <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col border-0 shadow-2xl overflow-hidden rounded-sm bg-white dark:bg-slate-900 relative transition-colors border border-slate-100 dark:border-slate-800">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
          
          {(!targetUser && activeView === 'private-chat') ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center opacity-40">
              <MessageSquare size={64} className="mb-4 text-slate-300 dark:text-slate-600" />
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">Select a Conversation</h2>
              <p className="font-medium text-slate-500 max-w-sm mt-2">Choose someone from the active threads or search the directory to start messaging.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar relative z-10">
                  <AnimatePresence initial={false}>
                    {filteredMessages.map((msg, idx) => {
                      const isNewDate = idx === 0 || new Date(msg.timestamp).toDateString() !== new Date(filteredMessages[idx-1].timestamp).toDateString();
                      
                      return (
                        <React.Fragment key={msg.id}>
                      {isNewDate && (
                        <div className="flex justify-center my-8">
                          <span className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-700 transition-colors">
                            {new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={clsx("flex flex-col group", msg.senderId === user?.id ? "items-end" : "items-start")}
                      >
                        <div className={clsx(
                          "max-w-[85%] lg:max-w-[70%] p-4 rounded-[2rem] text-sm font-medium shadow-sm transition-all duration-300 relative group",
                          msg.senderId === user?.id 
                            ? "bg-blue-600 text-white rounded-br-none shadow-blue-200 dark:shadow-none" 
                            : (msg.isAdminReply 
                                ? "bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 rounded-bl-none border border-red-100 dark:border-red-900/50" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700")
                        )}>
                          {msg.senderId !== user?.id && (
                            <p className="text-[9px] font-black uppercase opacity-60 mb-1.5 flex items-center gap-1.5">
                              {msg.senderName} {msg.isAdminReply && <Badge color="red" className="text-[7px] py-0 px-1 border border-red-200 dark:border-red-900/50">STAFF</Badge>}
                            </p>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          
                          {/* Message Read Status/Tick */}
                          {msg.senderId === user?.id && (
                            <div className="absolute -bottom-5 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider">{msg.read ? 'Seen' : 'Delivered'}</span>
                              <div className={clsx("w-2.5 h-2.5 rounded-full flex items-center justify-center", msg.read ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400")}>
                                <CheckCircle size={8} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 px-2">
                          <span className="text-[8px] lg:text-[9px] text-slate-400 dark:text-slate-600 font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
              
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-bl-none animate-pulse">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{typingUsers[0].userName} is typing</span>
                </div>
              )}
              <div ref={chatEndRef} />
          </div>
          
          <div className="px-4 lg:px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative z-20 transition-colors">
            {/* Smart Replies */}
            <AnimatePresence>
               {(smartReplies.length > 0 || isAiLoading) && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="flex gap-2 overflow-x-auto pb-4 no-scrollbar items-center"
                 >
                   <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                     <Zap size={14} className={clsx(isAiLoading && "animate-pulse")} />
                   </div>
                   {isAiLoading ? (
                     <div className="flex gap-2">
                       {[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-full"></div>)}
                     </div>
                   ) : (
                     smartReplies.map((reply, i) => (
                       <button 
                         key={i} 
                         onClick={() => handleSendMessage({ preventDefault: () => {}, target: { value: reply } } as any, reply)}
                         className="shrink-0 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap"
                       >
                         {reply}
                       </button>
                     ))
                   )}
                 </motion.div>
               )}
            </AnimatePresence>

            {showEmojiPicker && (
              <div ref={emojiRef} className="absolute bottom-full left-4 lg:left-6 mb-2 p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_10px_50px_-10px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 z-[100] animate-in slide-in-from-bottom-2 duration-200">
                <div className="grid grid-cols-4 gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => addEmoji(e)} className="w-10 h-10 text-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">{e}</button>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 lg:gap-4 bg-slate-50 dark:bg-slate-800 p-1 lg:p-2 rounded-sm border border-slate-100 dark:border-slate-700 shadow-inner group transition-colors">
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={clsx("p-2 lg:p-3 transition-colors", showEmojiPicker ? "text-blue-600" : "text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400")}><Smile size={22}/></button>
              <button type="button" className="p-2 lg:p-3 text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden sm:block"><Paperclip size={18}/></button>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-transparent border-0 px-2 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors"
                disabled={isSending || !!permissionError}
              />
              <button 
                type="submit" 
                disabled={isSending || !newMessage.trim() || !!permissionError}
                className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl dark:shadow-none disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
          </>
          )}
        </Card>
      </div>
    </div>
  );

  if (activeView === 'system-list' && isStaff) {
    // Fix: Cast the room list mapping results to avoid 'unknown' errors in components
    const roomList = (Object.entries(supportRooms) as [string, { user: User, lastMsg: string, timestamp: string, unread: number }][]).sort((a,b) => b[1].timestamp.localeCompare(a[1].timestamp));
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in duration-500 transition-colors">
         <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('hub')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
              <ArrowLeft size={24} className="text-slate-400 dark:text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Staff Support</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm transition-colors">Managing user support requests.</p>
            </div>
         </div>
         <Card className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-white dark:bg-slate-900 rounded-sm border-0 shadow-2xl custom-scrollbar border border-slate-100 dark:border-slate-800 transition-colors">
            {roomList.length > 0 ? roomList.map(([uid, data]) => (
              <div key={uid} onClick={() => { setSelectedRecipient(data.user); setActiveView('system-chat'); }} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm cursor-pointer transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30 group">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-lg overflow-hidden group-hover:scale-105 transition-transform relative">
                       {data.user.avatar ? <img src={data.user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="text-slate-200 dark:text-slate-800" size={24} />}
                       {data.unread > 0 && (
                         <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-800 animate-bounce">
                           {data.unread}
                         </span>
                       )}
                    </div>
                    <div className="min-w-0">
                       <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900 dark:text-white text-lg group-hover:text-red-600 transition-colors leading-none">{data.user.name}</p>
                          {data.unread > 0 && <Badge color="green" className="text-[7px] py-0.5 px-1.5 ring-1 ring-green-100 dark:ring-green-900/50">NEW MESSAGE</Badge>}
                       </div>
                       <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-[200px] lg:max-w-none transition-colors">{data.lastMsg}</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-2 text-right">
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700">{new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowRight size={20} className="text-slate-200 dark:text-slate-800 group-hover:text-red-500 transition-colors" />
                 </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 italic">
                 <MessageCircle size={64} className="mb-4 text-slate-200 dark:text-slate-800" />
                 <p className="font-bold text-slate-400 dark:text-slate-600 transition-colors">No active threads.</p>
              </div>
            )}
         </Card>
      </div>
    );
  }

  if (activeView === 'user-list') {
    return (
      <MessengerDirectory 
        allUsers={allUsers}
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setActiveView={setActiveView}
        setSelectedRecipient={setSelectedRecipient}
        unreadCounts={unreadCounts}
      />
    );
  }

  if (activeView === 'system-chat') {
    return renderChat(
      user?.role === UserRole.USER ? "Help Center" : (selectedRecipient?.name || "System Support"), 
      MessageSquare, 
      selectedRecipient || undefined
    );
  }

  if (activeView === 'private-chat') {
    return renderChat(
      selectedRecipient?.name || "Messenger", 
      UserIcon, 
      selectedRecipient || undefined
    );
  }

  if (activeView === 'social-hub') {
    return <SocialHubView setActiveView={setActiveView} />;
  }

  if (activeView === 'help-center') {
    return <HelpCenterView setActiveView={setActiveView} />;
  }

  // Fix: Correctly calculate total unreads by excluding individual support thread counts for staff (already summarized in 'SYSTEM')
  const unreadTotal = Object.entries(unreadCounts).reduce((acc, [key, count]) => {
    if (key.startsWith('SUPPORT_')) return acc;
    return acc + (count || 0);
  }, 0);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 transition-colors bg-slate-50/50 dark:bg-slate-950/20 -m-4 lg:-m-8 p-4 lg:p-6 min-h-[calc(100vh-140px)]">
      <Toast {...toastState} onClose={hideToast} />
      
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden p-6 lg:p-12 bg-slate-900 rounded-sm border border-slate-800 shadow-2xl group min-h-[300px] flex items-center">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rotate-12 group-hover:rotate-0 pointer-events-none">
            <LifeBuoy size={300} className="text-blue-500" />
         </div>
         {/* Abstract Decorative Shapes */}
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full"></div>
         <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>

         <div className="relative z-10 max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge color="red" className="mb-4 px-4 py-1 text-[10px] font-black tracking-[0.3em] uppercase bg-red-600/20 text-red-100 border border-red-500/30">SUPPORT PROTOCOL V2.0</Badge>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[1.1] mb-4"
            >
              How can we <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-[8px]">assist</span> you today?
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-400 font-medium text-sm lg:text-base leading-relaxed mb-8 max-w-2xl"
            >
              Access our advanced multi-channel support network. Real-time assistance, comprehensive documentation, and direct community messaging.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-6 items-center"
            >
            
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400 overflow-hidden shadow-xl">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 40}`} alt="Support" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-widest">Active Heroes</p>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">24/7 Verified Support</p>
                </div>
              </div>
            </motion.div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} onClick={() => setActiveView('help-center')} className="cursor-pointer">
          <SupportLinkCard 
            icon={HelpCircle} 
            title="Help Center" 
            description={isStaff ? "Manage support queries and FAQs." : "Submit tickets for general inquiries and view FAQs."} 
            color="red" 
          />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} onClick={() => { setActiveView('private-chat'); setSelectedRecipient(null); }} className="cursor-pointer">
          <SupportLinkCard 
            icon={MessageCircle} 
            title="Messenger" 
            description="Secure direct messaging with verified community members." 
            color="blue" 
            badge={Object.values(unreadCounts).reduce((a, b) => a + b, 0) - (isStaff ? unreadTotal : (unreadCounts['SYSTEM'] || 0))} 
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} onClick={() => setActiveView('social-hub')} className="cursor-pointer">
          <SupportLinkCard 
            icon={Zap} 
            title="Social Hub" 
            description="Our official verified presence across global social platforms." 
            color="green" 
          />
        </motion.div>
      </div>

    </div>
  );
};

const SupportLinkCard = ({ icon: Icon, title, description, color, badge }: any) => {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/10",
      text: "text-blue-600 dark:text-blue-400",
      hover: "group-hover:bg-blue-600 group-hover:text-white",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/10",
      text: "text-green-600 dark:text-green-400",
      hover: "group-hover:bg-green-600 group-hover:text-white",
      glow: "shadow-[0_0_20px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]"
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/10",
      text: "text-red-600 dark:text-red-400",
      hover: "group-hover:bg-red-600 group-hover:text-white",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
    }
  };

  const style = colorStyles[color as keyof typeof colorStyles] || colorStyles.blue;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className={clsx(
        "p-6 lg:p-10 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 rounded-sm h-full flex flex-col justify-between group border border-slate-100 dark:border-slate-800 relative overflow-hidden",
        style.glow
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-500">
           <Icon size={120} />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className={clsx("w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 bg-white dark:bg-slate-800 shadow-xl border border-slate-50 dark:border-slate-700 group-hover:scale-110", style.text)}>
              <Icon size={32} />
            </div>
            {badge > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg ring-4 ring-white dark:ring-slate-800 animate-bounce">
                {badge} NEW
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-4 tracking-tighter">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed transition-colors opacity-80 group-hover:opacity-100">{description}</p>
        </div>
        <div className="mt-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
          <span className="group-hover:translate-x-1 transition-transform">Explore Support</span> 
          <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
        </div>
      </Card>
    </motion.div>
  );
};
