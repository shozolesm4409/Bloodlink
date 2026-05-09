import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../services/api';
import { Card } from '../../components/UI';
import { Megaphone, X, Check } from 'lucide-react';

export const AdvertisementsPage = () => {
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissAd, setDismissAd] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.ADVERTISEMENTS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    setActiveAds(activeAds.filter(ad => ad.id !== id));
    setDismissAd(null);
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-black">Loading Advertisements...</div>;

  return (
    <div className="space-y-6">
       <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Advertisements</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeAds.map(ad => (
            <Card key={ad.id} className="p-4 rounded-3xl border border-slate-200 shadow-lg bg-white overflow-hidden relative">
                <button 
                  onClick={() => setDismissAd(ad.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="font-black text-slate-900 mb-2 pr-8">{ad.adName}</h3>
                <p className="text-xs font-bold text-slate-500 mb-4 bg-slate-100 px-2 py-1 rounded inline-block">Target: {ad.targetPage}</p>
                {ad.videoLink.includes('youtube.com') || ad.videoLink.includes('youtu.be') ? (
                    <iframe 
                      className="w-full aspect-video rounded-xl"
                      src={ad.videoLink.replace('watch?v=', 'embed/').split('&')[0]}
                      title={ad.adName}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                ) : (
                    <video 
                      className="w-full aspect-video rounded-xl"
                      controls
                      src={ad.videoLink}
                    />
                )}
            </Card>
        ))}
        {activeAds.length === 0 && <div className="text-center py-20 text-slate-400">No active advertisements.</div>}
       </div>
       
       {dismissAd && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <Card className="p-6 max-w-sm w-full rounded-3xl text-center space-y-4">
                <h3 className="font-black text-slate-900 text-xl">Dismiss Advertisement?</h3>
                <p className="text-slate-600">Are you sure you want to remove this ad from your view?</p>
                <div className="flex gap-4 justify-center">
                   <button 
                      onClick={() => setDismissAd(null)}
                      className="px-4 py-2 rounded-full font-bold text-slate-600 hover:bg-slate-100"
                   >
                     Cancel
                   </button>
                   <button 
                      onClick={() => handleDismiss(dismissAd)}
                      className="px-4 py-2 rounded-full font-bold bg-red-600 text-white hover:bg-red-700"
                   >
                     Confirm
                   </button>
                </div>
             </Card>
          </div>
       )}
    </div>
  );
};
