
import { Voice, Region, Gender, User, Plan } from './types';

// A valid, short audio clip encoded as a base64 data URL.
// This is the most reliable method to prevent any network or CORS-related playback errors
// for the "Listen Sample" feature.
const SPEECH_SAMPLE_URL = 'data:audio/wav;base64,UklGRrwDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YbIDAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKC..gAAgAAAABAAZGF0YXvJ/v//xP75/tD+8v7S/uj/2/5m/6T9Mf5a/gn9//3Z+z/76fpk+Vb2eO355yfnVd8p2mLTgtA+zJ7AZrhTq5CgX5Z5iG6DYXhVbU9wT2tLbEtsT3BNbVRyV3Ba';

// Fix: Add and export MOCK_USER, AVAILABLE_VOICES, and CLONING_SENTENCES
export const MOCK_USER: User = {
    email: 'user@v-ai.com',
    plan: Plan.Creator,
    charactersUsed: 150000,
    characterLimit: 500000,
};

export const AVAILABLE_VOICES: Voice[] = [
    {
      id: 'hn-female-le-minh',
      name: 'Lê Minh',
      gender: Gender.Female,
      region: Region.North,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Standard-A',
    },
    {
      id: 'hn-male-trung-kien',
      name: 'Trung Kiên',
      gender: Gender.Male,
      region: Region.North,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Standard-B',
    },
    {
      id: 'sg-female-linh-san',
      name: 'Linh San',
      gender: Gender.Female,
      region: Region.South,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Standard-C',
    },
    {
      id: 'sg-male-thanh-long',
      name: 'Thanh Long',
      gender: Gender.Male,
      region: Region.South,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Standard-D',
    },
    {
      id: 'hue-female-ngoc-huyen',
      name: 'Ngọc Huyền',
      gender: Gender.Female,
      region: Region.Central,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Wavenet-A',
    },
    {
      id: 'hue-male-gia-huy',
      name: 'Gia Huy',
      gender: Gender.Male,
      region: Region.Central,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Wavenet-B',
    },
    {
      id: 'sg-male-hoang-nam',
      name: 'Hoàng Nam (Kể chuyện)',
      gender: Gender.Male,
      region: Region.South,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Wavenet-D',
    },
    {
      id: 'sg-female-mai-chi',
      name: 'Mai Chi (Podcast)',
      gender: Gender.Female,
      region: Region.South,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Wavenet-C',
    },
    {
      id: 'vn-male-neural2-d-horror',
      name: 'Minh Tuấn (Truyện ma)',
      gender: Gender.Male,
      region: Region.South,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'vi-VN-Neural2-D',
    },
    {
      id: 'en-us-male-wavenet-d',
      name: 'David (Trầm ấm)',
      gender: Gender.Male,
      region: Region.US,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'en-US-Wavenet-D',
    },
    {
      id: 'en-us-male-studio-m',
      name: 'John (Studio)',
      gender: Gender.Male,
      region: Region.US,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'en-US-Studio-M',
    },
    {
      id: 'en-us-male-news-n',
      name: 'News Anchor (Rõ ràng)',
      gender: Gender.Male,
      region: Region.US,
      sampleAudio: SPEECH_SAMPLE_URL,
      googleApiName: 'en-US-News-N',
    },
];

export const CLONING_SENTENCES = [
    "V-AI có thể giúp bạn tạo ra các giọng nói nhân tạo chân thực.",
    "Trí tuệ nhân tạo đang thay đổi cách chúng ta tương tác với công nghệ.",
    "Bằng cách ghi âm giọng nói, bạn có thể tạo ra một phiên bản AI của chính mình.",
    "Công nghệ chuyển văn bản thành giọng nói ngày càng trở nên phổ biến.",
    "Chúng tôi cam kết bảo vệ dữ liệu và quyền riêng tư của người dùng.",
];

export const SSML_EXAMPLE = `<speak>Đây là một ví dụ về SSML. Bạn có thể thêm một khoảng nghỉ <break time="1s"/> và nhấn mạnh một <emphasis level="strong">từ</emphasis> cụ thể.</speak>`;
