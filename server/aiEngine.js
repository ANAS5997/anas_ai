import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './systemPrompt.js';
import { streamDemoResponse } from './demoChat.js';

const REQUEST_TIMEOUT = 35000;
const MAX_HISTORY = 12;
const MAX_TOKENS = 2048;

// ─── Build text-only messages for OpenAI-compatible APIs ─────────────────────
function trimMessages(messages) {
  return messages.slice(-MAX_HISTORY);
}

function buildTextMessages(messages) {
  const out = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const msg of trimMessages(messages)) {
    let content = msg.content || '';
    if (msg.attachments?.length) {
      for (const att of msg.attachments) {
        if (!att.type.startsWith('image/')) {
          content += `\n\n[ملف مرفق: ${att.name}]\n${att.data}`;
        }
      }
    }
    out.push({ role: msg.role, content });
  }
  return out;
}

// ─── Build multimodal messages for vision-capable OpenAI APIs ─────────────────
function buildOpenAIMessages(messages) {
  const formatted = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const msg of trimMessages(messages)) {
    if (msg.attachments && msg.attachments.length > 0) {
      const content = [{ type: 'text', text: msg.content || 'حلل هذه الصور:' }];
      for (const att of msg.attachments) {
        if (att.type.startsWith('image/')) {
          content.push({ type: 'image_url', image_url: { url: att.data } });
        } else {
          content.push({ type: 'text', text: `\n\n[ملف مرفق: ${att.name}]\n${att.data}` });
        }
      }
      formatted.push({ role: msg.role, content });
    } else {
      formatted.push({ role: msg.role, content: msg.content || '' });
    }
  }
  return formatted;
}

// ─── Gemini streaming (vision-capable) ───────────────────────────────────────
function base64ToGenerativePart(dataUrl) {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  return { inlineData: { data: matches[2], mimeType: matches[1] } };
}

async function streamGemini(apiKey, model, messages, res) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const trimmed = trimMessages(messages);
  const gemini = genAI.getGenerativeModel({
    model: model || 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = [];
  for (let i = 0; i < trimmed.length - 1; i++) {
    const m = trimmed[i];
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts = [{ text: m.content || '' }];
    if (m.attachments) {
      for (const att of m.attachments) {
        if (att.type.startsWith('image/')) {
          const part = base64ToGenerativePart(att.data);
          if (part) parts.push(part);
        } else {
          parts.push({ text: `\n\n[ملف مرفق: ${att.name}]\n${att.data}` });
        }
      }
    }
    history.push({ role, parts });
  }

  const lastMsg = trimmed[trimmed.length - 1];
  const lastMsgParts = [{ text: lastMsg?.content || 'حلل المرفقات:' }];
  if (lastMsg?.attachments) {
    for (const att of lastMsg.attachments) {
      if (att.type.startsWith('image/')) {
        const part = base64ToGenerativePart(att.data);
        if (part) lastMsgParts.push(part);
      } else {
        lastMsgParts.push({ text: `\n\n[ملف مرفق: ${att.name}]\n${att.data}` });
      }
    }
  }

  const chat = gemini.startChat({ history });
  const result = await chat.sendMessageStream(lastMsgParts);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

// ─── OpenAI-compatible stream helper ─────────────────────────────────────────
async function pipeStream(stream, res) {
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

async function createOpenAIStream(client, model, messages, useVision = false) {
  return client.chat.completions.create({
    model,
    messages: useVision ? buildOpenAIMessages(messages) : buildTextMessages(messages),
    stream: true,
    temperature: 0.7,
    max_tokens: MAX_TOKENS,
  });
}

// ─── Free Hugging Face inference (no key required) ───────────────────────────
async function streamHuggingFace(messages, res) {
  const MODELS = [
    'Qwen/Qwen2.5-72B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
  ];

  const textMsgs = buildTextMessages(messages);
  const prompt = textMsgs
    .map((m) => (m.role === 'system' ? `[System]: ${m.content}` : `[${m.role}]: ${m.content}`))
    .join('\n');

  for (const model of MODELS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: MAX_TOKENS, temperature: 0.7, return_full_text: false },
            stream: false,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (!response.ok) continue;

      const data = await response.json();
      let text = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        text = data[0].generated_text;
      } else if (data?.generated_text) {
        text = data.generated_text;
      }
      if (!text) continue;

      // Stream word by word for better UX
      const words = text.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        await new Promise((r) => setTimeout(r, 25));
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

// ─── Free Pollinations (no key) ──────────────────────────────────────────────
async function streamPollinations(messages, res) {
  const POLLINATIONS_MODELS = ['openai', 'openai-fast', 'qwen', 'mistral', 'llama'];

  for (const model of POLLINATIONS_MODELS) {
    try {
      const client = new OpenAI({
        apiKey: 'free',
        baseURL: 'https://text.pollinations.ai/openai',
        timeout: REQUEST_TIMEOUT,
      });

      const stream = await client.chat.completions.create({
        model,
        messages: buildTextMessages(messages),
        stream: true,
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
      });

      await pipeStream(stream, res);
      return true;
    } catch (err) {
      // 429 rate limit - try next model
      if (err?.status === 429 || err?.message?.includes('429')) continue;
      continue;
    }
  }
  return false;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function streamAIResponse(messages, res, clientGeminiKey, clientOpenaiKey) {
  const finalOpenaiKey = clientOpenaiKey || process.env.OPENAI_API_KEY;
  const finalGeminiKey = clientGeminiKey || process.env.GEMINI_API_KEY;

  // 1️⃣ User-provided or env OpenAI key (GPT-4o, supports vision)
  if (finalOpenaiKey) {
    try {
      const client = new OpenAI({
        apiKey: finalOpenaiKey,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        timeout: REQUEST_TIMEOUT,
      });
      const hasImages = messages.some((m) =>
        m.attachments?.some((a) => a.type.startsWith('image/'))
      );
      const stream = await createOpenAIStream(
        client,
        process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        hasImages
      );
      await pipeStream(stream, res);
      return;
    } catch (err) {
      console.error('OpenAI API failed:', err.message);
    }
  }

  // 2️⃣ User-provided or env Gemini key (vision-capable, free tier)
  if (finalGeminiKey) {
    try {
      await streamGemini(
        finalGeminiKey,
        process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        messages,
        res
      );
      return;
    } catch (err) {
      console.error('Gemini API failed:', err.message);
    }
  }

  // 3️⃣ Pollinations free (no key needed) — try first because it's fast
  console.log('Trying Pollinations free tier...');
  try {
    const ok = await streamPollinations(messages, res);
    if (ok) return;
  } catch {}

  // 4️⃣ Hugging Face free inference (no key needed) — powerful open models
  console.log('Trying Hugging Face free inference...');
  try {
    const ok = await streamHuggingFace(messages, res);
    if (ok) return;
  } catch {}

  // 5️⃣ Static demo fallback (always works)
  console.warn('All providers exhausted — using demo response.');
  await streamDemoResponse(messages, res);
}
