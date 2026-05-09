import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../services/api';
import { X } from 'lucide-react';
import { Card } from './UI';
import { Megaphone } from 'lucide-react';

export const AdPopup = ({ targetPage }: { targetPage: string }) => {
  const [ads, setAds] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [blockedAds, setBlockedAds] = useState<string[]>([]);

  useEffect(() => {
    const handleStorage = () => {
      const storedBlocked = localStorage.getItem('blocked_ads');
      if (storedBlocked) {
        setBlockedAds(JSON.parse(storedBlocked));
      } else {
        setBlockedAds([]);
      }
    };
    
    handleStorage();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('ads-unblocked', handleStorage);
    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('ads-unblocked', handleStorage);
    };
  }, []);

  const handleBlockAd = (id: string) => {
    const updatedBlocked = [...blockedAds, id];
    setBlockedAds(updatedBlocked);
    localStorage.setItem('blocked_ads', JSON.stringify(updatedBlocked));
  };

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.ADVERTISEMENTS),
      where('targetPages', 'array-contains', targetPage)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredAds = fetchedAds.filter(ad => !blockedAds.includes(ad.id));
      setAds(filteredAds);
      if (filteredAds.length > 0) {
        setIsOpen(true);
      }
    });
    return () => unsubscribe();
  }, [targetPage, blockedAds]);

  if (!isOpen || ads.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-4 shadow-2xl bg-white dark:bg-slate-900 border-0 rounded-3xl relative">
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
           <X size={20}/>
        </button>
        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
           <Megaphone size={20} className="text-red-600" /> Advertisements
        </h2>
        <div className="space-y-4 overflow-y-auto">
          {ads.map(ad => (
            <div key={ad.id} className="p-2 rounded-3xl border border-red-100 shadow-lg bg-white relative">
              <button 
                  onClick={() => handleBlockAd(ad.id)}
                  className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                  title="Block this Ad"
                >
                  Block <X size={16} />
              </button>
              <div className="flex items-center gap-2 mb-3 text-red-600">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">{ad.adName}</h3>
              </div>
              {ad.videoLink && (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900">
                  {ad.videoLink.includes('youtube.com') || ad.videoLink.includes('youtu.be') ? (
                    <iframe
                        src={(() => {
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = ad.videoLink.match(regExp);
                          if (match && match[2].length === 11) {
                            return 'https://www.youtube.com/embed/' + match[2] + '?autoplay=1&mute=1';
                          }
                          return ad.videoLink + (ad.videoLink.includes('?') ? '&' : '?') + 'autoplay=1&mute=1';
                        })()}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                  ) : (
                    <video src={ad.videoLink} autoPlay muted controls className="w-full h-full" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
