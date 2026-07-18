import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

/* ---------------------------------------------------------
   Deterministic pseudo-random (seeded) so background layers
   are stable across renders instead of reshuffling on state
   updates — avoids visual "jumps" and keeps memoization cheap.
--------------------------------------------------------- */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const GLOBE_NODES = (() => {
  const rand = seededRandom(42);
  const nodes = [];
  for (let i = 0; i < 16; i++) {
    nodes.push({
      id: `NODE-${(0x1000 + Math.floor(rand() * 0xefff)).toString(16).toUpperCase()}`,
      rotY: Math.floor(rand() * 360),
      rotX: Math.floor(rand() * 140) - 70,
      threat: rand() > 0.78,
      delay: (rand() * 4).toFixed(2),
    });
  }
  return nodes;
})();

const MESH_NODES = (() => {
  const rand = seededRandom(7);
  const nodes = [];
  for (let i = 0; i < 22; i++) {
    nodes.push({
      x: rand() * 100,
      y: rand() * 100,
      r: rand() * 1.6 + 0.6,
      delay: (rand() * 5).toFixed(2),
    });
  }
  return nodes;
})();

const MESH_LINES = (() => {
  const lines = [];
  for (let i = 0; i < MESH_NODES.length; i++) {
    const a = MESH_NODES[i];
    const b = MESH_NODES[(i + 3) % MESH_NODES.length];
    const c = MESH_NODES[(i + 7) % MESH_NODES.length];
    lines.push([a, b]);
    if (i % 2 === 0) lines.push([a, c]);
  }
  return lines;
})();

const PARTICLES = (() => {
  const rand = seededRandom(101);
  return Array.from({ length: 34 }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    size: rand() * 2.4 + 0.8,
    duration: rand() * 14 + 12,
    delay: rand() * -20,
    depth: rand(),
  }));
})();

const CODE_COLUMNS = (() => {
  const rand = seededRandom(202);
  const glyphs = "01ABCDEF{}<>/#$%*&^~".split("");
  return Array.from({ length: 14 }, (_, i) => {
    const len = 18 + Math.floor(rand() * 14);
    let str = "";
    for (let j = 0; j < len; j++) str += glyphs[Math.floor(rand() * glyphs.length)];
    return {
      id: i,
      left: (i / 14) * 100 + rand() * 3,
      duration: rand() * 6 + 9,
      delay: rand() * -12,
      text: str,
    };
  });
})();

