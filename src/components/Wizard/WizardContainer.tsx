'use client';

import { useState, useCallback } from 'react';
import { LuUpload, LuListChecks, LuSparkles, LuSave } from 'react-icons/lu';
import StepUpload from './StepUpload';
import StepReview from './StepReview';
import StepCategorize from './StepCategorize';
import StepCommit from './StepCommit';
import type { CategorizedExpense } from '@/types';

const STEPS = [
  { label: 'Upload', icon: LuUpload },
  { label: 'Review', icon: LuListChecks },
  { label: 'AI Map', icon: LuSparkles },
  { label: 'Commit', icon: LuSave },
] as const;

interface WizardContainerProps {
  initialCompanyName?: string;
  contextYear?: string;
  autoSample?: boolean;
}

export default function WizardContainer({ initialCompanyName, contextYear, autoSample }: WizardContainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mappedExpenses, setMappedExpenses] = useState<CategorizedExpense[]>([]);
  const [reviewedExpenses, setReviewedExpenses] = useState<CategorizedExpense[]>([]);
  const [categorizedExpenses, setCategorizedExpenses] = useState<
    CategorizedExpense[]
  >([]);

  const handleUploadComplete = useCallback(
    (expenses: CategorizedExpense[]) => {
      setMappedExpenses(expenses);
      setReviewedExpenses(expenses);
      setCurrentStep(1);
    },
    []
  );

  const handleReviewComplete = useCallback(
    (expenses: CategorizedExpense[]) => {
      setReviewedExpenses(expenses);
      setCurrentStep(2);
    },
    []
  );

  const handleCategorizeComplete = useCallback(
    (expenses: CategorizedExpense[]) => {
      setCategorizedExpenses(expenses);
      setCurrentStep(3);
    },
    []
  );

  const canGoBack = currentStep > 0;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step.label} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-accent-primary text-bg-primary'
                      : isCompleted
                        ? 'bg-success text-bg-primary'
                        : 'bg-bg-tertiary text-text-muted'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-medium ${
                    isActive
                      ? 'text-accent-primary'
                      : isCompleted
                        ? 'text-success'
                        : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-3 mb-5 h-0.5 w-16 rounded-full transition-colors ${
                    index < currentStep ? 'bg-success' : 'bg-bg-tertiary'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        {currentStep === 0 && (
          <StepUpload onComplete={handleUploadComplete} autoSample={autoSample} />
        )}
        {currentStep === 1 && (
          <StepReview
            expenses={mappedExpenses}
            onComplete={handleReviewComplete}
          />
        )}
        {currentStep === 2 && (
          <StepCategorize
            expenses={reviewedExpenses}
            onComplete={handleCategorizeComplete}
          />
        )}
        {currentStep === 3 && (
          <StepCommit
            expenses={categorizedExpenses}
            initialCompanyName={initialCompanyName}
            contextYear={contextYear}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={!canGoBack}
          className="rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-30"
        >
          Back
        </button>
        <span className="text-xs text-text-muted">
          Step {currentStep + 1} of {STEPS.length}
        </span>
        {/* Next button only shown as disabled hint; actual progression is via step onComplete */}
        <button
          disabled={true}
          className="rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary opacity-30 cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
