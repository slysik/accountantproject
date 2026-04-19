'use client';

import { useSearchParams } from 'next/navigation';
import WizardContainer from '@/components/Wizard/WizardContainer';

export default function WizardPage() {
  const searchParams = useSearchParams();
  const initialCompanyName = searchParams.get('company') ?? '';
  const contextYear = searchParams.get('year') ?? undefined;
  const autoSample = searchParams.get('sample') === 'true';

  return (
    <WizardContainer
      initialCompanyName={initialCompanyName}
      contextYear={contextYear}
      autoSample={autoSample}
    />
  );
}
