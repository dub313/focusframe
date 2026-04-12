import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { KEYS } from '../lib/keys';
import type { ChatMessage } from '../types';

const MAX_MESSAGES_PER_DAY = 20;

export function useChat() {
  const { data: messages, set, loading } = useStorage<ChatMessage[]>(KEYS.CHAT, []);

  const messageCount = messages.length;
  const canSend = messages.filter((m) => m.role === 'user').length < MAX_MESSAGES_PER_DAY;

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    set((prev) => [...prev, msg]);
    return msg;
  }, [set]);

  const clearChat = useCallback(() => {
    set([]);
  }, [set]);

  return { messages, loading, addMessage, clearChat, canSend, messageCount };
}
