import { useCallback, useEffect, useRef, useState } from "react";
import "./Splash.css";

export default function Splash({ onComplete }) {
  const [stage, setStage] = useState("intro");
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (stage !== "loading") return;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 2, 100);
        if (next >= 100) {
          clearInterval(intervalRef.current);
          setTimeout(() => onComplete?.(), 450);
        }
        return next;
      });
    }, 40);
    return () => clearInterval(intervalRef.current);
  }, [stage, onComplete]);

  const enter = useCallback(() => {
    if (stage !== "intro") return;
    try {
      const a = new Audio("/startup-sound.mp3");
      a.volume = 0.55;
      a.play().catch(() => {});
    } catch {}
    setStage("loading");
  }, [stage]);

  return (
    <div
      className={`iwx-splash iwx-splash--${stage}`}
      onClick={enter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && enter()}
      aria-label={stage === "intro" ? "Tap anywhere to begin" : "Loading"}
    >
      {stage === "intro" ? (
        <div className="iwx-splash__intro">
          <div className="iwx-splash__brand">
            <div className="iwx-splash__icon-wrap">
              <svg viewBox="0 0 80 80" width="80" height="80" className="iwx-splash__icon-svg">
                {/* Connection lines */}
                <line x1="20" y1="20" x2="60" y2="60" stroke="currentColor" strokeWidth="1.5" className="iwx-splash__line iwx-splash__line--1" />
                <line x1="60" y1="20" x2="20" y2="60" stroke="currentColor" strokeWidth="1.5" className="iwx-splash__line iwx-splash__line--2" />
                <line x1="40" y1="10" x2="40" y2="70" stroke="currentColor" strokeWidth="1.5" className="iwx-splash__line iwx-splash__line--3" />
                <line x1="10" y1="40" x2="70" y2="40" stroke="currentColor" strokeWidth="1.5" className="iwx-splash__line iwx-splash__line--4" />
                {/* Central hub */}
                <circle cx="40" cy="40" r="8" fill="currentColor" className="iwx-splash__hub" />
                {/* Connection nodes */}
                <circle cx="20" cy="20" r="4" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--1" />
                <circle cx="60" cy="20" r="4" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--2" />
                <circle cx="60" cy="60" r="4" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--3" />
                <circle cx="20" cy="60" r="4" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--4" />
                <circle cx="40" cy="10" r="3" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--5" />
                <circle cx="40" cy="70" r="3" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--6" />
                <circle cx="10" cy="40" r="3" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--7" />
                <circle cx="70" cy="40" r="3" fill="currentColor" className="iwx-splash__dot iwx-splash__dot--8" />
              </svg>
            </div>
            <div className="iwx-splash__logo">
              <span className="iwx-splash__logo-iwx">IWX</span>
              <span className="iwx-splash__logo-connect">Connect</span>
            </div>
          </div>
          <p className="iwx-splash__tagline">Where conversations and moments meet.</p>
          <div className="iwx-splash__hint">Tap anywhere to begin</div>
        </div>
      ) : (
        <div className="iwx-splash__loader">
          {/* ── Social Network Animation ── */}
          <div className="iwx-splash__scene">
            <svg viewBox="0 0 240 240" width="200" height="200" className="iwx-splash__svg" fill="none">
              {/* Background glow */}
              <defs>
                <radialGradient id="splash-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="splash-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="currentColor" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <circle cx="120" cy="120" r="110" fill="url(#splash-glow)" />

              {/* Outer rotating ring */}
              <circle cx="120" cy="120" r="95" stroke="currentColor" strokeWidth="0.4" opacity="0.08" strokeDasharray="6 8" className="iwx-anim__ring iwx-anim__ring--outer" />
              <circle cx="120" cy="120" r="72" stroke="currentColor" strokeWidth="0.4" opacity="0.12" strokeDasharray="4 6" className="iwx-anim__ring iwx-anim__ring--inner" />

              {/* Network connection lines (drawn on load) */}
              <g className="iwx-anim__network-lines">
                {/* Center to people */}
                <line x1="120" y1="120" x2="120" y2="38"  stroke="url(#splash-line-grad)" strokeWidth="1" className="iwx-anim__netline iwx-anim__netline--1" />
                <line x1="120" y1="120" x2="197" y2="75"  stroke="url(#splash-line-grad)" strokeWidth="1" className="iwx-anim__netline iwx-anim__netline--2" />
                <line x1="120" y1="120" x2="197" y2="165" stroke="url(#splash-line-grad)" strokeWidth="1" className="iwx-anim__netline iwx-anim__netline--3" />
                <line x1="120" y1="120" x2="120" y2="202" stroke="url(#splash-line-grad)" strokeWidth="1" className="iwx-anim__netline iwx-anim__netline--4" />
                <line x1="120" y1="120" x2="43"  y2="165" stroke="url(#splash-line-grad)" strokeWidth="1" className="iwx-anim__netline iwx-anim__netline--5" />
                <line x1="120" y1="120" x2="43"  y2="75"  stroke="url(#splash-line-grad)" strokeWidth="1" className="iwx-anim__netline iwx-anim__netline--6" />
                {/* People to people (triangle connections) */}
                <line x1="120" y1="38"  x2="197" y2="75"  stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="iwx-anim__netline iwx-anim__netline--7" />
                <line x1="197" y1="165" x2="120" y2="202" stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="iwx-anim__netline iwx-anim__netline--8" />
                <line x1="43"  y1="165" x2="43"  y2="75"  stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="iwx-anim__netline iwx-anim__netline--9" />
              </g>

              {/* 6 People nodes around (small person silhouettes) */}
              {/* Person 1 — top */}
              <g className="iwx-anim__person iwx-anim__person--1">
                <circle cx="120" cy="32" r="6" fill="currentColor" opacity="0.15" className="iwx-anim__person-glow" />
                <circle cx="120" cy="30" r="3.5" fill="currentColor" opacity="0.7" />
                <path d="M114 40 a6 4 0 0 1 12 0" fill="currentColor" opacity="0.5" />
              </g>
              {/* Person 2 — top right */}
              <g className="iwx-anim__person iwx-anim__person--2">
                <circle cx="197" cy="69" r="6" fill="currentColor" opacity="0.15" className="iwx-anim__person-glow" />
                <circle cx="197" cy="67" r="3.5" fill="currentColor" opacity="0.6" />
                <path d="M191 77 a6 4 0 0 1 12 0" fill="currentColor" opacity="0.4" />
              </g>
              {/* Person 3 — bottom right */}
              <g className="iwx-anim__person iwx-anim__person--3">
                <circle cx="197" cy="159" r="6" fill="currentColor" opacity="0.15" className="iwx-anim__person-glow" />
                <circle cx="197" cy="157" r="3.5" fill="currentColor" opacity="0.55" />
                <path d="M191 167 a6 4 0 0 1 12 0" fill="currentColor" opacity="0.35" />
              </g>
              {/* Person 4 — bottom */}
              <g className="iwx-anim__person iwx-anim__person--4">
                <circle cx="120" cy="196" r="6" fill="currentColor" opacity="0.15" className="iwx-anim__person-glow" />
                <circle cx="120" cy="194" r="3.5" fill="currentColor" opacity="0.65" />
                <path d="M114 204 a6 4 0 0 1 12 0" fill="currentColor" opacity="0.45" />
              </g>
              {/* Person 5 — bottom left */}
              <g className="iwx-anim__person iwx-anim__person--5">
                <circle cx="43" cy="159" r="6" fill="currentColor" opacity="0.15" className="iwx-anim__person-glow" />
                <circle cx="43" cy="157" r="3.5" fill="currentColor" opacity="0.5" />
                <path d="M37 167 a6 4 0 0 1 12 0" fill="currentColor" opacity="0.3" />
              </g>
              {/* Person 6 — top left */}
              <g className="iwx-anim__person iwx-anim__person--6">
                <circle cx="43" cy="69" r="6" fill="currentColor" opacity="0.15" className="iwx-anim__person-glow" />
                <circle cx="43" cy="67" r="3.5" fill="currentColor" opacity="0.6" />
                <path d="M37 77 a6 4 0 0 1 12 0" fill="currentColor" opacity="0.4" />
              </g>

              {/* Central hub — IWX logo mark */}
              <g className="iwx-anim__hub">
                <circle cx="120" cy="120" r="22" fill="currentColor" opacity="0.04" className="iwx-anim__hub-glow" />
                <circle cx="120" cy="120" r="16" fill="currentColor" opacity="0.08" />
                <circle cx="120" cy="120" r="10" fill="currentColor" opacity="0.2" />
                {/* Stylized "IWX" in center */}
                <text x="120" y="124" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="var(--font-serif, serif)" opacity="0.85" className="iwx-anim__hub-text">IWX</text>
              </g>

              {/* Floating social icons orbiting */}
              {/* Chat bubble */}
              <g className="iwx-anim__float iwx-anim__float--chat">
                <path d="M-6,-5 h12 a2 2 0 0 1 2 2 v6 a2 2 0 0 1 -2 2 h-7 l-3 3 v-3 h-2 a2 2 0 0 1 -2 -2 v-6 a2 2 0 0 1 2 -2z" fill="currentColor" opacity="0.5" />
                <circle cx="-2" cy="-1" r="1" fill="currentColor" opacity="0.3" />
                <circle cx="2" cy="-1" r="1" fill="currentColor" opacity="0.3" />
                <circle cx="6" cy="-1" r="1" fill="currentColor" opacity="0.3" />
              </g>
              {/* Heart */}
              <g className="iwx-anim__float iwx-anim__float--heart">
                <path d="M0,-4 C-2,-7 -7,-7 -7,-3 C-7,1 0,6 0,6 C0,6 7,1 7,-3 C7,-7 2,-7 0,-4z" fill="currentColor" opacity="0.45" />
              </g>
              {/* Camera / reel */}
              <g className="iwx-anim__float iwx-anim__float--camera">
                <rect x="-7" y="-5" width="14" height="10" rx="2" fill="currentColor" opacity="0.45" />
                <circle cx="0" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <circle cx="0" cy="0" r="1.2" fill="currentColor" opacity="0.35" />
              </g>
              {/* Story ring */}
              <g className="iwx-anim__float iwx-anim__float--story">
                <circle cx="0" cy="0" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 3" opacity="0.4" className="iwx-anim__story-ring" />
                <circle cx="0" cy="0" r="3.5" fill="currentColor" opacity="0.3" />
              </g>

              {/* Traveling data particles along network lines */}
              <circle r="1.5" fill="currentColor" opacity="0.6" className="iwx-anim__particle iwx-anim__particle--1" />
              <circle r="1.2" fill="currentColor" opacity="0.5" className="iwx-anim__particle iwx-anim__particle--2" />
              <circle r="1"   fill="currentColor" opacity="0.4" className="iwx-anim__particle iwx-anim__particle--3" />
              <circle r="1.3" fill="currentColor" opacity="0.55" className="iwx-anim__particle iwx-anim__particle--4" />
            </svg>
          </div>

          <div className="iwx-splash__brand-small">
            <span className="iwx-splash__logo-iwx">IWX</span>
            <span className="iwx-splash__logo-connect">Connect</span>
          </div>

          <div className="iwx-splash__track">
            <div className="iwx-splash__fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="iwx-splash__caption">Establishing your connection…</p>
        </div>
      )}
    </div>
  );
}
