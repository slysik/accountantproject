'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuCheck, LuRefreshCw, LuTags, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import {
  applyCategoryMappingToExistingExpenses,
  deleteCategoryMapping,
  getCategoryMappings,
  getDistinctOriginalCategories,
  saveCategoryMapping,
  type CategoryMapping,
} from '@/lib/category-mappings';
import { getAllCategories, getCategoryName } from '@/lib/categories';

export default function CategorySettingsPage() {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const allCategories = useMemo(() => getAllCategories(), []);

  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [sourceCategories, setSourceCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sourceLabel, setSourceLabel] = useState('');
  const [categoryId, setCategoryId] = useState(allCategories[0]?.id ?? 'uncategorized');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applyingSource, setApplyingSource] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const [nextMappings, nextSources] = await Promise.all([
        getCategoryMappings(effectiveUserId),
        getDistinctOriginalCategories(effectiveUserId),
      ]);
      setMappings(nextMappings);
      setSourceCategories(nextSources);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load category mappings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [effectiveUserId]);

  const mappedLabels = useMemo(
    () => new Set(mappings.map((mapping) => mapping.source_label.trim().toLowerCase())),
    [mappings]
  );

  const unmappedSources = useMemo(
    () => sourceCategories.filter((label) => !mappedLabels.has(label.trim().toLowerCase())),
    [sourceCategories, mappedLabels]
  );

  const handleSave = async (labelOverride?: string) => {
    if (!effectiveUserId) return;
    const nextLabel = (labelOverride ?? sourceLabel).trim();
    if (!nextLabel) {
      setError('Source category label is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveCategoryMapping(effectiveUserId, nextLabel, categoryId);
      const updatedCount = await applyCategoryMappingToExistingExpenses(effectiveUserId, nextLabel, categoryId);
      setSuccess(`Saved mapping for "${nextLabel}" and updated ${updatedCount} existing expense${updatedCount === 1 ? '' : 's'}.`);
      setSourceLabel('');
      await refresh();
    } catch (err) {
      setError((err as Error).message ?? 'Failed to save category mapping.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mapping: CategoryMapping) => {
    if (!effectiveUserId) return;
    setDeletingId(mapping.id);
    setError('');
    setSuccess('');

    try {
      await deleteCategoryMapping(effectiveUserId, mapping.id);
      setSuccess(`Deleted mapping for "${mapping.source_label}".`);
      await refresh();
    } catch (err) {
      setError((err as Error).message ?? 'Failed to delete category mapping.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleApplySource = async (label: string) => {
    setSourceLabel(label);
    setApplyingSource(label);
    try {
      await handleSave(label);
    } finally {
      setApplyingSource(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="mb-4 flex items-center gap-2">
          <LuTags className="h-4 w-4 text-accent-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Expense Category Mapping</h2>
        </div>
        <p className="mb-5 text-xs text-text-muted">
          Create mappings from imported source categories into your ABF expense categories. New imports will use these mappings automatically, and saved mappings can also update existing expenses that used the same source label.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Source Label</label>
            <input
              type="text"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="e.g. Meals & Entertainment"
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Map To Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            >
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => void handleSave()}
              disabled={saving || !sourceLabel.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              <LuCheck className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Mapping'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Detected Source Categories</h2>
            <p className="mt-1 text-xs text-text-muted">
              These are original category labels already found in your imported expenses.
            </p>
          </div>
          <button
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-primary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <LuRefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-text-muted">Loading categories...</p>
        ) : unmappedSources.length === 0 ? (
          <p className="text-sm text-text-muted">No unmapped source categories found.</p>
        ) : (
          <div className="space-y-2">
            {unmappedSources.map((label) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="text-xs text-text-muted">Not mapped yet</p>
                </div>
                <button
                  onClick={() => void handleApplySource(label)}
                  disabled={saving || applyingSource === label}
                  className="rounded-lg border border-border-primary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary disabled:opacity-50"
                >
                  {applyingSource === label ? 'Applying...' : 'Use Current Category'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Saved Mappings</h2>
        {loading ? (
          <p className="text-sm text-text-muted">Loading mappings...</p>
        ) : mappings.length === 0 ? (
          <p className="text-sm text-text-muted">No category mappings saved yet.</p>
        ) : (
          <div className="space-y-2">
            {mappings.map((mapping) => (
              <div key={mapping.id} className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{mapping.source_label}</p>
                  <p className="text-xs text-text-muted">Maps to {getCategoryName(mapping.category_id)}</p>
                </div>
                <button
                  onClick={() => void handleDelete(mapping)}
                  disabled={deletingId === mapping.id}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                >
                  <LuTrash2 className="h-3.5 w-3.5" />
                  {deletingId === mapping.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
