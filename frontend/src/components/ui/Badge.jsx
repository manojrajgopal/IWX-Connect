export default function Badge({ count, tone = "accent", className = "" }) {
  if (!count) return null;
  const display = count > 99 ? "99+" : String(count);
  const palette = tone === "danger"
    ? { bg: "#dc2626", fg: "white" }
    : { bg: "var(--accent)", fg: "var(--accent-inverse, white)" };
  return (
    <span
      className={`inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] h-[18px] leading-none ${className}`}
      style={{ background: palette.bg, color: palette.fg }}
    >
      {display}
    </span>
  );
}
