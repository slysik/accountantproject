import { supabase } from './supabase';

export type MappingMatchType = 'source_category' | 'retailer';

export interface CategoryMapping {
  id: string;
  user_id: string;
  source_label: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryMappingLookup {
  sourceCategories: Record<string, string>;
  retailers: Array<{ label: string; categoryId: string }>;
}

const SOURCE_CATEGORY_PREFIX = 'source_category:';
const RETAILER_PREFIX = 'retailer:';

function normalizeSourceLabel(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function encodeMappingKey(matchType: MappingMatchType, value: string) {
  const normalizedValue = normalizeSourceLabel(value).toLowerCase();
  return `${matchType === 'retailer' ? RETAILER_PREFIX : SOURCE_CATEGORY_PREFIX}${normalizedValue}`;
}

function decodeMappingKey(storedValue: string): { matchType: MappingMatchType; label: string } {
  if (storedValue.startsWith(RETAILER_PREFIX)) {
    return {
      matchType: 'retailer',
      label: storedValue.slice(RETAILER_PREFIX.length),
    };
  }

  if (storedValue.startsWith(SOURCE_CATEGORY_PREFIX)) {
    return {
      matchType: 'source_category',
      label: storedValue.slice(SOURCE_CATEGORY_PREFIX.length),
    };
  }

  return {
    matchType: 'source_category',
    label: storedValue,
  };
}

export function getMappingDisplayLabel(mapping: CategoryMapping) {
  return decodeMappingKey(mapping.source_label).label;
}

export function getMappingMatchType(mapping: CategoryMapping): MappingMatchType {
  return decodeMappingKey(mapping.source_label).matchType;
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
  categoryId: string,
  matchType: MappingMatchType = 'source_category'
): Promise<CategoryMapping> {
  const normalizedSourceLabel = normalizeSourceLabel(sourceLabel);
  if (!normalizedSourceLabel) throw new Error('Source category label is required.');

  const { data, error } = await supabase
    .from('category_mappings')
    .upsert(
      {
        user_id: userId,
        source_label: encodeMappingKey(matchType, normalizedSourceLabel),
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
  categoryId: string,
  matchType: MappingMatchType = 'source_category'
): Promise<number> {
  const normalizedSourceLabel = normalizeSourceLabel(sourceLabel);

  const fetchQuery = supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId);

  const updateQuery = supabase
    .from('expenses')
    .update({ category: categoryId })
    .eq('user_id', userId);

  if (matchType === 'retailer') {
    fetchQuery.ilike('description', `%${normalizedSourceLabel}%`);
    updateQuery.ilike('description', `%${normalizedSourceLabel}%`);
  } else {
    fetchQuery.ilike('original_category', normalizedSourceLabel);
    updateQuery.ilike('original_category', normalizedSourceLabel);
  }

  const { data: existingRows, error: fetchError } = await fetchQuery;
  if (fetchError) throw fetchError;

  const { error } = await updateQuery;
  if (error) throw error;
  return existingRows?.length ?? 0;
}

export function buildCategoryMappingLookup(mappings: CategoryMapping[]): CategoryMappingLookup {
  return mappings.reduce<CategoryMappingLookup>((acc, mapping) => {
    const decoded = decodeMappingKey(mapping.source_label.trim().toLowerCase());

    if (decoded.matchType === 'retailer') {
      acc.retailers.push({
        label: decoded.label,
        categoryId: mapping.category_id,
      });
    } else {
      acc.sourceCategories[decoded.label] = mapping.category_id;
    }

    return acc;
  }, { sourceCategories: {}, retailers: [] });
}
