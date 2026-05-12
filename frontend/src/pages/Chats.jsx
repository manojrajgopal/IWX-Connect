import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend } from "react-icons/fi";
import { chatsService } from "../services";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import Avatar from "../components/ui/Avatar.jsx";

export default function Chats() {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: () => chatsService.list() });
  const [activeId, setActiveId] = useState(null);
  const setStoreActive = useChatStore((s) => s.setActive);

  useEffect(() => { setStoreActive(activeId); }, [activeId, setStoreActive]);

  const active = useMemo(
    () => (conversations.data || []).find((c) => c.public_id === activeId),
    [conversations.data, activeId]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-[calc(100vh-var(--header-height)-var(--mobilebar-height))] md:h-[calc(100vh-var(--header-height))]">
      <aside className={`${activeId ? "hidden md:flex" : "flex"} flex-col border-r`} style={{ borderColor: "var(--border-color)" }}>
        <div className="p-4">
          <h2 className="font-serif text-2xl">Chats</h2>
        </div>
        <div className="divider" />
        <div className="flex-1 overflow-y-auto">
          {(conversations.data || []).map((c) => {
            const other = c.members?.find((u) => u.username !== me?.username) || c.members?.[0];
            return (
              <button
                key={c.public_id}
                onClick={() => setActiveId(c.public_id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition"
                style={{ background: c.public_id === activeId ? "var(--bg-surface)" : "transparent" }}
              >
                <Avatar user={other} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{other?.display_name || other?.username}</span>
                    {c.unread > 0 && (
                      <span className="text-[10px] px-1.5 py-[1px] rounded-full"
                            style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}>
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>@{other?.username}</div>
                </div>
              </button>
            );
          })}
          {!conversations.data?.length && <div className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>No conversations yet.</div>}
        </div>
      </aside>

      <section className={`${activeId ? "flex" : "hidden md:flex"} flex-col min-w-0`}>
        {active ? <Thread conversation={active} onBack={() => setActiveId(null)} onSent={() => qc.invalidateQueries({ queryKey: ["conversations"] })} /> :
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
            Select a conversation
          </div>}
      </section>
    </div>
  );
}

function Thread({ conversation, onBack, onSent }) {
  const me = useAuthStore((s) => s.user);
  const other = conversation.members?.find((u) => u.username !== me?.username) || conversation.members?.[0];
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const scrollerRef = useRef(null);

  const storeMsgs = useChatStore((s) => s.byId[conversation.public_id]);

  useEffect(() => {
    let alive = true;
    chatsService.messages(conversation.public_id).then((m) => alive && setMessages(m || []));
    return () => { alive = false; };
  }, [conversation.public_id]);

  useEffect(() => {
    if (storeMsgs?.length) setMessages((prev) => [...prev, ...storeMsgs.filter((m) => !prev.find((x) => x.public_id === m.public_id))]);
  }, [storeMsgs]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const msg = await chatsService.send(conversation.public_id, body);
    setMessages((m) => [...m, msg]);
    onSent?.();
  };

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border-color)" }}>
        <button className="btn-ghost md:hidden" onClick={onBack}>←</button>
        <Avatar user={other} />
        <div>
          <div className="font-medium">{other?.display_name || other?.username}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{other?.username}</div>
        </div>
      </header>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.sender?.username === me?.username;
            return (
              <motion.div
                key={m.public_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${mine ? "self-end" : "self-start"}`}
                style={{
                  background: mine ? "var(--accent)" : "var(--bg-surface)",
                  color: mine ? "var(--accent-inverse)" : "var(--text-primary)",
                  border: mine ? "none" : "1px solid var(--border-color)",
                }}
              >
                {m.body}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t" style={{ borderColor: "var(--border-color)" }}>
        <input className="input" placeholder="Message…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="btn-primary"><FiSend /></button>
      </form>
    </>
  );
}
