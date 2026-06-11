import { streamAIResponse } from '../server/aiEngine.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

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
}
