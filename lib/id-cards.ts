import { supabase } from './supabase';

export interface IdCardRequest {
  id: number;
  reference_number: string | null;
  new_replacement: string | null;
  pay_role_number: string | null;
  badge_type: string | null;
  surname: string | null;
  forename: string | null;
  department: string | null;
  base_location: string | null;
  date_received: string | null;
  badge_id_complete: string | null;
  status: string;
  created_at: string;
}

export function emptyIdCardForm(): Record<string, string> {
  return {
    new_replacement: '',
    pay_role_number: '',
    badge_type: '',
    surname: '',
    forename: '',
    department: '',
    expiry_date: '',
    manager: '',
    access_card: '',
    base_location: '',
    base_post_code: '',
    previous_last_name: '',
    position: '',
    unit: '',
    address: '',
    uer_number: '',
    powers: '',
    date_received: '',
    date_posted: '',
    badge_id_complete: '',
  };
}

export async function fetchIdCards(): Promise<IdCardRequest[]> {
  const { data, error } = await supabase
    .from('id_card_requests')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as IdCardRequest[]) ?? [];
}

export async function submitIdCardRequest(formData: Record<string, string>): Promise<string> {
  const { data, error } = await supabase.rpc('submit_id_card_request', { p_data: formData });
  if (error) throw error;
  return (data as string) ?? '';
}

export async function archiveAllIdCards(): Promise<number> {
  const { data, error } = await supabase.rpc('archive_all_id_cards');
  if (error) throw error;
  return (data as number) ?? 0;
}