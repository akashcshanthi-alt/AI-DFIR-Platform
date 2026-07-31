import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiActivity } from 'react-icons/fi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ALL_GRAPHS = [
  // 1. THREAT TRENDS
  { category: 'Threat Trends', name: 'Threat Activity Line Chart', type: 'trend-line' },
  { category: 'Threat Trends', name: 'Incident Volume Area Chart', type: 'trend-area' },
  { category: 'Threat Trends', name: 'Alert Frequency Bar Chart', type: 'trend-bar' },
  { category: 'Threat Trends', name: 'Severity Distribution Donut Chart', type: 'trend-donut' },
  
  // 2. SECURITY EVENTS
  { category: 'Security Events', name: 'Authentication Events Timeline', type: 'event-auth' },
  { category: 'Security Events', name: 'Process Spawn Activity', type: 'event-process' },
  { category: 'Security Events', name: 'Network Connection Flows', type: 'event-network' },
  { category: 'Security Events', name: 'IOC Detection Scatter Plot', type: 'event-scatter' },
  
  // 3. ATTACK CORRELATION
  { category: 'Attack Correlation', name: 'Attack Path Graph', type: 'correlation-path' },
  { category: 'Attack Correlation', name: 'IOC Relationship Network', type: 'correlation-ioc' },
  { category: 'Attack Correlation', name: 'Host Communication Graph', type: 'correlation-host' },
  { category: 'Attack Correlation', name: 'Incident Correlation Network', type: 'correlation-incident' },
];

