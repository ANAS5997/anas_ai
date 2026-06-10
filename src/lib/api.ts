import type { Message } from '../types';
import { useChatStore } from '../store/chatStore';

// Puter.js type declaration (loaded via CDN in index.html)
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string | object[],
          options?: { model?: string; stream?: boolean }
        ) => Promise<{ text?: string } | AsyncIterable<{ text?: string }>>;
      };
    };
  }
}

// Build a conversation-formatted prompt for Puter
function buildPuterMessages(messages: Message[]): object[] {
  const msgs: object[] = [];
  for (const m of messages.slice(-12)) {
    let content = m.content || '';
    if (m.attachments?.length) {
      for (const att of m.attachments) {
        if (att.type.startsWith('image/')) {
          // Puter supports multimodal images
          msgs.push({
            role: m.role,
            content: [
              { type: 'text', text: content || 'صف الصورة وحلل ما فيها:' },
              { type: 'image_url', image_url: { url: att.data } },
            ],
          });
          continue;
        } else {
          content += `\n\n[ملف مرفق: ${att.name}]\n${att.data}`;
        }
      }
    }
    msgs.push({ role: m.role, content });
  }
  return msgs;
}

// Try Puter.js (free GPT-4o, no key needed, browser-only)
async function tryPuter(
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<boolean> {
  if (typeof window === 'undefined' || !window.puter?.ai) return false;

  try {
    const puterMsgs = buildPuterMessages(messages);
    const response = await window.puter.ai.chat(puterMsgs, {
      model: 'gpt-4o-mini',
      stream: true,
    });

    if (signal?.aborted) return true;

    // Handle streaming response
    if (Symbol.asyncIterator in (response as object)) {
      for await (const chunk of response as AsyncIterable<{ text?: string }>) {
        if (signal?.aborted) break;
        if (chunk?.text) onChunk(chunk.text);
      }
    } else {
      const text = (response as { text?: string }).text;
      if (text) onChunk(text);
    }
    return true;
  } catch (err) {
    console.warn('Puter.js failed:', err);
    return false;
  }
}

// Main streaming function
export async function streamChat(
  messages: Message[],
  onChunk: (content: string) => void,
  signal?: AbortSignal
): Promise<void> {
  // ── 1. Try Puter.js first (completely free, no key, uses GPT-4o) ──────────
  const puterOk = await tryPuter(messages, onChunk, signal);
  if (puterOk) return;

  // ── 2. Fall back to our server (which tries Pollinations, HF, demo) ───────
  const geminiKey = useChatStore.getState().geminiApiKey;
  const openaiKey = useChatStore.getState().openaiApiKey;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gemini-key': geminiKey || '',
      'x-openai-key': openaiKey || '',
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.content) onChunk(parsed.content);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}
