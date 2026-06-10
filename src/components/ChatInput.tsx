import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  X,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '../store/chatStore';
import { useChat } from '../hooks/useChat';
import { useSpeechRecognition } from '../hooks/useSpeech';
import { readFileAsBase64, readFileAsText } from '../lib/utils';
import type { Attachment } from '../types';

const TEXT_EXTENSIONS = ['.txt', '.md', '.json', '.js', '.ts', '.py', '.html', '.css', '.csv', '.xml', '.yaml', '.yml'];
const MAX_CHARS = 4000;

export default function ChatInput() {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isLoading = useChatStore((s) => s.isLoading);
  const { sendMessage, stopGeneration } = useChat();
  const { isListening, transcript, startListening, stopListening, isSupported: speechSupported } =
    useSpeechRecognition();

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setInput('');
      sendMessageRef.current(detail);
    };
    window.addEventListener('anas-ai-suggest', handler);
    return () => window.removeEventListener('anas-ai-suggest', handler);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = window.innerWidth < 640 ? 120 : 200;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  }, [input]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content && attachments.length === 0) return;
    if (isLoading) return;

    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await sendMessage(
      content || 'Please analyze the attached file(s).',
      attachments.length > 0 ? attachments : undefined
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (files: FileList | null, type: 'file' | 'image') => {
    if (!files) return;

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const isImage = type === 'image' || file.type.startsWith('image/');
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (isImage) {
        const data = await readFileAsBase64(file);
        newAttachments.push({ id: uuidv4(), name: file.name, type: file.type, data });
      } else if (TEXT_EXTENSIONS.includes(ext) || file.type.startsWith('text/')) {
        const text = await readFileAsText(file);
        newAttachments.push({
          id: uuidv4(),
          name: file.name,
          type: file.type || 'text/plain',
          data: text.slice(0, 50000),
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const charCount = input.length;
  const charCountClass =
    charCount > MAX_CHARS * 0.9
      ? 'char-counter danger'
      : charCount > MAX_CHARS * 0.7
      ? 'char-counter warn'
      : 'char-counter';

  const canSend = (input.trim() || attachments.length > 0) && !isLoading;

  return (
    <div className="chat-input-bg px-3 py-2.5 sm:px-5 sm:py-3.5 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5 max-w-3xl mx-auto">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 border border-white/10 text-xs max-w-full"
            >
              {att.type.startsWith('image/') ? (
                <img src={att.data} alt={att.name} className="w-6 h-6 rounded object-cover shrink-0" />
              ) : (
                <Paperclip size={12} className="shrink-0 text-violet-400" />
              )}
              <span className="truncate max-w-[100px] text-gray-300">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="text-gray-500 hover:text-red-400 shrink-0 transition-colors ml-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Mobile toolbar */}
        <div className="flex items-center gap-1 sm:hidden mb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-icon !p-2 !min-w-0 !min-h-0"
            title="رفع ملف"
            disabled={isLoading}
          >
            <Paperclip size={17} />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="btn-icon !p-2 !min-w-0 !min-h-0"
            title="رفع صورة"
            disabled={isLoading}
          >
            <ImageIcon size={17} />
          </button>
          {speechSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`btn-icon !p-2 !min-w-0 !min-h-0 ${isListening ? 'text-red-400 animate-pulse' : ''}`}
              title={isListening ? 'إيقاف الاستماع' : 'إدخال صوتي'}
              disabled={isLoading}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}
        </div>

        {/* Main Input Row */}
        <div className="flex items-end gap-2">
          {/* Desktop toolbar */}
          <div className="hidden sm:flex gap-0.5 shrink-0 pb-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-icon"
              title="رفع ملف"
              disabled={isLoading}
            >
              <Paperclip size={18} />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="btn-icon"
              title="رفع صورة"
              disabled={isLoading}
            >
              <ImageIcon size={18} />
            </button>
            {speechSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`btn-icon ${isListening ? 'text-red-400 animate-pulse' : ''}`}
                title={isListening ? 'إيقاف الاستماع' : 'إدخال صوتي'}
                disabled={isLoading}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك لـ Anas AI..."
              rows={1}
              disabled={isLoading}
              className="input-field w-full resize-none rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3
                         text-sm sm:text-sm leading-relaxed
                         disabled:opacity-40 transition-all"
            />
          </div>

          {/* Send / Stop Button */}
          {isLoading ? (
            <button
              onClick={stopGeneration}
              className="touch-target p-2.5 sm:p-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-all shrink-0 border border-red-500/30"
              title="إيقاف التوليد"
            >
              <Square size={17} className="sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!canSend}
              className="send-btn touch-target p-2.5 sm:p-3 rounded-xl text-white shrink-0"
              title="إرسال"
            >
              <Send size={17} className="sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Bottom row: disclaimer + char count */}
        <div className="flex items-center justify-between mt-2 px-0.5">
          <p className="hidden sm:block text-[10px] text-gray-600">
            Anas AI قد يرتكب أخطاء. تحقق من المعلومات المهمة.
          </p>
          {charCount > 0 && (
            <span className={`${charCountClass} mr-auto sm:mr-0`}>
              {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={TEXT_EXTENSIONS.join(',')}
        multiple
        onChange={(e) => handleFileUpload(e.target.files, 'file')}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e.target.files, 'image')}
      />
    </div>
  );
}
