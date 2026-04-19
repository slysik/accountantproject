'use client';

import { useSearchParams } from 'next/navigation';
import IncomeWizardContainer from '@/components/IncomeWizard/IncomeWizardContainer';

export default function IncomeWizardPage() {
  const searchParams = useSearchParams();
  const initialCompanyName = searchParams.get('company') ?? '';

  return (
    <IncomeWizardContainer initialCompanyName={initialCompanyName} />
  );
}
