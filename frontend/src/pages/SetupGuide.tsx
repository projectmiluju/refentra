import React from 'react';
import { SETUP_GUIDE_TEXT } from '../constants/uiText';

interface SetupGuideProps {
  message: string;
  setupSteps?: string[];
}

const SetupGuide: React.FC<SetupGuideProps> = ({ message, setupSteps }) => {
  const steps = setupSteps && setupSteps.length > 0 ? setupSteps : SETUP_GUIDE_TEXT.defaultSteps;

  return (
    <div className="min-h-screen bg-background text-sys-text flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-surface border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-jetbrains text-text-muted">{SETUP_GUIDE_TEXT.kicker}</span>
          <h1 className="text-3xl font-pretendard font-bold">{SETUP_GUIDE_TEXT.title}</h1>
          <p className="text-body-ko text-slate-300">{message}</p>
        </div>

        <div className="bg-[#060E20] border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
          <h2 className="text-lg font-pretendard font-semibold">{SETUP_GUIDE_TEXT.stepsTitle}</h2>
          <ol className="list-decimal list-inside text-body-ko text-slate-300 flex flex-col gap-2">
            {steps.map((step) => (
              <li key={step}>
                <code className="font-jetbrains text-sm text-sys-text">{step}</code>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-2 text-body-ko text-slate-300">
          <p>{SETUP_GUIDE_TEXT.hint}</p>
          <p>{SETUP_GUIDE_TEXT.resetHint}</p>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
