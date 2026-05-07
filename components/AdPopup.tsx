import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, COLLECTIONS } from '../services/api';
import { X } from 'lucide-react';
import { Card } from './UI';

export const AdPopup: React.FC = () => {
  const [ad, setAd] = useState<any | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Determine targetPage based on location.pathname
    // Simple mapping: remove leading slash
    const currentPageMatch = location.pathname.substring(1) || 'dashboard';

    const q = query(
      collection(db, COLLECTIONS.ADVERTISEMENTS),
      where('targetPage', '==', currentPageMatch)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (ads.length > 0) {
        // Show the first ad found for this page
        setAd(ads[0]);
        setIsVisible(true);
      } else {
        setAd(null);
        setIsVisible(false);
      }
    });

    return () => unsubscribe();
  }, [location.pathname]);

  const getEmbedUrl = (url: string) => {
    if (url.includes('embed/')) return url;
    
    // YouTube
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Google Drive
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1].split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Facebook
    if (url.includes('facebook.com/')) {
       // Facebook embeds are complex via iframe src directly. Assuming simple conversion to public embed if possible or using link.
       // For now, return the link.
       return url; 
    }
    
    return url;
  };

  if (!isVisible || !ad) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border-0 rounded-2xl relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">{ad.adName}</h3>
        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
          <iframe 
            src={getEmbedUrl(ad.videoLink)} 
            className="w-full h-full"
            title="Advertisement"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Card>
    </div>
  );
};
