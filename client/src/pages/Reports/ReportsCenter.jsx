import React, { useState, useEffect } from 'react';

export default function ReportsCenter() {
  const [qualityScore, setQualityScore] = useState(0);
  const [clickedRow, setClickedRow] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Dynamically load Google Fonts and Material Symbols for the Stitch screen
  useEffect(() => {
    const linkFont = document.createElement('link');
    linkFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Geist:wght@400;600;700&display=swap';
    linkFont.rel = 'stylesheet';
    document.head.appendChild(linkFont);

    const linkSymbols = document.createElement('link');
    linkSymbols.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    linkSymbols.rel = 'stylesheet';
    document.head.appendChild(linkSymbols);

    return () => {
      if (document.head.contains(linkFont)) {
        document.head.removeChild(linkFont);
      }
      if (document.head.contains(linkSymbols)) {
        document.head.removeChild(linkSymbols);
      }
    };
  }, []);

  // Simple quality score animation simulation
  useEffect(() => {
    let score = 0;
    const targetScore = 90;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (score < targetScore) {
          score++;
          setQualityScore(score);
        } else {
          clearInterval(interval);
        }
      }, 15);
      return () => clearInterval(interval);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleRowClick = (index) => {
    setClickedRow(index);
    setTimeout(() => setClickedRow(null), 200);
  };

  return (
    <div className="trace-reports-page text-on-surface font-body-md overflow-x-hidden min-h-full relative">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#47faf3] text-[#47faf3] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          {toastMsg}
        </div>
      )}
      {/* Scope-contained custom styles matching the Stitch layout */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .trace-reports-page {
            background-color: #0a0e1a;
            background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
            background-size: 32px 32px;
            padding: 40px;
            box-sizing: border-box;
            width: 100%;
          }

          .glass-card {
            background: rgba(27, 31, 44, 0.4);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
          }

          .neon-glow-primary {
            box-shadow: 0 0 15px rgba(174, 198, 255, 0.1);
          }

          .neon-glow-secondary {
            box-shadow: 0 0 20px rgba(71, 250, 243, 0.15);
          }

          .status-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }

          .scroll-hide::-webkit-scrollbar { display: none; }
        `
      }} />

      {/* Main Content Area */}
      <div className="p-0">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Reports Center</h1>
            <p className="text-on-surface-variant font-body-md max-w-2xl">
              Manage, generate, and analyze forensic evidence reports. AI-assisted synthesis is currently active for critical incident #TR-8821.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => triggerToast('Opening scheduler wizard...')}
              className="px-5 py-2.5 bg-surface-container-high text-on-surface border border-white/10 rounded-lg font-label-caps text-label-caps flex items-center gap-2 hover:bg-surface-container-highest transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              Schedule
            </button>
            <button 
              onClick={() => triggerToast('Exporting reports catalog...')}
              className="px-5 py-2.5 bg-surface-container-high text-on-surface border border-white/10 rounded-lg font-label-caps text-label-caps flex items-center gap-2 hover:bg-surface-container-highest transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
              Export
            </button>
            <button 
              onClick={() => triggerToast('Generating comprehensive incident summary report...')}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps flex items-center gap-2 hover:bg-primary/90 transition-all neon-glow-primary cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">magic_button</span>
              Generate Report
            </button>
          </div>
        </div>

        {/* KPI Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-gutter mb-gutter">
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-primary opacity-5 transform group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[80px]">description</span>
            </div>
            <span className="text-on-surface-variant font-label-caps text-label-caps">Total Generated</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline-md text-on-surface">1,284</span>
              <span className="text-xs text-secondary">+12%</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
            <span className="text-on-surface-variant font-label-caps text-label-caps">Scheduled</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline-md text-on-surface">42</span>
              <span className="text-xs text-on-surface-variant">Ongoing</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-full w-[65%]"></div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
            <span className="text-on-surface-variant font-label-caps text-label-caps">Investigations</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline-md text-secondary">89</span>
              <span className="text-xs text-secondary-fixed-dim">Active</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
            <span className="text-on-surface-variant font-label-caps text-label-caps">Compliance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline-md text-on-surface">99.2%</span>
              <span className="text-xs text-secondary">Optimal</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32 border-primary/20 bg-primary/5 relative overflow-hidden group">
            <span className="text-primary font-label-caps text-label-caps">AI Generated</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-headline-md text-on-surface">412</span>
              <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column (Templates & Main List) */}
          <div className="lg:col-span-8 space-y-gutter">
            {/* Report Templates Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-on-surface font-headline-md text-[20px]">Report Templates</h2>
                <button 
                  onClick={() => triggerToast('Loading complete templates database...')}
                  className="text-secondary text-sm font-label-caps flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none"
                >
                  View All <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Template Card */}
                <div 
                  onClick={() => triggerToast('Initializing Executive Summary template...')}
                  className="glass-card p-4 rounded-xl hover:border-secondary/40 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">monitoring</span>
                  </div>
                  <h3 className="font-semibold text-on-surface text-sm mb-1">Executive Summary</h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">High-level briefing for leadership and stakeholders.</p>
                </div>
                <div 
                  onClick={() => triggerToast('Initializing Incident Report template...')}
                  className="glass-card p-4 rounded-xl hover:border-secondary/40 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">crisis_alert</span>
                  </div>
                  <h3 className="font-semibold text-on-surface text-sm mb-1">Incident Report</h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">Technical analysis of breach events and remediation.</p>
                </div>
                <div 
                  onClick={() => triggerToast('Initializing Malware Analysis template...')}
                  className="glass-card p-4 rounded-xl hover:border-secondary/40 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">bug_report</span>
                  </div>
                  <h3 className="font-semibold text-on-surface text-sm mb-1">Malware Analysis</h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">Detailed behavioral study of isolated malicious files.</p>
                </div>
                <div 
                  onClick={() => triggerToast('Initializing Evidence Report template...')}
                  className="glass-card p-4 rounded-xl hover:border-secondary/40 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">gavel</span>
                  </div>
                  <h3 className="font-semibold text-on-surface text-sm mb-1">Evidence Report</h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">Forensic chain of custody and artifact extraction docs.</p>
                </div>
                <div 
                  onClick={() => triggerToast('Initializing IOC Report template...')}
                  className="glass-card p-4 rounded-xl hover:border-secondary/40 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">hub</span>
                  </div>
                  <h3 className="font-semibold text-on-surface text-sm mb-1">IOC Report</h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">Indicators of Compromise for fleet-wide distribution.</p>
                </div>
                <div 
                  onClick={() => triggerToast('Initializing Compliance Template...')}
                  className="glass-card p-4 rounded-xl hover:border-secondary/40 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-secondary">verified_user</span>
                  </div>
                  <h3 className="font-semibold text-on-surface text-sm mb-1">Compliance</h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">GDPR/SOC2/HIPAA specific regulatory alignment.</p>
                </div>
              </div>
            </section>

            {/* Recent Reports Table */}
            <section className="glass-card rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-on-surface font-headline-md text-[20px]">Recent Reports</h2>
                <div className="flex gap-2">
                  <button className="p-1.5 hover:bg-white/5 rounded cursor-pointer bg-transparent border-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low/50 text-[11px] text-on-surface-variant font-label-caps uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Report Name</th>
                      <th className="px-6 py-4">Case ID</th>
                      <th className="px-6 py-4">Generated By</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      { name: 'SOC-L3 Breach Summary', caseId: '#TR-8821', by: 'AI Sentinel v4', byIconBg: 'bg-surface-container-highest border border-white/10', date: 'Oct 24, 14:22', status: 'Complete', statusBg: 'bg-secondary/10 text-secondary' },
                      { name: 'Malware Analysis: Gootloader', caseId: '#TR-8790', by: 'D. Sterling', byIconBg: 'bg-primary-container/20 border border-primary/20', date: 'Oct 23, 09:15', status: 'Complete', statusBg: 'bg-secondary/10 text-secondary' },
                      { name: 'Compliance Audit Q3', caseId: '#CMP-442', by: 'System Auto', byIconBg: 'bg-surface-container-highest', date: 'Oct 22, 23:59', status: 'Processing', statusBg: 'bg-primary/10 text-primary' },
                      { name: 'Endpoint Forensics Node-8', caseId: '#TR-8815', by: 'M. Chen', byIconBg: 'bg-primary-container/20 border border-primary/20', date: 'Oct 21, 11:45', status: 'Complete', statusBg: 'bg-secondary/10 text-secondary' }
                    ].map((row, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setClickedRow(idx);
                          triggerToast(`Selected report: ${row.name}`);
                          setTimeout(() => setClickedRow(null), 1000);
                        }}
                        className={`transition-colors cursor-pointer group ${
                          clickedRow === idx ? 'bg-primary/5' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-on-surface">{row.name}</td>
                        <td className="px-6 py-4 text-secondary font-code-sm">{row.caseId}</td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${row.byIconBg}`}></div>
                          <span>{row.by}</span>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{row.date}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.statusBg}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Detailed Report Preview */}
            <section className="glass-card rounded-xl p-8 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="text-[10px] font-code-sm text-primary uppercase opacity-50">Draft v2.1.0</span>
              </div>
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-16 bg-surface-container flex flex-col items-center justify-center rounded border border-white/10 shadow-lg">
                    <span className="text-[10px] font-bold text-on-surface-variant">PDF</span>
                    <span className="material-symbols-outlined text-primary">description</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-headline-md text-on-surface">Incident Analysis #TR-8821</h3>
                    <p className="text-on-surface-variant">Generated: Oct 24, 2023 | Classification: Top Secret</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-secondary font-label-caps text-label-caps mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-secondary"></span> Executive Summary
                    </h4>
                    <p className="text-on-surface-variant leading-relaxed">
                      The incident involved a targeted credential harvesting campaign against Tier-2 administrative accounts. Rapid identification occurred at T+14 minutes, followed by an automated isolation of 3 redundant domain controllers. No data exfiltration was detected in the primary ledger.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-secondary font-label-caps text-label-caps mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-secondary"></span> Evidence Summary
                      </h4>
                      <ul className="space-y-2 text-sm text-on-surface-variant">
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-primary">check_circle</span> 14 Memory Dumps Analyzed</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-primary">check_circle</span> 42 Network PCAP Files</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px] text-primary">check_circle</span> Registry Hive Snapshots</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-secondary font-label-caps text-label-caps mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-secondary"></span> AI Findings
                      </h4>
                      <div className="bg-surface-container/50 p-4 rounded-lg border border-primary/10">
                        <p className="text-[12px] italic text-primary">
                          "98.4% confidence match with APT-29 signature behaviors. Tactics suggest a lateral movement attempt using compromised PowerShell scripts."
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <h4 className="text-on-surface-variant font-label-caps text-[10px] uppercase mb-4 tracking-widest">Incident Timeline</h4>
                    <div className="relative pl-6 border-l border-white/10 space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-secondary ring-4 ring-secondary/20"></div>
                        <span className="text-[11px] font-code-sm text-secondary">02:14:22 UTC</span>
                        <p className="text-sm">Initial intrusion detected via VPN Node 4</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
                        <span className="text-[11px] font-code-sm text-primary">02:28:10 UTC</span>
                        <p className="text-sm">Automated containment triggered for affected nodes</p>
                      </div>
                      <div className="relative opacity-50">
                        <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-white/20"></div>
                        <span className="text-[11px] font-code-sm text-on-surface-variant">03:00:00 UTC</span>
                        <p className="text-sm">Root cause analysis initialized</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (AI Assistant & Insights) */}
          <div className="lg:col-span-4 space-y-gutter">
            {/* AI Assistant Panel */}
            <div className="glass-card rounded-xl p-6 flex flex-col gap-6 sticky top-24">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-[18px]">AI Assistant</h3>
                  <span className="text-[10px] text-secondary uppercase font-bold tracking-widest">Reports Optimizer</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-surface-container-high/50 p-4 rounded-lg">
                  <p className="text-xs text-on-surface-variant mb-2">Suggested Improvements:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">add_task</span>
                      Add MITRE ATT&amp;CK mapping for Section 4.2
                    </li>
                    <li className="flex items-start gap-2 text-[13px]">
                      <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">add_task</span>
                      Expand on root cause of credential leak
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col items-center py-6 border-y border-white/5">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-white/5" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                      <circle className="text-secondary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364" strokeDashoffset={`${364 - (364 * qualityScore) / 100}`} strokeWidth="8"></circle>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold text-on-surface">{qualityScore}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase">Quality Score</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-label-caps">Compliance Status</span>
                    <span className="text-xs text-secondary">92%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <button 
                  onClick={() => triggerToast('Applying automated AI formatting fixes...')}
                  className="w-full py-3 border border-primary/30 text-primary rounded-lg text-xs font-label-caps hover:bg-primary/5 transition-all cursor-pointer bg-transparent"
                >
                  APPLY AUTO-FIXES
                </button>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-label-caps text-on-surface-variant">Version Control</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      <span>v2.1.0 (Current)</span>
                    </div>
                    <span className="text-on-surface-variant">10m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] opacity-60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      <span>v2.0.4 (Published)</span>
                    </div>
                    <span className="text-on-surface-variant">2h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <section className="mt-gutter">
          <h2 className="text-on-surface font-headline-md text-[20px] mb-6">Report History &amp; Archival</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => triggerToast('Downloading Q2 archive package (2.4 GB)...')}
              className="glass-card p-4 rounded-xl flex items-center justify-between group hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">folder_zip</span>
                <div>
                  <p className="text-sm font-medium">Q2 Archive</p>
                  <p className="text-[10px] text-on-surface-variant">420 Reports | 2.4 GB</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">download</span>
            </div>
            <div 
              onClick={() => triggerToast('Downloading Compliance-2022 package (1.1 GB)...')}
              className="glass-card p-4 rounded-xl flex items-center justify-between group hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">inventory_2</span>
                <div>
                  <p className="text-sm font-medium">Compliance-2022</p>
                  <p className="text-[10px] text-on-surface-variant">88 Reports | 1.1 GB</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">download</span>
            </div>
            <div 
              onClick={() => triggerToast('Opening Drafts Hub view...')}
              className="glass-card p-4 rounded-xl flex items-center justify-between group hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">description</span>
                <div>
                  <p className="text-sm font-medium">Drafts Hub</p>
                  <p className="text-[10px] text-on-surface-variant">12 Active Drafts</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </div>
            <div 
              onClick={() => triggerToast('Creating new archive folder...')}
              className="glass-card p-4 rounded-xl border-dashed border-white/10 flex items-center justify-center gap-2 group hover:border-primary/50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant">add</span>
              <span className="text-sm text-on-surface-variant font-label-caps">Create Folder</span>
            </div>
          </div>
        </section>

        {/* Local Footer Status Bar for the component layout */}
        <footer className="bg-surface-dim/80 backdrop-blur-xl border-t border-white/5 py-4 px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 rounded-lg">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-on-surface-variant font-label-caps tracking-widest">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> SECURE TUNNEL ACTIVE</span>
            <span>ENCRYPTION: AES-256-GCM</span>
            <span>WORKSTATION: NODE-X-88</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-on-surface-variant font-label-caps">
            <span>© 2026 TRACE AI FORENSICS</span>
            <a className="hover:text-primary transition-colors" href="#">API ACCESS</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
