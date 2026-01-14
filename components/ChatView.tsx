
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { db } from '../services/dbService';
import { ArrowLeft, Send } from 'lucide-react';

interface ChatViewProps {
  currentUser: User;
  targetUserId: string;
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser, targetUserId, onBack }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatId = [currentUser.id, targetUserId].sort().join('_');

  useEffect(() => {
    // 1. Fetch Target User Data
    db.getUserById(targetUserId).then(u => setTargetUser(u));

    // 2. Subscribe to Real-time Chat Updates
    const unsubscribe = db.subscribeToChat(chatId, (updatedChat) => {
      if (updatedChat && updatedChat.messages) {
        const msgList = Object.values(updatedChat.messages) as Message[];
        setMessages(msgList.sort((a, b) => a.timestamp - b.timestamp));
      }
    });
    
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await db.sendMessage(chatId, { senderId: currentUser.id, text: inputText });
    setInputText('');
  };

  if (!targetUser) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black text-white flex flex-col animate-slide-up">
      <div className="p-4 flex items-center border-b border-zinc-800 bg-[#121212]">
        <button onClick={onBack} className="p-2"><ArrowLeft /></button>
        <div className="w-10 h-10 rounded-full overflow-hidden mx-3 border border-zinc-800">
          <img src={targetUser.avatar} className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="font-bold block">@{targetUser.username}</span>
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest">UID: {targetUser.id.substring(0, 8)}...</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${m.senderId === currentUser.id ? 'bg-[#fe2c55] text-white rounded-tr-none' : 'bg-zinc-800 text-white rounded-tl-none'}`}>
              <p className="text-sm">{m.text}</p>
              <p className="text-[9px] opacity-40 mt-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <Send size={48} className="mb-2" />
            <p className="text-sm">Start your conversation</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-black border-t border-zinc-800 flex items-center space-x-3">
        <input 
          value={inputText} 
          onChange={e => setInputText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Type something..." 
          className="flex-1 bg-zinc-900 rounded-full px-5 py-3 text-sm outline-none focus:border-[#fe2c55] border border-transparent transition" 
        />
        <button onClick={handleSend} className="p-3 bg-[#fe2c55] rounded-full text-white active:scale-90 transition shadow-lg"><Send size={20} /></button>
      </div>
    </div>
  );
};

export default ChatView;
