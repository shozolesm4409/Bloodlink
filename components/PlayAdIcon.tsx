import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../services/api';

export const PlayAdIcon = ({ targetPage }: { targetPage: string }) => {
  const [adIds, setAdIds] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.ADVERTISEMENTS),
      where('targetPages', 'array-contains', targetPage)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAdIds(snapshot.docs.map(doc => doc.id));
    });
    
    return () => unsubscribe();
  }, [targetPage]);

  const handleShowAds = () => {
    const storedBlocked = localStorage.getItem('blocked_ads');
    const blockedIds = storedBlocked ? JSON.parse(storedBlocked) as string[] : [];
    const newBlockedIds = blockedIds.filter(id => !adIds.includes(id));
    localStorage.setItem('blocked_ads', JSON.stringify(newBlockedIds));
    
    // Dispatch custom event to notify AdPopup in the same tab, 
    // and storage event for other windows/tabs.
    window.dispatchEvent(new CustomEvent('ads-unblocked'));
    window.dispatchEvent(new Event('storage'));
  };

  if (adIds.length === 0) return null;

  return (
    <button 
      onClick={handleShowAds}
      className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors animate-pulse aria-label='Show Ads'"
      title="Play Advertisements"
    >
      <Play size={16} fill="white" />
    </button>
  );
};
