
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Voice, User, GeneratedAudio } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { ttsService } from '../services/ttsService';
import { SSML_EXAMPLE } from '../constants';

interface TextToSpeechEditorProps {
    selectedVoice: Voice;
    speed: number;
    pitch: number;
    user: User;
    updateCharacterCount: (count: number) => void;
    onAddToLibrary: (audio: GeneratedAudio) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const GenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6a1 1 0 00-1-1H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1V3.5zM3 11a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
         <path d="M10 18a.5.5 0 00.5-.5v-2.036a.5.5 0 00-.5-.5.5.5 0 00-.5.5v2.036a.5.5 0 00.5.5zM8 15a.5.5 0 00.5.5h3a.5.5 0 000-1h-3a.5.5 0 00-.5.5z" />
    </svg>
);

const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const ScriptBuilderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);


const DEFAULT_PLACEHOLDER = "Nhập văn bản của bạn ở đây. Bạn có thể sử dụng SSML để kiểm soát giọng nói tốt hơn.";

export const TextToSpeechEditor: React.FC<TextToSpeechEditorProps> = ({ selectedVoice, speed, pitch, user, updateCharacterCount, onAddToLibrary, showToast }) => {
    const [text, setText] = useState(DEFAULT_PLACEHOLDER);
    const [isSsml, setIsSsml] = useState(false);
    const [styleInstructions, setStyleInstructions] = useState('');
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const lastGeneratedAudioRef = useRef<{blob: Blob, text: string} | null>(null);

    // Revoke old URL when a new one is created or component unmounts
    useEffect(() => {
        const lastUrl = lastGeneratedAudioRef.current?.blob ? URL.createObjectURL(lastGeneratedAudioRef.current.blob) : null;
        return () => {
            if (lastUrl && lastUrl.startsWith('blob:')) {
                URL.revokeObjectURL(lastUrl);
            }
        };
    }, [generatedAudioUrl]);

    const handleGenerate = async () => {
        if (!text.trim() || text.trim() === DEFAULT_PLACEHOLDER) {
            showToast('Vui lòng nhập văn bản để tạo âm thanh.', 'error');
            return;
        }
        
        if (!ttsService.isApiConfigured()) {
            showToast('Vui lòng nhập Google API Key để sử dụng tính năng này.', 'error');
            return;
        }

        const charCount = text.length;
        if (user.charactersUsed + charCount > user.characterLimit) {
            showToast('Bạn đã vượt quá giới hạn ký tự hàng tháng.', 'error');
            return;
        }

        setIsGenerating(true);
        setGenerationStatus("Đang khởi tạo...");
        setGeneratedAudioUrl(null);
        if (lastGeneratedAudioRef.current) {
            lastGeneratedAudioRef.current = null;
        }

        try {
            // Use Google Cloud TTS API
            const audioBlob = await ttsService.generateSpeech({
                text,
                voice: selectedVoice,
                speed,
                pitch,
                isSsml,
                styleInstructions,
                onProgress: (status) => {
                    if (status.stage === 'generating_ssml') {
                        setGenerationStatus('AI đang tạo kịch bản theo phong cách...');
                    } else if (status.stage === 'generating') {
                        setGenerationStatus(`Đang tạo âm thanh... (${status.current}/${status.total})`);
                    } else if (status.stage === 'merging') {
                        setGenerationStatus('Đang ghép các đoạn âm thanh...');
                    }
                }
            });
            
            // Store the raw blob and original text for the library
            lastGeneratedAudioRef.current = { blob: audioBlob, text: text };
            
            const url = URL.createObjectURL(audioBlob);
            setGeneratedAudioUrl(url);
            updateCharacterCount(charCount);

        } catch (error: any) {
            console.error("Speech generation error:", error);
            const errorMessage = error.message || 'Đã xảy ra lỗi không xác định.';
            showToast(errorMessage, 'error');
            setGeneratedAudioUrl(null);
        } finally {
            setIsGenerating(false);
            setGenerationStatus(null);
        }
    };
    
    const handleCancel = () => {
        ttsService.cancel();
        setIsGenerating(false);
        setGenerationStatus(null);
    };
    
    const handleAddToLibrary = () => {
        if (!lastGeneratedAudioRef.current) return;
        
        // IMPORTANT: Create a distinct copy (clone) of the blob for the library.
        // This prevents the library's URL from being invalidated when the editor generates a new audio.
        const audioBlobClone = lastGeneratedAudioRef.current.blob.slice();

        const newAudio: GeneratedAudio = {
            id: new Date().getTime().toString(),
            text: lastGeneratedAudioRef.current.text,
            voiceName: selectedVoice.name,
            audioUrl: URL.createObjectURL(audioBlobClone),
            createdAt: new Date(),
        };
        onAddToLibrary(newAudio);
        showToast('Đã thêm vào thư viện âm thanh.');
    };

    const handleToggleSsml = () => {
        const nextIsSsml = !isSsml;
        setIsSsml(nextIsSsml);

        if (nextIsSsml) {
            // Smart SSML toggle logic
            const currentText = text.trim();
            const isDefaultText = currentText === DEFAULT_PLACEHOLDER || currentText === "";
            const isAlreadySsml = currentText.startsWith('<speak>') && currentText.endsWith('</speak>');

            if (!isAlreadySsml) {
                if (isDefaultText) {
                    setText(SSML_EXAMPLE);
                } else {
                    setText(`<speak>${currentText}</speak>`);
                }
            }
        } else {
            // When turning off SSML, remove tags if they exist
            const ssmlRegex = /<speak>(.*?)<\/speak>/s;
            const match = text.match(ssmlRegex);
            if (match && match[1]) {
                // A simple way to clean up some tags for readability
                const cleanedText = match[1].replace(/<[^>]+>/g, ' ').replace(/\s\s+/g, ' ').trim();
                setText(cleanedText || DEFAULT_PLACEHOLDER);
            }
        }
    };

    const characterCount = text === DEFAULT_PLACEHOLDER ? 0 : text.length;

    return (
        <div className="flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-white">Chuyển Đổi Văn Bản</h2>
                    <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="ssml-toggle"
                          checked={isSsml}
                          onChange={handleToggleSsml}
                          className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-secondary"
                        />
                        <label htmlFor="ssml-toggle" className="ml-2 text-sm font-medium text-gray-300">
                          SSML
                        </label>
                    </div>
                 </div>
            </div>

            <div className="relative flex-grow">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => text === DEFAULT_PLACEHOLDER && setText('')}
                    onBlur={() => text.trim() === '' && setText(DEFAULT_PLACEHOLDER)}
                    placeholder="Nhập văn bản của bạn ở đây..."
                    className="w-full h-full min-h-[200px] bg-gray-900 border-2 border-gray-700 rounded-lg p-4 resize-none focus:outline-none focus:border-brand-primary transition-colors"
                    aria-label="Text to speech input"
                />
                 <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                    {characterCount.toLocaleString('vi-VN')} ký tự
                </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-900 rounded-lg border-2 border-gray-700">
                <div className="flex items-center mb-2">
                    <ScriptBuilderIcon />
                    <h3 className="text-lg font-semibold text-white">Script builder</h3>
                </div>
                <div>
                    <label htmlFor="style-instructions" className="text-sm font-medium text-gray-300">Style instructions</label>
                    <input
                        id="style-instructions"
                        type="text"
                        value={styleInstructions}
                        onChange={(e) => setStyleInstructions(e.target.value)}
                        placeholder="Read aloud in a warm, welcoming tone"
                        className="mt-1 w-full bg-gray-700/50 border border-gray-600 rounded-md p-2 text-sm focus:outline-none focus:border-brand-primary"
                        aria-label="Style instructions for text to speech"
                    />
                </div>
            </div>

             <div className="mt-4">
                <AudioPlayer audioUrl={generatedAudioUrl} generationStatus={generationStatus} />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                 {isGenerating ? (
                    <button onClick={handleCancel} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700">
                        <CancelIcon />
                        Hủy
                    </button>
                ) : (
                    <button onClick={handleGenerate} className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-indigo-700">
                        <GenerateIcon />
                        Tạo Âm Thanh
                    </button>
                )}
                
                <button 
                    onClick={handleAddToLibrary} 
                    disabled={!lastGeneratedAudioRef.current}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                    Thêm vào Thư viện
                </button>
            </div>
        </div>
    );
};
