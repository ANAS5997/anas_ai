export default function handler(_req, res) {
  const mode = process.env.OPENAI_API_KEY
    ? 'premium'
    : process.env.GEMINI_API_KEY
      ? 'gemini'
      : 'free-ai';

  res.status(200).json({
    status: 'ok',
    name: 'Anas AI',
    creator: 'Anas Ali',
    mode,
    ready: true,
  });
}
