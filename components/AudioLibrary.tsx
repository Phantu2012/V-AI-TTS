import React, { useState, useRef, useEffect } from 'react';
import { GeneratedAudio } from '../types';

// Icons
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

interface AudioLibraryItemProps {
  item: GeneratedAudio;
  isPlaying: boolean;
  onPlay: (item: GeneratedAudio) => void;
  onDelete: (id: string) => void;
}

const AudioLibraryItem: React.FC<AudioLibraryItemProps> = ({ item, isPlaying, onPlay, onDelete }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.audioUrl;
    link.download = `v-ai-voice-${item.id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between space-x-4">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate" title={item.text}>
          "{item.text.length > 80 ? `${item.text.substring(0, 80)}...` : item.text}"
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Giọng: {item.voiceName} - {item.createdAt.toLocaleDateString('vi-VN')}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={() => onPlay(item)} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded-full transition-colors">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={handleDownload} title="Tải xuống" className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded-full transition-colors">
          <DownloadIcon />
        </button>
        <button onClick={() => onDelete(item.id)} title="Xóa" className="p-2 text-gray-300 hover:text-red-500 hover:bg-gray-600 rounded-full transition-colors">
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
};


interface AudioLibraryProps {
  library: GeneratedAudio[];
  onDelete: (id: string) => void;
}

export const AudioLibrary: React.FC<AudioLibraryProps> = ({ library, onDelete }) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
        const handleEnded = () => setPlayingAudioId(null);
        audioEl.addEventListener('ended', handleEnded);
        return () => audioEl.removeEventListener('ended', handleEnded);
    }
  }, []);

  const handlePlay = async (item: GeneratedAudio) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    
    if (playingAudioId === item.id) {
        audioEl.pause();
        setPlayingAudioId(null);
    } else {
        audioEl.pause();
        audioEl.src = item.audioUrl;
        try {
            await audioEl.play();
            setPlayingAudioId(item.id);
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                 console.error("Audio playback error:", error);
            }
            setPlayingAudioId(null);
        }
    }
  };


  return (
    <div className="flex flex-col h-full pt-6 border-t border-gray-700">
      <audio ref={audioRef} className="hidden" />
      <h2 className="text-2xl font-bold text-white mb-4">Thư Viện Âm Thanh</h2>
      {library.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-center bg-gray-900 rounded-lg p-6">
          <p className="text-gray-500">Các file âm thanh bạn tạo sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-3 pr-2 overflow-y-auto max-h-96">
          {library.map(item => (
            <AudioLibraryItem
              key={item.id}
              item={item}
              isPlaying={playingAudioId === item.id}
              onPlay={handlePlay}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
