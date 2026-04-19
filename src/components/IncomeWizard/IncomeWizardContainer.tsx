'use client';

import { useState, useCallback } from 'react';
import { LuUpload, LuListChecks, LuSave } from 'react-icons/lu';
import IncomeStepUpload from './StepUpload';
import IncomeStepReview from './StepReview';
import IncomeStepCommit from './StepCommit';
import type { Income } from '@/types';

const STEPS = [
  { label: 'Upload', icon: LuUpload },
  { label: 'Review', icon: LuListChecks },
  { label: 'Commit', icon: LuSave },
] as const;

interface IncomeWizardContainerProps {
  initialCompanyName?: string;
}

export default function IncomeWizardContainer({ initialCompanyName }: IncomeWizardContainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedRows, setUploadedRows] = useState<Income[]>([]);
  const [reviewedRows, setReviewedRows] = useState<Income[]>([]);

  const handleUploadComplete = useCallback((rows: Income[]) => {
    setUploadedRows(rows);
    setCurrentStep(1);
  }, []);

  const handleReviewComplete = useCallback((rows: Income[]) => {
    setReviewedRows(rows);
    setCurrentStep(2);
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-primary text-bg-primary'
                    : isDone
                    ? 'bg-success/15 text-success'
                    : 'bg-bg-secondary text-text-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {step.label}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-px w-8 ${idx < currentStep ? 'bg-success/50' : 'bg-border-primary'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-border-primary bg-bg-secondary p-6">
        <div className="mb-5 border-b border-border-primary pb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
              {(() => { const Icon = STEPS[currentStep].icon; return <Icon className="h-4 w-4 text-success" />; })()}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                {currentStep === 0 && 'Upload income CSV'}
                {currentStep === 1 && 'Review & classify income'}
                {currentStep === 2 && 'Commit to company'}
              </h2>
              <p className="text-xs text-text-muted">
                {currentStep === 0 && 'Import bank deposits, checks, payment processor exports, or invoice data.'}
                {currentStep === 1 && 'Confirm income type (check, deposit, cash, etc.) and enter source for any unknown rows.'}
                {currentStep === 2 && 'Select the company and save the income records.'}
              </p>
            </div>
          </div>
        </div>

        {currentStep === 0 && (
          <IncomeStepUpload onComplete={handleUploadComplete} />
        )}
        {currentStep === 1 && (
          <IncomeStepReview
            rows={uploadedRows}
            onComplete={handleReviewComplete}
            onBack={() => setCurrentStep(0)}
          />
        )}
        {currentStep === 2 && (
          <IncomeStepCommit
            rows={reviewedRows}
            initialCompanyName={initialCompanyName}
            onBack={() => setCurrentStep(1)}
          />
        )}
      </div>
    </div>
  );
}
