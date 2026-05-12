import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { connectionsService, chatsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";

export default function Requests() {
  const qc = useQueryClient();
  const pending = useQuery({ queryKey: ["pending"], queryFn: () => connectionsService.pending() });
  const friends = useQuery({ queryKey: ["friends"], queryFn: () => connectionsService.friends() });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const onSearch = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const r = await connectionsService.search(q);
    setResults(r || []);
  };

  const respond = async (id, action) => {
    await connectionsService.respond(id, action);
    qc.invalidateQueries({ queryKey: ["pending"] });
    qc.invalidateQueries({ queryKey: ["friends"] });
  };

  const sendRequest = async (username) => {
    await connectionsService.send(username);
    setResults((r) => r.filter((u) => u.username !== username));
  };

  const openChat = async (username) => {
    await chatsService.open(username);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  };

  return (
    <div className="container-x py-6 md:py-8 grid lg:grid-cols-2 gap-6">
      <section className="card p-5">
        <h2 className="font-serif text-2xl mb-4">Find people</h2>
        <input className="input mb-3" placeholder="Search by username" value={search} onChange={onSearch} />
        <div className="flex flex-col gap-2">
          {results.map((u) => (
            <motion.div key={u.public_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-2 rounded-md surface">
              <Avatar user={u} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{u.display_name || u.username}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
              </div>
              <button className="btn-primary" onClick={() => sendRequest(u.username)}>Connect</button>
            </motion.div>
          ))}
          {search.length >= 2 && !results.length && (
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>No matches.</div>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-serif text-2xl mb-4">Pending requests</h2>
        <div className="flex flex-col gap-2">
          {(pending.data || []).map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-md surface">
              <Avatar user={p.from} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.from.display_name || p.from.username}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{p.from.username}</div>
              </div>
              <button className="btn" onClick={() => respond(p.id, "reject")}>Reject</button>
              <button className="btn-primary" onClick={() => respond(p.id, "accept")}>Accept</button>
            </div>
          ))}
          {!pending.data?.length && <div className="text-sm" style={{ color: "var(--text-muted)" }}>No requests waiting.</div>}
        </div>
      </section>

      <section className="card p-5 lg:col-span-2">
        <h2 className="font-serif text-2xl mb-4">Your connections</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(friends.data || []).map((u) => (
            <div key={u.public_id} className="flex items-center gap-3 p-2 rounded-md surface">
              <Avatar user={u} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{u.display_name || u.username}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
              </div>
              <button className="btn" onClick={() => openChat(u.username)}>Chat</button>
            </div>
          ))}
          {!friends.data?.length && <div className="text-sm" style={{ color: "var(--text-muted)" }}>You haven’t connected with anyone yet.</div>}
        </div>
      </section>
    </div>
  );
}
