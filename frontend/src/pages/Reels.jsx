import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { feedsService } from "../services";

export default function Reels() {
  const { data, isLoading } = useQuery({ queryKey: ["reels"], queryFn: () => feedsService.feed("reel") });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-var(--header-height)-var(--mobilebar-height))] md:h-[calc(100vh-var(--header-height))] flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="skel" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div className="skel" style={{ height: 14, width: 120 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-var(--header-height)-var(--mobilebar-height))] md:h-[calc(100vh-var(--header-height))] overflow-y-scroll snap-y snap-mandatory" style={{ scrollSnapType: "y mandatory" }}>
      {(data || []).map((p) => (
        <motion.section key={p.public_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="snap-start h-full flex items-center justify-center relative">
          {p.media_url ? (
            <video src={p.media_url} loop autoPlay muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>No media</div>
          )}
          <div className="absolute bottom-6 left-6 right-6 text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
            <div className="font-medium">@{p.author?.username}</div>
            {p.caption && <div className="text-sm">{p.caption}</div>}
          </div>
        </motion.section>
      ))}
      {!data?.length && (
        <div className="h-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
          No reels yet.
        </div>
      )}
    </div>
  );
}
