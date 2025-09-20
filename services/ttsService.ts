
import { Voice } from '../types';
import { GoogleGenAI } from "@google/genai";

// This helper function needs to be accessible to the service.
// We are defining it here for simplicity.
const splitTextIntoChunks = (text: string, maxLength: number): string[] => {
    const chunks: string[] = [];
    let remainingText = text.trim();

    while (remainingText.length > 0) {
        if (remainingText.length <= maxLength) {
            chunks.push(remainingText);
            break;
        }

        let chunk = remainingText.substring(0, maxLength);
        let lastSentenceEnd = -1;

        ['.', '?', '!', '\n'].forEach(punctuation => {
            const index = chunk.lastIndexOf(punctuation);
            if (index > lastSentenceEnd) {
                lastSentenceEnd = index;
            }
        });
        
        const splitIndex = lastSentenceEnd > -1 ? lastSentenceEnd + 1 : maxLength;
        
        chunks.push(remainingText.substring(0, splitIndex).trim());
        remainingText = remainingText.substring(splitIndex).trim();
    }
    return chunks.filter(chunk => chunk.length > 0);
};


type ProgressCallback = (status: { stage: 'generating' | 'merging' | 'done' | 'generating_ssml', current?: number, total?: number }) => void;

interface GenerateSpeechOptions {
    text: string;
    voice: Voice;
    speed: number;
    pitch: number;
    onProgress?: ProgressCallback;
    isSsml?: boolean;
    styleInstructions?: string;
}

interface TtsServiceConfig {
    apiKey: string;
}

const API_CHAR_LIMIT = 1500;
const SSML_CHAR_LIMIT = 5000; // Google Cloud TTS limit for SSML

/**
 * Service for Text-to-Speech generation.
 * It can use a professional external API (like Google Cloud TTS) if an API key is provided,
 * or fall back to the browser's built-in SpeechSynthesis API for basic functionality.
 */
class TtsService {
    private synthesis: SpeechSynthesis | null;
    private apiKey: string | null = null;
    private geminiAi: GoogleGenAI | null = null;
    private isCancelled = false;
    
    constructor() {
        this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    }

    public configure(config: TtsServiceConfig) {
        this.apiKey = config.apiKey;
        if (config.apiKey) {
            // Initialize Gemini client as well.
            // Note: In a real-world scenario, Gemini and Cloud TTS might use different keys/auth.
            // Here we assume the same key works for simplicity as per the app's design.
            try {
                this.geminiAi = new GoogleGenAI({ apiKey: config.apiKey });
            } catch (e) {
                console.error("Failed to initialize Gemini AI Client", e);
                this.geminiAi = null;
            }
        } else {
            this.geminiAi = null;
        }
    }

    public isApiConfigured(): boolean {
        return !!this.apiKey;
    }

    private base64ToBlob(base64: string, contentType = 'audio/mpeg'): Blob {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    }

    private async generateSsmlFromInstructions(text: string, instructions: string, voice: Voice): Promise<string> {
        if (!this.geminiAi) {
            throw new Error("Gemini AI client not initialized. Please configure the API Key.");
        }

        const prompt = `
            You are an expert SSML scriptwriter for Google Cloud Text-to-Speech, tasked with enhancing plain text based on a style instruction, while preserving the core characteristics of the specified base voice.

            **Core Task:** Convert the following plain text to SSML.
            **Constraint:** The SSML must subtly apply the style instruction WITHOUT altering the fundamental accent or regional dialect of the base voice. Your enhancements must sound natural.

            **Base Voice Profile:**
            - Name: "${voice.name}"
            - Gender: "${voice.gender}"
            - Region/Accent: "${voice.region}"

            **User's Style Instruction:**
            "${instructions}"

            **Rules for SSML Generation:**
            1.  **Preserve Accent:** Your primary goal is to add emotional style ON TOP of the existing accent. For example, a "Huế" voice must still sound like a "Huế" voice. Do NOT generate SSML that neutralizes or changes its regional characteristics.
            2.  **Subtle Prosody:** Use <prosody> for changes in rate, pitch, and volume. Avoid extreme or abrupt shifts unless the instruction is explicit (e.g., "shout", "whisper", "speak very fast").
            3.  **Natural Pauses:** Use <break> tags to create natural pauses in speech.
            4.  **Raw Output Only:** Your entire response must be the raw SSML string. It must start with <speak> and end with </speak>. Do NOT include any explanations, comments, or markdown formatting (like \`\`\`xml).

            **Plain Text to Convert:**
            "${text}"

            **Your SSML Output:**
        `;
        
        try {
            const response = await this.geminiAi.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const ssmlResult = response.text.trim();

            if (!ssmlResult.startsWith('<speak') || !ssmlResult.endsWith('</speak>')) {
                console.error("Gemini did not return valid SSML:", ssmlResult);
                throw new Error("AI could not generate a valid SSML script from the style instructions. Try rephrasing.");
            }
            return ssmlResult;
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            if (error instanceof Error && error.message.includes("AI could not generate")) {
                throw error;
            }
            throw new Error("An error occurred while generating the voice style script with AI.");
        }
    }


