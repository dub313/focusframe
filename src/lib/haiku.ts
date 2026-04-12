import type { DailyState, Profile, ChatMessage } from '../types';

function buildSystemPrompt(state: DailyState, profile: Profile): string {
  const batteryRemaining = Math.max(0, state.batteryMax - state.batteryUsed);
  const tasksCompleted = state.tasks.filter((t) => t.completed).length;
  const tasksTotal = state.tasks.length;

  return `You are Vega Jr., a concise ADHD coach for a teen athlete. You see his current state and help him stay focused without being preachy.

Current state:
- Energy: ${state.energy}/5
- Battery: ${batteryRemaining}/${state.batteryMax} bars remaining
- Training today: ${state.training.type}${state.training.time ? ` at ${state.training.time}` : ''}
- Mood: ${state.mood.level}/5
- Tasks: ${tasksCompleted}/${tasksTotal} done
- Surge: ${state.surgeActive ? `ACTIVE (${state.surgeTaskCount} surge tasks)` : 'not active'}
- Today's XP: ${state.xpEarnedToday}
- Streak: ${profile.currentStreak} days
- Total XP: ${profile.totalXP}

Rules:
- Keep responses to 2-3 sentences max
- Be direct, encouraging, never preachy
- Use sports metaphors when natural
- If energy/mood is low: validate it, suggest quick wins or breathing
- If surge is active: fuel the momentum
- If no tasks done yet: help with getting started (task initiation is the hardest part for ADHD)
- Never say "I understand" or generic platitudes
- Be specific and actionable`;
}

export async function chatWithVega(
  userMessage: string,
  chatHistory: ChatMessage[],
  state: DailyState,
  profile: Profile,
  apiKey?: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(state, profile);

  // Build messages array from chat history (last 10 messages for context)
  const messages = chatHistory.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: userMessage });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages,
      anthropic_version: '2023-06-01',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? 'Something went wrong. Try again.';
}
