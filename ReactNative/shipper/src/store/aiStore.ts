import { create } from 'zustand';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface AiState {
    messages: Message[];
    isLoading: boolean;
    addMessage: (msg: Message) => void;
    setIsLoading: (status: boolean) => void;
}

export const useAiStore = create<AiState>((set) => ({
    messages: [{ role: 'ai', content: 'Chào bạn! Tôi là trợ lý ShopTech. Tôi có thể giúp gì cho bạn?' }],
    isLoading: false,
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setIsLoading: (status) => set({ isLoading: status }),
}));