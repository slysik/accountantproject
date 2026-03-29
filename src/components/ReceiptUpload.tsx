'use client';

import { useState, useRef, useCallback } from 'react';
import { LuUpload, LuCheck, LuX } from 'react-icons/lu';
import { uploadReceiptsMultiple } from '@/lib/receipt-handler';
import { useAuth } from '@/lib/auth';
import type { Receipt } from '@/types';

interface ReceiptUploadProps {
  expenseId: string;
  onUploadComplete: (receipts: Receipt[]) => void;
}

export default function ReceiptUpload({
  expenseId,
  onUploadComplete,
}: ReceiptUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
    // Reset input so the same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFiles.length || !user) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      const { successful, failed } = await uploadReceiptsMultiple(
        user.id,
        expenseId,
        selectedFiles
      );

      if (failed.length > 0) {
        const failedNames = failed.map((f) => f.file).join(', ');
        setError(`Failed to upload: ${failedNames}`);
      }

      if (successful.length > 0) {
        setSuccess(true);
        setSelectedFiles([]);
        setUploadProgress(100);
        setTimeout(() => {
          onUploadComplete(successful);
          setSuccess(false);
          setUploadProgress(0);
        }, 1500);
      } else if (failed.length === 0) {
        setError('No files were uploaded');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipts');
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, user, expenseId, onUploadComplete]);

  const handleCancel = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  }, []);

  // Preview mode - show selected files
  if (selectedFiles.length > 0) {
    return (
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuUpload className="h-5 w-5 text-accent-primary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Ready to Upload
            </h2>
          </div>
          <div className="text-xs text-text-secondary">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* File list */}
        <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
          {selectedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border-primary bg-bg-tertiary p-3"
            >
              <div className="text-xs">
                <p className="font-medium text-text-primary truncate">{file.name}</p>
                <p className="text-text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-bg-tertiary">
              <div
                className="h-full rounded-full bg-accent-primary transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <LuCheck className="h-4 w-4 text-success flex-shrink-0" />
            <span className="text-xs font-medium text-success">
              Receipts uploaded successfully
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || success}
            className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {success ? (
              <>
                <LuCheck className="h-3.5 w-3.5" />
                Uploaded
              </>
            ) : (
              <>
                <LuUpload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading...' : 'Upload'}
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
          >
            <LuX className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </section>
    );
  }

  // Upload zone mode
  return (
    <section>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all ${
          isDragging
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border-primary bg-bg-secondary hover:border-text-muted hover:bg-bg-secondary/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary">
            <LuUpload
              className={`h-5 w-5 ${isDragging ? 'text-accent-primary' : 'text-text-muted'}`}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Add Receipts
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Drag and drop files here, or click to browse
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Supported: PDF, Images (JPG, PNG, WebP), Documents (DOCX, XLSX, TXT) • Max 50MB
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
          {error}
        </div>
      )}
    </section>
  );
}