const THREAT_FEED = [
  "EVID-2291 hash re-verified :: match",
  "Perimeter sensor sync :: nominal",
  "Anomaly on NODE-A31F :: auto-contained",
  "Chain of custody :: unbroken",
  "Timeline reconstruction :: 98% complete",
  "Volatile memory capture :: queued",
  "Signature match against IOC feed :: none",
  "Case index :: rebuilt in 0.4s",
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function ShieldMark({ state }) {
  return (
    <div className={`shield-mark shield-mark--${state}`} aria-hidden="true">
      <svg viewBox="0 0 120 132" className="shield-svg">
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>
        <path
          className="shield-outline"
          d="M60 4 L112 24 V64 C112 96 90 118 60 128 C30 118 8 96 8 64 V24 Z"
          fill="rgba(10,30,40,0.35)"
          stroke="url(#shieldGrad)"
          strokeWidth="2.5"
        />
        <path
          className="shield-inner-ring"
          d="M60 16 L100 32 V64 C100 89 84 106 60 115 C36 106 20 89 20 64 V32 Z"
          fill="none"
          stroke="var(--cyan)"
          strokeWidth="0.75"
          opacity="0.4"
        />
        <g className="shield-lock">
          <rect x="44" y="60" width="32" height="26" rx="4" fill="none" stroke="var(--cyan)" strokeWidth="3" />
          <path d="M50 60 V50 a10 10 0 0 1 20 0 V60" fill="none" stroke="var(--cyan)" strokeWidth="3" />
          <circle cx="60" cy="72" r="3.2" fill="var(--cyan)" />
        </g>
        <rect className="shield-scan" x="8" y="4" width="104" height="6" fill="url(#shieldGrad)" opacity="0.55" />
      </svg>
    </div>
  );
}

export default function Login({ onLogin, productName = "ARCLIGHT", tagline = "AI-Driven Digital Forensics & Incident Response" }) {
  const reducedMotion = useReducedMotion();
  const clock = useClock();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ operatorId: "", passkey: "" });
  const [showPasskey, setShowPasskey] = useState(false);
  const [remember, setRemember] = useState(false);
  const [authState, setAuthState] = useState("idle"); // idle | authenticating | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [feedIndex, setFeedIndex] = useState(0);
  const [focusField, setFocusField] = useState(null);

  const sceneRef = useRef(null);
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const pendingMove = useRef(null);

  /* Cycle the threat-feed ticker line */
  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => setFeedIndex((i) => (i + 1) % THREAT_FEED.length), 3200);
    return () => clearInterval(t);
  }, [reducedMotion]);

  /* rAF-throttled pointer parallax + card tilt.
     Writes transforms directly to the DOM via refs instead of
     setState, so mouse movement never triggers a React re-render. */
  const handlePointerMove = useCallback(
    (e) => {
      if (reducedMotion) return;
      pendingMove.current = { clientX: e.clientX, clientY: e.clientY };
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const { clientX, clientY } = pendingMove.current;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nx = (clientX / vw) * 2 - 1; // -1..1
        const ny = (clientY / vh) * 2 - 1;

        if (sceneRef.current) {
          sceneRef.current.style.setProperty("--px", nx.toFixed(3));
          sceneRef.current.style.setProperty("--py", ny.toFixed(3));
        }

        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          const cx = (clientX - rect.left) / rect.width - 0.5;
          const cy = (clientY - rect.top) / rect.height - 0.5;
          const withinBounds =
            clientX > rect.left - 120 &&
            clientX < rect.right + 120 &&
            clientY > rect.top - 120 &&
            clientY < rect.bottom + 120;
          if (withinBounds) {
            const rx = (cy * -8).toFixed(2);
            const ry = (cx * 10).toFixed(2);
            cardRef.current.style.setProperty("--tiltx", `${rx}deg`);
            cardRef.current.style.setProperty("--tilty", `${ry}deg`);
          }
        }
      });
    },
    [reducedMotion]
  );

  useEffect(() => {
    if (reducedMotion) return;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handlePointerMove, reducedMotion]);

  const handleCardLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--tiltx", `0deg`);
    cardRef.current.style.setProperty("--tilty", `0deg`);
  };

  const handleChange = (field) => (e) => {
    setFormData((f) => ({ ...f, [field]: e.target.value }));
    if (authState === "error") setAuthState("idle");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authState === "authenticating") return;

    if (!formData.operatorId.trim() || !formData.passkey.trim()) {
      setAuthState("error");
      setErrorMsg("Operator ID and passkey are both required.");
      return;
    }

    setAuthState("authenticating");
    setErrorMsg("");

    window.setTimeout(() => {
      setAuthState("success");
      sessionStorage.setItem("arclight-dev-session", "active");
      onLogin?.({ ...formData, remember });
      window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    }, 1850);
  };

  const timeString = useMemo(() => {
    return clock.toISOString().slice(11, 19) + "Z";
  }, [clock]);

  const dateString = useMemo(() => clock.toISOString().slice(0, 10), [clock]);

  return (
    <div className={`login-page ${reducedMotion ? "reduced-motion" : ""}`}>
      <div className="scene" ref={sceneRef}>
        {/* ---- Background layers ---- */}
        <div className="layer layer--mesh" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mesh-svg">
            {MESH_LINES.map(([a, b], i) => (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="mesh-line" />
            ))}
            {MESH_NODES.map((n, i) => (
              <circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={n.r}
                className="mesh-node"
                style={{ animationDelay: `${n.delay}s` }}
              />
            ))}
          </svg>
        </div>

        <div className="layer layer--particles" aria-hidden="true">
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                opacity: 0.25 + p.depth * 0.5,
              }}
            />
          ))}
        </div>

        <div className="layer layer--coderain" aria-hidden="true">
          {CODE_COLUMNS.map((c) => (
            <div
              key={c.id}
              className="code-column"
              style={{
                left: `${c.left}%`,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
              }}
            >
              {c.text.split("").map((ch, idx) => (
                <span key={idx}>{ch}</span>
              ))}
            </div>
          ))}
        </div>

        {/* ---- Holographic globe + attack vectors ---- */}
        <div className="layer layer--globe" aria-hidden="true">
          <div className="globe-scene">
            <div className="globe">
              <div className="globe-sphere" />
              {[0, 25, -25, 50, -50].map((deg, i) => (
                <div key={i} className="globe-ring globe-ring--lat" style={{ transform: `rotateX(${90 + deg}deg)` }} />
              ))}
              {[0, 45, 90, 135].map((deg, i) => (
                <div key={i} className="globe-ring globe-ring--lon" style={{ transform: `rotateY(${deg}deg)` }} />
              ))}
              {GLOBE_NODES.map((n) => (
                <div
                  key={n.id}
                  className={`globe-node ${n.threat ? "globe-node--threat" : ""}`}
                  style={{
                    transform: `rotateY(${n.rotY}deg) rotateX(${n.rotX}deg) translateZ(148px)`,
                    animationDelay: `${n.delay}s`,
                  }}
                >
                  <span className="globe-node-dot" />
                  <span className="globe-node-label">{n.id}</span>
                </div>
              ))}
            </div>
          </div>

          <svg className="attack-vectors" viewBox="0 0 800 800" aria-hidden="true">
            <defs>
              <linearGradient id="vecGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--magenta)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--magenta)" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {[
              "M40,120 C240,180 340,300 400,400",
              "M760,90 C560,160 460,280 400,400",
              "M60,700 C260,600 340,480 400,400",
              "M740,660 C540,580 460,480 400,400",
              "M400,20 C400,150 400,260 400,400",
            ].map((d, i) => (
              <path key={i} d={d} className="vector-path" style={{ animationDelay: `${i * 0.9}s` }} />
            ))}
            <circle cx="400" cy="400" r="10" className="vector-impact" />
          </svg>
        </div>

        <div className="layer layer--scanlines" aria-hidden="true" />
        <div className="layer layer--vignette" aria-hidden="true" />

        {/* ---- HUD chrome ---- */}
        <div className="hud" aria-hidden="true">
          <div className="hud-corner hud-corner--tl" />
          <div className="hud-corner hud-corner--tr" />
          <div className="hud-corner hud-corner--bl" />
          <div className="hud-corner hud-corner--br" />

          <div className="hud-status hud-status--top-left">
            <span className="hud-dot" />
            SYSTEM ONLINE
          </div>

          <div className="hud-status hud-status--top-right">
            {dateString} &nbsp;•&nbsp; {timeString}
          </div>

          <div className="hud-ticker">
            <span className="hud-ticker-label">FEED</span>
            <span key={feedIndex} className="hud-ticker-text">
              {THREAT_FEED[feedIndex]}
            </span>
          </div>
        </div>

        {/* ---- Login card ---- */}
        <main
          className="login-card"
          ref={cardRef}
          onMouseLeave={handleCardLeave}
        >
          <div className="login-card-inner">
            <header className="card-header">
              <ShieldMark state={authState} />
              <h1 className="brand">{productName}</h1>
              <p className="tagline">{tagline}</p>
            </header>

            <div className="integrity-row">
              <span className="integrity-dot" />
              EVIDENCE INTEGRITY: VERIFIED
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className={`field ${focusField === "operatorId" ? "field--focus" : ""}`}>
                <label htmlFor="operatorId">Operator ID</label>
                <input
                  id="operatorId"
                  name="operatorId"
                  type="text"
                  autoComplete="username"
                  value={formData.operatorId}
                  onChange={handleChange("operatorId")}
                  onFocus={() => setFocusField("operatorId")}
                  onBlur={() => setFocusField(null)}
                  placeholder="e.g. J.RIVERA"
                  disabled={authState === "authenticating"}
                />
                <span className="field-underline" />
              </div>

              <div className={`field ${focusField === "passkey" ? "field--focus" : ""}`}>
                <label htmlFor="passkey">Passkey</label>
                <div className="passkey-row">
                  <input
                    id="passkey"
                    name="passkey"
                    type={showPasskey ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.passkey}
                    onChange={handleChange("passkey")}
                    onFocus={() => setFocusField("passkey")}
                    onBlur={() => setFocusField(null)}
                    placeholder="••••••••••••"
                    disabled={authState === "authenticating"}
                  />
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setShowPasskey((s) => !s)}
                    aria-label={showPasskey ? "Hide passkey" : "Show passkey"}
                  >
                    {showPasskey ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <span className="field-underline" />
              </div>

              <div className="field-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="checkbox-box" />
                  Remember this workstation
                </label>
                <a href="#recover" className="link-muted" onClick={(ev) => ev.preventDefault()}>
                  Forgot passkey?
                </a>
              </div>

              <button
                type="submit"
                className={`submit-btn submit-btn--${authState}`}
                disabled={authState === "authenticating"}
              >
                <span className="submit-btn-scan" />
                <span className="submit-btn-label">
                  {authState === "authenticating" && "VERIFYING CREDENTIALS…"}
                  {authState === "success" && "ACCESS GRANTED"}
                  {(authState === "idle" || authState === "error") && "AUTHENTICATE"}
                </span>
              </button>

              <button type="button" className="biometric-btn" disabled={authState === "authenticating"}>
                <svg viewBox="0 0 24 24" className="biometric-icon" aria-hidden="true">
                  <path
                    d="M12 2a7 7 0 0 0-7 7v3c0 3.5-1 5-2 6.5M12 2a7 7 0 0 1 7 7v3c0 1.2.15 2.2.4 3M8 12a4 4 0 0 1 8 0v1c0 3 .5 5 1.5 7M12 12v1c0 3.5.6 5.8 2 8M8 9v3c0 4-1 6.5-3 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                Use biometric scan
              </button>

              <div className="form-status" role="status" aria-live="polite">
                {authState === "error" && <span className="status-error">{errorMsg}</span>}
                {authState === "success" && <span className="status-success">Session established. Redirecting to case dashboard…</span>}
              </div>
            </form>

            <p className="auth-switch-row">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="link-muted">
                Create Account
              </Link>
            </p>

            <footer className="card-footer">
              <span>AES-256</span>
              <span className="dot-sep">•</span>
              <span>ZERO-TRUST</span>
              <span className="dot-sep">•</span>
              <span>SOC2</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}