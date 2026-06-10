import { useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { streamChat } from '../lib/api';
import type { Attachment, Message } from '../types';

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);

  const {
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    removeLastAssistantMessage,
    setLoading,
    getActiveConversation,
  } = useChatStore();

  const streamResponse = useCallback(
    async (conversationId: string, apiMessages: Message[]) => {
      const assistantMessageId = addMessage(conversationId, {
        role: 'assistant',
        content: '',
      });

      setLoading(true);
      abortRef.current = new AbortController();

      try {
        let fullContent = '';
        await streamChat(
          apiMessages,
          (chunk) => {
            fullContent += chunk;
            updateMessage(conversationId, assistantMessageId, fullContent);
          },
          abortRef.current.signal
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';
        updateMessage(
          conversationId,
          assistantMessageId,
          `⚠️ **خطأ:** ${errorMessage}\n\nحاول مرة أخرى.`
        );
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [addMessage, updateMessage, setLoading]
  );

  const sendMessage = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = createConversation();
      }

      addMessage(conversationId, {
        role: 'user',
        content,
        attachments,
      });

      const conversation = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId);

      const apiMessages = conversation?.messages ?? [];

      await streamResponse(conversationId, apiMessages);
    },
    [activeConversationId, createConversation, addMessage, streamResponse]
  );

  const regenerate = useCallback(async () => {
    const conversation = getActiveConversation();
    if (!conversation || conversation.messages.length < 2) return;

    const messages = conversation.messages;
    if (messages[messages.length - 1].role !== 'assistant') return;

    removeLastAssistantMessage(conversation.id);
    const apiMessages = messages.slice(0, -1);
    await streamResponse(conversation.id, apiMessages);
  }, [getActiveConversation, removeLastAssistantMessage, streamResponse]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { sendMessage, regenerate, stopGeneration };
}
