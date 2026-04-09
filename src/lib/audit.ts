import { supabase } from './supabase';

export type AuditEventType = 'login' | 'import';

export interface AuditEvent {
  id: string;
  owner_user_id: string;
  actor_user_id: string | null;
  actor_email: string;
  company_name: string | null;
  event_type: AuditEventType;
  event_title: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface CreateAuditEventInput {
  ownerUserId: string;
  actorUserId: string | null;
  actorEmail: string;
  companyName?: string | null;
  eventType: AuditEventType;
  eventTitle: string;
  details?: Record<string, unknown>;
}

export async function createAuditEvent(input: CreateAuditEventInput): Promise<void> {
  const { error } = await supabase.from('account_audit_events').insert({
    owner_user_id: input.ownerUserId,
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    company_name: input.companyName ?? null,
    event_type: input.eventType,
    event_title: input.eventTitle,
    details: input.details ?? {},
  });

  if (error) throw error;
}

export async function getAuditEvents(
  ownerUserId: string,
  companyName?: string
): Promise<AuditEvent[]> {
  let query = supabase
    .from('account_audit_events')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false });

  if (companyName && companyName !== 'all') {
    query = query.eq('company_name', companyName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AuditEvent[];
}
