import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { streamAIResponse } from './aiEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.get('/api/health', (_req, res) => {
  const mode = process.env.OPENAI_API_KEY
    ? 'premium'
    : process.env.GEMINI_API_KEY
      ? 'gemini'
      : 'free-ai';

  res.json({
    status: 'ok',
    name: 'Anas AI',
    creator: 'Anas Ali',
    mode,
    ready: true,
  });
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const clientGeminiKey = req.headers['x-gemini-key'];
    const clientOpenaiKey = req.headers['x-openai-key'];
    await streamAIResponse(messages, res, clientGeminiKey, clientOpenaiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (!res.headersSent) {
      return res.status(500).json({ error: message });
    }
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

app.use(express.static('dist'));

app.get('*', (_req, res) => {
  res.sendFile('index.html', { root: 'dist' }, (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Anas AI running on http://${HOST}:${PORT}`);
  if (process.env.OPENAI_API_KEY) console.log('AI: Custom OpenAI-compatible');
  else if (process.env.GEMINI_API_KEY) console.log('AI: Google Gemini');
  else console.log('AI: Free cloud models (Llama, Qwen, Pollinations)');
});
