'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Download,
  ChevronDown,
  Bot,
  User,
  Loader2,
  Zap,
  Sparkles,
} from 'lucide-react';
import {
  useChatModels,
  useChatHistory,
  postChat,
  postClearChat,
  ChatMessage,
} from '@/lib/api';

const QUICK_PILLS = [
  'Why this trade?',
  "What's the risk?",
  'Second opinion?',
  'Show the math',
];

const MODEL_ICONS: Record<string, React.ElementType> = {
  groq: Zap,
  gemini: Sparkles,
};

function modelIcon(provider: string) {
  const key = provider?.toLowerCase() ?? '';
  if (key.includes('groq')) return Zap;
  if (key.includes('gemini')) return Sparkles;
  return Bot;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({
  msg,
  modelName,
}: {
  msg: ChatMessage;
  modelName?: string;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs ${
          isUser ? 'bg-primary/20 text-primary' : 'bg-[#21262D] text-muted-foreground'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Header */}
        <div className={`flex items-center gap-1.5 text-[10px] text-muted-foreground ${isUser ? 'flex-row-reverse' : ''}`}>
          <span>{isUser ? 'You' : modelName ?? 'AI'}</span>
          {msg.timestamp && (
            <span className="opacity-60">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-[#21262D] text-foreground border border-[#30363D] rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
      </div>
    </div>
  );
}

export default function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const { data: modelsData } = useChatModels();
  const { data: historyData, mutate: mutateHistory } = useChatHistory();
  const models = modelsData?.models ?? [];

  // Seed default model
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed history once
  useEffect(() => {
    if (historyData?.messages && messages.length === 0) {
      setMessages(historyData.messages);
    }
  }, [historyData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Close model dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const reply = await postChat({ message: text.trim(), model: selectedModel });
        setMessages((prev) => [...prev, reply]);
      } catch (err: any) {
        const errMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${err.message ?? 'Failed to reach AI'}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading, selectedModel]
  );

  async function handleClear() {
    try {
      await postClearChat();
      setMessages([]);
      await mutateHistory();
    } catch {}
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeModel = models.find((m) => m.id === selectedModel);
  const ModelIcon = activeModel ? modelIcon(activeModel.provider) : Bot;

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl font-semibold text-sm text-white"
        style={{
          background: 'linear-gradient(135deg, #7C4DFF 0%, #5C2DE8 100%)',
          boxShadow: '0 8px 32px rgba(124,77,255,0.4)',
        }}
      >
        {/* Pulsing dot */}
        <span className="relative flex w-2.5 h-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        💬 AI Chat
      </motion.button>

      {/* ── Slide-up Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed z-50 bottom-0 right-0 left-0 md:left-auto md:right-6 md:bottom-20 md:w-[400px] flex flex-col rounded-t-2xl md:rounded-2xl border border-[#30363D] overflow-hidden shadow-2xl"
              style={{
                background: '#161B22',
                height: 'calc(100dvh * 0.75)',
                maxHeight: '600px',
              }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {/* ── Header ── */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0D1117] border-b border-[#30363D] shrink-0">
                {/* Drag handle (mobile) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#30363D] rounded-full md:hidden" />

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0`}
                  style={{ background: 'linear-gradient(135deg, #7C4DFF 0%, #5C2DE8 100%)' }}
                >
                  <ModelIcon className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Model selector */}
                <div className="flex-1 relative" ref={modelMenuRef}>
                  <button
                    onClick={() => setShowModelMenu((v) => !v)}
                    className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {activeModel?.name ?? 'AI Chat'}
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                  {activeModel && (
                    <div className="text-[10px] text-muted-foreground">
                      {activeModel.provider} · {activeModel.speed} · {activeModel.cost}
                    </div>
                  )}
                  {showModelMenu && models.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-[#0D1117] border border-[#30363D] rounded-lg shadow-xl py-1 w-64">
                      {models.map((m) => {
                        const Icon = modelIcon(m.provider);
                        return (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }}
                            className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-[#21262D] transition-colors ${
                              m.id === selectedModel ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-xs">{m.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {m.provider} · {m.speed} · {m.cost}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={handleClear}
                    className="p-1.5 rounded-md hover:bg-[#21262D] text-muted-foreground hover:text-foreground transition-colors"
                    title="New chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-1.5 rounded-md hover:bg-[#21262D] text-muted-foreground hover:text-foreground transition-colors"
                    title="Export"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-md hover:bg-[#21262D] text-muted-foreground hover:text-foreground transition-colors"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Messages ── */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 && !loading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-8">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #7C4DFF22 0%, #5C2DE822 100%)' }}
                    >
                      <MessageSquare className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask me about your trades, charts or risk.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        modelName={activeModel?.name}
                      />
                    ))}
                    {loading && (
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#21262D] flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="bg-[#21262D] border border-[#30363D] rounded-2xl rounded-tl-sm">
                          <TypingDots />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Quick Pills ── */}
              <div className="flex gap-1.5 px-4 py-2 overflow-x-auto shrink-0 border-t border-[#30363D]/50">
                {QUICK_PILLS.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => send(pill)}
                    disabled={loading}
                    className="shrink-0 px-3 py-1.5 text-xs rounded-full border border-[#30363D] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-40"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* ── Input ── */}
              <div className="flex items-center gap-2 px-3 py-3 bg-[#0D1117] border-t border-[#30363D] shrink-0">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about your trades…"
                  disabled={loading}
                  className="flex-1 bg-[#21262D] border border-[#30363D] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
                  style={{
                    background: input.trim() && !loading
                      ? 'linear-gradient(135deg, #7C4DFF 0%, #5C2DE8 100%)'
                      : '#21262D',
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
