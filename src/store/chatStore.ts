import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Conversation, Message, Attachment } from '../types';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  geminiApiKey: string;
  openaiApiKey: string;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
  setGeminiApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;

  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;

  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  removeLastAssistantMessage: (conversationId: string) => void;
  getActiveConversation: () => Conversation | undefined;
}

function generateTitle(content: string): string {
  const cleaned = content.trim().replace(/\s+/g, ' ');
  return cleaned.length > 40 ? cleaned.slice(0, 40) + '...' : cleaned || 'New Chat';
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
      theme: 'dark',
      geminiApiKey: '',
      openaiApiKey: '',

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setLoading: (loading) => set({ isLoading: loading }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),

      createConversation: () => {
        const id = uuidv4();
        const conversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          conversations: [conversation, ...s.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeConversationId =
            s.activeConversationId === id
              ? conversations[0]?.id ?? null
              : s.activeConversationId;
          return { conversations, activeConversationId };
        }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        })),

      addMessage: (conversationId, message) => {
        const id = uuidv4();
        const newMessage: Message = {
          ...message,
          id,
          timestamp: Date.now(),
        };

        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const isFirstUserMessage =
              message.role === 'user' && c.messages.length === 0;
            return {
              ...c,
              title: isFirstUserMessage ? generateTitle(message.content) : c.title,
              messages: [...c.messages, newMessage],
              updatedAt: Date.now(),
            };
          }),
        }));

        return id;
      },

      updateMessage: (conversationId, messageId, content) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content } : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      removeLastAssistantMessage: (conversationId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const messages = [...c.messages];
            if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
              messages.pop();
            }
            return { ...c, messages, updatedAt: Date.now() };
          }),
        })),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },
    }),
    {
      name: 'anas-ai-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        theme: state.theme,
        geminiApiKey: state.geminiApiKey,
        openaiApiKey: state.openaiApiKey,
      }),
    }
  )
);

export type { Attachment };
