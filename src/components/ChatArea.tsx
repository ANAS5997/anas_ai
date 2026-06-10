import { useEffect, useRef } from 'react';
import { Code2, Globe, Lightbulb, Calculator, PenLine, Sparkles } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';

const SUGGESTIONS = [
  {
    icon: Code2,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    text: 'اكتب كود Python لترتيب قائمة',
    label: 'برمجة',
  },
  {
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    text: 'ترجم هذه الجملة للإنجليزية: أهلاً بالعالم',
    label: 'ترجمة',
  },
  {
    icon: Calculator,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'ما هو الفرق بين AI و Machine Learning؟',
    label: 'تعليم',
  },
  {
    icon: PenLine,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'اكتب لي بريداً إلكترونياً احترافياً للتقديم على وظيفة',
    label: 'كتابة',
  },
  {
    icon: Lightbulb,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'اقترح أفكاراً لمشروع تقني مربح',
    label: 'أفكار',
  },
  {
    icon: Sparkles,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
    text: 'من صنعك؟',
    label: 'عن Anas AI',
  },
];

export default function ChatArea() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId)
  );
  const isLoading = useChatStore((s) => s.isLoading);
  const createConversation = useChatStore((s) => s.createConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isLoading]);

  const handleSuggestion = (text: string) => {
    if (!useChatStore.getState().activeConversationId) {
      createConversation();
    }
    window.dispatchEvent(
      new CustomEvent('anas-ai-suggest', { detail: text })
    );
  };

  if (!conversation || conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto welcome-gradient">
        {/* Logo / Icon */}
        <div className="animate-fade-in-scale mb-6 sm:mb-8">
          <div className="relative mx-auto w-fit">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ai-logo flex items-center justify-center shadow-2xl animate-glow">
              <Sparkles size={30} className="text-white sm:w-9 sm:h-9" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="animate-fade-in mb-2" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            مرحباً بك في{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #60a5fa)' }}
            >
              Anas AI
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto">
            مساعدك الذكي للبرمجة، التعليم، الترجمة، وحل المشكلات.
            <br />
            <span className="text-violet-400 text-xs">صُنع بواسطة Anas Ali</span>
          </p>
        </div>

        {/* Divider */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent my-6 sm:my-8" />

        {/* Suggestion Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl w-full animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.text}
              onClick={() => handleSuggestion(s.text)}
              className={`suggestion-card border ${s.bg} group`}
              style={{ animationDelay: `${0.1 * i + 0.2}s` }}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 shrink-0 ${s.color}`}>
                  <s.icon size={15} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition-colors line-clamp-2">
                    {s.text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-0">
      {conversation.messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={
            isLoading &&
            index === conversation.messages.length - 1 &&
            message.role === 'assistant'
          }
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
