'use client';

import { useState, useCallback } from 'react';
import { LuX, LuTrash2, LuDownload, LuUpload, LuPlus } from 'react-icons/lu';
import { softDeleteReceipt } from '@/lib/database';
import { deleteReceiptFromStorage, getReceiptUrl, uploadReceiptsMultiple } from '@/lib/receipt-handler';
import { useAuth } from '@/lib/auth';
import ReceiptThumbnail from './ReceiptThumbnail';
import type { Receipt } from '@/types';

interface ReceiptGalleryProps {
  receipts: Receipt[];
  expenseId: string;
  userId: string;
  onReceiptDeleted?: (receiptId: string) => void;
  onReceiptsUploaded?: (receipts: Receipt[]) => void;
  onClose: () => void;
}

export default function ReceiptGallery({
  receipts,
  expenseId,
  userId,
  onReceiptDeleted,
  onReceiptsUploaded,
  onClose,
}: ReceiptGalleryProps) {
  const { user } = useAuth();
  const [localReceipts, setLocalReceipts] = useState<Receipt[]>(receipts);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (receiptId: string) => {
      setDeleting(receiptId);
      setError(null);

      try {
        const receipt = localReceipts.find((r) => r.id === receiptId);
        if (!receipt) throw new Error('Receipt not found');

        await deleteReceiptFromStorage(receipt.storage_path);
        await softDeleteReceipt(userId, receiptId);

        setLocalReceipts((prev) => prev.filter((r) => r.id !== receiptId));
        setDeleteConfirm(null);
        onReceiptDeleted?.(receiptId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete receipt');
      } finally {
        setDeleting(null);
      }
    },
    [localReceipts, userId, onReceiptDeleted]
  );

  const handleDownload = useCallback(async (receipt: Receipt) => {
    try {
      const url = await getReceiptUrl(receipt.storage_path);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = receipt.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length || !user) return;
      setUploading(true);
      setUploadError(null);

      try {
        const { successful, failed } = await uploadReceiptsMultiple(user.id, expenseId, files);

        if (successful.length > 0) {
          setLocalReceipts((prev) => [...prev, ...successful]);
          onReceiptsUploaded?.(successful);
        }

        if (failed.length > 0) {
          setUploadError(`Failed to upload: ${failed.map((f) => f.file).join(', ')}`);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [user, expenseId, onReceiptsUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) handleFiles(files);
      e.target.value = '';
    },
    [handleFiles]
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] rounded-xl border border-border-primary bg-bg-secondary overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-primary p-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Receipts {localReceipts.length > 0 && `(${localReceipts.length})`}
            </h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-text-muted hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              <LuX className="h-5 w-5" />
            </button>
          </div>

          {/* Error messages */}
          {(error || uploadError) && (
            <div className="mx-6 mt-4 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
              {error || uploadError}
            </div>
          )}

          {/* Gallery grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {localReceipts.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                No receipts yet. Upload one below.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="group relative rounded-lg border border-border-primary bg-bg-tertiary p-3 hover:border-accent-primary/50 transition-colors"
                  >
                    <div className="mb-3">
                      <ReceiptThumbnail receipt={receipt} size="md" />
                    </div>
                    <p className="mb-2 truncate text-xs font-medium text-text-primary" title={receipt.filename}>
                      {receipt.filename}
                    </p>
                    <p className="mb-3 text-xs text-text-muted">
                      {(receipt.size_bytes / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(receipt)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors text-xs font-medium"
                      >
                        <LuDownload className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>

                      {deleteConfirm === receipt.id ? (
                        <div className="flex-1 flex gap-1">
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            disabled={deleting === receipt.id}
                            className="flex-1 rounded px-2 py-1.5 bg-error/20 text-error hover:bg-error/30 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === receipt.id ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting === receipt.id}
                            className="flex-1 rounded px-2 py-1.5 bg-bg-primary border border-border-primary text-text-secondary hover:bg-bg-tertiary transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(receipt.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 bg-error/10 text-error hover:bg-error/20 transition-colors text-xs font-medium"
                        >
                          <LuTrash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              className={`mt-4 rounded-xl border-2 border-dashed p-5 transition-all ${
                isDragging
                  ? 'border-accent-primary bg-accent-primary/5'
                  : 'border-border-primary hover:border-text-muted'
              }`}
            >
              <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <span className="text-xs text-text-muted">Uploading...</span>
                ) : (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary">
                      <LuPlus className={`h-4 w-4 ${isDragging ? 'text-accent-primary' : 'text-text-muted'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary">
                        Add receipts — drag & drop or{' '}
                        <span className="text-accent-primary">browse</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-text-muted">
                        PDF, JPG, PNG, WebP, DOCX, XLSX, TXT · Max 50MB
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border-primary bg-bg-tertiary p-4 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt"
                multiple
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />
              <LuUpload className="h-3.5 w-3.5" />
              {uploading ? 'Uploading...' : 'Upload Receipt'}
            </label>
            <button
              onClick={onClose}
              className="rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
