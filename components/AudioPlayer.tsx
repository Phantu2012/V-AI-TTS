import React from 'react';

interface AudioPlayerProps {
    audioUrl: string | null;
    generationStatus: string | null;
}

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
);

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, generationStatus }) => {
    const isGenerating = generationStatus !== null;

    if (isGenerating) {
        return (
            <div className="w-full bg-gray-700/50 rounded-lg p-4 flex items-center space-x-4">
                <LoadingSpinner />
                <div className="flex-grow">
                    <p className="font-semibold text-white">{generationStatus}</p>
                    <p className="text-sm text-gray-400">Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    if (!audioUrl) {
         return (
            <div className="w-full bg-gray-700/50 rounded-lg p-4 flex items-center space-x-4">
                 <div className="w-10 h-10 flex items-center justify-center bg-gray-600 rounded-full">
                    <PlayIcon />
                 </div>
                <div className="flex-grow">
                    <p className="font-semibold text-white">Âm thanh sẽ được phát ở đây</p>
                    <p className="text-sm text-gray-400">Nhấn "Tạo Âm Thanh" để bắt đầu</p>
                </div>
            </div>
        );
    }
    
    if (audioUrl.startsWith('data:audio/mp3;base64,')) {
        return (
            <div className="w-full bg-gray-700/50 rounded-lg p-3">
                <audio
                    controls
                    autoPlay
                    src={audioUrl}
                    className="w-full"
                >
                    Trình duyệt của bạn không hỗ trợ phát âm thanh.
                </audio>
            </div>
        );
    }

    // This handles the browser TTS success case where no file is generated
    return (
        <div className="w-full bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-center space-x-4">
             <div className="w-10 h-10 flex items-center justify-center bg-green-500/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
             </div>
            <div className="flex-grow">
                <p className="font-semibold text-white">Âm thanh đã được tạo thành công!</p>
                <p className="text-sm text-gray-300">Âm thanh đã được phát. Nhấn tạo lại để nghe phiên bản mới.</p>
            </div>
        </div>
    );
};