    /**
     * Generates speech using the configured API and returns the audio data as a Blob.
     * Handles text chunking and merging automatically for plain text.
     * Does not chunk SSML.
     * @returns {Promise<Blob>} A promise that resolves with the final audio Blob.
     */
    public async generateSpeech(options: GenerateSpeechOptions): Promise<Blob> {
        this.isCancelled = false;
        let effectiveText = options.text;
        let effectiveIsSsml = options.isSsml;

        if (!this.apiKey || !options.voice.googleApiName) {
            throw new Error("API key not configured or voice is not an API voice.");
        }
        
        if (options.styleInstructions && options.styleInstructions.trim() !== '') {
            options.onProgress?.({ stage: 'generating_ssml' });
            effectiveText = await this.generateSsmlFromInstructions(options.text, options.styleInstructions, options.voice);
            effectiveIsSsml = true; // The output from Gemini is always SSML
        }

        // Fix: Explicitly branch logic for SSML vs. plain text to ensure correct processing.
        if (effectiveIsSsml) {
            // --- SSML Path ---
            if (effectiveText.length > SSML_CHAR_LIMIT) {
                throw new Error(`SSML input is too long. Maximum is ${SSML_CHAR_LIMIT} characters.`);
            }
            if (this.isCancelled) throw new Error("Operation cancelled by user.");

            options.onProgress?.({ stage: 'generating', current: 1, total: 1 });
            const base64Audio = await this.generateSpeechWithApi({ ...options, text: effectiveText, isSsml: true });
            const audioBlob = this.base64ToBlob(base64Audio);
            options.onProgress?.({ stage: 'done' });
            return audioBlob;
            
        } else {
            // --- Plain Text Path ---
            const chunks = splitTextIntoChunks(effectiveText, API_CHAR_LIMIT);
            const audioBlobs: Blob[] = [];

            for (let i = 0; i < chunks.length; i++) {
                if (this.isCancelled) throw new Error("Operation cancelled by user.");
                
                options.onProgress?.({ stage: 'generating', current: i + 1, total: chunks.length });
                
                const chunkOptions = { ...options, text: chunks[i], isSsml: false };
                const base64Audio = await this.generateSpeechWithApi(chunkOptions);
                const audioBlob = this.base64ToBlob(base64Audio);
                audioBlobs.push(audioBlob);
            }
            
            if (this.isCancelled) throw new Error("Operation cancelled by user.");
            
            if (audioBlobs.length === 0) {
                 throw new Error("No audio content was generated.");
            }
            if (audioBlobs.length === 1) {
                options.onProgress?.({ stage: 'done' });
                return audioBlobs[0];
            }

            options.onProgress?.({ stage: 'merging' });
            const mergedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
            options.onProgress?.({ stage: 'done' });
            
            return mergedBlob;
        }
    }

    /**
     * Makes a real API call to Google Cloud Text-to-Speech.
     * @returns {Promise<string>} A promise that resolves with the base64 encoded audio string.
     */
    private async generateSpeechWithApi(options: Pick<GenerateSpeechOptions, 'text' | 'voice' | 'speed' | 'pitch' | 'isSsml'>): Promise<string> {
        const GOOGLE_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;
        
        const languageCode = options.voice.googleApiName?.startsWith('en-') ? 'en-US' : 'vi-VN';

        // FIX: Newer voices (like Neural2) require SSML.
        // This logic ensures that if we're using a Neural2 voice with plain text,
        // we automatically wrap the text in <speak> tags to make it a valid SSML request.
        const needsSsmlWrapper = options.voice.googleApiName?.includes('Neural2') && !options.isSsml;

        const requestBody = {
            input: (options.isSsml || needsSsmlWrapper) 
                ? { ssml: (needsSsmlWrapper ? `<speak>${options.text}</speak>` : options.text) } 
                : { text: options.text },
            voice: { languageCode: languageCode, name: options.voice.googleApiName },
            audioConfig: { audioEncoding: 'MP3', speakingRate: options.speed, pitch: options.pitch },
        };

        try {
            const response = await fetch(GOOGLE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error('Google TTS API Error:', errorBody);
                const apiMessage = errorBody?.error?.message || 'Lỗi API không xác định.';
                // Provide a more helpful, user-friendly error for common SSML issues.
                if (apiMessage.toLowerCase().includes('ssml')) {
                    throw new Error(`Invalid SSML. Newer voices like Neural2 require valid SSML.`);
                }
                throw new Error(apiMessage);
            }

            const data = await response.json();
            if (data.audioContent) return data.audioContent;
            
            throw new Error('API response did not contain audio content.');
        } catch (error) {
            console.error("Failed to fetch from Google TTS API:", error);
            if (error instanceof Error && error.message.includes('Invalid SSML')) {
                throw error;
            }
            throw new Error(`Failed to fetch from Google TTS API: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Uses the browser's built-in SpeechSynthesis API.
     * Note: SSML tags will be read literally by most browsers.
     * @returns {Promise<null>} A promise that resolves with null when speech is finished.
     */
    public generateSpeechWithBrowser(options: Omit<GenerateSpeechOptions, 'onProgress' | 'isSsml'>): Promise<null> {
        return new Promise((resolve, reject) => {
            if (!this.synthesis || !options.text.trim()) {
                return reject(new Error("Speech synthesis not available or text is empty."));
            }

            this.cancel();

            const utterance = new SpeechSynthesisUtterance(options.text);
            const browserVoices = this.synthesis.getVoices().filter(v => v.lang.startsWith('vi'));
            if (browserVoices.length > 0) {
                const voiceIndex = Math.abs(this.hashCode(options.voice.id)) % browserVoices.length;
                utterance.voice = browserVoices[voiceIndex];
            }

            // Browser pitch is 0-2, Google is -20 to 20. We'll stick to browser range for this.
            utterance.pitch = (options.pitch + 20) / 20; // Rough conversion
            utterance.rate = options.speed;
            utterance.onend = () => resolve(null);
            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                reject(new Error(`An error occurred during speech synthesis: ${event.error}`));
            };

            this.synthesis.speak(utterance);
        });
    }
    
    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return hash;
    }

    public cancel() {
        this.isCancelled = true;
        this.synthesis?.cancel();
    }
}

export const ttsService = new TtsService();