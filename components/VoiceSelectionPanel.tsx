
import React, { useState, useRef, useEffect } from 'react';
import { Voice, Region, Plan } from '../types';

const PlaySampleIcon = ({ isPlaying }: { isPlaying: boolean }) => {
    if (isPlaying) {
        // A clear Stop icon for better UX, replacing the pulsing dot
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
        )
    }
    // The original Play icon
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
    )
};

interface VoiceItemProps {
    voice: Voice;
    isSelected: boolean;
    isPlayingSample: boolean;
    onSelect: () => void;
    onPlaySample: (e: React.MouseEvent) => void;
}

const VoiceItem: React.FC<VoiceItemProps> = ({ voice, isSelected, isPlayingSample, onSelect, onPlaySample }) => (
  <div
    onClick={onSelect}
    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'bg-brand-primary/20 border-brand-primary' : 'bg-gray-700/50 border-transparent hover:border-gray-600'}`}
  >
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-3">
        {voice.sampleAudio && (
            <button 
                onClick={onPlaySample} 
                title={`Nghe thử giọng ${voice.name}`}
                className="text-gray-400 hover:text-brand-secondary transition-colors rounded-full p-1 -ml-1"
            >
                <PlaySampleIcon isPlaying={isPlayingSample} />
            </button>
        )}
        <div>
            <div className="flex items-center space-x-2">
                {voice.isCloned && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                )}
                <p className="font-semibold text-white">{voice.name}</p>
            </div>
            <p className="text-sm text-gray-400">{voice.gender} - {voice.region}</p>
        </div>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-gray-500'}`}></div>
    </div>
  </div>
);

// Fix: Defined props interface for VoiceSelectionPanel
interface VoiceSelectionPanelProps {
    voices: Voice[];
    selectedVoiceId: string;
    onSelectVoice: (id: string) => void;
    speed: number;
    setSpeed: (speed: number) => void;
    pitch: number;
    setPitch: (pitch: number) => void;
    onCloneVoiceClick: () => void;
    userPlan: Plan;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}

