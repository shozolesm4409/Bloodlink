
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  UserCircle, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Database,
  X,
  Upload,
  XCircle,
  Loader2,
  Edit,
  ArrowUp,
  ArrowDown,
  GripVertical
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import clsx from 'clsx';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface SystemAsset {
  id: string;
  url: string;
  name: string;
  category?: string;
  status: 'active' | 'inactive';
  visibility: 'visible' | 'hidden';
  order?: number;
  createdAt?: any;
}

interface SortableAssetProps {
  asset: SystemAsset;
  index: number;
  activeTab: 'avatars' | 'covers';
  onEdit: (asset: SystemAsset) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  totalItems: number;
}

const SortableAsset = ({ asset, index, activeTab, onEdit, onDelete, onMove, totalItems }: SortableAssetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: asset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    boxShadow: isDragging ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' : undefined
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 hover:border-red-200 dark:hover:border-red-900/50 transition-all flex flex-col items-center gap-3 relative shadow-sm",
        isDragging && "opacity-50 ring-2 ring-red-500 border-red-500"
      )}
    >
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={() => onEdit(asset)}
          title="Edit"
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
        >
          <Edit size={12} />
        </button>
        <button 
          onClick={() => onDelete(asset.id)}
          title="Delete" 
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div 
          {...attributes} 
          {...listeners}
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={12} />
        </div>
        <button 
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 disabled:opacity-30"
        >
          <ArrowUp size={12} />
        </button>
        <button 
          onClick={() => onMove(index, 'down')}
          disabled={index === totalItems - 1}
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 disabled:opacity-30"
        >
          <ArrowDown size={12} />
        </button>
      </div>

      <div className={clsx(
        "rounded-xl bg-slate-50 dark:bg-slate-950 shadow-inner p-1 border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform",
        activeTab === 'avatars' ? "w-16 h-16" : "w-full aspect-[3/1]"
      )}>
        <img 
          src={asset.url} 
          alt={asset.name} 
          className="w-full h-full object-cover rounded-lg"
          draggable={false}
        />
      </div>
      
      <div className="text-center w-full min-w-0">
        <div className="flex items-center justify-center gap-1.5 px-2">
          <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
            {asset.name}
          </p>
          {asset.visibility === 'hidden' ? (
            <EyeOff size={10} className="text-slate-400 shrink-0" />
          ) : (
            <Eye size={10} className="text-red-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          {asset.category && (
            <span className="text-[8px] font-black px-1.5 py-0.5 bg-white dark:bg-slate-800 text-slate-400 rounded-md border border-slate-100 dark:border-slate-700 uppercase tracking-widest">
              {asset.category}
            </span>
          )}
          {asset.status === 'active' ? (
            <CheckCircle2 size={10} className="text-green-500" />
          ) : (
            <AlertCircle size={10} className="text-amber-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminAvatarManage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'avatars' | 'covers'>('avatars');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('Male');
  const [newAssetFile, setNewAssetFile] = useState<string | null>(null);
  const [newAssetVisibility, setNewAssetVisibility] = useState<'visible' | 'hidden'>('visible');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SystemAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatars, setAvatars] = useState<SystemAsset[]>([]);
  const [covers, setCovers] = useState<SystemAsset[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    alert(`Error: ${error instanceof Error ? error.message : 'Something went wrong while processing your request.'}`);
  };

  // Real-time listener for avatars and covers
  useEffect(() => {
    setIsLoading(true);
    const avatarsRef = collection(db, 'system_avatars');
    const coversRef = collection(db, 'system_covers');
    
    const avatarsQuery = query(avatarsRef);
    const coversQuery = query(coversRef);

    const unsubAvatars = onSnapshot(avatarsQuery, (snapshot) => {
      const avatarList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemAsset[];

      avatarList.sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
        const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
        return dateB - dateA;
      });

      setAvatars(avatarList);
      if (activeTab === 'avatars') setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'system_avatars');
    });

    const unsubCovers = onSnapshot(coversQuery, (snapshot) => {
      const coverList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemAsset[];

      coverList.sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0);
        const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0);
        return dateB - dateA;
      });

      setCovers(coverList);
      if (activeTab === 'covers') setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'system_covers');
    });

    return () => {
      unsubAvatars();
      unsubCovers();
    };
  }, [activeTab]);

  const filteredAssets = useMemo(() => {
    let list = activeTab === 'avatars' ? [...avatars] : [...covers];
    
    return list.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeTab === 'avatars' 
        ? (categoryFilter === 'All' || a.category === categoryFilter)
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [activeTab, avatars, covers, searchTerm, categoryFilter]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredAssets.findIndex((item) => item.id === active.id);
      const newIndex = filteredAssets.findIndex((item) => item.id === over.id);

      const newList = arrayMove(filteredAssets, oldIndex, newIndex);
      
      // Update state immediately for visual feedback
      if (activeTab === 'avatars') {
        setAvatars(prev => {
          const others = prev.filter(p => !filteredAssets.find(f => f.id === p.id));
          const sortedList = [...newList, ...others];
          return sortedList;
        });
      } else {
        setCovers(prev => {
          const others = prev.filter(p => !filteredAssets.find(f => f.id === p.id));
          const sortedList = [...newList, ...others];
          return sortedList;
        });
      }

      try {
        const batch = writeBatch(db);
        const collectionName = activeTab === 'avatars' ? 'system_avatars' : 'system_covers';
        
        // Update order values for all visible items to fix them in place
        newList.forEach((item, index) => {
          const docRef = doc(db, collectionName, item.id);
          batch.update(docRef, { order: 1000 + index });
        });

        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'batch_reorder');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.split('.').slice(0, -1).join('.') || file.name;
      setNewAssetName(fileName);

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAssetFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName || !newAssetFile || isUploading) return;

    try {
      setIsUploading(true);
      const collectionName = activeTab === 'avatars' ? 'system_avatars' : 'system_covers';
      
      const assetData: any = {
        url: newAssetFile,
        name: newAssetName,
        status: 'active',
        visibility: newAssetVisibility,
        order: Date.now(),
        createdAt: serverTimestamp(),
        createdBy: user?.id || 'anonymous'
      };

      if (activeTab === 'avatars') {
        assetData.category = newAssetCategory;
      }

      if (editingAsset) {
        const updateData: any = {
          name: newAssetName,
          visibility: newAssetVisibility,
          url: newAssetFile
        };

        if (activeTab === 'avatars') {
          updateData.category = newAssetCategory;
        }

        await updateDoc(doc(db, collectionName, editingAsset.id), updateData);
      } else {
        await addDoc(collection(db, collectionName), assetData);
      }
      
      setIsUploadModalOpen(false);
      setEditingAsset(null);
      setNewAssetName('');
      setNewAssetCategory('Male');
      setNewAssetFile(null);
    } catch (error) {
      handleFirestoreError(error, editingAsset ? OperationType.UPDATE : OperationType.CREATE, activeTab === 'avatars' ? 'system_avatars' : 'system_covers');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (asset: SystemAsset) => {
    setEditingAsset(asset);
    setNewAssetName(asset.name);
    setNewAssetCategory(asset.category || 'Male');
    setNewAssetVisibility(asset.visibility || 'visible');
    setNewAssetFile(asset.url);
    setIsUploadModalOpen(true);
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const list = [...filteredAssets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const itemA = list[index];
    const itemB = list[targetIndex];

    try {
      const collectionName = activeTab === 'avatars' ? 'system_avatars' : 'system_covers';
      const orderA = itemA.order || Date.now() + index;
      const orderB = itemB.order || Date.now() + targetIndex;

      await updateDoc(doc(db, collectionName, itemA.id), { order: orderB });
      await updateDoc(doc(db, collectionName, itemB.id), { order: orderA });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reordering');
    }
  };

  const handleDeleteAsset = (id: string) => {
    setAssetToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    
    try {
      const collectionName = activeTab === 'avatars' ? 'system_avatars' : 'system_covers';
      await deleteDoc(doc(db, collectionName, assetToDelete));
      setIsDeleteModalOpen(false);
      setAssetToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${activeTab === 'avatars' ? 'system_avatars' : 'system_covers'}/${assetToDelete}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-red-900/20">
            <UserCircle className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
              Avatar & Cover
            </h1>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">
              System Intel / Asset Repository
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 whitespace-nowrap"
        >
          <Plus size={16} />
          Upload New {activeTab === 'avatars' ? 'Avatar' : 'Cover'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('avatars')}
            className={clsx(
              "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2",
              activeTab === 'avatars' 
                ? "text-red-600 dark:text-red-400 border-red-600 dark:border-red-400" 
                : "text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            System Avatars
          </button>
          <button 
            onClick={() => setActiveTab('covers')}
            className={clsx(
              "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2",
              activeTab === 'covers' 
                ? "text-red-600 dark:text-red-400 border-red-600 dark:border-red-400" 
                : "text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            System Covers
          </button>
        </div>

        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'avatars' ? 'avatars' : 'covers'} by name...`}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {activeTab === 'avatars' && (
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                <Filter size={16} className="text-slate-400" />
                <select 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Anime">Anime</option>
                  <option value="Icon">Icon</option>
                </select>
              </div>
            )}
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2">
              Total {filteredAssets.length} {activeTab === 'avatars' ? 'Avatars' : 'Covers'}
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-red-600" size={32} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading assets...</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredAssets}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset, index) => (
                      <SortableAsset 
                        key={asset.id} 
                        asset={asset} 
                        index={index}
                        activeTab={activeTab}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteAsset}
                        onMove={handleMoveOrder}
                        totalItems={filteredAssets.length}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3">
                      <ImageIcon className="text-slate-200" size={48} strokeWidth={1} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        No {activeTab === 'avatars' ? 'avatars' : 'covers'} found matching your search
                      </p>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex flex-col items-center justify-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-red-400 transition-all group lg:min-h-[140px]"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-300 group-hover:text-red-400 transition-colors">
                      <Plus size={32} strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-red-400">
                      Add More
                    </span>
                  </button>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-red-900/20">
                  <Upload className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                    {editingAsset ? 'Edit' : 'Upload'} {activeTab === 'avatars' ? 'Avatar' : 'Cover'}
                  </h2>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">
                    Asset Repository
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setEditingAsset(null);
                  setNewAssetName('');
                  setNewAssetVisibility('visible');
                  setNewAssetFile(null);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {activeTab === 'avatars' ? 'Avatar' : 'Cover'} Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Enter ${activeTab === 'avatars' ? 'avatar' : 'cover'} name`}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-slate-400"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                  />
                </div>

                {activeTab === 'avatars' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Gender / Category
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                      value={newAssetCategory}
                      onChange={(e) => setNewAssetCategory(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Neutral">Neutral</option>
                      <option value="Anime">Anime</option>
                      <option value="Icon">Icon</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Visibility
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    value={newAssetVisibility}
                    onChange={(e) => setNewAssetVisibility(e.target.value as 'visible' | 'hidden')}
                  >
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" id="file-upload-label">
                    Select {activeTab === 'avatars' ? 'Avatar' : 'Cover'} File
                  </label>
                  {!newAssetFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center gap-3 hover:border-red-400 hover:bg-red-50/5 dark:hover:bg-red-950/5 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-300 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300">
                        <Plus size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Click or Drag Image</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 italic">SVG, PNG, JPG (Max 2MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className={clsx(
                      "relative mx-auto group",
                      activeTab === 'avatars' ? "w-48 aspect-square" : "w-full aspect-[3/1]"
                    )}>
                      <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-950 p-2 shadow-inner border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <img 
                          src={newAssetFile} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNewAssetFile(null)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-110"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={!newAssetName || !newAssetFile || isUploading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-red-200 dark:shadow-none active:scale-95"
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {isUploading ? 'Processing...' : `${editingAsset ? 'Update' : 'Save'} ${activeTab === 'avatars' ? 'Avatar' : 'Cover'} Asset`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-red-50/50 dark:ring-red-950/20">
                <Trash2 className="text-red-600" size={40} strokeWidth={1.5} />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                Are you sure?
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed mb-8 px-4">
                This action will permanently delete this {activeTab === 'avatars' ? 'avatar' : 'cover'}. This cannot be undone.
              </p>

              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-red-200 dark:shadow-none active:scale-95"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setAssetToDelete(null);
                  }}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
