import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { feedsService, connectionsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";
import PostCard from "../components/feed/PostCard.jsx";
import { useUIStore } from "../stores/uiStore";
import { useAuthStore } from "../stores/authStore";

function HomeSkeleton() {
  return (
    <div className="container-x py-6 md:py-8 flex flex-col gap-8">
      <div>
        <div className="skel" style={{ height: 12, width: 60, marginBottom: 12 }} />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="skel" style={{ width: 68, height: 68, borderRadius: "50%" }} />
              <div className="skel" style={{ height: 10, width: 50 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skel" style={{ borderRadius: "var(--border-radius)", overflow: "hidden", height: 420 }} />
          ))}
        </div>
        <aside className="hidden lg:flex flex-col gap-3">
          <div className="skel" style={{ height: 280, borderRadius: "var(--border-radius)" }} />
        </aside>
      </div>
    </div>
  );
}

function groupStoriesByAuthor(list) {
  const map = new Map();
  for (const s of list) {
    const key = s.author?.username || s.author?.public_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return Array.from(map.values());
}

export default function Home() {
  const stories = useQuery({ queryKey: ["stories"], queryFn: () => feedsService.stories() });
  const feed    = useQuery({ queryKey: ["feed"],    queryFn: () => feedsService.feed("post") });
  const friends = useQuery({ queryKey: ["friends"], queryFn: () => connectionsService.friends() });
  const openComposer = useUIStore((s) => s.openComposer);
  const openStories  = useUIStore((s) => s.openStoryViewer);
  const me = useAuthStore((s) => s.user);

  const isLoading = stories.isLoading || feed.isLoading;
  const storiesList = Array.isArray(stories.data) ? stories.data : [];
  const grouped = groupStoriesByAuthor(storiesList);
  const myGroup    = grouped.find((g) => g[0]?.author?.username === me?.username);
  const otherGroups = grouped.filter((g) => g[0]?.author?.username !== me?.username);
  // Sort: groups with any unseen story first, fully-seen groups last
  otherGroups.sort((a, b) => {
    const aUnseen = a.some((s) => !s.viewed);
    const bUnseen = b.some((s) => !s.viewed);
    if (aUnseen === bUnseen) return 0;
    return aUnseen ? -1 : 1;
  });
  const feedList    = Array.isArray(feed.data)    ? feed.data    : [];
  const friendsList = Array.isArray(friends.data) ? friends.data : [];

  if (isLoading) return <HomeSkeleton />;

  return (
    <div className="container-x py-6 md:py-8 flex flex-col gap-8">
      <section>
        <div className="eyebrow mb-3">Stories</div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Your story tile — shows ring + thumbnail when you have an active story */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative">
              {myGroup ? (
                <button
                  onClick={() => openStories(myGroup, 0)}
                  className="rounded-full p-[2.5px]"
                  style={{ background: "linear-gradient(45deg,#22c55e,#3b82f6)" }}
                  title="View your story"
                >
                  <div className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: 64, height: 64, background: "var(--bg-card)", padding: 2 }}>
                    {me?.profile?.avatar
                      ? <img src={me.profile.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                      : <div className="w-full h-full rounded-full flex items-center justify-center font-medium" style={{ background: "var(--bg-surface-2)" }}>
                          {(me?.username || "?")[0].toUpperCase()}
                        </div>}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => openComposer("story", true)}
                  className="rounded-full overflow-hidden flex items-center justify-center"
                  style={{ width: 68, height: 68, background: "var(--bg-surface-2)", border: "2px dashed var(--border-color)" }}
                  title="Add a story"
                >
                  {me?.profile?.avatar
                    ? <img src={me.profile.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center font-medium" style={{ color: "var(--text-secondary)" }}>{(me?.username || "?")[0].toUpperCase()}</div>}
                </button>
              )}
              {/* "+" badge always present so users can add another story */}
              <button
                onClick={() => openComposer("story", true)}
                aria-label="Add to your story"
                className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center"
                style={{
                  width: 22, height: 22,
                  background: "var(--accent)", color: "var(--accent-inverse)",
                  border: "2px solid var(--bg-page)", fontSize: 14, lineHeight: 1,
                }}
              >+</button>
            </div>
            <div className="text-xs font-medium">{myGroup ? "Your story" : "Add story"}</div>
          </div>

          {otherGroups.map((group, gi) => {
            const author = group[0].author;
            const hasUnseen = group.some((s) => !s.viewed);
            return (
              <motion.button
                key={author?.username || gi}
                whileHover={{ scale: 1.04 }}
                onClick={() => openStories(group, 0)}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div
                  className="rounded-full p-[2.5px]"
                  style={{
                    background: hasUnseen
                      ? "linear-gradient(45deg,#f43f5e,#a855f7,#3b82f6)"
                      : "var(--border-color)",
                  }}
                >
                  <div className="rounded-full overflow-hidden" style={{ width: 64, height: 64, background: "var(--bg-card)", padding: 2 }}>
                    {author?.profile?.avatar
                      ? <img src={author.profile.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                      : <div className="w-full h-full rounded-full flex items-center justify-center font-medium" style={{ background: "var(--bg-surface-2)" }}>
                          {(author?.username || "?")[0].toUpperCase()}
                        </div>}
                  </div>
                </div>
                <div className="text-xs truncate max-w-[80px]" style={{ color: hasUnseen ? "var(--text-primary)" : "var(--text-muted)" }}>{author?.username}</div>
              </motion.button>
            );
          })}
          {!otherGroups.length && !myGroup && <div className="text-sm self-center" style={{ color: "var(--text-muted)" }}>No active stories from your connections.</div>}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {feedList.map((p) => <PostCard key={p.public_id} post={p} />)}
          {!feedList.length && (
            <div className="card p-8 text-center">
              <h2 className="font-serif text-2xl mb-2">Your feed is quiet</h2>
              <p style={{ color: "var(--text-secondary)" }}>Connect with people to start seeing their posts here.</p>
              <div className="mt-4">
                <button className="btn-primary" onClick={() => openComposer("post")}>Create your first post</button>
              </div>
            </div>
          )}
        </div>

        <aside className="hidden lg:flex flex-col gap-3">
          <div className="card p-4">
            <div className="eyebrow mb-3">Connections</div>
            <div className="flex flex-col gap-2">
              {friendsList.slice(0, 8).map((u) => (
                <div key={u.public_id} className="flex items-center gap-3">
                  <Avatar user={u} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{u.display_name || u.username}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
                  </div>
                </div>
              ))}
              {!friendsList.length && <div className="text-sm" style={{ color: "var(--text-muted)" }}>No connections yet.</div>}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
