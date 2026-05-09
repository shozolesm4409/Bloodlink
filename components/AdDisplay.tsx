import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, COLLECTIONS } from '../services/api';
import { Card } from './UI';
import { Megaphone } from 'lucide-react';

export const AdDisplay = ({ targetPage }: { targetPage: string }) => {
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.ADVERTISEMENTS),
      where('targetPage', '==', targetPage)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [targetPage]);

  if (ads.length === 0) return null;

  return (
    <div className="space-y-4 my-6">
      {ads.map(ad => (
        <Card key={ad.id} className="p-4 rounded-3xl border border-red-100 shadow-lg bg-white relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3 text-red-600">
            <Megaphone size={18} />
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">{ad.adName}</h3>
          </div>
          {ad.videoLink && (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900">
              <iframe
                src={ad.videoLink}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
