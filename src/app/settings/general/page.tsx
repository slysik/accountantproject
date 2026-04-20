'use client';

import AppearancePicker from './AppearancePicker';

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">General</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Customize your app experience.
        </p>
      </div>

      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">Appearance</h3>
        <p className="mb-5 text-xs text-text-muted">
          Choose how the app looks. Auto follows your system setting.
        </p>
        <AppearancePicker />
      </section>
    </div>
  );
}
