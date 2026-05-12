export default function RouteFallback({ variant = "grid" }) {
  if (variant === "chat") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] h-[calc(100vh-var(--header-height)-var(--mobilebar-height))] md:h-[calc(100vh-var(--header-height))]">
        <div className="flex flex-col border-r" style={{ borderColor: "var(--border-color)", background: "var(--bg-surface)" }}>
          <div className="p-4 pb-2">
            <div className="skel" style={{ height: 28, width: "40%", marginBottom: 12 }} />
            <div className="skel" style={{ height: 40, borderRadius: 8 }} />
          </div>
          <div className="flex-1 flex flex-col gap-1 p-2">
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
        </div>
        <div className="hidden md:flex flex-col items-center justify-center" style={{ background: "var(--bg-base)" }}>
          <div className="skel" style={{ width: 64, height: 64, borderRadius: "50%", opacity: 0.3 }} />
          <div className="skel" style={{ height: 14, width: 200, marginTop: 16 }} />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="container-x py-10 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="skel shrink-0" style={{ width: 72, height: 72, borderRadius: "50%" }} />
          <div>
            <div className="skel" style={{ height: 28, width: 180, marginBottom: 8 }} />
            <div className="skel" style={{ height: 14, width: 120 }} />
          </div>
        </div>
        <div className="skel" style={{ borderRadius: "var(--border-radius)", padding: 20 }}>
          <div className="grid gap-4">
            <div className="skel" style={{ height: 44 }} />
            <div className="skel" style={{ height: 80 }} />
            <div className="grid grid-cols-2 gap-4">
              <div className="skel" style={{ height: 44 }} />
              <div className="skel" style={{ height: 44 }} />
            </div>
            <div className="skel" style={{ height: 40, width: 140, marginLeft: "auto" }} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="container-x py-6 md:py-8 max-w-3xl">
        <div className="skel" style={{ height: 28, width: "30%", marginBottom: 16 }} />
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 skel" style={{ height: 72 }}>
              <div className="skel shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
              <div className="flex-1">
                <div className="skel" style={{ height: 14, width: "50%", marginBottom: 6, background: "var(--bg-surface-2)" }} />
                <div className="skel" style={{ height: 12, width: "70%", background: "var(--bg-surface-2)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "feed") {
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
              <div key={i} className="skel" style={{ borderRadius: "var(--border-radius)", overflow: "hidden" }}>
                <div className="flex items-center gap-3 p-4">
                  <div className="skel shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
                  <div className="flex-1">
                    <div className="skel" style={{ height: 14, width: "40%", marginBottom: 6, background: "var(--bg-surface-2)" }} />
                    <div className="skel" style={{ height: 10, width: "25%", background: "var(--bg-surface-2)" }} />
                  </div>
                </div>
                <div className="skel" style={{ height: 280, background: "var(--bg-surface-2)" }} />
                <div className="p-4">
                  <div className="skel" style={{ height: 12, width: "60%", background: "var(--bg-surface-2)" }} />
                </div>
              </div>
            ))}
          </div>
          <aside className="hidden lg:flex flex-col gap-3">
            <div className="skel" style={{ borderRadius: "var(--border-radius)", padding: 16 }}>
              <div className="skel" style={{ height: 12, width: 80, marginBottom: 12, background: "var(--bg-surface-2)" }} />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <div className="skel shrink-0" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
                  <div className="flex-1">
                    <div className="skel" style={{ height: 12, width: "70%", background: "var(--bg-surface-2)" }} />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (variant === "reels") {
    return (
      <div className="h-[calc(100vh-var(--header-height)-var(--mobilebar-height))] md:h-[calc(100vh-var(--header-height))] flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="skel" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div className="skel" style={{ height: 14, width: 120 }} />
        </div>
      </div>
    );
  }

  if (variant === "requests") {
    return (
      <div className="container-x py-6 md:py-8 grid lg:grid-cols-2 gap-6">
        <div className="skel" style={{ borderRadius: "var(--border-radius)", padding: 20 }}>
          <div className="skel" style={{ height: 24, width: "50%", marginBottom: 16, background: "var(--bg-surface-2)" }} />
          <div className="skel" style={{ height: 40, marginBottom: 12, background: "var(--bg-surface-2)" }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="skel shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
              <div className="flex-1">
                <div className="skel" style={{ height: 14, width: "60%", background: "var(--bg-surface-2)" }} />
              </div>
              <div className="skel" style={{ height: 32, width: 80, borderRadius: 6, background: "var(--bg-surface-2)" }} />
            </div>
          ))}
        </div>
        <div className="skel" style={{ borderRadius: "var(--border-radius)", padding: 20 }}>
          <div className="skel" style={{ height: 24, width: "50%", marginBottom: 16, background: "var(--bg-surface-2)" }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="skel shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
              <div className="flex-1">
                <div className="skel" style={{ height: 14, width: "50%", marginBottom: 4, background: "var(--bg-surface-2)" }} />
                <div className="skel" style={{ height: 10, width: "30%", background: "var(--bg-surface-2)" }} />
              </div>
              <div className="flex gap-2">
                <div className="skel" style={{ height: 32, width: 60, borderRadius: 6, background: "var(--bg-surface-2)" }} />
                <div className="skel" style={{ height: 32, width: 60, borderRadius: 6, background: "var(--bg-surface-2)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default grid
  return (
    <div className="container-x py-8">
      <div className="skel" style={{ height: 28, width: "30%", marginBottom: 16 }} />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skel" style={{ aspectRatio: "1 / 1" }} />
        ))}
      </div>
    </div>
  );
}
