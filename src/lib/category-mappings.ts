import { supabase } from './supabase';

export interface CategoryMapping {
  id: string;
  user_id: string;
  source_label: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

function normalizeSourceLabel(value: string) {
  return value.trim();
}

export async function getCategoryMappings(userId: string): Promise<CategoryMapping[]> {
  const { data, error } = await supabase
    .from('category_mappings')
    .select('*')
    .eq('user_id', userId)
    .order('source_label', { ascending: true });

  if (error) throw error;
  return (data ?? []) as CategoryMapping[];
}

export async function saveCategoryMapping(
  userId: string,
  sourceLabel: string,
  categoryId: string
): Promise<CategoryMapping> {
  const normalizedSourceLabel = normalizeSourceLabel(sourceLabel);
  if (!normalizedSourceLabel) throw new Error('Source category label is required.');

  const { data, error } = await supabase
    .from('category_mappings')
    .upsert(
      {
        user_id: userId,
        source_label: normalizedSourceLabel,
        category_id: categoryId,
      },
      { onConflict: 'user_id,source_label' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data as CategoryMapping;
}

export async function deleteCategoryMapping(userId: string, mappingId: string): Promise<void> {
  const { error } = await supabase
    .from('category_mappings')
    .delete()
    .eq('id', mappingId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getDistinctOriginalCategories(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('original_category')
    .eq('user_id', userId)
    .not('original_category', 'is', null)
    .neq('original_category', '');

  if (error) throw error;

  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => (row.original_category as string)?.trim())
        .filter((value): value is string => !!value)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export async function applyCategoryMappingToExistingExpenses(
  userId: string,
  sourceLabel: string,
  categoryId: string
): Promise<number> {
  const normalizedSourceLabel = normalizeSourceLabel(sourceLabel);

  const { data: existingRows, error: fetchError } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId)
    .ilike('original_category', normalizedSourceLabel);

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('expenses')
    .update({ category: categoryId })
    .eq('user_id', userId)
    .ilike('original_category', normalizedSourceLabel);

  if (error) throw error;
  return existingRows?.length ?? 0;
}

export function buildCategoryMappingLookup(mappings: CategoryMapping[]): Record<string, string> {
  return mappings.reduce<Record<string, string>>((acc, mapping) => {
    acc[mapping.source_label.trim().toLowerCase()] = mapping.category_id;
    return acc;
  }, {});
}
