import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Volume2, RotateCcw, User, Bot } from 'lucide-react';
import type { Message } from '../types';
import { copyToClipboard } from '../lib/utils';
import { useTheme } from '../hooks/useTheme';
import { useTextToSpeech } from '../hooks/useSpeech';
import { useChatStore } from '../store/chatStore';
import { useChat } from '../hooks/useChat';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function CodeBlock({ code, language, isDark }: { code: string; language: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span>{language || 'code'}</span>
        <button onClick={handleCopy} className="code-copy-btn">
          {copied ? (
            <>
              <Check size={10} className="text-green-400" />
              <span className="text-green-400">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0 0 0.75rem 0.75rem',
          fontSize: '0.78rem',
          maxWidth: '100%',
          overflowX: 'auto',
          background: isDark ? '#1a1a2e' : undefined,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { speak, isSpeaking } = useTextToSpeech();
  const { regenerate } = useChat();
  const isLoading = useChatStore((s) => s.isLoading);
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId)
  );

  const isUser = message.role === 'user';
  const isLastAssistant =
    !isUser &&
    conversation?.messages[conversation.messages.length - 1]?.id === message.id;

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex gap-2.5 sm:gap-3 animate-fade-in max-w-full ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`
          w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md
          ${isUser
            ? 'bg-violet-600'
            : 'ai-logo'
          }
        `}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 max-w-[88%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`
            inline-block text-left rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 max-w-full
            break-words overflow-hidden
            ${isUser
              ? 'msg-user text-white rounded-tr-sm'
              : 'msg-ai rounded-tl-sm'
            }
          `}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2.5 space-y-2">
              {message.attachments.map((att) =>
                att.type.startsWith('image/') ? (
                  <img
                    key={att.id}
                    src={att.data}
                    alt={att.name}
                    className="max-w-full max-h-52 rounded-xl"
                  />
                ) : (
                  <div
                    key={att.id}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 flex items-center gap-1.5"
                  >
                    <span>📎</span>
                    <span className="truncate">{att.name}</span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Message Content */}
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
              {message.content}
            </p>
          ) : message.content ? (
            <div className="markdown-body text-xs sm:text-sm max-w-full overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (match) {
                      return (
                        <CodeBlock
                          code={codeString}
                          language={match[1]}
                          isDark={isDark}
                        />
                      );
                    }

                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : isStreaming ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="typing-dot w-2 h-2 rounded-full" />
              <div className="typing-dot w-2 h-2 rounded-full" />
              <div className="typing-dot w-2 h-2 rounded-full" />
            </div>
          ) : null}
        </div>

        {/* Action Bar (AI only) */}
        {!isUser && message.content && (
          <div className="flex items-center gap-1 mt-1.5 ml-0.5">
            <button onClick={handleCopy} className="btn-icon !p-1.5 !min-w-0 !min-h-0" title="نسخ">
              {copied ? (
                <Check size={13} className="text-green-400" />
              ) : (
                <Copy size={13} />
              )}
            </button>
            <button
              onClick={() => speak(message.content)}
              className={`btn-icon !p-1.5 !min-w-0 !min-h-0 ${isSpeaking ? 'text-violet-400' : ''}`}
              title="قراءة بصوت"
            >
              <Volume2 size={13} />
            </button>
            {isLastAssistant && !isLoading && (
              <button onClick={regenerate} className="btn-icon !p-1.5 !min-w-0 !min-h-0" title="إعادة توليد">
                <RotateCcw size={13} />
              </button>
            )}
            {/* Timestamp */}
            <span className="text-[10px] text-gray-600 ml-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* User timestamp */}
        {isUser && (
          <span className="text-[10px] text-gray-600 mt-1 mr-0.5">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
