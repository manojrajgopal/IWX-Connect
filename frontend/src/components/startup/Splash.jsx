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
    }, 50);
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
            <div className="iwx-splash__logo">IWX</div>
            <div className="iwx-splash__since">Since 2025</div>
          </div>
          <h1 className="iwx-splash__title">IWX Connect</h1>
          <p className="iwx-splash__tagline">Where conversations and moments meet.</p>
          <div className="iwx-splash__hint">Tap anywhere to begin</div>
        </div>
      ) : (
        <div className="iwx-splash__loader">
          <div className="iwx-splash__scene">
            <svg viewBox="0 0 200 160" width="100%" height="100%" className="iwx-splash__svg">
              <g className="iwx-splash__ring">
                <circle cx="100" cy="80" r="60" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
                <circle cx="100" cy="80" r="44" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
                <circle cx="100" cy="80" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
              </g>
              <g className="iwx-splash__core">
                <circle cx="100" cy="80" r="9" fill="currentColor" />
                <circle cx="100" cy="80" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              </g>
              <g className="iwx-splash__node iwx-splash__node--a">
                <circle cx="160" cy="80" r="3.5" fill="currentColor" />
              </g>
              <g className="iwx-splash__node iwx-splash__node--b">
                <circle cx="40" cy="80" r="3" fill="currentColor" />
              </g>
              <g className="iwx-splash__node iwx-splash__node--c">
                <circle cx="100" cy="24" r="2.5" fill="currentColor" />
                <circle cx="100" cy="136" r="2.5" fill="currentColor" />
              </g>
            </svg>
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
