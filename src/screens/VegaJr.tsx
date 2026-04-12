import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { useDailyState } from '../hooks/useDailyState';
import { useProfile } from '../hooks/useProfile';
import { useChat } from '../hooks/useChat';
import { useStorage } from '../hooks/useStorage';
import { KEYS } from '../lib/keys';
import { chatWithVega } from '../lib/haiku';
import type { AppSettings } from '../types';

const QUICK_ACTIONS = [
  "I'm stuck",
  "Motivate me",
  "What should I do next?",
  "Help me plan my day",
];

const DEFAULT_SETTINGS: AppSettings = {
  timerWorkMinutes: 25,
  timerBreakMinutes: 5,
  notificationsEnabled: false,
  hapticEnabled: true,
  seasonMode: 'auto',
};

export default function VegaJr() {
  const { state } = useDailyState();
  const { profile } = useProfile();
  const { messages, addMessage, canSend } = useChat();
  const { data: settings } = useStorage<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !canSend) return;

    const userMsg = text.trim();
    setInput('');
    addMessage('user', userMsg);
    setLoading(true);

    try {
      const response = await chatWithVega(userMsg, messages, state, profile, settings.apiKey);
      addMessage('assistant', response);
    } catch (err) {
      addMessage('assistant', "Can't connect right now. Check your API key in Settings, or try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] animate-slide-up">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-xl font-bold">Ask Vega Jr.</h1>
        <p className="text-xs text-[#555570]">Your ADHD coach. 2-3 sentences, always direct.</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-3">🤖</span>
            <p className="text-[#8888a0] text-sm mb-1">Hey! I'm Vega Jr.</p>
            <p className="text-[#555570] text-xs">I can see your tasks, energy, and mood. Ask me anything.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm
                ${msg.role === 'user'
                  ? 'bg-[#22d3ee] text-[#0a0a0f] rounded-br-md'
                  : 'bg-[#1a1a24] border border-[#2a2a3a] rounded-bl-md'}`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#555570] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#555570] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#555570] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length < 2 && (
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-[#2a2a3a] text-[#8888a0]
                hover:border-[#22d3ee] hover:text-[#22d3ee] transition-colors"
              onClick={() => sendMessage(action)}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-4 pt-2">
        {!canSend && (
          <p className="text-xs text-[#f43f5e] text-center mb-2">Daily message limit reached. Reset tomorrow.</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={canSend ? "Ask Vega Jr..." : "Limit reached"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            disabled={!canSend || loading}
            className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
              placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none disabled:opacity-40"
          />
          <Button
            size="md"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !canSend}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
