import { useState } from "react";
import { FiGlobe, FiShieldOff } from "react-icons/fi";

const ATTACK_VECTORS = [
  { id: "v1", src: "Beijing, CN (183.14.22.9)", dst: "NYC HQ DC01 (10.0.4.12)", proto: "TCP/445 SMB", status: "BLOCKED", color: "#EF3340" },
  { id: "v2", src: "Moscow, RU (194.26.29.11)", dst: "VPN-GW-04 (192.168.1.1)", proto: "HTTPS/443 C2", status: "ISOLATED", color: "#F97316" },
  { id: "v3", src: "Frankfurt, DE (85.214.40.2)", dst: "AWS S3 Cluster", proto: "TLS Egress", status: "MONITORING", color: "#3B82F6" },
];

export default function WorldAttackMap3D() {
  const [activeVector, setActiveVector] = useState(ATTACK_VECTORS[0]);

  return (
    <div className="panel-3d attack-map-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Global Cyber Telemetry</span>
          <h3 className="panel-title">Real-Time Threat Attack Vectors</h3>
        </div>

        <div className="map-live-tag">
          <span className="live-dot" /> 3D Cyber Grid Active
        </div>
      </div>

      <div className="attack-map-stage">
        {/* SVG 3D Globe Projection & Cyber Mesh */}
        <svg className="map-svg-viewport" viewBox="0 0 800 360" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#3B82F6" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#07090F" stopOpacity={0} />
            </radialGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <linearGradient id="arcGradRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF3340" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#EF3340" stopOpacity="1" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="arcGradOrange" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#F97316" stopOpacity="1" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          {/* Glowing Background Radial */}
          <ellipse cx="400" cy="180" rx="360" ry="160" fill="url(#globeGlow)" />

          {/* Grid Latitude/Longitude Ellipses for 3D sphere look */}
          <g stroke="#252B3A" strokeWidth="1" fill="none" opacity="0.6">
            <ellipse cx="400" cy="180" rx="340" ry="140" strokeDasharray="4 6" />
            <ellipse cx="400" cy="180" rx="260" ry="100" />
            <ellipse cx="400" cy="180" rx="180" ry="60" />
            <line x1="60" y1="180" x2="740" y2="180" />
            <line x1="400" y1="40" x2="400" y2="320" />
          </g>

          {/* World Map Continent Outlines (SVG Path Mesh) */}
          <path
            d="M 120 120 Q 150 100 200 130 T 260 160 Q 230 200 180 220 T 130 180 Z 
               M 240 240 Q 280 250 300 300 T 260 320 Z
               M 380 100 Q 420 90 460 120 T 440 160 Z
               M 420 180 Q 460 200 480 250 T 430 280 Z
               M 520 100 Q 600 80 680 120 T 640 180 T 560 160 Z
               M 620 220 Q 680 230 700 280 Z"
            fill="#151A27"
            stroke="#252B3A"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Pulsing Threat Origin Nodes */}
          {/* Node 1: East Asia (Beijing) */}
          <g transform="translate(620, 130)">
            <circle r="12" fill="#EF3340" opacity="0.2" className="ping-ring" />
            <circle r="5" fill="#EF3340" filter="url(#neonGlow)" />
            <text x="10" y="4" fill="#F8FAFC" fontSize="10" fontFamily="Inter">Beijing Threat Hub</text>
          </g>

          {/* Node 2: Eastern Europe (Moscow) */}
          <g transform="translate(480, 110)">
            <circle r="12" fill="#F97316" opacity="0.2" className="ping-ring" />
            <circle r="5" fill="#F97316" filter="url(#neonGlow)" />
            <text x="10" y="4" fill="#F8FAFC" fontSize="10" fontFamily="Inter">C2 Infrastructure</text>
          </g>

          {/* Target Node: North America (NYC HQ) */}
          <g transform="translate(200, 140)">
            <circle r="16" fill="#7C3AED" opacity="0.25" className="ping-ring" />
            <circle r="7" fill="#7C3AED" filter="url(#neonGlow)" />
            <text x="-80" y="-10" fill="#7C3AED" fontSize="11" fontWeight="bold" fontFamily="Inter">NYC CORE DC01</text>
          </g>

          {/* Curved 3D Trajectory Attack Arcs */}
          {/* Arc 1: Beijing to NYC */}
          <path
            d="M 620 130 Q 410 20 200 140"
            fill="none"
            stroke="url(#arcGradRed)"
            strokeWidth="3"
            strokeDasharray="8 4"
            className="attack-arc-path"
          />

          {/* Arc 2: Moscow to NYC */}
          <path
            d="M 480 110 Q 340 50 200 140"
            fill="none"
            stroke="url(#arcGradOrange)"
            strokeWidth="2.5"
            className="attack-arc-path"
          />
        </svg>
      </div>

      <div className="attack-vectors-footer">
        {ATTACK_VECTORS.map((vec) => (
          <div
            key={vec.id}
            className={`vector-card ${activeVector.id === vec.id ? "vector-card--active" : ""}`}
            onClick={() => setActiveVector(vec)}
          >
            <FiShieldOff style={{ color: vec.color }} className="vec-icon" />
            <div className="vec-info">
              <span className="vec-title">{vec.src} → {vec.dst}</span>
              <span className="vec-proto">{vec.proto}</span>
            </div>
            <span className="vec-status-badge" style={{ borderColor: vec.color, color: vec.color }}>
              {vec.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
