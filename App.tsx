
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
  const [apiKey, setApiKey] = useState<string>(() => {
    // Tải API key từ localStorage khi khởi tạo
    return localStorage.getItem('googleApiKey') || '';
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
        setToast(null);
    }, 5000); // Increased duration for error messages
  };

  // Lưu API key vào localStorage mỗi khi nó thay đổi
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('googleApiKey', apiKey);
    } else {
      localStorage.removeItem('googleApiKey');
    }
  }, [apiKey]);

  // Cấu hình TTS service với API key từ state
  useEffect(() => {
    if (apiKey) {
      ttsService.configure({ apiKey: apiKey });
      console.log("V-AI Voice Studio: TTS Service configured with provided API Key.");
    } else {
      ttsService.configure({ apiKey: '' }); // Vô hiệu hóa nếu không có key
      console.warn("V-AI Voice Studio: API Key is not set.");
    }
  }, [apiKey]);
  
  // Effect for cleaning up blob URLs to prevent memory leaks.
  useEffect(() => {
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
  }, [audioLibrary]);


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
  
  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
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
          showToast={showToast}
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
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
