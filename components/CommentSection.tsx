
import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Comment } from '../types';
import { moderateContent } from '../services/geminiService';

interface CommentSectionProps {
  comments: Comment[];
  onClose: () => void;
  onAddComment: (text: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onClose, onAddComment }) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const isSafe = await moderateContent(inputText);
    
    if (isSafe) {
      onAddComment(inputText);
      setInputText('');
    } else {
      alert("Please keep the conversation respectful.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="absolute inset-0 z-[120] flex flex-col justify-end">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="bg-[#0f0f0f] rounded-t-xl h-[60%] z-20 flex flex-col overflow-hidden animate-slide-up border-t border-white/10 shadow-2xl">
        <div className="px-4 py-2 border-b border-zinc-900 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-center text-zinc-500">{comments.length} comments</span>
          <button onClick={onClose} className="p-1 text-zinc-600 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-10">
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">No comments yet</span>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-6 h-6 rounded-full bg-zinc-900 overflow-hidden shrink-0 border border-white/5">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-[9px] font-black text-[#fe2c55] tracking-tight">@{comment.username}</p>
                    <span className="text-[7px] text-zinc-600 font-bold">{new Date(comment.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-zinc-300 mt-0.5">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input moved up with increased padding for better visibility */}
        <div className="px-4 pt-3 pb-12 bg-[#0f0f0f] border-t border-zinc-900 flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Add comment..."
              className="w-full bg-zinc-900/80 rounded-full pl-5 pr-12 py-2.5 text-[12px] outline-none border border-white/5 focus:border-[#fe2c55]/30 transition text-white placeholder-zinc-600"
            />
            <button 
              onClick={handleSubmit}
              disabled={!inputText.trim() || isSubmitting}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${inputText.trim() ? 'text-[#fe2c55] scale-110' : 'text-zinc-700 scale-100'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
