import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

/* ---------------------------------------------------------
   Deterministic pseudo-random (seeded) so background layers
   are stable across renders instead of reshuffling on state
   updates — mirrors the approach used on the Login page so
   the two screens feel like one continuous environment.
--------------------------------------------------------- */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const GLOBE_NODES = (() => {
  const rand = seededRandom(58);
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
  const rand = seededRandom(13);
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
  const rand = seededRandom(211);
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
  const rand = seededRandom(303);
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
  "New case workspace :: provisioning",
  "Perimeter sensor sync :: nominal",
  "Access policy template :: applied",
  "Chain of custody :: initialized",
  "Operator directory :: syncing",
  "Encryption keys :: generated",
  "Signature match against IOC feed :: none",
  "Audit log :: ready",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/* Password strength: 0-4 based on length + character variety */
function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ["VERY WEAK", "WEAK", "MODERATE", "STRONG", "MAXIMUM"];

function ShieldMark({ state }) {
  return (
    <div className={`rg-shield rg-shield--${state}`} aria-hidden="true">
      <svg viewBox="0 0 120 132" className="rg-shield-svg">
        <defs>
          <linearGradient id="rgShieldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--rg-cyan)" />
            <stop offset="100%" stopColor="var(--rg-blue)" />
          </linearGradient>
        </defs>
        <path
          className="rg-shield-outline"
          d="M60 4 L112 24 V64 C112 96 90 118 60 128 C30 118 8 96 8 64 V24 Z"
          fill="rgba(10,30,40,0.35)"
          stroke="url(#rgShieldGrad)"
          strokeWidth="2.5"
        />
        <path
          className="rg-shield-inner-ring"
          d="M60 16 L100 32 V64 C100 89 84 106 60 115 C36 106 20 89 20 64 V32 Z"
          fill="none"
          stroke="var(--rg-cyan)"
          strokeWidth="0.75"
          opacity="0.4"
        />
        <g className="rg-shield-lock">
          <rect x="44" y="60" width="32" height="26" rx="4" fill="none" stroke="var(--rg-cyan)" strokeWidth="3" />
          <path d="M50 60 V50 a10 10 0 0 1 20 0 V60" fill="none" stroke="var(--rg-cyan)" strokeWidth="3" />
          <circle cx="60" cy="72" r="3.2" fill="var(--rg-cyan)" />
        </g>
        <rect className="rg-shield-scan" x="8" y="4" width="104" height="6" fill="url(#rgShieldGrad)" opacity="0.55" />
      </svg>
    </div>
  );
}

export default function Register({
  onRegister,
  onNavigateToLogin,
  loginPath = "/login",
  productName = "ARCLIGHT",
  tagline = "AI-Driven Digital Forensics & Incident Response",
}) {
  const reducedMotion = useReducedMotion();
  const clock = useClock();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organization: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState("idle"); // idle | submitting | success | error
  const [feedIndex, setFeedIndex] = useState(0);
  const [focusField, setFocusField] = useState(null);

  const sceneRef = useRef(null);
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const pendingMove = useRef(null);

  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => setFeedIndex((i) => (i + 1) % THREAT_FEED.length), 3200);
    return () => clearInterval(t);
  }, [reducedMotion]);

  /* rAF-throttled pointer parallax + card tilt — writes directly
     to the DOM via refs so mouse movement never triggers a re-render. */
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
        const nx = (clientX / vw) * 2 - 1;
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
    const value = field === "email" ? e.target.value.trim() : e.target.value;
    setFormData((f) => ({ ...f, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    if (submitState === "error") setSubmitState("idle");
  };

  const passwordScore = useMemo(() => scorePassword(formData.password), [formData.password]);

  const validate = (data) => {
    const next = {};

    if (!data.fullName.trim()) next.fullName = "Full name is required.";

    if (!data.email.trim()) next.email = "Email / Operator ID is required.";
    else if (!EMAIL_RE.test(data.email)) next.email = "Enter a valid email address.";

    if (!data.organization.trim()) next.organization = "Organization name is required.";

    if (!data.password) next.password = "Password is required.";
    else if (data.password.length < 8) next.password = "Password must be at least 8 characters.";
    else if (scorePassword(data.password) < 2) next.password = "Add uppercase, numbers, or symbols for a stronger password.";

    if (!data.confirmPassword) next.confirmPassword = "Please confirm your password.";
    else if (data.confirmPassword !== data.password) next.confirmPassword = "Passwords do not match.";

    return next;
  };

  const handleBlurValidate = (field) => () => {
    setFocusField(null);
    const fieldErrors = validate(formData);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitState === "submitting") return;

    const fieldErrors = validate(formData);
    if (!agreedToTerms) fieldErrors.terms = "You must accept the terms to continue.";

    if (Object.values(fieldErrors).some(Boolean)) {
      setErrors(fieldErrors);
      setSubmitState("error");
      return;
    }

    setErrors({});
    setSubmitState("submitting");

    window.setTimeout(() => {
      setSubmitState("success");
      onRegister?.({ ...formData, organization: formData.organization });
      window.setTimeout(() => {
        if (onNavigateToLogin) onNavigateToLogin();
        else navigate(loginPath);
      }, 1800);
    }, 1700);
  };

  const handleSignInClick = (e) => {
    if (onNavigateToLogin) {
      e.preventDefault();
      onNavigateToLogin();
    }
    // otherwise let the <Link> handle routing to loginPath
  };

  const timeString = useMemo(() => clock.toISOString().slice(11, 19) + "Z", [clock]);
  const dateString = useMemo(() => clock.toISOString().slice(0, 10), [clock]);

  return (
    <div className={`rg-page ${reducedMotion ? "rg-reduced-motion" : ""}`}>
      <div className="rg-scene" ref={sceneRef}>
        {/* ---- Background layers ---- */}
        <div className="rg-layer rg-layer--mesh" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="rg-mesh-svg">
            {MESH_LINES.map(([a, b], i) => (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="rg-mesh-line" />
            ))}
            {MESH_NODES.map((n, i) => (
              <circle key={i} cx={n.x} cy={n.y} r={n.r} className="rg-mesh-node" style={{ animationDelay: `${n.delay}s` }} />
            ))}
          </svg>
        </div>

        <div className="rg-layer rg-layer--particles" aria-hidden="true">
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              className="rg-particle"
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

        <div className="rg-layer rg-layer--coderain" aria-hidden="true">
          {CODE_COLUMNS.map((c) => (
            <div
              key={c.id}
              className="rg-code-column"
              style={{ left: `${c.left}%`, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s` }}
            >
              {c.text.split("").map((ch, idx) => (
                <span key={idx}>{ch}</span>
              ))}
            </div>
          ))}
        </div>

        <div className="rg-layer rg-layer--globe" aria-hidden="true">
          <div className="rg-globe-scene">
            <div className="rg-globe">
              <div className="rg-globe-sphere" />
              {[0, 25, -25, 50, -50].map((deg, i) => (
                <div key={i} className="rg-globe-ring rg-globe-ring--lat" style={{ transform: `rotateX(${90 + deg}deg)` }} />
              ))}
              {[0, 45, 90, 135].map((deg, i) => (
                <div key={i} className="rg-globe-ring rg-globe-ring--lon" style={{ transform: `rotateY(${deg}deg)` }} />
              ))}
              {GLOBE_NODES.map((n) => (
                <div
                  key={n.id}
                  className={`rg-globe-node ${n.threat ? "rg-globe-node--threat" : ""}`}
                  style={{ transform: `rotateY(${n.rotY}deg) rotateX(${n.rotX}deg) translateZ(148px)`, animationDelay: `${n.delay}s` }}
                >
                  <span className="rg-globe-node-dot" />
                  <span className="rg-globe-node-label">{n.id}</span>
                </div>
              ))}
            </div>
          </div>

          <svg className="rg-attack-vectors" viewBox="0 0 800 800" aria-hidden="true">
            <defs>
              <linearGradient id="rgVecGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--rg-magenta)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--rg-magenta)" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {[
              "M40,120 C240,180 340,300 400,400",
              "M760,90 C560,160 460,280 400,400",
              "M60,700 C260,600 340,480 400,400",
              "M740,660 C540,580 460,480 400,400",
              "M400,20 C400,150 400,260 400,400",
            ].map((d, i) => (
              <path key={i} d={d} className="rg-vector-path" style={{ animationDelay: `${i * 0.9}s` }} />
            ))}
            <circle cx="400" cy="400" r="10" className="rg-vector-impact" />
          </svg>
        </div>

        <div className="rg-layer rg-layer--scanlines" aria-hidden="true" />
        <div className="rg-layer rg-layer--vignette" aria-hidden="true" />

        {/* ---- HUD chrome ---- */}
        <div className="rg-hud" aria-hidden="true">
          <div className="rg-hud-corner rg-hud-corner--tl" />
          <div className="rg-hud-corner rg-hud-corner--tr" />
          <div className="rg-hud-corner rg-hud-corner--bl" />
          <div className="rg-hud-corner rg-hud-corner--br" />

          <div className="rg-hud-status rg-hud-status--top-left">
            <span className="rg-hud-dot" />
            SYSTEM ONLINE
          </div>

          <div className="rg-hud-status rg-hud-status--top-right">
            {dateString} &nbsp;•&nbsp; {timeString}
          </div>

          <div className="rg-hud-ticker">
            <span className="rg-hud-ticker-label">SETUP</span>
            <span key={feedIndex} className="rg-hud-ticker-text">
              {THREAT_FEED[feedIndex]}
            </span>
          </div>
        </div>

        {/* ---- Register card ---- */}
        <main className="rg-card" ref={cardRef} onMouseLeave={handleCardLeave}>
          <div className="rg-card-inner">
            <header className="rg-card-header">
              <ShieldMark state={submitState} />
              <h1 className="rg-brand">{productName}</h1>
              <p className="rg-tagline">{tagline}</p>
            </header>

            <div className="rg-integrity-row">
              <span className="rg-integrity-dot" />
              EVIDENCE INTEGRITY: VERIFIED
            </div>

            <form className="rg-form" onSubmit={handleSubmit} noValidate>
              <div className={`rg-field ${focusField === "fullName" ? "rg-field--focus" : ""} ${errors.fullName ? "rg-field--error" : ""}`}>
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange("fullName")}
                  onFocus={() => setFocusField("fullName")}
                  onBlur={handleBlurValidate("fullName")}
                  placeholder="e.g. Jordan Rivera"
                  disabled={submitState === "submitting"}
                  aria-invalid={!!errors.fullName}
                />
                <span className="rg-field-underline" />
                {errors.fullName && <span className="rg-field-error-msg">{errors.fullName}</span>}
              </div>

              <div className={`rg-field ${focusField === "email" ? "rg-field--focus" : ""} ${errors.email ? "rg-field--error" : ""}`}>
                <label htmlFor="email">Email / Operator ID</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  onFocus={() => setFocusField("email")}
                  onBlur={handleBlurValidate("email")}
                  placeholder="operator@agency.gov"
                  disabled={submitState === "submitting"}
                  aria-invalid={!!errors.email}
                />
                <span className="rg-field-underline" />
                {errors.email && <span className="rg-field-error-msg">{errors.email}</span>}
              </div>

              <div className={`rg-field ${focusField === "organization" ? "rg-field--focus" : ""} ${errors.organization ? "rg-field--error" : ""}`}>
                <label htmlFor="organization">Organization Name</label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  value={formData.organization}
                  onChange={handleChange("organization")}
                  onFocus={() => setFocusField("organization")}
                  onBlur={handleBlurValidate("organization")}
                  placeholder="e.g. Meridian Cyber Response"
                  disabled={submitState === "submitting"}
                  aria-invalid={!!errors.organization}
                />
                <span className="rg-field-underline" />
                {errors.organization && <span className="rg-field-error-msg">{errors.organization}</span>}
              </div>

              <div className={`rg-field ${focusField === "password" ? "rg-field--focus" : ""} ${errors.password ? "rg-field--error" : ""}`}>
                <label htmlFor="password">Password</label>
                <div className="rg-input-row">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange("password")}
                    onFocus={() => setFocusField("password")}
                    onBlur={handleBlurValidate("password")}
                    placeholder="••••••••••••"
                    disabled={submitState === "submitting"}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="rg-ghost-btn"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <span className="rg-field-underline" />
                {formData.password && (
                  <div className="rg-strength" aria-hidden="true">
                    <div className="rg-strength-bar">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`rg-strength-seg ${i < passwordScore ? `rg-strength-seg--${passwordScore}` : ""}`} />
                      ))}
                    </div>
                    <span className="rg-strength-label">{STRENGTH_LABELS[passwordScore]}</span>
                  </div>
                )}
                {errors.password && <span className="rg-field-error-msg">{errors.password}</span>}
              </div>

              <div className={`rg-field ${focusField === "confirmPassword" ? "rg-field--focus" : ""} ${errors.confirmPassword ? "rg-field--error" : ""}`}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="rg-input-row">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    onFocus={() => setFocusField("confirmPassword")}
                    onBlur={handleBlurValidate("confirmPassword")}
                    placeholder="••••••••••••"
                    disabled={submitState === "submitting"}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="rg-ghost-btn"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <span className="rg-field-underline" />
                {errors.confirmPassword && <span className="rg-field-error-msg">{errors.confirmPassword}</span>}
              </div>

              <div className={`rg-field-row ${errors.terms ? "rg-field--error" : ""}`}>
                <label className="rg-checkbox">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      setErrors((prev) => ({ ...prev, terms: undefined }));
                    }}
                  />
                  <span className="rg-checkbox-box" />
                  I agree to the Terms of Service and Acceptable Use Policy
                </label>
              </div>
              {errors.terms && <span className="rg-field-error-msg rg-field-error-msg--standalone">{errors.terms}</span>}

              <button type="submit" className={`rg-submit-btn rg-submit-btn--${submitState}`} disabled={submitState === "submitting"}>
                <span className="rg-submit-btn-scan" />
                <span className="rg-submit-btn-label">
                  {submitState === "submitting" && "PROVISIONING ACCESS…"}
                  {submitState === "success" && "ACCOUNT CREATED"}
                  {(submitState === "idle" || submitState === "error") && "CREATE SECURE ACCOUNT"}
                </span>
              </button>

              <div className="rg-form-status" role="status" aria-live="polite">
                {submitState === "error" && <span className="rg-status-error">Check the highlighted fields and try again.</span>}
                {submitState === "success" && <span className="rg-status-success">Account created. Redirecting to sign in…</span>}
              </div>
            </form>

            <p className="rg-signin-row">
              Already have an account?{" "}
              <Link to={loginPath} className="rg-signin-link" onClick={handleSignInClick}>
                Sign In
              </Link>
            </p>

            <footer className="rg-card-footer">
              <span>AES-256</span>
              <span className="rg-dot-sep">•</span>
              <span>ZERO-TRUST</span>
              <span className="rg-dot-sep">•</span>
              <span>SOC2</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}