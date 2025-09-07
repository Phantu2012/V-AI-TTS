import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AccountModal } from './components/AccountModal';
import { VoiceCloningModal } from './components/VoiceCloningModal';
import { Toast } from './components/Toast';
import { Voice, User, Gender, Region, GeneratedAudio, ToastState } from './types';
import { AVAILABLE_VOICES, MOCK_USER } from './constants';
import { ttsService } from './services/ttsService';

const App: React.FC = () => {
  const [user, setUser] = useState<User>(MOCK_USER);
  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [isCloningModalOpen, setCloningModalOpen] = useState(false);
  const [userVoices, setUserVoices] = useState<Voice[]>(AVAILABLE_VOICES);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [audioLibrary, setAudioLibrary] = useState<GeneratedAudio[]>([]);
  // Initialize with an empty string for a clean start.
  const [apiKey, setApiKey] = useState("");


  useEffect(() => {
    // Configure the TTS service whenever the API key changes.
    // WARNING: Do not expose API keys on the client-side in a production application.
    // This key should be handled by a secure backend service.
    ttsService.configure({ apiKey });

    // Cleanup blob URLs on window close to prevent memory leaks
    const handleBeforeUnload = () => {
        audioLibrary.forEach(audio => {
            if (audio.audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(audio.audioUrl);
            }
        });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [audioLibrary, apiKey]);


  const handleCloningComplete = (newVoiceName: string) => {
    const newVoice: Voice = {
      id: `cloned-${Date.now()}`,
      name: newVoiceName,
      // Fix: Imported Gender and Region enums
      gender: Gender.Male, // This could be user-configurable in a full version
      region: Region.South, // Or detected
      isCloned: true,
    };
    setUserVoices(prev => [...prev, newVoice]);
    setCloningModalOpen(false);
    showToast(`Giọng nói "${newVoiceName}" đã được tạo thành công!`);
  };
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
        setToast(null);
    }, 5000); // Increased duration for error messages
  };

  const handleAddToLibrary = (audio: GeneratedAudio) => {
    setAudioLibrary(prev => [audio, ...prev]);
  };

  const handleDeleteFromLibrary = (id: string) => {
    const audioToDelete = audioLibrary.find(audio => audio.id === id);
    if (audioToDelete && audioToDelete.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioToDelete.audioUrl);
    }
    setAudioLibrary(prev => prev.filter(audio => audio.id !== id));
  };


  return (
    <div className="min-h-screen bg-gray-900 font-sans flex flex-col">
      <Header user={user} onAccountClick={() => setAccountModalOpen(true)} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Dashboard
          user={user}
          voices={userVoices}
          onCloneVoiceClick={() => setCloningModalOpen(true)}
          updateCharacterCount={(count) => setUser(prev => ({...prev, charactersUsed: prev.charactersUsed + count}))}
          audioLibrary={audioLibrary}
          onAddToLibrary={handleAddToLibrary}
          onDeleteFromLibrary={handleDeleteFromLibrary}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          showToast={showToast}
        />
      </main>
      
      {isAccountModalOpen && (
        <AccountModal user={user} onClose={() => setAccountModalOpen(false)} />
      )}

      {isCloningModalOpen && (
        <VoiceCloningModal
          onClose={() => setCloningModalOpen(false)}
          onCloningComplete={handleCloningComplete}
        />
      )}

      {toast && <Toast toast={toast} />}
    </div>
  );
};

export default App;