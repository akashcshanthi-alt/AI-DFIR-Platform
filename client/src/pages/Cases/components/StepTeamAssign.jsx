import React from 'react';
import { UserPlus, ChevronDown } from 'lucide-react';

export default function StepTeamAssign({
  leadInvestigator, setLeadInvestigator,
  deadline, setDeadline,
  collaborators, setCollaborators
}) {
  
  const teamList = [
    {
      name: 'Liam Hughes',
      role: 'L3 Malware Analyst',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp2Xhxdj7cSZa2cPd4FjOc2PvHZlZ37-T3mPyLimCqG6UnktqHBm_8JU1Ul-QJ-rwti23qMuhNz6w1zzhROWYBaH9ODebGnCKkYhPVxak82S9BHXSjZgZVe9NnBmrWyqQ4ib1x1HbMp6yRM0PzGLlc2lc4HQzs57VXyRg184eO7vN20XsduPzl-l9yK8BMX4aK1cB4TidXW9XO5_mZXrY4k8WmqkGYb5EkZAkmFfTls9xgUCvsBmmS'
    },
    {
      name: 'Marcus Thorne',
      role: 'Network Forensics',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBO7aYzBqCmDi9_smT1Oe5nT-1TrHRB9tEfZHZE-TG8FZX3YM9u65Pj1kOvEWKoJABluOlgBSpcq-ce-AWo80ItXj1lRAy1xN8IyoITbk-I3QXjYC7hHAy1yyXUWg7BDzXqB5NYtQZM4h6fHQCJz32WsQfm2CAS2LOMfGh41Qk92fBr58YbmYYJ52m4cVQjSJPU43yaw2jIrbNCs5XohtIT2286pTmP0ut2guIhL0cLmCPD-mh52-r4'
    },
    {
      name: 'Jessica W.',
      role: 'Log Correlation Specialist',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsuzq3KMtpR2BywmCPRdf-LJUL9XM5Zaki8ffqStRcF0JXQoQ3pSBa2pZ-xyPCXqZwlkEQe4OEHvjZESQmYPTG5TWQ5ZMfYcwi_FqWUUHiOqi6tsvLyngpjCKQn8YV2avF4Zb7O9uZrEYanV7H41_zAuPUp1i8xVaWBZIEE0Z1g7Xid2h8l8AAsbI72QiMZv2Ijc6I87qjDLnGlBzQd8y5BskpGO2n3mG26glz0riZznAKxGx1A1jz'
    }
  ];

  const handleToggleCollaborator = (name) => {
    if (collaborators.includes(name)) {
      setCollaborators(collaborators.filter(c => c !== name));
    } else {
      setCollaborators([...collaborators, name]);
    }
  };

  return (
    <div className="step-transition">
      <div className="flex items-center gap-3 mb-8">
        <UserPlus className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-headline-md text-white font-bold">Incident Response Team</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col gap-6">
          
          {/* Lead Investigator */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-on-surface-variant">Lead Investigator</label>
            <div className="relative group">
              <select 
                className="w-full bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 pl-12 text-on-surface appearance-none border outline-none cursor-pointer"
                value={leadInvestigator}
                onChange={(e) => setLeadInvestigator(e.target.value)}
              >
                <option value="Dr. Elena Kozlov (Senior Lead)">Dr. Elena Kozlov (Senior Lead)</option>
                <option value="Mark J. Sterling (Forensics)">Mark J. Sterling (Forensics)</option>
                <option value="Sarah Chen (Malware Lead)">Sarah Chen (Malware Lead)</option>
              </select>
              
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <img 
                  className="w-8 h-8 rounded-full border border-primary/40 object-cover" 
                  alt="Lead investigator avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaIOfOGoNQJuSWwI0_y6S-2FgfEcHcSZCBr8J1YhA7HPlzb5-KbQYfcPrjUUcmVw0YFQPYBTa6irAKALMqTs5iDvAMaJSAhZ-JZ4ImHaklQzIrWmkBFXUDBMGwtskwB3DSBsKUDjRqAhjmgnHn8pD57XiphvFJPASNrWOAhSaJPqDzwEP8VrfEd6CkC9oNOo05dVualD-v-WvttPIlNMZpGDgmBIQRGplRVN1khUi0HzVF0og-no0v" 
                />
              </div>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          {/* Response Deadline */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-on-surface-variant">Response Deadline</label>
            <input 
              className="bg-surface-container-lowest border-outline-variant focus:border-primary rounded-lg p-3 text-on-surface border outline-none w-full cursor-pointer" 
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        {/* Collaborators list */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-label-caps text-on-surface-variant">Collaboration Team</label>
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {teamList.map((member) => {
              const isChecked = collaborators.includes(member.name);
              return (
                <div 
                  key={member.name}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer select-none ${
                    isChecked ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-surface-container-low'
                  }`}
                  onClick={() => handleToggleCollaborator(member.name)}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    className="rounded border-outline-variant bg-surface text-primary focus:ring-primary cursor-pointer w-4 h-4"
                    readOnly
                  />
                  <img 
                    className="w-8 h-8 rounded-full object-cover" 
                    alt={member.name}
                    src={member.avatar} 
                  />
                  <div className="flex-grow text-left">
                    <p className="text-sm font-bold text-white">{member.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{member.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
