// Test Puter.js free AI (keyless, user-pays model)
// Puter provides GPT-4o for free via browser JS SDK
// We can use it directly from the browser side, no server needed

// Test mlvoca API
async function testMlvoca() {
  try {
    const res = await fetch('https://mlvoca.com/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-r1', prompt: 'Say hi', stream: false }),
    });
    console.log('mlvoca status:', res.status);
    const text = await res.text();
    console.log('mlvoca body:', text.slice(0, 200));
  } catch (err) {
    console.log('mlvoca error:', err.message);
  }
}

// Test Cloudflare AI (free, no key for public models)
async function testCloudflare() {
  try {
    const res = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/demo/ai/run/@cf/meta/llama-3-8b-instruct',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Say hi' }],
          stream: false,
        }),
      }
    );
    console.log('Cloudflare status:', res.status);
    const text = await res.text();
    console.log('Cloudflare body:', text.slice(0, 200));
  } catch (err) {
    console.log('Cloudflare error:', err.message);
  }
}

// Test AIML API free tier (check if keyless works)
async function testAimlapi() {
  try {
    const res = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: 'Say hi' }],
        stream: false,
      }),
    });
    console.log('aimlapi status:', res.status);
    const text = await res.text();
    console.log('aimlapi body:', text.slice(0, 200));
  } catch (err) {
    console.log('aimlapi error:', err.message);
  }
}

await testMlvoca();
await testCloudflare();
await testAimlapi();
