'use client';

import { useSearchParams } from 'next/navigation';
import WizardContainer from '@/components/Wizard/WizardContainer';
import { SAMPLE_COMPANY_NAME } from '@/lib/sample-data';

export default function WizardPage() {
  const searchParams = useSearchParams();
  const contextYear = searchParams.get('year') ?? undefined;
  const autoSample = searchParams.get('sample') === 'true';
  const initialCompanyName = autoSample ? SAMPLE_COMPANY_NAME : searchParams.get('company') ?? '';

  return (
    <WizardContainer
      initialCompanyName={initialCompanyName}
      contextYear={contextYear}
      autoSample={autoSample}
    />
  );
}
