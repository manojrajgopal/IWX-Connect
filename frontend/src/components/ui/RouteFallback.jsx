export default function RouteFallback({ variant = "grid" }) {
  if (variant === "form") {
    return (
      <div className="container-x py-10">
        <div className="skel" style={{ height: 28, width: "30%", marginBottom: 24 }} />
        <div className="grid gap-3">
          <div className="skel" style={{ height: 44 }} />
          <div className="skel" style={{ height: 44 }} />
          <div className="skel" style={{ height: 44 }} />
          <div className="skel" style={{ height: 44, width: 160 }} />
        </div>
      </div>
    );
  }
  if (variant === "list") {
    return (
      <div className="container-x py-8">
        <div className="skel" style={{ height: 24, width: "30%", marginBottom: 16 }} />
        <div className="grid gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 64 }} />
          ))}
        </div>
      </div>
    );
  }
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
