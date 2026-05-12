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
          <div className="iwx-splash__scene">
            <svg viewBox="0 0 200 200" width="160" height="160" className="iwx-splash__svg">
              {/* Outer pulse ring */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" className="iwx-splash__pulse-ring" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" className="iwx-splash__pulse-ring iwx-splash__pulse-ring--2" />

              {/* Orbiting connection nodes */}
              <g className="iwx-splash__orbit-group">
                <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.1" strokeDasharray="4 4" />
                <g className="iwx-splash__orbiter iwx-splash__orbiter--1">
                  <circle cx="150" cy="100" r="5" fill="currentColor" opacity="0.7" />
                  <circle cx="150" cy="100" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                </g>
                <g className="iwx-splash__orbiter iwx-splash__orbiter--2">
                  <circle cx="50" cy="100" r="4" fill="currentColor" opacity="0.5" />
                </g>
                <g className="iwx-splash__orbiter iwx-splash__orbiter--3">
                  <circle cx="100" cy="50" r="3.5" fill="currentColor" opacity="0.6" />
                </g>
              </g>

              {/* Central logo core */}
              <g className="iwx-splash__core">
                <circle cx="100" cy="100" r="18" fill="currentColor" opacity="0.08" />
                <circle cx="100" cy="100" r="12" fill="currentColor" opacity="0.15" />
                <circle cx="100" cy="100" r="6" fill="currentColor" />
              </g>

              {/* Connection beams */}
              <line x1="106" y1="100" x2="142" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.3" className="iwx-splash__beam iwx-splash__beam--1" />
              <line x1="94" y1="100" x2="58" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.3" className="iwx-splash__beam iwx-splash__beam--2" />
              <line x1="100" y1="94" x2="100" y2="58" stroke="currentColor" strokeWidth="1" opacity="0.3" className="iwx-splash__beam iwx-splash__beam--3" />
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
