
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Video as VideoIcon, Sparkles, Loader2, Music, Camera, RefreshCw, Save, Check, Globe, Users as UsersIcon, Lock } from 'lucide-react';
import { User, Video } from '../types';
import { generateSmartCaption } from '../services/geminiService';
import { db } from '../services/dbService';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (video: Video) => void;
  user: User;
  initialVideo?: Video;
}

const FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Sepia', class: 'sepia' },
  { name: 'Noir', class: 'grayscale brightness-75 contrast-125' },
  { name: 'Warm', class: 'sepia-[0.3] saturate-150 hue-rotate-[-10deg]' },
  { name: 'Cool', class: 'hue-rotate-[180deg] saturate-125' },
  { name: 'Glow', class: 'brightness-125 saturate-150 blur-[0.5px]' }
];

const TRACKS = [
  { id: '1', title: 'Upbeat Funk', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Lofi Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Viral Pop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
];

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload, user, initialVideo }) => {
  const [mode, setMode] = useState<'camera' | 'details'>(initialVideo ? 'details' : 'camera');
  const [previewUrl, setPreviewUrl] = useState<string>(initialVideo?.url || '');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState(initialVideo?.caption || '');
  const [privacy, setPrivacy] = useState<Video['privacy']>(initialVideo?.privacy || 'everyone');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [selectedMusic, setSelectedMusic] = useState<{title: string, url: string} | null>(null);
  const [showMusicList, setShowMusicList] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    if (mode === 'camera' && !previewUrl) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => console.error("Camera access denied:", err));
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode, previewUrl]);

  const startRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;
    chunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/mp4';
    }
    mediaRecorderRef.current = new MediaRecorder(stream, options);
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: options.mimeType });
      setVideoBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setMode('details');
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
    if (selectedMusic && audioRef.current) audioRef.current.play();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setVideoBlob(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setMode('details');
    }
  };

  const handleAiCaption = async () => {
    setIsGenerating(true);
    const smartCaption = await generateSmartCaption(caption || "Cool video vibes");
    setCaption(smartCaption);
    setIsGenerating(false);
  };

  const handleSaveDraft = async () => {
    if (!previewUrl) return;
    setIsSavingDraft(true);
    let finalUrl = previewUrl;
    if (videoBlob) finalUrl = await blobToBase64(videoBlob);
    
    const draft: Video = {
      id: initialVideo?.id || Math.random().toString(36).substr(2, 9),
      userId: user.id, username: user.username, userAvatar: user.avatar,
      url: finalUrl, caption, likes: [], comments: [], shares: 0,
      timestamp: Date.now(), privacy, isDraft: true, musicTitle: selectedMusic?.title
    };
    await db.saveDraft(draft);
    setIsSavingDraft(false);
    onClose();
  };

  const handlePost = async () => {
    if (!previewUrl || !caption) {
      alert("Please add a caption before posting.");
      return;
    }
    setIsPosting(true);
    let finalUrl = previewUrl;
    if (videoBlob) finalUrl = await blobToBase64(videoBlob);
    
    const newVideo: Video = {
      id: initialVideo?.id || Math.random().toString(36).substr(2, 9),
      userId: user.id, username: user.username, userAvatar: user.avatar,
      url: finalUrl, caption, likes: [], comments: [], shares: 0,
      timestamp: Date.now(), privacy, musicTitle: selectedMusic?.title
    };
    if (initialVideo?.isDraft) await db.deleteDraft(user.id, initialVideo.id);
    await db.saveVideo(newVideo);
    setIsPosting(false);
    onUpload(newVideo);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden">
      {/* Dynamic Overlay Header */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-50 pt-[env(safe-area-inset-top)]">
        <button onClick={onClose} className="p-3 bg-black/60 backdrop-blur-md rounded-full text-white shadow-xl">
          <X className="w-6 h-6" />
        </button>
        {mode === 'camera' && (
          <button onClick={() => setShowMusicList(!showMusicList)} className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 text-white text-xs font-black flex items-center space-x-2 shadow-xl">
            <Music size={14} className="text-[#fe2c55]" /> <span>{selectedMusic ? selectedMusic.title : 'ADD SOUND'}</span>
          </button>
        )}
        {mode === 'details' && (
          <div className="flex space-x-3">
            <button onClick={handleSaveDraft} disabled={isSavingDraft || isPosting} className="px-5 py-2.5 bg-zinc-800/80 backdrop-blur-md text-white rounded-2xl text-xs font-black flex items-center space-x-2 border border-zinc-700 shadow-xl">
              {isSavingDraft ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={14} />} <span>DRAFT</span>
            </button>
            <button onClick={handlePost} disabled={isPosting || isSavingDraft} className="px-7 py-2.5 bg-[#fe2c55] text-white rounded-2xl text-xs font-black shadow-[0_10px_20px_rgba(254,44,85,0.4)]">
              {isPosting ? <Loader2 className="animate-spin w-4 h-4" /> : 'POST'}
            </button>
          </div>
        )}
      </div>

      {mode === 'camera' ? (
        <div className="relative flex-1 flex flex-col">
          <video ref={videoRef} muted playsInline className={`flex-1 object-cover ${activeFilter.class}`} />
          {showMusicList && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl p-8 z-[60] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl tracking-tight">Sounds</h3>
                <button onClick={() => setShowMusicList(false)} className="p-2 bg-zinc-800 rounded-full"><X size={20}/></button>
              </div>
              <div className="space-y-3 overflow-y-auto no-scrollbar">
                {TRACKS.map(t => (
                  <button key={t.id} onClick={() => { setSelectedMusic(t); setShowMusicList(false); }} className={`w-full p-5 rounded-2xl flex justify-between items-center border transition-all ${selectedMusic?.id === t.id ? 'bg-[#fe2c55] border-[#fe2c55] text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                    <div className="flex items-center space-x-4">
                      <Music size={18} />
                      <span className="font-bold">{t.title}</span>
                    </div>
                    {selectedMusic?.id === t.id && <Check size={20} />}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col space-y-8 bg-gradient-to-t from-black via-black/40 to-transparent pb-[env(safe-area-inset-bottom)]">
            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
              {FILTERS.map(f => (
                <button key={f.name} onClick={() => setActiveFilter(f)} className={`flex-shrink-0 flex flex-col items-center space-y-1.5 ${activeFilter.name === f.name ? 'scale-110' : 'opacity-40'}`}>
                  <div className={`w-14 h-14 rounded-2xl border-2 ${activeFilter.name === f.name ? 'border-[#fe2c55]' : 'border-white/20'} overflow-hidden bg-zinc-800 transition-all`}>
                    <div className={`w-full h-full ${f.class} bg-zinc-700`} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{f.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-around pb-4">
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center"><div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10"><Upload size={22}/></div><span className="text-[10px] mt-2 font-black uppercase tracking-widest text-zinc-400">Upload</span></button>
              <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`w-24 h-24 rounded-full border-[6px] flex items-center justify-center transition-all ${isRecording ? 'border-[#fe2c55] scale-110' : 'border-white/40 shadow-2xl'}`}><div className={`w-18 h-18 bg-[#fe2c55] rounded-full shadow-inner ${isRecording ? 'animate-pulse scale-90' : ''}`} /></button>
              <button className="flex flex-col items-center"><div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10"><RefreshCw size={22}/></div><span className="text-[10px] mt-2 font-black uppercase tracking-widest text-zinc-400">Flip</span></button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} hidden accept="video/*" onChange={handleFileChange} />
          {selectedMusic && <audio ref={audioRef} src={selectedMusic.url} hidden />}
        </div>
      ) : (
        <div className="flex-1 bg-[#050505] overflow-y-auto no-scrollbar pt-28 px-6 pb-20">
          <div className="flex flex-col space-y-10 max-w-lg mx-auto">
            <div className="aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 w-full max-w-[300px] mx-auto group">
              <video key={previewUrl} src={previewUrl} className="w-full h-full object-cover" controls loop autoPlay playsInline />
            </div>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Caption</label>
                  <button onClick={handleAiCaption} disabled={isGenerating} className="flex items-center space-x-2 text-[10px] font-black text-[#25f4ee] bg-[#25f4ee]/10 px-4 py-2 rounded-full border border-[#25f4ee]/20 active:scale-95 transition">
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} <span>AI GENERATE</span>
                  </button>
                </div>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="What's on your mind?..." className="w-full h-40 bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] p-5 text-sm outline-none focus:border-[#fe2c55] focus:bg-zinc-900 transition resize-none shadow-inner" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Who can view this video?</label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setPrivacy('everyone')} className={`p-5 rounded-3xl border flex flex-col items-center justify-center space-y-3 transition-all ${privacy === 'everyone' ? 'bg-[#fe2c55] border-[#fe2c55] text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                    <Globe size={22} /> <span className="text-[10px] font-black uppercase">Everyone</span>
                  </button>
                  <button onClick={() => setPrivacy('friends')} className={`p-5 rounded-3xl border flex flex-col items-center justify-center space-y-3 transition-all ${privacy === 'friends' ? 'bg-[#25f4ee] border-[#25f4ee] text-black shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                    <UsersIcon size={22} /> <span className="text-[10px] font-black uppercase">Friends</span>
                  </button>
                  <button onClick={() => setPrivacy('private')} className={`p-5 rounded-3xl border flex flex-col items-center justify-center space-y-3 transition-all ${privacy === 'private' ? 'bg-white border-white text-black shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                    <Lock size={22} /> <span className="text-[10px] font-black uppercase">Only Me</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadModal;
