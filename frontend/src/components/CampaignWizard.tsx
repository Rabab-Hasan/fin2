import React, { useState } from 'react';

// Step components (to be implemented)
const StepBasicInfo = ({ data, onChange, onNext }: any) => (
  <div>
    <h2>Basic Info</h2>
    {/* Inputs for name, type, budget, product/service, objective, narrative, concept, tagline, hero artwork */}
    {/* Example: */}
    <input type="text" placeholder="Campaign Name" value={data.name || ''} onChange={e => onChange({ ...data, name: e.target.value })} />
    {/* ...other fields... */}
    <button onClick={onNext}>Next</button>
  </div>
);

const StepAssignManager = ({ data, onChange, onNext }: any) => (
  <div>
    <h2>Assign Account Manager</h2>
    {/* Dropdown/select for manager */}
    <button onClick={onNext}>Next</button>
  </div>
);

const StepActivities = ({ data, onChange, onNext }: any) => (
  <div>
    <h2>Marketing Activities</h2>
    {/* Checkbox/select for activities */}
    <button onClick={onNext}>Next</button>
  </div>
);

const StepApprovalWorkflow = ({ data, onChange, onNext }: any) => (
  <div>
    <h2>Approval Workflow</h2>
    {/* Select for internal/client approval */}
    <button onClick={onNext}>Next</button>
  </div>
);

const StepAIValidation = ({ data, onValidate, onSubmit }: any) => (
  <div>
    <h2>AI Validation</h2>
    {/* Show validation results, allow submit if valid */}
    <button onClick={onValidate}>Validate</button>
    <button onClick={onSubmit}>Submit</button>
  </div>
);

const steps = [
  StepBasicInfo,
  StepAssignManager,
  StepActivities,
  StepApprovalWorkflow,
  StepAIValidation,
];

const CampaignWizard = ({ onComplete }: { onComplete: (data: any) => void }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [aiValid, setAiValid] = useState(false);

  const handleNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const handleChange = (newData: any) => setData(newData);
  const handleValidate = () => {
    // TODO: Integrate AI validation API
    setAiValid(true);
  };
  const handleSubmit = () => {
    if (aiValid) onComplete(data);
  };

  const StepComponent = steps[step];
  return (
    <div>
      <StepComponent
        data={data}
        onChange={handleChange}
        onNext={handleNext}
        onValidate={handleValidate}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CampaignWizard;
