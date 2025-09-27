export enum Region {
  North = 'Miền Bắc',
  Central = 'Miền Trung',
  South = 'Miền Nam',
  US = 'Tiếng Anh - Mỹ',
  UK = 'Tiếng Anh - Anh',
}

export enum Gender {
  Male = 'Nam',
  Female = 'Nữ',
}

export interface Voice {
  id: string;
  name: string;
  gender: Gender;
  region: Region;
  description?: string; // Note for what content the voice is suitable for
  sampleAudio?: string; // URL to a sample audio file
  isCloned?: boolean;
  googleApiName?: string; // Specific voice name for Google Cloud TTS API
}

export enum Plan {
    Free = 'Free',
    Creator = 'Creator',
}

export interface User {
    email: string;
    plan: Plan;
    charactersUsed: number;
    characterLimit: number;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voiceName: string;
  audioUrl: string;
  createdAt: Date;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}
