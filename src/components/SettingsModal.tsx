import { X, Key, Trash2, Check, ExternalLink } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    geminiApiKey,
    openaiApiKey,
    setGeminiApiKey,
    setOpenaiApiKey,
    conversations,
  } = useChatStore();

  const [geminiInput, setGeminiInput] = useState(geminiApiKey);
  const [openaiInput, setOpenaiInput] = useState(openaiApiKey);
  const [savedGemini, setSavedGemini] = useState(false);
  const [savedOpenai, setSavedOpenai] = useState(false);

  if (!isOpen) return null;

  const handleSaveGemini = () => {
    setGeminiApiKey(geminiInput.trim());
    setSavedGemini(true);
    setTimeout(() => setSavedGemini(false), 2000);
  };

  const handleSaveOpenai = () => {
    setOpenaiApiKey(openaiInput.trim());
    setSavedOpenai(true);
    setTimeout(() => setSavedOpenai(false), 2000);
  };

  const handleDeleteAllConversations = () => {
    if (confirm('هل أنت متأكد من رغبتك في حذف جميع المحادثات بشكل نهائي؟')) {
      // Clear all conversations
      useChatStore.setState({ conversations: [], activeConversationId: null });
      alert('تم حذف جميع المحادثات بنجاح.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900/90 border border-violet-500/20 rounded-2xl shadow-2xl p-6 relative text-right" dir="rtl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>الإعدادات المتقدمة</span>
        </h2>

        {/* Keys Section */}
        <div className="space-y-5">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="font-semibold text-gray-200 flex items-center gap-1.5">
                <Key size={14} className="text-violet-400" />
                <span>مفتاح Gemini API (مجاني وموصى به للذكاء والصور)</span>
              </label>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>احصل على مفتاح مجاني</span>
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-violet-500/10 rounded-xl text-white text-sm text-left font-mono focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
              />
              <button
                onClick={handleSaveGemini}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  savedGemini
                    ? 'bg-emerald-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                {savedGemini ? <Check size={14} /> : null}
                <span>{savedGemini ? 'تم الحفظ' : 'حفظ'}</span>
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="font-semibold text-gray-200 flex items-center gap-1.5">
                <Key size={14} className="text-pink-400" />
                <span>مفتاح OpenAI API (اختياري)</span>
              </label>
              <a
                href="https://platform.openai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>موقع OpenAI</span>
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={openaiInput}
                onChange={(e) => setOpenaiInput(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-violet-500/10 rounded-xl text-white text-sm text-left font-mono focus:outline-none focus:border-pink-500 transition-colors placeholder:text-gray-600"
              />
              <button
                onClick={handleSaveOpenai}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  savedOpenai
                    ? 'bg-emerald-600 text-white'
                    : 'bg-pink-600 hover:bg-pink-500 text-white'
                }`}
              >
                {savedOpenai ? <Check size={14} /> : null}
                <span>{savedOpenai ? 'تم الحفظ' : 'حفظ'}</span>
              </button>
            </div>
          </div>

          <hr className="border-violet-500/10 my-4" />

          {/* Delete All Conversations */}
          <div className="flex items-center justify-between bg-red-950/20 border border-red-500/20 rounded-xl p-4">
            <div>
              <h4 className="text-sm font-semibold text-red-200">مسح كافة المحادثات</h4>
              <p className="text-xs text-red-400/80 mt-1">سيتم إزالة جميع سجلات الدردشة نهائياً من المتصفح.</p>
            </div>
            <button
              onClick={handleDeleteAllConversations}
              disabled={conversations.length === 0}
              className="px-3.5 py-2 rounded-xl bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <Trash2 size={13} />
              <span>حذف الكل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
