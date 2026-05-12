import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { feedsService, connectionsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";

export default function Home() {
  const stories = useQuery({ queryKey: ["stories"], queryFn: () => feedsService.stories() });
  const feed    = useQuery({ queryKey: ["feed"],    queryFn: () => feedsService.feed("post") });
  const friends = useQuery({ queryKey: ["friends"], queryFn: () => connectionsService.friends() });

  return (
    <div className="container-x py-6 md:py-8 flex flex-col gap-8">
      <section>
        <div className="eyebrow mb-3">Stories</div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(stories.data || []).map((s) => (
            <motion.div key={s.public_id} whileHover={{ scale: 1.04 }} className="flex flex-col items-center gap-2 shrink-0">
              <div className="rounded-full p-[2px]" style={{ background: "linear-gradient(45deg, var(--accent), var(--text-muted))" }}>
                <div className="rounded-full overflow-hidden" style={{ width: 64, height: 64, background: "var(--bg-card)" }}>
                  <img src={s.thumbnail_url || s.media_url} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="text-xs truncate max-w-[80px]">{s.author?.username}</div>
            </motion.div>
          ))}
          {!stories.data?.length && <div className="text-sm" style={{ color: "var(--text-muted)" }}>No active stories.</div>}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {(feed.data || []).map((p) => (
            <motion.article key={p.public_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <Avatar user={p.author} />
                <div>
                  <div className="font-medium">{p.author?.display_name || p.author?.username}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{p.author?.username}</div>
                </div>
              </div>
              {p.media_url && <img src={p.media_url} className="w-full max-h-[640px] object-cover" alt="" />}
              {p.caption && <div className="p-4 text-sm">{p.caption}</div>}
              <div className="flex items-center gap-4 px-4 pb-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{p.likes_count} likes</span>
                <span>{p.comments_count} comments</span>
              </div>
            </motion.article>
          ))}
          {!feed.data?.length && (
            <div className="card p-8 text-center">
              <h2 className="font-serif text-2xl mb-2">Your feed is quiet</h2>
              <p style={{ color: "var(--text-secondary)" }}>Connect with people to start seeing their posts here.</p>
            </div>
          )}
        </div>

        <aside className="hidden lg:flex flex-col gap-3">
          <div className="card p-4">
            <div className="eyebrow mb-3">Connections</div>
            <div className="flex flex-col gap-2">
              {(friends.data || []).slice(0, 8).map((u) => (
                <div key={u.public_id} className="flex items-center gap-3">
                  <Avatar user={u} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{u.display_name || u.username}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
                  </div>
                </div>
              ))}
              {!friends.data?.length && <div className="text-sm" style={{ color: "var(--text-muted)" }}>No connections yet.</div>}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
