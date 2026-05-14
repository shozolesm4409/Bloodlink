import React, { useState, useEffect } from 'react';
import { addNews, updateNews, deleteNews } from '../../services/api';
import { useAuth } from '../../AuthContext';
import { Card, Button, ConfirmModal } from '../../components/UI';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Loader2, Trash2, Edit2, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['link'],
    ],
};

const quillFormats = [
    'font', 'size',
    'bold', 'italic', 'underline',
    'color', 'background', 'align',
    'list', 'indent',
    'link'
];

export const AdminNewsMedia = () => {
    const { user } = useAuth();
    const [newsItems, setNewsItems] = useState<any[]>([]);
    const [subject, setSubject] = useState('');
    const [details, setDetails] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageType, setImageType] = useState<'url' | 'upload' | 'template'>('url');
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, 'news'), orderBy('timestamp', 'desc')), (snap) => {
            setNewsItems(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        const collections = ['system_news_thumbnails'];
        let snapshotData: Record<string, any[]> = {};
        const unsubscribes = collections.map(collectionName => {
            return onSnapshot(query(collection(db, collectionName)), (snap) => {
                snapshotData[collectionName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setTemplates(Object.values(snapshotData).flat());
            });
        });
        return () => { unsub(); unsubscribes.forEach(u => u()); };
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setSubject('');
        setDetails('');
        setImageUrl('');
    };

    const handleFileUpload = async (file: File) => {
        setLoading(true);
        const storageRef = ref(storage, `news/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setImageUrl(url);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !subject || !details) return;
        
        setLoading(true);
        try {
            if (editingId) {
                await updateNews(editingId, { subject, details, imageUrl }, user);
                alert('News updated successfully!');
            } else {
                await addNews({
                    subject,
                    details,
                    imageUrl,
                    authorId: user.id,
                    authorName: user.name,
                    authorAvatar: user.avatar,
                    timestamp: new Date().toISOString()
                }, user);
                alert('News posted successfully!');
            }
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Failed to save news.');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (item: any) => {
        setEditingId(item.id);
        setSubject(item.subject);
        setDetails(item.details);
        setImageUrl(item.imageUrl || '');
    };

    const handleDelete = async () => {
        if (!user || !deleteId) return;
        setIsDeleting(true);
        try {
            await deleteNews(deleteId, user);
            setDeleteId(null);
            alert('Deleted successfully and moved to archives.');
        } catch (error) {
            console.error(error);
            alert('Failed to delete.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
            <h1 className="text-2xl font-bold mb-6">Manage News</h1>
            
            <div className="grid grid-cols-1 gap-6">
                {/* Form */}
                <Card className="p-6 bg-slate-900 border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{editingId ? 'Edit News' : 'Post New News'}</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-300">Subject</label>
                                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="Enter subject here..." required />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" onClick={() => setImageType('url')} variant={imageType === 'url' ? 'primary' : 'secondary'}>URL</Button>
                                <Button type="button" onClick={() => setImageType('upload')} variant={imageType === 'upload' ? 'primary' : 'secondary'}>UPLOAD</Button>
                                <Button type="button" onClick={() => setImageType('template')} variant={imageType === 'template' ? 'primary' : 'secondary'}>TEMPLATE</Button>
                            </div>
                            {imageType === 'url' && <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white" placeholder="https://example.com/image.jpg" />}
                            {imageType === 'upload' && <input type="file" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white" />}
                            {imageType === 'template' && (
                                <div className="grid grid-cols-4 gap-2 h-48 overflow-y-auto border p-2 rounded bg-slate-950 border-slate-700">
                                    {templates.map(t => <img key={t.id} src={t.url} onClick={() => setImageUrl(t.url)} className={`cursor-pointer border-2 ${imageUrl === t.url ? 'border-red-500' : 'border-transparent'}`} />)}
                                </div>
                            )}
                            <div className="quill-dark-wrapper">
                                <label className="block text-sm font-medium mb-1 text-slate-300">Post Details</label>
                                <ReactQuill
                                    theme="snow"
                                    value={details}
                                    onChange={setDetails}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    className="bg-slate-800 text-white rounded border border-slate-700 h-64 mb-12"
                                    placeholder="Start typing your article here..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6 gap-2">
                            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                                {loading ? <Loader2 className="animate-spin" /> : (editingId ? 'UPDATE NEWS' : 'POST NEWS')}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Manage News List */}
                <Card className="p-4 bg-slate-900 border-slate-800 h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Manage News</h2>
                    </div>
                    <input className="w-full p-2 mb-4 bg-slate-800 border border-slate-700 rounded text-white" placeholder="Search..." />
                    
                    <div className="space-y-3">
                        {newsItems.map(item => (
                            <div key={item.id} className="p-3 flex items-center justify-between gap-3 bg-slate-800 rounded border border-slate-700">
                                <div className="flex items-center gap-3 min-w-0">
                                    {item.imageUrl && <img src={item.imageUrl} className="w-12 h-12 object-cover rounded" />}
                                    <div className="min-w-0">
                                        <h3 className="font-medium truncate">{item.subject}</h3>
                                        <p className="text-xs text-slate-400 truncate">{item.details?.replace(/<[^>]*>?/gm, '')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="secondary" onClick={() => startEdit(item)}><Edit2 size={16} /></Button>
                                    <Button variant="danger" onClick={() => setDeleteId(item.id)}><Trash2 size={16} /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <ConfirmModal
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    title="Archive News?"
                    message="Are you sure you want to delete this news? It will be moved to System Archives."
                    isLoading={isDeleting}
                />
            </div>
        </div>
    );
};
