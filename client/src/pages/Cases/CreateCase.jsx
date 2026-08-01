import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Rocket, Loader2 } from 'lucide-react';
import './CreateCase.css';

// Import modular wizard steps
import StepBasicInfo from './components/StepBasicInfo';
import StepIncidentScope from './components/StepIncidentScope';
import StepEvidenceIntake from './components/StepEvidenceIntake';
import StepTeamAssign from './components/StepTeamAssign';
import StepAugmentation from './components/StepAugmentation';
import StepReviewSubmit from './components/StepReviewSubmit';

export default function CreateCase() {
  const navigate = useNavigate();

  // Auth Guard check
  const hasSession = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
    }
  }, [hasSession, navigate]);

  // Unified Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Field States
  const [caseTitle, setCaseTitle] = useState('');
  const [incidentType, setIncidentType] = useState('Malware Outbreak');
  const [severity, setSeverity] = useState('HIGH');
  const [department, setDepartment] = useState('Network Security Ops');
  const [priority, setPriority] = useState(50);
  
  const [description, setDescription] = useState('');
  const [timelineStart, setTimelineStart] = useState('');
  const [mitreId, setMitreId] = useState('');
  const [assets, setAssets] = useState('');
  const [iocs, setIocs] = useState('');
  
  const [leadInvestigator, setLeadInvestigator] = useState('Dr. Elena Kozlov (Senior Lead)');
  const [deadline, setDeadline] = useState('');
  const [collaborators, setCollaborators] = useState(['Liam Hughes', 'Marcus Thorne']);
  
  const [aiOptions, setAiOptions] = useState({
    malware: true,
    ioc: true,
    timeline: true,
    risk: false,
    report: true
  });

  // Action Button States
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!hasSession) return null;

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!caseTitle.trim()) {
        setErrorMsg('Please specify a Case Title to proceed.');
        return;
      }
    }
    setErrorMsg('');
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToStep = (step) => {
    setCurrentStep(step);
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    
    setTimeout(() => {
      setIsSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        navigate('/cases');
      }, 2000);
    }, 2000);
  };

  // Progress line percent width
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="trace-create-layout flex flex-col min-h-screen w-full select-none create-case-grid-bg box-border p-6 md:p-8 relative">
      {isSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f1425] border border-[#10b981] text-[#10b981] text-xs px-4 py-2.5 rounded-lg shadow-xl font-bold">
          Investigation Case Successfully Initiated. Redirecting to SOC Command Center...
        </div>
      )}
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-between">
        
        {/* Back Link & Header */}
        <div className="mb-8 text-left">
          <Link to="/cases" className="inline-flex items-center gap-2 text-secondary font-label-caps text-xs mb-3 hover:brightness-110 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Case Management</span>
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-white font-bold leading-none">Initiate Forensic Investigation</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Configure parameters for a new AI-augmented threat analysis workflow.</p>
        </div>

        {/* Wizard Progress Track */}
        <div className="mb-10 relative select-none">
          <div className="flex justify-between items-center relative z-10">
            {[
              { step: 1, label: 'Basic Info' },
              { step: 2, label: 'Incidents' },
              { step: 3, label: 'Evidence' },
              { step: 4, label: 'Team' },
              { step: 5, label: 'AI Options' },
              { step: 6, label: 'Review' }
            ].map((s) => {
              const isCompleted = s.step < currentStep;
              const isActive = s.step === currentStep;
              return (
                <div 
                  key={s.step} 
                  className="flex flex-col items-center group cursor-pointer" 
                  onClick={() => handleGoToStep(s.step)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold ${
                    isCompleted 
                      ? 'border-primary bg-primary text-on-primary shadow-[0_0_15px_rgba(174,198,255,0.4)]' 
                      : isActive 
                        ? 'border-primary bg-primary text-on-primary shadow-[0_0_15px_rgba(174,198,255,0.4)]' 
                        : 'border-outline bg-surface text-outline'
                  }`}>
                    {isCompleted ? '✓' : s.step}
                  </div>
                  <span className={`mt-2 text-[10px] font-label-caps font-bold transition-colors ${
                    isActive || isCompleted ? 'text-primary' : 'text-outline'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Connecting Track Background Line */}
          <div className="absolute top-5 left-0 w-full h-[2px] bg-outline-variant/30 -z-10"></div>
          {/* Active Track Progress Line */}
          <div 
            className="absolute top-5 left-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(174,198,255,0.5)] transition-all duration-500 -z-10" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Wizard Main Card Container */}
        <div className="glass-card rounded-xl overflow-hidden shadow-2xl flex-grow flex flex-col justify-between min-h-[500px]">
          
          {/* Step Form Viewport */}
          <div className="p-8 md:p-10 flex-grow">
            {errorMsg && (
              <div className="mb-6 bg-[#ffb3ae]/10 border border-[#ffb3ae]/30 text-[#ffb3ae] text-xs px-4 py-2.5 rounded-lg">
                {errorMsg}
              </div>
            )}
            {currentStep === 1 && (
              <StepBasicInfo 
                title={caseTitle} setTitle={setCaseTitle}
                incidentType={incidentType} setIncidentType={setIncidentType}
                severity={severity} setSeverity={setSeverity}
                department={department} setDepartment={setDepartment}
                priority={priority} setPriority={setPriority}
              />
            )}
            
            {currentStep === 2 && (
              <StepIncidentScope 
                description={description} setDescription={setDescription}
                timelineStart={timelineStart} setTimelineStart={setTimelineStart}
                mitreId={mitreId} setMitreId={setMitreId}
                assets={assets} setAssets={setAssets}
                iocs={iocs} setIocs={setIocs}
              />
            )}

            {currentStep === 3 && (
              <StepEvidenceIntake />
            )}

            {currentStep === 4 && (
              <StepTeamAssign 
                leadInvestigator={leadInvestigator} setLeadInvestigator={setLeadInvestigator}
                deadline={deadline} setDeadline={setDeadline}
                collaborators={collaborators} setCollaborators={setCollaborators}
              />
            )}

            {currentStep === 5 && (
              <StepAugmentation 
                aiOptions={aiOptions} setAiOptions={setAiOptions}
              />
            )}

            {currentStep === 6 && (
              <StepReviewSubmit 
                title={caseTitle}
                incidentType={incidentType}
                severity={severity}
                leadInvestigator={leadInvestigator}
                collaborators={collaborators}
                deadline={deadline}
                aiOptions={aiOptions}
              />
            )}
          </div>

          {/* Wizard Footer Nav Actions */}
          <div className="p-6 md:px-10 border-t border-white/10 flex justify-between items-center bg-surface-container-low/50 shrink-0">
            <button 
              type="button"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-white/5 transition-all outline-none cursor-pointer ${
                currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              onClick={handlePrev}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex gap-4">
              <button 
                type="button" 
                className="px-6 py-2.5 rounded-lg text-on-surface-variant hover:text-white transition-colors outline-none cursor-pointer text-xs font-semibold"
                onClick={() => navigate('/cases')}
              >
                Save as Draft
              </button>
              
              {currentStep < totalSteps ? (
                <button 
                  type="button"
                  className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-primary-container text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg outline-none cursor-pointer text-xs"
                  onClick={handleNext}
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="button"
                  className="flex items-center gap-2 px-10 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-black tracking-widest glow-cyan hover:brightness-110 active:scale-95 transition-all outline-none cursor-pointer text-xs"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      INITIATING...
                    </>
                  ) : (
                    <>
                      SUBMIT INVESTIGATION
                      <Rocket className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Decorative Analytics Preview Footer */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 opacity-40 hover:opacity-100 transition-all select-none">
          <div className="glass-card p-4 rounded-lg text-left">
            <p className="text-[10px] font-label-caps text-on-surface-variant font-bold">SYSTEM LOAD</p>
            <div className="h-8 flex items-end gap-1 mt-2">
              <div className="w-2 bg-primary h-[40%] rounded-t-sm"></div>
              <div className="w-2 bg-primary h-[70%] rounded-t-sm"></div>
              <div className="w-2 bg-primary h-[50%] rounded-t-sm"></div>
              <div className="w-2 bg-primary h-[90%] rounded-t-sm"></div>
              <div className="w-2 bg-primary h-[60%] rounded-t-sm"></div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-lg text-left">
            <p className="text-[10px] font-label-caps text-on-surface-variant font-bold">NODE STATUS</p>
            <p className="text-lg font-bold text-secondary mt-2">ACTIVE</p>
          </div>
          <div className="glass-card p-4 rounded-lg text-left">
            <p className="text-[10px] font-label-caps text-on-surface-variant font-bold">THREAT FEED</p>
            <p className="text-lg font-bold text-error mt-2">STABLE</p>
          </div>
          <div className="glass-card p-4 rounded-lg text-left">
            <p className="text-[10px] font-label-caps text-on-surface-variant font-bold">UPLINK SPEED</p>
            <p className="text-lg font-bold text-on-surface mt-2 font-mono">10 GBPS</p>
          </div>
        </div>

      </div>
    </div>
  );
}
