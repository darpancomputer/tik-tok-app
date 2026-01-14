
import React, { useState, useEffect } from 'react';
import { User, Video } from '../types';
import { db } from '../services/dbService';
import { ArrowLeft, Trash2, Edit3, Loader2, Play } from 'lucide-react';

interface DraftsViewProps {
  user: User;
  onBack: () => void;
  onSelectDraft: (video: Video) => void;
}

const DraftsView: React.FC<DraftsViewProps> = ({ user, onBack, onSelectDraft }) => {
  const [drafts, setDrafts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, [user.id]);

  const loadDrafts = async () => {
    setLoading(true);
    const results = await db.getDrafts(user.id);
    setDrafts(results.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const handleDelete = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this draft permanently?")) {
      await db.deleteDraft(user.id, videoId);
      loadDrafts();
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-[#fe2c55]" />
    </div>
  );

  return (
    <div className="h-full bg-black flex flex-col animate-slide-up">
      <div className="p-4 flex items-center border-b border-zinc-900 bg-[#0a0a0a]">
        <button onClick={onBack} className="p-2"><ArrowLeft /></button>
        <h2 className="flex-1 text-center font-bold">Drafts</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {drafts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
            <p>No drafts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {drafts.map(d => (
              <div 
                key={d.id} 
                onClick={() => onSelectDraft(d)}
                className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden relative group border border-zinc-800"
              >
                <video src={d.url} className="w-full h-full object-cover opacity-60" muted />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                   <Edit3 className="text-white" />
                   <span className="text-[10px] font-black uppercase">Edit & Post</span>
                </div>
                <div className="absolute bottom-4 inset-x-4 flex justify-between items-center z-10">
                   <div className="flex items-center space-x-1 text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                      <Play size={10} className="fill-white" />
                      <span>Draft</span>
                   </div>
                   <button 
                     onClick={(e) => handleDelete(d.id, e)}
                     className="p-2 bg-red-500/80 rounded-full text-white backdrop-blur-sm active:scale-90 transition"
                    >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftsView;
