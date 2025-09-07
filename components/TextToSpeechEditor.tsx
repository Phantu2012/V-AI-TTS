import React, { useState, useEffect } from 'react';
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
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1H4a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        <path d="M10 9a2 2 0 100-4 2 2 0 000 4zM3 15a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
    </svg>
);

const TOTAL_CHAR_LIMIT = 200000;

export const TextToSpeechEditor: React.FC<TextToSpeechEditorProps> = ({ selectedVoice, speed, pitch, user, updateCharacterCount, onAddToLibrary, showToast }) => {
    const [text, setText] = useState('Chào mừng bạn đến với V-AI Voice Studio. Hãy nhập văn bản bạn muốn chuyển thành giọng nói tại đây.');
    const [generationStatus, setGenerationStatus] = useState<string | null>(null);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const [isSsmlMode, setIsSsmlMode] = useState(false);

    const isGenerating = generationStatus !== null;

    useEffect(() => {
        // This effect's cleanup will run ONLY when the component unmounts.
        // This prevents the race condition where starting a new generation cancels itself.
        return () => {
            ttsService.cancel();
        }
    }, []);
    
    const handleModeToggle = () => {
        const newMode = !isSsmlMode;
        setIsSsmlMode(newMode);
        // If switching to SSML and the text is the default placeholder, show the example
        if (newMode && text.startsWith('Chào mừng bạn')) {
            setText(SSML_EXAMPLE);
        }
    };


    const handleGenerate = async () => {
        if (!text.trim() || isGenerating) return;
        
        const totalCharCost = text.length;
        if (totalCharCost > TOTAL_CHAR_LIMIT) {
            showToast(`Văn bản quá dài. Giới hạn tối đa là ${TOTAL_CHAR_LIMIT.toLocaleString('vi-VN')} ký tự.`, 'error');
            return;
        }

        if (user.charactersUsed + totalCharCost > user.characterLimit) {
            showToast("Bạn đã vượt quá số ký tự cho phép trong tháng.", 'error');
            return;
        }

        if (generatedAudioUrl && generatedAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(generatedAudioUrl);
        }
        setGeneratedAudioUrl(null);

        const onProgress = (status: { stage: 'generating' | 'merging' | 'done', current?: number, total?: number }) => {
            if (status.stage === 'generating') {
                setGenerationStatus(`Đang tạo phần ${status.current}/${status.total}...`);
            } else if (status.stage === 'merging') {
                setGenerationStatus('Đang ghép các phần...');
            }
        };

        const useApi = ttsService.isApiConfigured() && selectedVoice.googleApiName && !selectedVoice.isCloned;
        
        try {
            if (useApi) {
                const audioBlob = await ttsService.generateSpeech({ text, voice: selectedVoice, speed, pitch, onProgress, isSsml: isSsmlMode });
                
                if (audioBlob) {
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setGeneratedAudioUrl(audioUrl);
                    
                    onAddToLibrary({
                        id: `audio-${Date.now()}`,
                        text: text,
                        voiceName: selectedVoice.name,
                        audioUrl: audioUrl,
                        createdAt: new Date(),
                    });
                }
            } else {
                 setGenerationStatus("Đang tạo...");
                 await ttsService.generateSpeechWithBrowser({ text, voice: selectedVoice, speed, pitch });
                 setGeneratedAudioUrl("generated_by_browser_tts");
                 if (selectedVoice.isCloned) {
                    showToast("Đã tạo âm thanh bằng giọng nói nhân bản (sử dụng giọng trình duyệt).", "success");
                 } else {
                    showToast("API Key không hợp lệ hoặc chưa nhập. Đã tạo âm thanh bằng giọng nói mặc định của trình duyệt.", "success");
                 }
            }
            updateCharacterCount(totalCharCost);

        } catch (error: any) {
            console.error("TTS generation error:", error);
            if (error.message !== "Operation cancelled by user.") {
                const userFriendlyMessage = error.message.includes("Cloud Text-to-Speech API has not been used")
                    ? "Lỗi API: Dịch vụ Text-to-Speech chưa được kích hoạt. Vui lòng kích hoạt trong Google Cloud Console và thử lại."
                    : `Lỗi tạo âm thanh: ${error.message}`;
                showToast(userFriendlyMessage, 'error');
            }
        } finally {
            setGenerationStatus(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Trình Soạn Thảo</h2>
                {/* SSML Toggle Switch */}
                <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${!isSsmlMode ? 'text-white' : 'text-gray-400'}`}>Văn bản thường</span>
                    <button
                        onClick={handleModeToggle}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-primary ${isSsmlMode ? 'bg-brand-primary' : 'bg-gray-600'}`}
                        aria-label="Toggle SSML mode"
                    >
                        <span
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isSsmlMode ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                    <span className={`text-sm font-medium ${isSsmlMode ? 'text-white' : 'text-gray-400'}`}>SSML</span>
                </div>
            </div>
            <div className="relative flex-grow">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập văn bản..."
                    className="w-full h-full p-4 bg-gray-900 border-2 border-gray-700 rounded-lg resize-none focus:outline-none focus:border-brand-primary text-gray-100 text-lg leading-relaxed font-mono"
                    maxLength={TOTAL_CHAR_LIMIT}
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                    {text.length.toLocaleString('vi-VN')} / {TOTAL_CHAR_LIMIT.toLocaleString('vi-VN')}
                </div>
            </div>
             {!isSsmlMode && (
                <p className="text-xs text-gray-500 mt-2">
                    Văn bản dài sẽ được tự động xử lý và ghép thành một file âm thanh hoàn chỉnh.
                </p>
            )}
            <div className="mt-4">
                <AudioPlayer audioUrl={generatedAudioUrl} generationStatus={generationStatus} />
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !text.trim()}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    <GenerateIcon />
                    {isGenerating ? (generationStatus || 'Đang tạo...') : 'Tạo Âm Thanh'}
                </button>
                <button
                    disabled={!generatedAudioUrl || isGenerating || generatedAudioUrl === "generated_by_browser_tts"}
                    onClick={() => {
                        if (generatedAudioUrl && generatedAudioUrl.startsWith('blob:')) {
                            const link = document.createElement('a');
                            link.href = generatedAudioUrl;
                            link.download = 'v-ai-voice.mp3';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }}
                    title={!generatedAudioUrl || generatedAudioUrl === "generated_by_browser_tts" ? "Tạo một file âm thanh để tải xuống" : "Tải xuống file MP3"}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Tải xuống (MP3)
                </button>
            </div>
        </div>
    );
};
