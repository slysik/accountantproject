import { supabase } from './supabase';
import { createReceipt } from './database';
import type { Receipt, ReceiptUploadResult } from '@/types';

const ALLOWED_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'docx', 'xlsx', 'txt'];
const MAX_FILE_SIZE = 52428800; // 50MB

/**
 * Validate file for upload.
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_TYPES.includes(ext)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename with timestamp to prevent collisions.
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const ext = originalName.split('.').pop();
  const name = originalName.replace(/\.[^.]+$/, '');
  return `${timestamp}_${name}.${ext}`;
}

/**
 * Get file type from extension.
 */
function getFileType(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ext;
}

/**
 * Upload receipt file and create database record.
 */
export async function uploadReceipt(
  userId: string,
  expenseId: string,
  file: File
): Promise<ReceiptUploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename
    const fileName = generateFileName(file.name);
    const storagePath = `receipts/${userId}/${expenseId}/${fileName}`;
    const fileType = getFileType(file);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('expense-receipts')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Create receipt record in database
    const receipt = await createReceipt(
      userId,
      expenseId,
      file.name,
      storagePath,
      fileType,
      file.size
    );

    return { success: true, receipt };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during upload';
    return { success: false, error: message };
  }
}

/**
 * Bulk upload multiple receipts.
 */
export async function uploadReceiptsMultiple(
  userId: string,
  expenseId: string,
  files: File[]
): Promise<{ successful: Receipt[]; failed: Array<{ file: string; error: string }> }> {
  const successful: Receipt[] = [];
  const failed: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    const result = await uploadReceipt(userId, expenseId, file);
    if (result.success && result.receipt) {
      successful.push(result.receipt);
    } else {
      failed.push({ file: file.name, error: result.error || 'Unknown error' });
    }
  }

  return { successful, failed };
}

/**
 * Get signed URL for receipt display (expires in 1 hour).
 */
export async function getReceiptUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('expense-receipts')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error(`Failed to get signed URL for ${storagePath}:`, error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Get signed URLs for multiple receipts (with expiration).
 */
export async function getReceiptUrls(
  storagePaths: string[],
  expiresIn: number = 3600
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};

  for (const path of storagePaths) {
    const url = await getReceiptUrl(path, expiresIn);
    if (url) {
      urls[path] = url;
    }
  }

  return urls;
}

/**
 * Delete receipt from storage.
 */
export async function deleteReceiptFromStorage(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('expense-receipts')
      .remove([storagePath]);

    if (error) {
      console.error('Failed to delete from storage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return false;
  }
}

/**
 * Get file type icon class for non-image files.
 */
export function getFileTypeIcon(
  fileType: string
): 'pdf' | 'doc' | 'image' | 'file' {
  if (fileType === 'pdf') return 'pdf';
  if (['docx', 'xlsx', 'txt'].includes(fileType)) return 'doc';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(fileType)) return 'image';
  return 'file';
}

/**
 * Check if file type is an image.
 */
export function isImageFile(fileType: string): boolean {
  return ['jpg', 'jpeg', 'png', 'webp'].includes(fileType);
}
