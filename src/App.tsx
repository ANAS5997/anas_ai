import { useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import InstallPrompt from './components/InstallPrompt';
import { useTheme } from './hooks/useTheme';
import { useChatStore } from './store/chatStore';

export default function App() {
  useTheme();
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  return (
    <div className="app-shell flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header />
        <ChatArea />
        <ChatInput />
      </main>
      <InstallPrompt />
    </div>
  );
}