export const VoiceSelectionPanel: React.FC<VoiceSelectionPanelProps> = ({ voices, selectedVoiceId, onSelectVoice, speed, setSpeed, pitch, setPitch, onCloneVoiceClick, userPlan, apiKey, onApiKeyChange }) => {
  const samplePlayerRef = useRef<HTMLAudioElement | null>(null);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    samplePlayerRef.current = new Audio();
    const player = samplePlayerRef.current;
    
    const handleEnded = () => setPlayingSampleId(null);
    player.addEventListener('ended', handleEnded);

    return () => {
        player.removeEventListener('ended', handleEnded);
        player.pause();
    };
  }, []);

  const handlePlaySample = async (e: React.MouseEvent, voice: Voice) => {
    e.stopPropagation();
    const player = samplePlayerRef.current;
    if (!player || !voice.sampleAudio) return;

    if (playingSampleId === voice.id) {
        player.pause();
        setPlayingSampleId(null);
    } else {
        if (!player.paused) {
           await player.pause();
        }
        player.src = voice.sampleAudio;
        try {
            await player.play();
            setPlayingSampleId(voice.id);
        } catch (error) {
            // The play() promise can be rejected if interrupted by another play command.
            // This is expected behavior in a rapid-click scenario.
            if ((error as DOMException).name !== 'AbortError') {
                console.error("Audio playback error:", error);
            }
            // If it fails for any reason, ensure the state is clean.
            setPlayingSampleId(null);
        }
    }
  };
  
  const groupedVoices = voices.reduce((acc, voice) => {
    const region = voice.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(voice);
    return acc;
  }, {} as Record<Region, Voice[]>);

  const clonedVoices = voices.filter(v => v.isCloned);

  const handleNumericInputChange = (setter: (val: number) => void, min: number, max: number, value: string) => {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= min && num <= max) {
          setter(num);
      } else if (value === "") {
          // Allow empty input temporarily
      }
  };


  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-white mb-4">Cài đặt & Giọng đọc</h2>
      
      <div className="mb-6">
          <label htmlFor="api-key-input" className="text-sm font-medium text-gray-300">Google API Key</label>
          <div className="relative mt-1">
              <input
                  id="api-key-input"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="Nhập API Key của bạn tại đây"
                  className="w-full bg-gray-900 border-2 border-gray-600 rounded-md p-2 pr-10 text-sm focus:outline-none focus:border-brand-primary"
                  aria-label="Google API Key"
              />
              <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white"
                  aria-label={showApiKey ? "Ẩn API Key" : "Hiện API Key"}
              >
                  {showApiKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.27 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.367zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                  )}
              </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">API key của bạn được lưu trữ an toàn trên trình duyệt.</p>
      </div>

      <div className="space-y-4 mb-6 pt-6 border-t border-gray-700">
          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="speed" className="text-sm font-medium text-gray-300">Tốc độ</label>
                <input 
                    type="number"
                    min="0.25"
                    max="4"
                    step="0.01"
                    value={speed.toFixed(2)}
                    onChange={(e) => handleNumericInputChange(setSpeed, 0.25, 4, e.target.value)}
                    onBlur={(e) => {
                        const val = parseFloat(parseFloat(e.target.value).toFixed(2));
                        if(val < 0.25) setSpeed(0.25);
                        else if (val > 4) setSpeed(4);
                        else setSpeed(val);
                    }}
                    className="w-20 bg-gray-900 border border-gray-600 rounded-md text-center p-1 text-sm focus:outline-none focus:border-brand-primary"
                />
            </div>
            <input id="speed" type="range" min="0.25" max="4" step="0.01" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-secondary" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="pitch" className="text-sm font-medium text-gray-300">Cao độ</label>
                 <input 
                    type="number"
                    min="-20"
                    max="20"
                    step="0.1"
                    value={pitch.toFixed(1)}
                    onChange={(e) => handleNumericInputChange(setPitch, -20, 20, e.target.value)}
                    onBlur={(e) => {
                        const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                        if(val < -20) setPitch(-20);
                        else if (val > 20) setPitch(20);
                        else setPitch(val);
                    }}
                    className="w-20 bg-gray-900 border border-gray-600 rounded-md text-center p-1 text-sm focus:outline-none focus:border-brand-primary"
                />
            </div>
            <input id="pitch" type="range" min="-20" max="20" step="0.1" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-secondary" />
          </div>
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">
        {clonedVoices.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Giọng Của Tôi</h3>
            <div className="space-y-2">
              {clonedVoices.map(voice => 
                <VoiceItem 
                    key={voice.id} 
                    voice={voice} 
                    isSelected={voice.id === selectedVoiceId} 
                    onSelect={() => onSelectVoice(voice.id)}
                    isPlayingSample={playingSampleId === voice.id}
                    onPlaySample={(e) => handlePlaySample(e, voice)}
                />
              )}
            </div>
          </div>
        )}
        {(Object.keys(groupedVoices) as Region[]).map(region => (
            <div key={region}>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">{region}</h3>
                <div className="space-y-2">
                    {groupedVoices[region].filter(v => !v.isCloned).map(voice => (
                        <VoiceItem 
                            key={voice.id} 
                            voice={voice} 
                            isSelected={voice.id === selectedVoiceId} 
                            onSelect={() => onSelectVoice(voice.id)}
                            isPlayingSample={playingSampleId === voice.id}
                            onPlaySample={(e) => handlePlaySample(e, voice)}
                        />
                    ))}
                </div>
            </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={onCloneVoiceClick}
          disabled={userPlan === Plan.Free}
          title={userPlan === Plan.Free ? "Nâng cấp lên gói Creator để sử dụng tính năng này" : "Nhân bản giọng nói của bạn"}
          className="w-full inline-flex items-center justify-center px-4 py-3 border border-dashed border-gray-600 text-base font-medium rounded-md text-gray-300 hover:text-white hover:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" />
          </svg>
          Nhân Bản Giọng Nói
        </button>
      </div>
    </div>
  );
};
