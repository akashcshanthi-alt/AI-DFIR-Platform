import React from 'react';
import { Bot, Bug, Workflow, Activity, AlertCircle, FileText } from 'lucide-react';

export default function StepAugmentation({ aiOptions, setAiOptions }) {
  
  const handleToggle = (key) => {
    setAiOptions({
      ...aiOptions,
      [key]: !aiOptions[key]
    });
  };

  const options = [
    {
      key: 'malware',
      title: 'Deep Malware Analysis',
      desc: 'Sandboxed detonation & behavioral heuristics',
      icon: Bug,
      color: 'text-primary bg-primary/10'
    },
    {
      key: 'ioc',
      title: 'Automated IOC Extraction',
      desc: 'Identify IP, Domain, and Hashes in real-time',
      icon: Workflow,
      color: 'text-secondary bg-secondary/10'
    },
    {
      key: 'timeline',
      title: 'Timeline Reconstruction',
      desc: 'AI-sequenced event correlation across logs',
      icon: Activity,
      color: 'text-primary bg-primary/10'
    },
    {
      key: 'risk',
      title: 'Proactive Risk Scoring',
      desc: 'Live probability of lateral movement',
      icon: AlertCircle,
      color: 'text-tertiary bg-tertiary/10'
    },
    {
      key: 'report',
      title: 'Auto-Report Generation',
      desc: 'Generates Draft CISO and Technical reports automatically',
      icon: FileText,
      color: 'text-secondary bg-secondary/10',
      spanTwo: true
    }
  ];

  return (
    <div className="step-transition">
      <div className="flex items-center gap-3 mb-8">
        <Bot className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-headline-md text-white font-bold">AI Augmentation Controls</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt) => {
          const IconComp = opt.icon;
          const isChecked = aiOptions[opt.key];
          return (
            <div 
              key={opt.key}
              className={`flex items-center justify-between p-6 bg-surface-container-high/50 border rounded-xl hover:border-primary/40 transition-all select-none ${
                opt.spanTwo ? 'md:col-span-2' : ''
              } ${isChecked ? 'border-primary/20' : 'border-white/10'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`p-3 rounded-lg ${opt.color}`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{opt.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{opt.desc}</p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  className="sr-only peer"
                  onChange={() => handleToggle(opt.key)}
                />
                <div className="w-11 h-6 bg-surface-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
