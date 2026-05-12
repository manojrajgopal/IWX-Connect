import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { connectionsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";

export default function Discover() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(() => connectionsService.search(q).then((r) => setResults(r || [])), 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="container-x py-6 md:py-8">
      <h2 className="font-serif text-3xl mb-4">Discover</h2>
      <input className="input mb-4" placeholder="Search people, posts, anything" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((u) => (
          <div key={u.public_id} className="card p-4 flex items-center gap-3">
            <Avatar user={u} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{u.display_name || u.username}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
            </div>
            <button className="btn-primary" onClick={() => connectionsService.send(u.username)}>Connect</button>
          </div>
        ))}
      </div>
    </div>
  );
}
