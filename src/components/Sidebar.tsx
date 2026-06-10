import { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  Edit2,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';

function getDateGroup(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const day = 86400000;

  if (diff < day) return 'اليوم';
  if (diff < 2 * day) return 'أمس';
  if (diff < 7 * day) return 'هذا الأسبوع';
  if (diff < 30 * day) return 'هذا الشهر';
  return 'أقدم';
}

export default function Sidebar() {
  const {
    conversations,
    activeConversationId,
    isSidebarOpen,
    setSidebarOpen,
    createConversation,
    setActiveConversation,
    deleteConversation,
    renameConversation,
  } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewChat = () => {
    createConversation();
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) renameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  // Filter + group conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const groups: Record<string, typeof conversations> = {};
    const order = ['اليوم', 'أمس', 'هذا الأسبوع', 'هذا الشهر', 'أقدم'];

    for (const conv of filteredConversations) {
      const group = getDateGroup(conv.updatedAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(conv);
    }

    return order.filter((g) => groups[g]?.length > 0).map((g) => ({
      label: g,
      items: groups[g],
    }));
  }, [filteredConversations]);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-[min(85vw,17rem)] sm:w-[17rem] sidebar-bg
          flex flex-col transition-transform duration-300
          pt-[env(safe-area-inset-top)]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-0'}
        `}
      >
        {/* Logo + New Chat Button */}
        <div className="p-3 sm:p-4 space-y-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-7 h-7 rounded-lg ai-logo flex items-center justify-center shrink-0">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="font-bold text-sm text-white">Anas AI</span>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 btn-primary py-2.5 text-sm"
          >
            <Plus size={16} />
            محادثة جديدة
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-full pl-8 pr-3 py-2 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              {searchQuery ? (
                <>
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-xs text-gray-500">لا توجد نتائج لـ "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-xs text-gray-500">لا توجد محادثات بعد</p>
                  <p className="text-xs text-gray-600 mt-1">ابدأ محادثة جديدة!</p>
                </>
              )}
            </div>
          ) : (
            groupedConversations.map(({ label, items }) => (
              <div key={label}>
                <p className="date-group-label">{label}</p>
                {items.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conv-item group ${activeConversationId === conv.id ? 'active' : ''}`}
                    onClick={() => handleSelect(conv.id)}
                  >
                    <MessageSquare
                      size={13}
                      className={`shrink-0 ${activeConversationId === conv.id ? 'text-violet-400' : 'text-gray-500'}`}
                    />

                    {editingId === conv.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent border-b border-violet-500 outline-none text-xs text-white"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`flex-1 text-xs truncate ${
                          activeConversationId === conv.id ? 'text-violet-300' : 'text-gray-300'
                        }`}
                      >
                        {conv.title}
                      </span>
                    )}

                    {/* Mobile: always show actions */}
                    <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Desktop: show on hover */}
                    <div className="hidden sm:group-hover:flex items-center gap-0.5 shrink-0">
                      {editingId === conv.id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); saveEdit(conv.id); }}
                          className="p-1 rounded-lg hover:bg-white/10 text-green-400"
                        >
                          <Check size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(conv.id, conv.title); }}
                          className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5">
          <p className="text-[10px] text-gray-600 text-center leading-relaxed">
            Anas AI v1.0 · Created by{' '}
            <span className="text-violet-500">Anas Ali</span>
          </p>
        </div>

        {/* Close button (mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 btn-icon lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </aside>
    </>
  );
}
