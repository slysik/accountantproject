'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuClipboardList, LuLogIn, LuUpload } from 'react-icons/lu';
import { getAuditEvents, type AuditEvent } from '@/lib/audit';
import { getUserFolders } from '@/lib/database';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AuditPage() {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email || !effectiveUserId) return;
    const currentUser = user;
    const ownerUserId = effectiveUserId;
    const currentUserEmail = (currentUser.email ?? '').toLowerCase().trim();

    let cancelled = false;

    async function loadAudit() {
      setLoading(true);
      setError(null);

      try {
        const isOwner = currentUser.id === ownerUserId;
        let role: string | null = null;

        if (!isOwner) {
          const { data } = await supabase
            .from('account_members')
            .select('role')
            .eq('owner_user_id', ownerUserId)
            .eq('member_email', currentUserEmail)
            .maybeSingle();
          role = (data?.role as string | undefined) ?? null;
        }

        const canView = isOwner || role === 'admin';

        if (cancelled) return;
        setAllowed(canView);

        if (!canView) {
          setEvents([]);
          return;
        }

        const [auditEvents, folderTree] = await Promise.all([
          getAuditEvents(ownerUserId),
          getUserFolders(ownerUserId),
        ]);

        if (cancelled) return;
        setEvents(auditEvents);
        setCompanies(folderTree.map((company) => company.companyName));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load audit history.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAudit();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, user]);

  const filteredEvents = useMemo(() => {
    if (selectedCompany === 'all') {
      return events;
    }
    return events.filter((event) => event.company_name === selectedCompany);
  }, [events, selectedCompany]);

  const loginCount = filteredEvents.filter((event) => event.event_type === 'login').length;
  const importCount = filteredEvents.filter((event) => event.event_type === 'import').length;

  if (loading) {
    return (
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <p className="text-sm text-text-secondary">Loading audit trail...</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h1 className="text-xl font-semibold text-text-primary">Audit</h1>
        <p className="mt-2 text-sm text-text-muted">
          Audit history is available to the account owner and team admins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Audit</h1>
        <p className="mt-1 text-sm text-text-muted">
          Track sign-ins and imports across this account from one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Events</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{filteredEvents.length}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Logins</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{loginCount}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Imports</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{importCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Activity feed</h2>
            <p className="mt-1 text-xs text-text-muted">Filter to a company to focus on import history for that ledger.</p>
          </div>
          <select
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            className="rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/30"
          >
            <option value="all">All companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
            {error}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="rounded-lg border border-border-primary bg-bg-tertiary/30 px-4 py-6 text-center text-sm text-text-muted">
              No audit events have been recorded for this view yet.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="rounded-xl border border-border-primary bg-bg-tertiary/30 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-bg-secondary">
                      {event.event_type === 'login' ? (
                        <LuLogIn className="h-4 w-4 text-accent-primary" />
                      ) : event.event_type === 'import' ? (
                        <LuUpload className="h-4 w-4 text-accent-primary" />
                      ) : (
                        <LuClipboardList className="h-4 w-4 text-accent-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{event.event_title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {event.actor_email}
                        {event.company_name ? ` · ${event.company_name}` : ' · Account access'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">{formatTimestamp(event.created_at)}</span>
                </div>

                {event.event_type === 'import' ? (
                  <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-text-secondary">
                    <span>Submitted: {String(event.details.submitted_rows ?? '-')}</span>
                    <span>Inserted: {String(event.details.inserted_rows ?? '-')}</span>
                    <span>
                      Files: {Array.isArray(event.details.source_files) ? (event.details.source_files as string[]).join(', ') : '-'}
                    </span>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
