import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ChatFAB() {
  return (
    <button 
      type="button"
      className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group glow-primary border-none outline-none"
    >
      <MessageSquare className="w-6 h-6 select-none" />
      <div className="absolute right-full mr-4 bg-surface-container-high px-4 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none shadow-xl">
        AI SOC Assistant Online
      </div>
    </button>
  );
}
