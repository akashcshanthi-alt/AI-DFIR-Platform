import React, { useState, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';

export default function NetworkPreview() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  return (
    <>
      <div 
        className="mt-auto glass-panel rounded-xl overflow-hidden aspect-video relative group cursor-pointer select-none"
        onClick={() => setIsModalOpen(true)}
      >
        <div 
          className="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD1fCUBCySzKLTlzJ1-eWZBIx7X57MamBRokp7hX8XDUF8PqihLvVNSywe2Wz2O1Ud5533pwrwIoBwgxB6vYV_An_mGmm9P_KcS1Zxzt8Fnc0oS30BHtARbx4MxEKgu3e4DbIf3g5lFtU7_n5HTHzze9MLNNvoVstAMmaXAWBFfXxSTIKCWdETxSlBmpFWW1UcKrbWGDkqpYlyIq1jsEnwMIdTHtSGm3aXKD2DE9Hh8uTr7M4ruiuJK')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-left">
          <p className="font-label-caps text-[10px] text-secondary tracking-wider font-bold">REAL-TIME TRAFFIC</p>
          <p className="font-body-md font-bold text-white text-sm">Interactive Topology</p>
        </div>
        <button type="button" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity border-none outline-none">
          <Maximize2 className="w-5 h-5 text-white mr-2" />
          <span className="font-label-caps text-[12px] text-white border border-white/40 px-4 py-2 rounded font-bold tracking-wider">EXPAND MAP</span>
        </button>
      </div>

      {/* Fullscreen Modal Viewport */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#04070e]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 transition-all duration-300">
          <div className="absolute top-6 right-6 flex gap-3 z-50">
            <button 
              type="button"
              className="px-4 py-2 rounded-lg bg-surface-container border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors font-mono cursor-pointer outline-none flex items-center gap-2"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-4 h-4" />
              <span>CLOSE PREVIEW [ESC]</span>
            </button>
          </div>
          
          <div className="relative max-w-5xl w-full aspect-video glass-panel rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-[#47faf3]/20 animate-fade-in">
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD1fCUBCySzKLTlzJ1-eWZBIx7X57MamBRokp7hX8XDUF8PqihLvVNSywe2Wz2O1Ud5533pwrwIoBwgxB6vYV_An_mGmm9P_KcS1Zxzt8Fnc0oS30BHtARbx4MxEKgu3e4DbIf3g5lFtU7_n5HTHzze9MLNNvoVstAMmaXAWBFfXxSTIKCWdETxSlBmpFWW1UcKrbWGDkqpYlyIq1jsEnwMIdTHtSGm3aXKD2DE9Hh8uTr7M4ruiuJK')" }}
            />
            <div className="absolute bottom-6 left-6 font-mono text-left">
              <span className="text-[10px] text-secondary tracking-widest font-bold">CYBER RANGE LIVE SCAN</span>
              <h2 className="text-xl font-bold text-white mt-1">Interactive Network Topology</h2>
              <p className="text-xs text-outline mt-1">SRV-PROD-SQL01 isolated routing segments & beacons</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
