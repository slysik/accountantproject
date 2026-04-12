import { supabase } from './supabase';

export interface AccountProfile {
  user_id: string;
  account_id?: string;
  account_name: string;
  first_name: string;
  last_name: string;
  business_name: string;
  contact_email: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_region: string;
  postal_code: string;
  country: string;
  website: string;
}

export const EMPTY_ACCOUNT_PROFILE: AccountProfile = {
  user_id: '',
  account_id: undefined,
  account_name: '',
  first_name: '',
  last_name: '',
  business_name: '',
  contact_email: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state_region: '',
  postal_code: '',
  country: '',
  website: '',
};

function normalizeProfileRow(row: Partial<AccountProfile> | null, userId: string): AccountProfile {
  return {
    user_id: userId,
    account_id: row?.account_id ?? undefined,
    account_name: row?.account_name ?? '',
    first_name: row?.first_name ?? '',
    last_name: row?.last_name ?? '',
    business_name: row?.business_name ?? '',
    contact_email: row?.contact_email ?? '',
    phone: row?.phone ?? '',
    address_line_1: row?.address_line_1 ?? '',
    address_line_2: row?.address_line_2 ?? '',
    city: row?.city ?? '',
    state_region: row?.state_region ?? '',
    postal_code: row?.postal_code ?? '',
    country: row?.country ?? '',
    website: row?.website ?? '',
  };
}

export async function getAccountProfile(userId: string): Promise<AccountProfile> {
  const { data, error } = await supabase
    .from('account_profiles')
    .select(
      'user_id, account_id, account_name, first_name, last_name, business_name, contact_email, phone, address_line_1, address_line_2, city, state_region, postal_code, country, website'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeProfileRow((data as Partial<AccountProfile> | null) ?? null, userId);
}

export async function saveAccountProfile(profile: AccountProfile): Promise<AccountProfile> {
  const { data, error } = await supabase
    .from('account_profiles')
    .upsert(profile, {
      onConflict: 'user_id',
    })
    .select(
      'user_id, account_id, account_name, first_name, last_name, business_name, contact_email, phone, address_line_1, address_line_2, city, state_region, postal_code, country, website'
    )
    .single();

  if (error) throw error;
  return normalizeProfileRow((data as Partial<AccountProfile> | null) ?? null, profile.user_id);
}
