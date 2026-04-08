export const MASTER_ADMIN_EMAIL = 'vic@alpina.net';

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === MASTER_ADMIN_EMAIL;
}
