import React, { useState, useEffect, useRef } from 'react';
import { CLONING_SENTENCES } from '../constants';

interface VoiceCloningModalProps {
  onClose: () => void;
  onCloningComplete: (newVoiceName: string) => void;
}

enum Step {
  Intro,
  Choice,
  Record,
  Upload,
  Processing,
  Done,
}

const MicIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-5.93 5.93v.07z" clipRule="evenodd" />
    </svg>
);

const UploadIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);


const getRandomSentence = () => CLONING_SENTENCES[Math.floor(Math.random() * CLONING_SENTENCES.length)];

export const VoiceCloningModal: React.FC<VoiceCloningModalProps> = ({ onClose, onCloningComplete }) => {
  const [step, setStep] = useState<Step>(Step.Intro);
  const [sentence, setSentence] = useState('');
  const [voiceName, setVoiceName] = useState('Giọng Của Tôi');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("Bắt đầu quá trình...");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSentence(getRandomSentence());
  }, []);

  useEffect(() => {
    if (step === Step.Processing) {
      // Reset state for re-runs
      setProgress(0);
      setProcessingStatus("Đang phân tích đặc điểm âm thanh...");

      // Simulate stages
      setTimeout(() => {
          setProcessingStatus("Trích xuất các mẫu âm sắc...");
          setProgress(30);
      }, 750);
      
      setTimeout(() => {
          setProcessingStatus("Xây dựng mô hình giọng nói AI...");
          setProgress(70);
      }, 1500);

      setTimeout(() => {
          setProcessingStatus("Tinh chỉnh và hoàn tất...");
          setProgress(100);
      }, 2500);

      // Final transition to Done step
      const timer = setTimeout(() => {
          setStep(Step.Done);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [step]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      mediaRecorderRef.current.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
          setStep(Step.Processing);
      };

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Không thể truy cập micro. Vui lòng cấp quyền trong cài đặt trình duyệt.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'audio/mpeg') {
        // In a real app, you might validate duration here
        setSelectedFile(file);
    } else {
        alert("Vui lòng chọn một file MP3.");
    }
  };
  
  const startCloningFromFile = () => {
    if (!selectedFile) return;
    setStep(Step.Processing);
  }

  const handleFinish = () => {
    if (voiceName.trim()) {
        onCloningComplete(voiceName.trim());
    }
  };

  const renderContent = () => {
    switch(step) {
      case Step.Intro:
        return (
            <>
                <h3 className="text-xl font-bold text-white">Quy Trình và Cam Kết</h3>
                <p className="text-gray-300 mt-4">
                    Để đảm bảo an toàn và đạo đức, chúng tôi chỉ cho phép bạn nhân bản giọng nói của chính mình. Bằng việc tiếp tục, bạn cam kết rằng file âm thanh bạn sắp cung cấp là giọng nói của bạn và không mạo danh người khác.
                </p>
                <button onClick={() => setStep(Step.Choice)} className="mt-6 w-full text-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-indigo-700">
                    Tôi đã hiểu và bắt đầu
                </button>
            </>
        );
      case Step.Choice:
        return (
             <div className="text-center">
                <h3 className="text-xl font-bold text-white">Chọn Phương Pháp</h3>
                <p className="text-gray-300 mt-2 mb-6">Bạn muốn nhân bản giọng nói bằng cách nào?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setStep(Step.Record)} className="p-6 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-brand-primary">
                        <MicIcon className="h-12 w-12 text-brand-secondary mx-auto mb-2" />
                        <span className="font-semibold text-white">Ghi âm trực tiếp</span>
                    </button>
                    <button onClick={() => setStep(Step.Upload)} className="p-6 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-brand-primary">
                        <UploadIcon className="h-12 w-12 text-brand-secondary mx-auto mb-2" />
                        <span className="font-semibold text-white">Tải lên file MP3</span>
                    </button>
                </div>
            </div>
        );
      case Step.Record:
         return (
            <div className="text-center">
                <h3 className="text-xl font-bold text-white">Ghi Âm Mẫu Giọng</h3>
                <p className="text-gray-300 mt-2">Đọc to và rõ ràng câu văn dưới đây:</p>
                <p className="text-2xl font-semibold text-brand-secondary my-6 bg-gray-900 p-4 rounded-lg">
                    "{sentence}"
                </p>
                {!isRecording ? (
                    <button onClick={startRecording} className="mx-auto flex items-center justify-center w-20 h-20 bg-red-600 rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <MicIcon className="h-10 w-10 text-white" />
                    </button>
                ) : (
                    <button onClick={stopRecording} className="mx-auto flex items-center justify-center w-20 h-20 bg-gray-600 rounded-full hover:bg-gray-700 transition-colors shadow-lg animate-pulse">
                        <div className="w-8 h-8 bg-red-600 rounded-sm"></div>
                    </button>
                )}
                <p className="text-gray-400 mt-4">{!isRecording ? 'Nhấn để bắt đầu ghi âm' : 'Đang ghi âm...'}</p>
            </div>
        );
       case Step.Upload:
        return (
             <div className="text-center">
                <h3 className="text-xl font-bold text-white">Tải Lên File Âm Thanh</h3>
                <p className="text-gray-300 mt-2 mb-6">Chọn một file MP3 chất lượng tốt, không tạp âm, thời lượng dưới 1 phút.</p>
                <input type="file" accept=".mp3,audio/mpeg" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-brand-primary transition-colors">
                    <UploadIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <span className="font-semibold text-white">{selectedFile ? selectedFile.name : 'Chọn file để tải lên'}</span>
                </button>
                 <button onClick={startCloningFromFile} disabled={!selectedFile} className="mt-6 w-full text-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Bắt đầu nhân bản
                </button>
            </div>
        );
      case Step.Processing:
        return (
            <div className="text-center flex flex-col items-center justify-center h-48">
                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                    <MicIcon className="h-8 w-8 text-brand-primary relative z-10" />
                    <div className="absolute h-full w-full rounded-full bg-brand-primary/20"></div>
                    <div className="absolute h-full w-full rounded-full bg-brand-primary/20 animate-ping opacity-75"></div>
                </div>

                <p className="text-lg text-white font-semibold">{processingStatus}</p>
                <p className="text-sm text-gray-400">Quá trình này có thể mất vài phút.</p>

                <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                    <div 
                        className="bg-gradient-to-r from-brand-secondary to-brand-primary h-2 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        );
      case Step.Done:
        return (
             <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-bold text-white">Hoàn Thành!</h3>
                <p className="text-gray-300 mt-2 mb-4">Giọng nói của bạn đã được tạo. Hãy đặt tên cho nó.</p>
                <input 
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full p-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-brand-primary"
                />
                 <button 
                    onClick={handleFinish} 
                    disabled={!voiceName.trim()}
                    className="mt-6 w-full text-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Lưu Giọng Nói
                </button>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Nhân Bản Giọng Nói</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-8">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};