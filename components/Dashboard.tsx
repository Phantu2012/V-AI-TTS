
import React, { useState } from 'react';
import { TextToSpeechEditor } from './TextToSpeechEditor';
import { VoiceSelectionPanel } from './VoiceSelectionPanel';
import { Voice, User, GeneratedAudio, ToastState } from '../types';
import { AudioLibrary } from './AudioLibrary';

interface DashboardProps {
  user: User;
  voices: Voice[];
  onCloneVoiceClick: () => void;
  updateCharacterCount: (count: number) => void;
  audioLibrary: GeneratedAudio[];
  onAddToLibrary: (audio: GeneratedAudio) => void;
  onDeleteFromLibrary: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, voices, onCloneVoiceClick, updateCharacterCount, audioLibrary, onAddToLibrary, onDeleteFromLibrary, showToast, apiKey, onApiKeyChange }) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(voices[0]?.id || '');
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);

  const selectedVoice = voices.find(v => v.id === selectedVoiceId) || voices[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">
      <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col space-y-6">
        <TextToSpeechEditor 
            selectedVoice={selectedVoice} 
            speed={speed} 
            pitch={pitch} 
            user={user}
            updateCharacterCount={updateCharacterCount}
            onAddToLibrary={onAddToLibrary}
            showToast={showToast}
        />
        <AudioLibrary 
            library={audioLibrary}
            onDelete={onDeleteFromLibrary}
        />
      </div>
      <div className="lg:col-span-1 bg-gray-800 rounded-xl shadow-lg p-6">
        <VoiceSelectionPanel
          voices={voices}
          selectedVoiceId={selectedVoiceId}
          onSelectVoice={setSelectedVoiceId}
          speed={speed}
          setSpeed={setSpeed}
          pitch={pitch}
          setPitch={setPitch}
          onCloneVoiceClick={onCloneVoiceClick}
          userPlan={user.plan}
          apiKey={apiKey}
          onApiKeyChange={onApiKeyChange}
        />
      </div>
    </div>
  );
};