export default function CommonGraphsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const autoShiftTimer = useRef(null);

  const activeGraph = ALL_GRAPHS[activeIndex];
  const currentCategory = activeGraph.category;

  // Clear and restart the automatic rotation sequence (4.5s)
  const startTimer = () => {
    if (autoShiftTimer.current) {
      clearInterval(autoShiftTimer.current);
    }
    autoShiftTimer.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ALL_GRAPHS.length);
    }, 4500);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (autoShiftTimer.current) {
        clearInterval(autoShiftTimer.current);
      }
    };
  }, []);

  // Jump to specific category first item
  const handleCategorySelect = (category) => {
    const idx = ALL_GRAPHS.findIndex(g => g.category === category);
    if (idx !== -1) {
      setActiveIndex(idx);
      startTimer();
    }
  };

  // Navigations
  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + ALL_GRAPHS.length) % ALL_GRAPHS.length);
    startTimer();
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % ALL_GRAPHS.length);
    startTimer();
  };

  // Render standardized Y-Axis Grid Lines for Data Charts
  const renderDataGrid = (max = 100) => (
    <g>
      {[25, 50, 75, 100].map(pct => {
        const val = Math.round((pct / 100) * max);
        const yVal = 240 - (pct / 100) * 180;
        return (
          <g key={pct}>
            <line x1="50" y1={yVal} x2="550" y2={yVal} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <text x="40" y={yVal + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="monospace">{val}</text>
          </g>
        );
      })}
      <line x1="50" y1="240" x2="550" y2="240" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
    </g>
  );

  const isRechartsGraph = (type) => {
    return ['trend-line', 'trend-area', 'trend-bar', 'trend-donut'].includes(type);
  };

  const renderRechartsContent = () => {
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div style={{
            backgroundColor: '#0c1322',
            border: '1px solid var(--color-primary, #3b82f6)',
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
            fontSize: '0.75rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-muted, #64748b)' }}>{label}</p>
            {payload.map((pld, index) => (
              <p key={index} style={{ margin: '3px 0 0 0', fontWeight: '600', color: pld.color || pld.fill }}>
                {`${pld.name}: ${pld.value}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    switch (activeGraph.type) {
      case 'trend-line': {
        const lineData = [
          { name: 'Mon', Active: 12, Resolved: 8 },
          { name: 'Tue', Active: 18, Resolved: 12 },
          { name: 'Wed', Active: 15, Resolved: 11 },
          { name: 'Thu', Active: 27, Resolved: 20 },
          { name: 'Fri', Active: 21, Resolved: 16 },
          { name: 'Sat', Active: 24, Resolved: 18 },
          { name: 'Sun', Active: 19, Resolved: 15 }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
              <XAxis dataKey="name" stroke="var(--text-muted, #64748b)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--text-muted, #64748b)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="Active" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ stroke: '#06b6d4', strokeWidth: 2, r: 4 }} />
              <Line type="monotone" dataKey="Resolved" stroke="#22c55e" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ stroke: '#10b981', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      }
      case 'trend-area': {
        const areaData = [
          { name: '00:00', IncidentVolume: 4 },
          { name: '04:00', IncidentVolume: 8 },
          { name: '08:00', IncidentVolume: 18 },
          { name: '12:00', IncidentVolume: 12 },
          { name: '16:00', IncidentVolume: 22 },
          { name: '20:00', IncidentVolume: 14 }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
              <XAxis dataKey="name" stroke="var(--text-muted, #64748b)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--text-muted, #64748b)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="IncidentVolume" name="Incident Volume" stroke="#06b6d4" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        );
      }
      case 'trend-bar': {
        const barData = [
          { name: 'Malware', Events: 85, fill: '#EF4444' },
          { name: 'Phishing', Events: 45, fill: '#F97316' },
          { name: 'BruteForce', Events: 65, fill: '#EAB308' },
          { name: 'Exfil', Events: 25, fill: '#8B5CF6' },
          { name: 'DOS', Events: 55, fill: '#3B82F6' }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
              <XAxis dataKey="name" stroke="var(--text-muted, #64748b)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--text-muted, #64748b)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Events" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }
      case 'trend-donut': {
        const donutData = [
          { name: 'Critical', value: 15, fill: '#EF4444' },
          { name: 'High', value: 30, fill: '#F97316' },
          { name: 'Medium', value: 40, fill: '#EAB308' },
          { name: 'Low', value: 15, fill: '#3B82F6' }
        ];
        return (
          <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {donutData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.fill }} />
                  <span style={{ fontWeight: '600' }}>{`${item.name} (${item.value}%)`}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Switch to render corresponding threat visualization inside the 600x300 SVG stage
  const renderGraphSVGContent = () => {
    switch (activeGraph.type) {
      // 1. Threat Trends - Line Chart
      case 'trend-line': {
        const linePoints = [
          { x: 70, y: 200, val: 12, day: 'Mon' },
          { x: 150, y: 155, val: 18, day: 'Tue' },
          { x: 230, y: 175, val: 15, day: 'Wed' },
          { x: 310, y: 90, val: 27, day: 'Thu' },
          { x: 390, y: 135, val: 21, day: 'Fri' },
          { x: 470, y: 110, val: 24, day: 'Sat' },
          { x: 550, y: 145, val: 19, day: 'Sun' }
        ];
        const lPath = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
          <g>
            {renderDataGrid(30)}
            <path
              d={lPath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray="1000"
              strokeDashoffset="1000"
              className="line-draw-path"
            />
            {linePoints.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6.5"
                  fill="#0a0f1d"
                  stroke="#06B6D4"
                  strokeWidth="2.5"
                  className="animated-dot"
                  style={{ animationDelay: `${idx * 0.1 + 0.5}s` }}
                />
                <text
                  x={p.x}
                  y={p.y - 12}
                  fill="#f8fafc"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  opacity="0"
                  className="pop-text"
                  style={{ animationDelay: `${idx * 0.1 + 0.7}s` }}
                >
                  {p.val}
                </text>
                <text
                  x={p.x}
                  y="260"
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {p.day}
                </text>
              </g>
            ))}
          </g>
        );
      }

      // 2. Threat Trends - Area Chart
      case 'trend-area': {
        const areaPoints = [
          { x: 70, y: 210, hour: '00:00', val: 4 },
          { x: 166, y: 180, hour: '04:00', val: 8 },
          { x: 262, y: 100, hour: '08:00', val: 18 },
          { x: 358, y: 145, hour: '12:00', val: 12 },
          { x: 454, y: 70, hour: '16:00', val: 22 },
          { x: 550, y: 130, hour: '20:00', val: 14 }
        ];
        const lPathArea = areaPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const aPathArea = `${lPathArea} L 550 240 L 70 240 Z`;
        return (
          <g>
            <defs>
              <clipPath id="areaShowcaseClip">
                <rect x="0" y="0" width="0" height="300">
                  <animate attributeName="width" from="0" to="600" dur="1s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
                </rect>
              </clipPath>
              <linearGradient id="areaBlueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {renderDataGrid(25)}
            <path
              d={aPathArea}
              fill="url(#areaBlueGrad)"
              clipPath="url(#areaShowcaseClip)"
            />
            <path
              d={lPathArea}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="3"
              strokeLinecap="round"
              clipPath="url(#areaShowcaseClip)"
            />
            {areaPoints.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="#0a0f1d"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  className="animated-dot"
                  style={{ animationDelay: `${idx * 0.1 + 0.7}s` }}
                />
                <text
                  x={p.x}
                  y="260"
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {p.hour}
                </text>
                <text
                  x={p.x}
                  y={p.y - 12}
                  fill="#f8fafc"
                  fontSize="10"
                  textAnchor="middle"
                  opacity="0"
                  className="pop-text"
                  style={{ animationDelay: `${idx * 0.1 + 0.9}s` }}
                >
                  {p.val}
                </text>
              </g>
            ))}
          </g>
        );
      }

      // 3. Threat Trends - Bar Chart
      case 'trend-bar': {
        const barValues = [
          { name: 'Malware', val: 85, color: '#EF4444' },     // Critical
          { name: 'Phishing', val: 45, color: '#F97316' },    // Orange Warning
          { name: 'BruteForce', val: 65, color: '#EAB308' },  // Yellow Warning
          { name: 'Exfil', val: 25, color: '#8B5CF6' },       // Purple Accent
          { name: 'DOS', val: 55, color: '#3B82F6' }          // Blue Primary
        ];
        return (
          <g>
            <defs>
              {barValues.map((b, idx) => (
                <linearGradient key={idx} id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={b.color} />
                  <stop offset="100%" stopColor={b.color} stopOpacity="0.15" />
                </linearGradient>
              ))}
            </defs>
            {renderDataGrid(100)}
            {barValues.map((b, idx) => {
              const x = 85 + idx * 100;
              const height = (b.val / 100) * 180;
              const y = 240 - height;
              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={240}
                    width="44"
                    height="0"
                    rx="4"
                    fill={`url(#barGrad-${idx})`}
                    stroke={b.color}
                    strokeWidth="1.2"
                    opacity="0.85"
                  >
                    <animate attributeName="height" from="0" to={height} dur="0.8s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
                    <animate attributeName="y" from="240" to={y} dur="0.8s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
                  </rect>
                  <text x={x + 22} y="260" fill="var(--text-muted)" fontSize="9.5" fontWeight="600" textAnchor="middle">
                    {b.name}
                  </text>
                  <text x={x + 22} y={y - 10} fill={b.color} fontSize="10" fontWeight="bold" textAnchor="middle" opacity="0" className="pop-text" style={{ animationDelay: '0.6s' }}>
                    {b.val}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      // 4. Threat Trends - Donut Chart
      case 'trend-donut': {
        return (
          <g>
            <circle
              cx="230" cy="150" r="75"
              fill="none"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="26"
            />
            {/* Medium 40% (Yellow) */}
            <circle
              cx="230" cy="150" r="75"
              fill="none"
              stroke="#EAB308"
              strokeWidth="26"
              strokeDasharray="188.5 471.2"
              strokeDashoffset="0"
              transform="rotate(-90 230 150)"
              strokeLinecap="round"
            >
              <animate attributeName="stroke-dasharray" from="0 471.2" to="188.5 471.2" dur="1s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
            </circle>
            {/* High 30% (Orange) */}
            <circle
              cx="230" cy="150" r="75"
              fill="none"
              stroke="#F97316"
              strokeWidth="26"
              strokeDasharray="141.4 471.2"
              strokeDashoffset="-188.5"
              transform="rotate(-90 230 150)"
              strokeLinecap="round"
            >
              <animate attributeName="stroke-dasharray" from="0 471.2" to="141.4 471.2" dur="1s" begin="0.1s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
            </circle>
            {/* Critical 15% (Red) */}
            <circle
              cx="230" cy="150" r="75"
              fill="none"
              stroke="#EF4444"
              strokeWidth="26"
              strokeDasharray="70.7 471.2"
              strokeDashoffset="-329.9"
              transform="rotate(-90 230 150)"
              strokeLinecap="round"
            >
              <animate attributeName="stroke-dasharray" from="0 471.2" to="70.7 471.2" dur="1s" begin="0.2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
            </circle>
            {/* Low 15% (Blue) */}
            <circle
              cx="230" cy="150" r="75"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="26"
              strokeDasharray="70.7 471.2"
              strokeDashoffset="-400.6"
              transform="rotate(-90 230 150)"
              strokeLinecap="round"
            >
              <animate attributeName="stroke-dasharray" from="0 471.2" to="70.7 471.2" dur="1s" begin="0.3s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
            </circle>
            <g transform="translate(380, 95)" fontSize="11" fill="var(--text-secondary)">
              <g transform="translate(0, 0)">
                <circle cx="0" cy="0" r="6" fill="#EF4444" />
                <text x="14" y="4" fontWeight="600">15% Critical Severity</text>
              </g>
              <g transform="translate(0, 24)">
                <circle cx="0" cy="0" r="6" fill="#F97316" />
                <text x="14" y="4" fontWeight="600">30% High Severity</text>
              </g>
              <g transform="translate(0, 48)">
                <circle cx="0" cy="0" r="6" fill="#EAB308" />
                <text x="14" y="4" fontWeight="600">40% Medium Severity</text>
              </g>
              <g transform="translate(0, 72)">
                <circle cx="0" cy="0" r="6" fill="#3B82F6" />
                <text x="14" y="4" fontWeight="600">15% Low Severity</text>
              </g>
            </g>
          </g>
        );
      }

      // 5. Security Events - Authentication Events
      case 'event-auth': {
        const authCategories = [
          { name: 'Failed Login', color: '#EF4444', events: [190, 260, 340, 410, 480] },
          { name: 'Successful Login', color: '#22C55E', events: [170, 210, 230, 280, 310, 370, 430, 460, 520] },
          { name: 'Unusual Source', color: '#F97316', events: [220, 390, 500] },
          { name: 'Privilege Change', color: '#EAB308', events: [290, 440] }
        ];
        return (
          <g>
            {authCategories.map((c, idx) => {
              const y = 70 + idx * 55;
              return (
                <g key={idx}>
                  <line x1="160" y1={y} x2="550" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                  <text x="40" y={y + 4} fill={c.color} fontSize="10" fontWeight="bold">
                    {c.name}
                  </text>
                  {c.events.map((evX, eIdx) => (
                    <circle
                      key={eIdx}
                      cx={evX}
                      cy={y}
                      r="7.5"
                      fill={c.color}
                      opacity="0.8"
                      className="animated-dot"
                      style={{ animationDelay: `${idx * 0.1 + eIdx * 0.08}s` }}
                    >
                      <animate attributeName="r" values="7.5;10;7.5" dur="2s" repeatCount="indefinite" begin={`${idx * 0.2 + eIdx * 0.1}s`} />
                    </circle>
                  ))}
                </g>
              );
            })}
          </g>
        );
      }

      // 6. Security Events - Process Spawn
      case 'event-process': {
        const processNodes = [
          { id: 0, x: 300, y: 55, label: 'explorer.exe', pid: 'PID 1824', color: '#3B82F6', isCrit: false },
          { id: 1, x: 180, y: 135, label: 'cmd.exe', pid: 'PID 4820', color: '#F97316', isCrit: false },
          { id: 2, x: 300, y: 135, label: 'powershell.exe', pid: 'PID 9104', color: '#EF4444', isCrit: true },
          { id: 3, x: 420, y: 135, label: 'chrome.exe', pid: 'PID 3308', color: '#06B6D4', isCrit: false },
          { id: 4, x: 110, y: 220, label: 'whoami.exe', pid: 'PID 4890', color: '#F97316', isCrit: false },
          { id: 5, x: 230, y: 220, label: 'malicious.ps1', pid: 'PID 9122', color: '#EF4444', isCrit: true },
          { id: 6, x: 370, y: 220, label: 'helper.exe (Safe)', pid: 'PID 3340', color: '#22C55E', isCrit: false }
        ];
        const processLinks = [
          [0, 1, '#F97316'], [0, 2, '#EF4444'], [0, 3, '#06B6D4'], [1, 4, '#F97316'], [2, 5, '#EF4444'], [3, 6, '#22C55E']
        ];
        return (
          <g>
            {processLinks.map(([n1, n2, lineColor], idx) => {
              const p1 = processNodes[n1];
              const p2 = processNodes[n2];
              return (
                <line
                  key={idx}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={lineColor}
                  strokeWidth="2"
                  opacity={p2.color === '#EF4444' ? '0.85' : '0.45'}
                  strokeDasharray="500"
                  strokeDashoffset="500"
                  className="line-draw-path"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                />
              );
            })}
            {processNodes.map((n, idx) => {
              return (
                <g key={n.id} className="net-node-item" style={{ animationDelay: `${idx * -0.7}s` }}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="11"
                    fill="#0a0f1d"
                    stroke={n.color}
                    strokeWidth="2.5"
                    className="animated-dot"
                    style={{ animationDelay: `${idx * 0.08 + 0.4}s` }}
                  />
                  {n.isCrit && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="16"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      opacity="0.6"
                    >
                      <animate attributeName="r" values="11;19;11" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text
                    x={n.x}
                    y={n.y - 17}
                    fill="#f8fafc"
                    fontSize="9.5"
                    fontWeight="700"
                    textAnchor="middle"
                    opacity="0"
                    className="pop-text"
                    style={{ animationDelay: `${idx * 0.08 + 0.6}s` }}
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 20}
                    fill="var(--text-muted)"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                    opacity="0"
                    className="pop-text"
                    style={{ animationDelay: `${idx * 0.08 + 0.6}s` }}
                  >
                    {n.pid}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      // 7. Security Events - Network Connections
      case 'event-network': {
        const netNodes = [
          // Internal Subnet
          { id: 0, x: 120, y: 70, label: 'App Server', type: 'internal', color: '#06B6D4' },
          { id: 1, x: 120, y: 150, label: 'Workstation', type: 'internal', color: '#06B6D4' },
          { id: 2, x: 120, y: 230, label: 'DB Server', type: 'internal', color: '#06B6D4' },
          // Firewall
          { id: 3, x: 300, y: 150, label: 'Main Firewall', type: 'gateway', color: '#3B82F6' },
          // Destinations
          { id: 4, x: 480, y: 70, label: 'Cloud DNS', type: 'external', color: '#3B82F6' },
          { id: 5, x: 480, y: 150, label: 'C2 IP (Suspicious)', type: 'suspicious', color: '#F97316' },
          { id: 6, x: 480, y: 230, label: 'Tor Exit (Blocked)', type: 'blocked', color: '#EF4444' }
        ];
        const netLinks = [
          { from: 0, to: 3, color: '#06B6D4', status: 'allow' },
          { from: 1, to: 3, color: '#06B6D4', status: 'allow' },
          { from: 2, to: 3, color: '#06B6D4', status: 'allow' },
          { from: 3, to: 4, color: '#3B82F6', status: 'allow' },
          { from: 3, to: 5, color: '#F97316', status: 'warn' },
          { from: 3, to: 6, color: '#EF4444', status: 'block' }
        ];
        return (
          <g>
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes pulse-flow-soc {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
                .flow-dash-soc {
                  stroke-dasharray: 6 4;
                  animation: pulse-flow-soc 1.5s linear infinite;
                }
              `
            }} />
            {netLinks.map((l, idx) => {
              const p1 = netNodes[l.from];
              const p2 = netNodes[l.to];
              return (
                <g key={idx}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={l.color}
                    strokeWidth="2"
                    opacity={l.status === 'allow' ? '0.45' : '0.85'}
                  />
                  {l.status !== 'block' && (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={l.color}
                      strokeWidth="2.5"
                      className="flow-dash-soc"
                    />
                  )}
                  {l.status === 'block' && (
                    <g transform={`translate(${(p1.x + p2.x)/2}, ${(p1.y + p2.y)/2})`}>
                      <circle r="7.5" fill="#EF4444" />
                      <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#ffffff" strokeWidth="1.5" />
                      <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                  )}
                </g>
              );
            })}
            {netNodes.map((n, idx) => {
              return (
                <g key={n.id} className="net-node-item" style={{ animationDelay: `${idx * -0.8}s` }}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.type === 'gateway' ? '14' : '10'}
                    fill="#0a0f1d"
                    stroke={n.color}
                    strokeWidth="2.5"
                    className="animated-dot"
                    style={{ animationDelay: `${idx * 0.08 + 0.4}s` }}
                  />
                  {n.type === 'blocked' && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="15"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1"
                      opacity="0.5"
                    >
                      <animate attributeName="r" values="10;17;10" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text
                    x={n.x}
                    y={n.y - 17}
                    fill="#f8fafc"
                    fontSize="9.5"
                    fontWeight="700"
                    textAnchor="middle"
                    opacity="0"
                    className="pop-text"
                    style={{ animationDelay: `${idx * 0.08 + 0.6}s` }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      // 8. Security Events - IOC Detection Scatter
      case 'event-scatter': {
        const scatterIOCs = [
          { x: 120, y: 190, label: 'mimikatz.exe', color: '#EF4444', isCrit: true },      // Critical Red
          { x: 190, y: 120, label: 'super-c2.net', color: '#EF4444', isCrit: true },      // Critical Red
          { x: 260, y: 160, label: 'HKLM:...Run', color: '#F97316', isCrit: false },       // Alert Orange
          { x: 330, y: 80, label: 'powershell -enc', color: '#EF4444', isCrit: true },    // Critical Red
          { x: 400, y: 210, label: 'temp_payload.dll', color: '#EAB308', isCrit: false },  // Warning Yellow
          { x: 470, y: 130, label: 'ssh-port-scan', color: '#06B6D4', isCrit: false },     // Electric Cyan
          { x: 520, y: 100, label: 'dhcp-renew (Safe)', color: '#22C55E', isCrit: false }  // Success Green
        ];
        return (
          <g>
            <g>
              {/* Axes */}
              <line x1="60" y1="240" x2="560" y2="240" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="60" y1="40" x2="60" y2="240" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <text x="550" y="255" fill="var(--text-muted)" fontSize="9" textAnchor="end">Malicious Confidence</text>
              <text x="70" y="52" fill="var(--text-muted)" fontSize="9">System Prevalence</text>
              {[50, 100, 150, 200].map(val => (
                <line key={val} x1="60" y1={240 - val} x2="560" y2={240 - val} stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              ))}
            </g>
            {scatterIOCs.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="8.5"
                  fill="#0a0f1d"
                  stroke={p.color}
                  strokeWidth="2.5"
                  className="scatter-dot"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                />
                {p.isCrit && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="13"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1"
                    opacity="0.5"
                  >
                    <animate attributeName="r" values="8.5;15;8.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text
                  x={p.x}
                  y={p.y - 13}
                  fill="var(--text-muted)"
                  fontSize="8.5"
                  fontWeight="600"
                  textAnchor="middle"
                  opacity="0"
                  className="pop-text"
                  style={{ animationDelay: `${idx * 0.08 + 0.4}s` }}
                >
                  {p.label}
                </text>
              </g>
            ))}
          </g>
        );
      }

      // 9. Attack Correlation - Attack Path Graph
      case 'correlation-path': {
        const pathNodes = [
          { id: 0, x: 90, y: 150, label: 'Phishing Email', phase: 'Initial Access', color: '#F97316', isCrit: false },      // Alert Orange
          { id: 1, x: 200, y: 150, label: 'User Device', phase: 'Execution', color: '#06B6D4', isCrit: false },             // Electric Cyan
          { id: 2, x: 310, y: 80, label: 'Domain Controller', phase: 'Credential Access', color: '#06B6D4', isCrit: false }, // Electric Cyan
          { id: 3, x: 310, y: 220, label: 'Local Backup', phase: 'Collection', color: '#8B5CF6', isCrit: false },           // Purple Correlation
          { id: 4, x: 440, y: 150, label: 'Exfil Server', phase: 'Exfil Target', color: '#EF4444', isCrit: true },          // Critical Red
          { id: 5, x: 540, y: 150, label: 'C2 IP (Ext)', phase: 'Exfil Sent', color: '#EF4444', isCrit: true }              // Critical Red
        ];
        // Connect lines inherit starting colors from source/destination pathways instead of all red
        const pathLinks = [
          { from: 0, to: 1, color: '#F97316' }, // Orange Path (Phishing)
          { from: 1, to: 2, color: '#06B6D4' }, // Cyan Path (Lateral)
          { from: 1, to: 3, color: '#8B5CF6' }, // Purple Path (Collection)
          { from: 2, to: 4, color: '#F97316' }, // Orange Path (Access escalates)
          { from: 3, to: 4, color: '#8B5CF6' }, // Purple Path (Backup access)
          { from: 4, to: 5, color: '#EF4444' }  // Red Path (Active exfiltration)
        ];
        return (
          <g>
            {pathLinks.map((link, idx) => {
              const p1 = pathNodes[link.from];
              const p2 = pathNodes[link.to];
              return (
                <line
                  key={idx}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={link.color}
                  strokeWidth="3.2"
                  opacity={link.color === '#EF4444' ? '0.9' : '0.55'}
                  strokeDasharray="500"
                  strokeDashoffset="500"
                  className="line-draw-path"
                  style={{ animationDelay: `${idx * 0.15}s` }}
                />
              );
            })}
            {pathNodes.map((n, idx) => (
              <g key={idx} className="net-node-item" style={{ animationDelay: `${idx * -0.6}s` }}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="11"
                  fill="#0a0f1d"
                  stroke={n.color}
                  strokeWidth="3"
                  className="animated-dot"
                  style={{ animationDelay: `${idx * 0.12 + 0.4}s` }}
                />
                {n.isCrit && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="16"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1"
                    opacity="0.4"
                  >
                    <animate attributeName="r" values="11;18;11" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text
                  x={n.x}
                  y={n.y - 18}
                  fill="#f8fafc"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity="0"
                  className="pop-text"
                  style={{ animationDelay: `${idx * 0.12 + 0.7}s` }}
                >
                  {n.label}
                </text>
                <text
                  x={n.x}
                  y={n.y + 20}
                  fill="var(--text-muted)"
                  fontSize="8"
                  textAnchor="middle"
                  opacity="0"
                  className="pop-text"
                  style={{ animationDelay: `${idx * 0.12 + 0.7}s` }}
                >
                  {n.phase}
                </text>
              </g>
            ))}
          </g>
        );
      }

      // 10. Attack Correlation - IOC Relationship Network
      case 'correlation-ioc': {
        const iocNodes = [
          { id: 0, x: 300, y: 150, label: 'Trojan.exe (File Hash)', color: '#EF4444', isCrit: true },    // Center Core (Red)
          { id: 1, x: 160, y: 70, label: 'HKCU:\\...\\Run', color: '#F97316', isCrit: false },           // Autostart Key (Orange)
          { id: 2, x: 440, y: 70, label: 'auth-gateway.org (C2)', color: '#EF4444', isCrit: true },      // C2 Connection (Red)
          { id: 3, x: 160, y: 230, label: 'PowerShell Payload', color: '#F97316', isCrit: false },       // Script execution (Orange)
          { id: 4, x: 440, y: 230, label: 'temp_log.txt', color: '#3B82F6', isCrit: false },             // Secondary log (Blue)
          { id: 5, x: 300, y: 250, label: 'lsass Memory Dump', color: '#EF4444', isCrit: true }         // Memory dump (Red)
        ];
        return (
          <g>
            {iocNodes.slice(1).map((n, idx) => (
              <line
                key={idx}
                x1="300"
                y1="150"
                x2={n.x}
                y2={n.y}
                stroke={n.color}
                strokeWidth="2.5"
                opacity={n.color === '#EF4444' ? '0.85' : '0.45'}
                strokeDasharray="500"
                strokeDashoffset="500"
                className="line-draw-path"
                style={{ animationDelay: `${idx * 0.1}s` }}
              />
            ))}
            <g className="net-node-item">
              <circle
                cx="300"
                cy="150"
                r="15"
                fill="#0a0f1d"
                stroke="#EF4444"
                strokeWidth="3.2"
                className="animated-dot"
              />
              <text x="300" y="128" fill="#f8fafc" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                MALICIOUS COMPROMISE
              </text>
            </g>
            {iocNodes.slice(1).map((n, idx) => (
              <g key={idx} className="net-node-item" style={{ animationDelay: `${idx * -0.9}s` }}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="9"
                  fill="#0a0f1d"
                  stroke={n.color}
                  strokeWidth="2.5"
                  className="animated-dot"
                  style={{ animationDelay: `${idx * 0.1 + 0.4}s` }}
                />
                <text
                  x={n.x}
                  y={n.y - 15}
                  fill="var(--text-muted)"
                  fontSize="9.5"
                  fontWeight="600"
                  textAnchor="middle"
                  opacity="0"
                  className="pop-text"
                  style={{ animationDelay: `${idx * 0.12 + 0.65}s` }}
                >
                  {n.label}
                </text>
              </g>
            ))}
          </g>
        );
      }

      // 11. Attack Correlation - Host Communication
      case 'correlation-host': {
        const numNodes = 6;
        const hNodes = [];
        for (let i = 0; i < numNodes; i++) {
          const angle = (i * 2 * Math.PI) / numNodes;
          // Node 2 = Infected Host (Red), Node 4 = Suspicious Host (Orange), Node 0 = Safe Host (Green), Others = Normal (Cyan)
          const color = i === 2 
            ? '#EF4444' 
            : i === 4
              ? '#F97316'
              : i === 0
                ? '#22C55E'
                : '#06B6D4';
          hNodes.push({
            id: i,
            x: 300 + 95 * Math.cos(angle),
            y: 150 + 95 * Math.sin(angle),
            label: i === 2 ? 'Infected Host (Crit)' : i === 4 ? 'Suspicious Host' : i === 0 ? 'Safe Server (Secured)' : `Host 10.0.1.${20 + i}`,
            color
          });
        }
        return (
          <g>
            {hNodes.map((n, idx) => {
              const nextNode = hNodes[(idx + 1) % numNodes];
              // Connection inherits the more critical threat level color
              const linkColor = n.color === '#EF4444' || nextNode.color === '#EF4444'
                ? '#EF4444'
                : n.color === '#F97316' || nextNode.color === '#F97316'
                  ? '#F97316'
                  : '#06B6D4';
              return (
                <line
                  key={idx}
                  x1={n.x}
                  y1={n.y}
                  x2={nextNode.x}
                  y2={nextNode.y}
                  stroke={linkColor}
                  strokeWidth="2"
                  opacity={linkColor === '#EF4444' ? '0.85' : '0.4'}
                  strokeDasharray="500"
                  strokeDashoffset="500"
                  className="line-draw-path"
                  style={{ animationDelay: `${idx * 0.12}s` }}
                />
              );
            })}
            {/* Center Router / Switch (Blue) */}
            <circle
              cx="300"
              cy="150"
              r="12"
              fill="#0a0f1d"
              stroke="#3B82F6"
              strokeWidth="2.5"
            />
            {hNodes.map((n) => (
              <line
                key={`spoke-${n.id}`}
                x1="300"
                y1="150"
                x2={n.x}
                y2={n.y}
                stroke={n.color}
                strokeWidth="1.5"
                opacity="0.3"
              />
            ))}
            {hNodes.map((n, idx) => (
              <g key={n.id} className="net-node-item" style={{ animationDelay: `${idx * -0.7}s` }}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="9"
                  fill="#0a0f1d"
                  stroke={n.color}
                  strokeWidth="2.5"
                  className="animated-dot"
                  style={{ animationDelay: `${idx * 0.1 + 0.5}s` }}
                />
                {n.color === '#EF4444' && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="14"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1"
                    opacity="0.6"
                  >
                    <animate attributeName="r" values="9;16;9" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <text
                  x={n.x}
                  y={n.y - 15}
                  fill="var(--text-muted)"
                  fontSize="9.5"
                  fontWeight="600"
                  textAnchor="middle"
                  opacity="0"
                  className="pop-text"
                  style={{ animationDelay: `${idx * 0.12 + 0.7}s` }}
                >
                  {n.label}
                </text>
              </g>
            ))}
          </g>
        );
      }

      // 12. Attack Correlation - Incident Correlation
      case 'correlation-incident': {
        const incNodes = [
          { id: 'user', x: 100, y: 150, label: 'Admin Session', type: 'user', color: '#06B6D4' },      // Cyan User
          { id: 'host', x: 200, y: 150, label: 'SecOps-Laptop', type: 'host', color: '#06B6D4' },      // Cyan Host
          { id: 'proc', x: 300, y: 90, label: 'powershell.exe', type: 'process', color: '#F97316' },   // Orange Suspicious
          { id: 'ip', x: 300, y: 210, label: '185.220.101.4 (Tor)', type: 'ip', color: '#EF4444' },    // Red Malicious
          { id: 'ioc', x: 440, y: 150, label: 'Alert FLAG-30', type: 'ioc', color: '#8B5CF6' },         // Purple Correlation
          { id: 'siem', x: 540, y: 150, label: 'Closed Incident', type: 'siem', color: '#22C55E' }     // Green Resolved
        ];
        const links = [
          { from: 'user', to: 'host', color: '#06B6D4' },
          { from: 'host', to: 'proc', color: '#F97316' },
          { from: 'host', to: 'ip', color: '#EF4444' },
          { from: 'proc', to: 'ioc', color: '#8B5CF6' },
          { from: 'ip', to: 'ioc', color: '#EF4444' },
          { from: 'ioc', to: 'siem', color: '#22C55E' }
        ];
        return (
          <g>
            {links.map((link, idx) => {
              const p1 = incNodes.find(n => n.id === link.from);
              const p2 = incNodes.find(n => n.id === link.to);
              return (
                <line
                  key={idx}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={link.color}
                  strokeWidth="2.2"
                  opacity={link.color === '#EF4444' ? '0.85' : '0.5'}
                  strokeDasharray="500"
                  strokeDashoffset="500"
                  className="line-draw-path"
                  style={{ animationDelay: `${idx * 0.12}s` }}
                />
              );
            })}
            {incNodes.map((n, idx) => {
              return (
                <g key={n.id} className="net-node-item" style={{ animationDelay: `${idx * -0.6}s` }}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r="9.5"
                    fill="#0a0f1d"
                    stroke={n.color}
                    strokeWidth="2.5"
                    className="animated-dot"
                    style={{ animationDelay: `${idx * 0.08 + 0.5}s` }}
                  />
                  <text
                    x={n.x}
                    y={n.y - 16}
                    fill="var(--text-muted)"
                    fontSize="9.5"
                    fontWeight="600"
                    textAnchor="middle"
                    opacity="0"
                    className="pop-text"
                    style={{ animationDelay: `${idx * 0.08 + 0.7}s` }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <section className="graphs-showcase-card" aria-label="Visualizations gallery">
      <style dangerouslySetInnerHTML={{
        __html: `
          .graphs-showcase-card {
            background-color: var(--bg-surface, #0e1626);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: var(--shadow-sm);
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            width: 100%;
          }

          .graphs-showcase-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            user-select: none;
            width: 100%;
          }

          .graphs-showcase-title-row {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .graphs-showcase-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-primary, #f8fafc);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .graphs-showcase-active-name {
            font-size: 0.8rem;
            color: var(--text-muted, #64748b);
            font-weight: 600;
            margin-left: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .graphs-category-pills {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .graphs-category-pill {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: 20px;
            padding: 6px 14px;
            color: var(--text-secondary, #cbd5e1);
            font-size: 0.775rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .graphs-category-pill:hover {
            border-color: var(--color-primary-light, rgba(59, 130, 246, 0.3));
            color: var(--text-primary, #f8fafc);
          }

          .graphs-category-pill.active {
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.12));
            border-color: var(--color-primary, #3b82f6);
            color: var(--color-primary, #3b82f6);
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
          }

          /* Layered Grid Stage with perspective */
          .graphs-3d-stage {
            perspective: 1200px;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px 0;
            box-sizing: border-box;
          }

          .graphs-3d-panel {
            width: 100%;
            max-width: 780px;
            background: linear-gradient(135deg, rgba(14, 22, 38, 0.95) 0%, rgba(8, 12, 24, 0.95) 100%),
                        radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 80%),
                        repeating-linear-gradient(rgba(255, 255, 255, 0.006) 0px, rgba(255, 255, 255, 0.006) 1px, transparent 1px, transparent 20px),
                        repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.006) 0px, rgba(255, 255, 255, 0.006) 1px, transparent 1px, transparent 20px);
            background-size: 100% 100%, 100% 100%, 20px 20px, 20px 20px;
            border: 1.2px solid rgba(6, 182, 212, 0.18);
            border-radius: var(--radius-lg, 12px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 
                        0 0 30px rgba(6, 182, 212, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
            transform: rotateX(8deg) rotateY(-5deg) rotateZ(0.5deg);
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), 
                        box-shadow 0.6s ease, 
                        border-color 0.6s ease;
            padding: 24px;
            position: relative;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .graphs-3d-panel:hover {
            transform: rotateX(3deg) rotateY(-2deg) rotateZ(0deg);
            border-color: rgba(6, 182, 212, 0.45);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 
                        0 0 40px rgba(6, 182, 212, 0.18),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .graphs-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            padding-bottom: 8px;
            user-select: none;
          }

          .graphs-panel-name {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--color-secondary, #06b6d4);
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .graphs-panel-index {
            font-size: 0.725rem;
            color: var(--text-muted, #64748b);
            font-family: monospace;
          }

          .graphs-viewport {
            width: 100%;
            height: 320px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            box-sizing: border-box;
          }

          .graphs-svg {
            width: 100%;
            height: 100%;
            max-height: 320px;
            display: block;
            overflow: visible;
          }

          .graphs-showcase-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding-top: 16px;
            flex-wrap: wrap;
            gap: 16px;
            user-select: none;
            width: 100%;
          }

          .graphs-step-controls {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .graphs-step-btn {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
            border-radius: var(--radius-sm, 4px);
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary, #cbd5e1);
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
            outline: none;
          }

          .graphs-step-btn:hover {
            border-color: var(--color-primary, #3b82f6);
            color: var(--text-primary, #f8fafc);
            background-color: var(--color-primary-light, rgba(59, 130, 246, 0.08));
          }

          .graphs-indicators {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .graphs-indicator-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.12);
            cursor: pointer;
            transition: all var(--transition-speed, 200ms) ease;
          }

          .graphs-indicator-dot:hover {
            background-color: rgba(255, 255, 255, 0.35);
          }

          .graphs-indicator-dot.active {
            width: 22px;
            border-radius: 4px;
            background-color: var(--color-secondary, #06b6d4);
            box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
          }

          @keyframes draw-path {
            to {
              stroke-dashoffset: 0;
            }
          }

          .line-draw-path {
            animation: draw-path 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          @keyframes scale-up {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          .animated-dot {
            transform-origin: center;
            opacity: 0;
            animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          @keyframes pop-in {
            from {
              transform: translateY(4px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .pop-text {
            opacity: 0;
            animation: pop-in 0.3s ease-out forwards;
          }

          @keyframes float-node {
            0% { transform: translate(0, 0); }
            50% { transform: translate(2.5px, -3.5px); }
            100% { transform: translate(0, 0); }
          }

          .net-node-item {
            transform-origin: center;
            animation: float-node 5s ease-in-out infinite;
          }

          @keyframes pop-scatter {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 0.8;
            }
          }

          .scatter-dot {
            transform-origin: center;
            opacity: 0;
            animation: pop-scatter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          @media (max-width: 768px) {
            .graphs-3d-stage {
              padding: 8px 0;
            }
            .graphs-3d-panel {
              transform: none !important;
              padding: 16px;
              max-width: 100%;
            }
            .graphs-viewport {
              height: 250px;
            }
            .graphs-svg {
              max-height: 250px;
            }
            .graphs-showcase-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
            .graphs-category-pills {
              width: 100%;
            }
            .graphs-category-pill {
              flex: 1 1 auto;
              text-align: center;
              padding: 5px 10px;
              font-size: 0.725rem;
            }
          }
        `
      }} />

      <div className="graphs-showcase-header">
        <div className="graphs-showcase-title-row">
          <h3 className="graphs-showcase-title">
            <FiActivity aria-hidden="true" style={{ color: '#3B82F6' }} />
            Threat Activity
            <span className="graphs-showcase-active-name">&bull; {activeGraph.name}</span>
          </h3>
        </div>

        <div className="graphs-category-pills" role="tablist" aria-label="Select graph category">
          {['Threat Trends', 'Security Events', 'Attack Correlation'].map(cat => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={currentCategory === cat}
              className={`graphs-category-pill ${currentCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="graphs-3d-stage">
        <div className="graphs-3d-panel">
          <div className="graphs-panel-header">
            <span className="graphs-panel-name">{activeGraph.name}</span>
            <span className="graphs-panel-index">{`ID: ${activeIndex + 1} / ${ALL_GRAPHS.length}`}</span>
          </div>

          <div className="graphs-viewport">
            {isRechartsGraph(activeGraph.type) ? (
              renderRechartsContent()
            ) : (
              <svg
                key={activeGraph.type}
                className="graphs-svg"
                viewBox="0 0 600 300"
              >
                {renderGraphSVGContent()}
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="graphs-showcase-footer">
        <div className="graphs-step-controls">
          <button
            type="button"
            className="graphs-step-btn"
            onClick={handlePrev}
            aria-label="Previous visualization"
            title="Previous Graph"
          >
            <FiChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="graphs-step-btn"
            onClick={handleNext}
            aria-label="Next visualization"
            title="Next Graph"
          >
            <FiChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="graphs-indicators" role="tablist" aria-label="Quick jump dots">
          {ALL_GRAPHS.map((_, idx) => (
            <span
              key={idx}
              role="button"
              tabIndex={0}
              className={`graphs-indicator-dot ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => {
                setActiveIndex(idx);
                startTimer();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveIndex(idx);
                  startTimer();
                }
              }}
              title={`Jump to Graph ${idx + 1}`}
              aria-label={`Jump to Graph ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
