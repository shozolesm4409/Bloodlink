import React, { useEffect, useState } from 'react';
import { getNews } from '../../services/api';
import { News } from '../../types';
import { Newspaper } from 'lucide-react';

export const NewsMediaPage = () => {
    const [newsItems, setNewsItems] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

    useEffect(() => {
        getNews().then((data) => {
            setNewsItems(data);
            setLoading(false);
        });
    }, []);

    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    if (loading) return <div className="text-center py-10 font-bold">Loading...</div>;

    const hero = selectedNewsId 
        ? newsItems.find(n => n.id === selectedNewsId) || newsItems[0]
        : newsItems[0];
    const others = newsItems.filter(n => n.id !== hero?.id);

    return (
        <div className="p-2 max-w-6xl mx-auto bg-white dark:bg-slate-900 font-serif">
            <header className="border-b-4 border-black dark:border-slate-700 pb-2 mb-4 text-center">
                <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white">DailyNews</h1>
                <p className="text-xs uppercase tracking-widest mt-1 dark:text-slate-400">{new Date().toLocaleDateString()}</p>
            </header>

            {newsItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Main Section */}
                    {hero && (
                        <div className="md:col-span-2 space-y-2 border-r border-slate-200 dark:border-slate-700 pr-0 md:pr-4">
                            <h2 className="text-3xl font-bold leading-tight text-black dark:text-white">{hero.subject}</h2>
                            <div className="text-slate-500 dark:text-slate-400 text-xs border-y border-slate-200 dark:border-slate-700 py-1">
                                By {hero.authorName} • {new Date(hero.timestamp).toLocaleDateString()}
                            </div>
                            <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-sm">
                                {hero.imageUrl ? <img src={hero.imageUrl} className="w-full h-full object-cover" /> : <Newspaper className="text-slate-400" size={32} />}
                            </div>
                            <div 
                                className="text-md text-slate-800 dark:text-slate-200 leading-relaxed ql-editor"
                                dangerouslySetInnerHTML={{ __html: hero.details }}
                            />
                        </div>
                    )}

                    {/* Sidebar Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold border-b border-black dark:border-slate-700 dark:text-white pb-1 mb-2">Latest Updates</h3>
                        {others.map((item) => (
                            <div key={item.id} className="border-b border-slate-100 dark:border-slate-700 pb-2 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 overflow-hidden" onClick={() => setSelectedNewsId(item.id)}>
                                {item.imageUrl && (
                                    <img src={item.imageUrl} className="w-16 h-16 object-cover rounded-sm flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm leading-snug mb-0.5 dark:text-white truncate">{item.subject}</h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-[10px] line-clamp-2 leading-tight">{stripHtml(item.details)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-5 text-slate-500 dark:text-slate-400 italic text-sm">No news published yet.</div>
            )}
        </div>
    );
};
