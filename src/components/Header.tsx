import { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Download,
  FileText,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTheme } from '../hooks/useTheme';
import { exportAsPdf, exportAsTxt } from '../lib/utils';
import SettingsModal from './SettingsModal';

export default function Header() {
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId)
  );
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="header-bg flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-3 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="btn-icon lg:hidden shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            {/* AI Logo */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl ai-logo flex items-center justify-center shadow-lg">
                <Sparkles size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm sm:text-base text-white dark:text-white light-theme-text truncate">
                  Anas AI
                </h1>
                {/* Status dot */}
                <div className="ai-status-dot shrink-0" title="Online" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                by Anas Ali
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {conversation && conversation.messages.length > 0 && (
            <div className="flex items-center gap-0.5 mr-1">
              <button
                onClick={() => exportAsTxt(conversation)}
                className="btn-icon"
                title="Export as TXT"
                aria-label="Export as TXT"
              >
                <FileText size={17} />
              </button>
              <button
                onClick={() => exportAsPdf(conversation)}
                className="btn-icon"
                title="Export as PDF"
                aria-label="Export as PDF"
              >
                <Download size={17} />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-icon mr-0.5"
            title="إعدادات المفاتيح البرمجية"
            aria-label="API Keys Settings"
          >
            <Settings size={17} />
          </button>

          <button
            onClick={toggleTheme}
            className="btn-icon"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} />
            )}
          </button>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
