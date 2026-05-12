import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiArrowLeft, FiCheck, FiCheckCircle, FiSearch, FiPaperclip, FiX, FiFile, FiDownload } from "react-icons/fi";
import { chatsService, mediaService } from "../services";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import Avatar from "../components/ui/Avatar.jsx";

function kindFromMime(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

export default function Chats() {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const location = useLocation();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: () => chatsService.list(), staleTime: 10_000 });
  const [activeId, setActiveId] = useState(null);
  const setStoreActive = useChatStore((s) => s.setActive);
  const setConversations = useChatStore((s) => s.setConversations);
  const markAllRead = useChatStore((s) => s.markAllRead);
  const [searchTerm, setSearchTerm] = useState("");
  const autoOpenHandled = useRef(false);

  useEffect(() => { setStoreActive(activeId); }, [activeId, setStoreActive]);
  useEffect(() => {
    if (conversations.data) setConversations(conversations.data);
  }, [conversations.data, setConversations]);

  // Auto-open a specific conversation when navigated with state
  useEffect(() => {
    const openId = location.state?.openConversation;
    if (openId && conversations.data?.length && !autoOpenHandled.current) {
      autoOpenHandled.current = true;
      const conv = conversations.data.find((c) => c.public_id === openId);
      if (conv) {
        setActiveId(openId);
        if (conv.unread > 0) markAllRead(openId, Infinity);
      }
      // Clear the state so refreshing doesn't re-open
      window.history.replaceState({}, "");
    }
  }, [location.state, conversations.data, markAllRead]);

  const handleSelectChat = useCallback((convId) => {
    setActiveId(convId);
    const conv = (conversations.data || []).find((c) => c.public_id === convId);
    if (conv && conv.unread > 0) {
      markAllRead(convId, Infinity);
    }
  }, [conversations.data, markAllRead]);

  const active = useMemo(
    () => (conversations.data || []).find((c) => c.public_id === activeId),
    [conversations.data, activeId]
  );

  const filteredConversations = useMemo(() => {
    const list = conversations.data || [];
    if (!searchTerm.trim()) return list;
    return list.filter((c) => {
      const other = c.members?.find((u) => u.username !== me?.username) || c.members?.[0];
      const name = (other?.display_name || other?.username || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [conversations.data, searchTerm, me]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] h-full" style={{ overflow: "hidden" }}>
      {/* Sidebar - Conversation List */}
      <aside className={`${activeId ? "hidden md:flex" : "flex"} flex-col border-r`} style={{ borderColor: "var(--border-color)", background: "var(--bg-surface)", overflow: "hidden" }}>
        <div className="p-4 pb-2">
          <h2 className="font-serif text-2xl font-bold mb-3">Chats</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={14} />
            <input
              className="input pl-9 text-sm"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-color)" }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {conversations.isLoading ? (
            <div className="flex flex-col gap-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="skel shrink-0" style={{ width: 44, height: 44, borderRadius: "50%" }} />
                  <div className="flex-1">
                    <div className="skel" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                    <div className="skel" style={{ height: 12, width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <AnimatePresence>
                {filteredConversations.map((c) => (
                  <ConversationItem
                    key={c.public_id}
                    conversation={c}
                    me={me}
                    isActive={c.public_id === activeId}
                    onClick={() => handleSelectChat(c.public_id)}
                  />
                ))}
              </AnimatePresence>
              {!conversations.data?.length && (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-2 opacity-30">💬</div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No conversations yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Connect with people to start chatting</p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Chat Thread */}
      <section className={`${activeId ? "flex" : "hidden md:flex"} flex-col min-w-0`} style={{ background: "var(--bg-base)", overflow: "hidden" }}>
        {active ? (
          <Thread
            conversation={active}
            onBack={() => setActiveId(null)}
            onSent={() => qc.invalidateQueries({ queryKey: ["conversations"] })}
          />
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

/* ─── Conversation List Item ─── */
function ConversationItem({ conversation, me, isActive, onClick }) {
  const other = conversation.members?.find((u) => u.username !== me?.username) || conversation.members?.[0];
  const typing = useChatStore((s) => s.typing[conversation.public_id]);
  const lastMsg = conversation.last_message;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:brightness-95"
      style={{
        background: isActive ? "var(--accent-subtle, rgba(99, 102, 241, 0.08))" : "transparent",
        borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
      }}
    >
      <div className="relative">
        <Avatar user={other} size={44} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm truncate">{other?.display_name || other?.username}</span>
          {lastMsg?.created_at && (
            <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
              {formatTime(lastMsg.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs truncate flex-1" style={{ color: typing ? "var(--accent)" : "var(--text-muted)" }}>
            {typing ? (
              <span className="flex items-center gap-1">
                <TypingDots small /> typing...
              </span>
            ) : lastMsg?.body ? (
              <span>{lastMsg.sender === me?.username ? "You: " : ""}{lastMsg.body}</span>
            ) : (
              <span>@{other?.username}</span>
            )}
          </span>
          {conversation.unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 text-[10px] px-1.5 py-[2px] rounded-full font-bold shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}
            >
              {conversation.unread > 99 ? "99+" : conversation.unread}
            </motion.span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-6xl opacity-20"
      >
        💬
      </motion.div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a conversation to start messaging</p>
    </div>
  );
}

/* ─── Chat Thread ─── */
function Thread({ conversation, onBack, onSent }) {
  const me = useAuthStore((s) => s.user);
  const other = conversation.members?.find((u) => u.username !== me?.username) || conversation.members?.[0];
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState(null); // { file, kind, previewUrl, progress }
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastReadRef = useRef(0);

  const storeMsgs = useChatStore((s) => s.byId[conversation.public_id]);
  const typing = useChatStore((s) => s.typing[conversation.public_id]);
  const markAllRead = useChatStore((s) => s.markAllRead);

  // Load messages on mount — fast
  useEffect(() => {
    let alive = true;
    setLoading(true);
    chatsService.messages(conversation.public_id).then((m) => {
      if (!alive) return;
      setMessages(m || []);
      setLoading(false);
      // Mark read immediately when opening
      const others = (m || []).filter((msg) => msg.sender?.username !== me?.username);
      if (others.length > 0) {
        const lastOther = others[others.length - 1];
        if (lastOther?.id && lastOther.id > lastReadRef.current) {
          lastReadRef.current = lastOther.id;
          chatsService.read(conversation.public_id, lastOther.id);
          markAllRead(conversation.public_id, lastOther.id);
        }
      }
    });
    return () => { alive = false; };
  }, [conversation.public_id, me?.username, markAllRead]);

  // Merge real-time messages instantly
  useEffect(() => {
    if (!storeMsgs?.length) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.public_id));
      const newMsgs = storeMsgs.filter((m) => !existingIds.has(m.public_id));
      if (!newMsgs.length) return prev;
      const merged = [...prev, ...newMsgs];
      // Mark new incoming messages as read immediately
      const newOthers = newMsgs.filter((m) => m.sender?.username !== me?.username);
      if (newOthers.length > 0) {
        const lastOther = newOthers[newOthers.length - 1];
        if (lastOther?.id && lastOther.id > lastReadRef.current) {
          lastReadRef.current = lastOther.id;
          chatsService.read(conversation.public_id, lastOther.id);
          markAllRead(conversation.public_id, lastOther.id);
        }
      }
      return merged;
    });
  }, [storeMsgs, conversation.public_id, me?.username, markAllRead]);

  // Scroll to bottom — instant on initial load, smooth on new messages
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (!scrollerRef.current) return;
    requestAnimationFrame(() => {
      const behavior = initialScrollDone.current ? "smooth" : "instant";
      scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior });
      initialScrollDone.current = true;
    });
  }, [messages.length, typing]);

  // Reset on conversation change
  useEffect(() => { initialScrollDone.current = false; }, [conversation.public_id]);

  const emitTyping = useCallback((state) => {
    const sock = window.__iwxSocket;
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ op: "typing", conversation_id: conversation.public_id, state }));
    }
  }, [conversation.public_id]);

  const handleInputChange = (e) => {
    setDraft(e.target.value);
    emitTyping("start");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping("stop"), 2000);
  };

  const onPickFile = (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return;
    const previewUrl = file.type.startsWith("image/") || file.type.startsWith("video/")
      ? URL.createObjectURL(file) : null;
    setPendingFile({ file, kind: kindFromMime(file.type), previewUrl, progress: 0 });
  };

  const clearPendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  };

  const send = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (sending) return;
    if (!body && !pendingFile) return;
    setDraft("");
    setSending(true);
    emitTyping("stop");

    const optimisticMsg = {
      public_id: `temp-${Date.now()}`,
      body,
      sender: me,
      kind: pendingFile?.kind || "text",
      media_ref: pendingFile?.previewUrl || "",
      status: "sending",
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((m) => [...m, optimisticMsg]);

    try {
      let media_ref = "";
      let kind = "text";
      if (pendingFile) {
        const asset = await mediaService.upload(pendingFile.file, (p) => {
          setPendingFile((cur) => cur ? { ...cur, progress: p } : cur);
        });
        media_ref = asset.url;
        kind = pendingFile.kind;
      }
      const msg = await chatsService.send(conversation.public_id, {
        body: body || (kind === "text" ? "" : " "),
        kind,
        media_ref,
      });
      setMessages((m) => {
        const withoutDupes = m.filter((x) => x.public_id !== optimisticMsg.public_id && x.public_id !== msg.public_id);
        return [...withoutDupes, msg];
      });
      clearPendingFile();
      onSent?.();
    } catch {
      setMessages((m) => m.filter((x) => x.public_id !== optimisticMsg.public_id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b backdrop-blur-sm"
        style={{ borderColor: "var(--border-color)", background: "var(--bg-surface)" }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="btn-ghost md:hidden p-2 rounded-full"
          onClick={onBack}
        >
          <FiArrowLeft size={20} />
        </motion.button>
        <Avatar user={other} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{other?.display_name || other?.username}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {typing ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1"
                style={{ color: "var(--accent)" }}
              >
                typing<TypingDots />
              </motion.span>
            ) : (
              `@${other?.username}`
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
        style={{ background: "var(--bg-base)", overscrollBehavior: "contain", minHeight: 0 }}
      >
        {loading ? (
          <div className="flex-1 flex flex-col gap-3 py-2">
            {Array.from({ length: 8 }).map((_, i) => {
              const isRight = i % 3 === 0;
              return (
                <div key={i} className={`flex items-end gap-2 ${isRight ? "self-end flex-row-reverse" : "self-start"}`} style={{ maxWidth: "70%" }}>
                  {!isRight && <div className="skel shrink-0" style={{ width: 28, height: 28, borderRadius: "50%" }} />}
                  <div className="skel" style={{
                    height: 40 + (i % 3) * 12,
                    width: 120 + (i % 4) * 40,
                    borderRadius: isRight ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  }} />
                </div>
              );
            })}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => {
              const mine = m.sender?.username === me?.username;
              const prevMsg = messages[idx - 1];
              const sameSender = prevMsg?.sender?.username === m.sender?.username;
              const showAvatar = !mine && !sameSender;

              return (
                <MessageBubble
                  key={m.public_id || idx}
                  message={m}
                  mine={mine}
                  showAvatar={showAvatar}
                  other={other}
                />
              );
            })}
          </AnimatePresence>
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {typing && typing.user !== me?.username && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-2xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}
            >
              <TypingDots />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="border-t" style={{ borderColor: "var(--border-color)", background: "var(--bg-surface)" }}>
        {pendingFile && (
          <div className="px-3 pt-3 pb-1 flex items-center gap-3">
            <div className="relative rounded-md overflow-hidden" style={{ width: 64, height: 64, background: "var(--bg-surface-2)" }}>
              {pendingFile.kind === "image" && pendingFile.previewUrl && <img src={pendingFile.previewUrl} alt="" className="w-full h-full object-cover" />}
              {pendingFile.kind === "video" && pendingFile.previewUrl && <video src={pendingFile.previewUrl} className="w-full h-full object-cover" muted />}
              {(pendingFile.kind === "file" || pendingFile.kind === "audio") && (
                <div className="w-full h-full flex items-center justify-center"><FiFile size={24} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate">{pendingFile.file.name}</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{(pendingFile.file.size / 1024).toFixed(0)} KB</div>
              {sending && (
                <div className="w-full h-1 mt-1 rounded" style={{ background: "var(--bg-surface-2)" }}>
                  <div className="h-full rounded" style={{ width: `${pendingFile.progress}%`, background: "var(--accent)" }} />
                </div>
              )}
            </div>
            <button onClick={clearPendingFile} className="btn-ghost p-1.5 rounded-full" aria-label="Remove"><FiX size={14} /></button>
          </div>
        )}
        <form onSubmit={send} className="flex items-center gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,video/*,audio/*,application/pdf,application/zip,.doc,.docx,.xls,.xlsx,.txt"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost p-2 rounded-full"
            title="Attach"
          >
            <FiPaperclip size={18} />
          </motion.button>
          <input
            ref={inputRef}
            className="input flex-1"
            placeholder="Message..."
            value={draft}
            onChange={handleInputChange}
            autoFocus
          />
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            type="submit"
            disabled={(!draft.trim() && !pendingFile) || sending}
            className="btn-primary p-2.5 rounded-full disabled:opacity-40 transition-all"
            style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}
          >
            <FiSend size={18} />
          </motion.button>
        </form>
      </div>
    </>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, mine, showAvatar, other }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex items-end gap-1.5 ${mine ? "self-end flex-row-reverse" : "self-start"}`}
      style={{ maxWidth: "78%" }}
    >
      {!mine && showAvatar && <Avatar user={other} size={28} />}
      {!mine && !showAvatar && <div style={{ width: 28 }} />}
      <div
        className={`text-sm leading-relaxed overflow-hidden ${mine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}
        style={{
          background: mine ? "var(--accent)" : "var(--bg-surface)",
          color: mine ? "var(--accent-inverse)" : "var(--text-primary)",
          border: mine ? "none" : "1px solid var(--border-color)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <MediaContent message={message} />
        {(message.body || message.kind === "text") && (
          <div className="px-3.5 py-2">{message.body}</div>
        )}
        <div className={`flex items-center gap-1 px-3.5 pb-1.5 ${mine ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] opacity-60">
            {formatTime(message.created_at)}
          </span>
          {mine && <MessageStatus status={message.status} />}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Message Status Icons (Animated ticks) ─── */
function MessageStatus({ status }) {
  if (status === "sending") {
    return (
      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-flex">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
          <circle cx="12" cy="12" r="10" strokeDasharray="50" strokeDashoffset="15" />
        </svg>
      </motion.span>
    );
  }
  if (!status || status === "sent") {
    return (
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.span>
    );
  }
  if (status === "delivered") {
    return (
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="inline-flex">
        <svg width="18" height="14" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
          <polyline points="16 6 8 17 4 12" />
          <polyline points="24 6 14 17 12 14" />
        </svg>
      </motion.span>
    );
  }
  if (status === "read") {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
        className="inline-flex"
      >
        <svg width="18" height="14" viewBox="0 0 28 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 6 8 17 4 12" />
          <polyline points="24 6 14 17 12 14" />
        </svg>
      </motion.span>
    );
  }
  return null;
}

/* ─── Typing Dots Animation ─── */
function TypingDots({ small }) {
  const dotSize = small ? "w-1 h-1" : "w-1.5 h-1.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`${dotSize} rounded-full`}
          style={{ background: "var(--accent)" }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

/* ─── Media Content (image/video/audio/file in a message bubble) ─── */
function MediaContent({ message }) {
  const { kind, media_ref } = message;
  if (!media_ref || kind === "text") return null;
  if (kind === "image") {
    return (
      <a href={media_ref} target="_blank" rel="noreferrer" className="block">
        <img src={media_ref} alt="" className="block max-w-[280px] max-h-[320px] object-cover" style={{ background: "rgba(0,0,0,0.05)" }} />
      </a>
    );
  }
  if (kind === "video") {
    return <video src={media_ref} controls playsInline className="block max-w-[320px] max-h-[360px]" style={{ background: "#000" }} />;
  }
  if (kind === "audio") {
    return <audio src={media_ref} controls className="block px-3.5 pt-2" />;
  }
  // file
  const filename = (() => { try { return decodeURIComponent(new URL(media_ref, window.location.href).pathname.split("/").pop() || "file"); } catch { return "file"; } })();
  return (
    <a href={media_ref} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3.5 py-2.5" style={{ minWidth: 200 }}>
      <FiFile size={28} />
      <div className="flex-1 min-w-0">
        <div className="text-xs truncate">{filename}</div>
        <div className="text-[10px] opacity-70">Tap to open</div>
      </div>
      <FiDownload size={16} className="opacity-70" />
    </a>
  );
}

/* ─── Helpers ─── */
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
