const CREATOR_REPLY =
  'أنا **Anas AI**، مساعد ذكاء اصطناعي مخصص تم إنشاؤه وتطويره بواسطة **Anas Ali**.';

function getLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content.trim();
  }
  return '';
}

function normalize(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function includesAny(text, words) {
  return words.some((w) => text.includes(w));
}

function generateResponse(messages) {
  const raw = getLastUserMessage(messages);
  const text = normalize(raw);
  const isArabic = /[\u0600-\u06FF]/.test(raw);

  if (
    includesAny(text, ['من صنعك', 'من طورك', 'من انشأك', 'من أنشأك', 'من بناك', 'من عملك']) ||
    includesAny(text, ['who created you', 'who made you', 'who built you', 'your creator'])
  ) {
    return `${CREATOR_REPLY}\n\n${isArabic ? '**Anas Ali** هو مطوّر برمجيات ومهتم بالذكاء الاصطناعي والأمن السيبراني والأتمتة.' : '**Anas Ali** is a software developer passionate about AI, cybersecurity, and automation.'}`;
  }

  if (includesAny(text, ['اهلا', 'أهلا', 'مرحبا', 'مرحباً', 'السلام', 'هاي', 'هلا', 'hello', 'hi', 'hey'])) {
    return isArabic
      ? `أهلاً وسهلاً! 👋 يسعدني تواصلك معي.\n\nأنا **Anas AI** — مساعدك الذكي. أستطيع مساعدتك في:\n\n✅ البرمجة وحل المشاكل التقنية\n✅ الشرح والتعليم خطوة بخطوة\n✅ الترجمة والكتابة\n✅ الرياضيات والتحليل\n✅ الأفكار والأعمال\n\n**كيف يمكنني مساعدتك؟**`
      : `Hello! 👋 Great to meet you.\n\nI'm **Anas AI** — your intelligent assistant. I can help with:\n\n✅ Coding & debugging\n✅ Step-by-step explanations\n✅ Translation & writing\n✅ Math & analysis\n✅ Business ideas\n\n**How can I help you?**`;
  }

  const mathMatch = raw.match(/(\d+(?:\.\d+)?)\s*([+\-*/×÷x])\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const b = parseFloat(mathMatch[3]);
    const ops = { '+': a + b, '-': a - b, '*': a * b, x: a * b, '×': a * b, '/': b ? a / b : '∞', '÷': b ? a / b : '∞' };
    return isArabic
      ? `## الحل\n\n**${mathMatch[1]} ${op} ${mathMatch[3]} = ${ops[op]}**`
      : `## Solution\n\n**${mathMatch[1]} ${op} ${mathMatch[3]} = ${ops[op]}**`;
  }

  if (includesAny(text, ['python', 'كود', 'code', 'برمجة', 'javascript', 'html'])) {
    return isArabic
      ? `## مثال برمجي\n\n\`\`\`python\n# برنامج من Anas AI\ndef main():\n    name = input("ما اسمك؟ ")\n    print(f"أهلاً {name}! أنا Anas AI جاهز لمساعدتك.")\n\nif __name__ == "__main__":\n    main()\n\`\`\`\n\n**اكتب طلبك بالتفصيل** (مثال: "اكتب برنامج لحساب المعدل التراكمي") وسأكتب لك الكود كاملاً.`
      : `## Code Example\n\n\`\`\`python\n# Program by Anas AI\ndef main():\n    name = input("Your name? ")\n    print(f"Hello {name}! I'm Anas AI, ready to help.")\n\nif __name__ == "__main__":\n    main()\n\`\`\`\n\n**Describe what you need** and I'll write complete code for you.`;
  }

  return isArabic
    ? `## بخصوص سؤالك\n\n> "${raw}"\n\nأنا **Anas AI** — مساعد ذكي من تطوير **Anas Ali**.\n\nللحصول على أفضل إجابة، حاول:\n- تحديد طلبك بوضوح\n- ذكر التفاصيل المهمة\n- طلب أمثلة أو كود إن احتجت\n\n**مثال:** "اشرح لي الذكاء الاصطناعي ببساطة" أو "اكتب إيميل رسمي للتقديم على وظيفة"\n\nأنا جاهز — ماذا تريد بالتحديد؟`
    : `## About your question\n\n> "${raw}"\n\nI'm **Anas AI**, developed by **Anas Ali**.\n\nFor the best answer, try:\n- Being specific about what you need\n- Including relevant details\n- Asking for examples or code if needed\n\n**Example:** "Explain AI simply" or "Write a professional job application email"\n\nI'm ready — what exactly do you need?`;
}

export async function streamDemoResponse(messages, res) {
  const content = generateResponse(messages);

  for (let i = 0; i < content.length; i += 40) {
    res.write(`data: ${JSON.stringify({ content: content.slice(i, i + 40) })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
