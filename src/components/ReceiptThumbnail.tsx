'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LuFileText, LuFile, LuDownload } from 'react-icons/lu';
import { getReceiptUrl } from '@/lib/receipt-handler';
import type { Receipt } from '@/types';

interface ReceiptThumbnailProps {
  receipt: Receipt;
  size?: 'sm' | 'md' | 'lg';
  showDownload?: boolean;
}

export default function ReceiptThumbnail({
  receipt,
  size = 'md',
  showDownload = false,
}: ReceiptThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        setLoading(true);
        const signedUrl = await getReceiptUrl(receipt.storage_path);
        if (signedUrl) {
          setUrl(signedUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to get receipt URL:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [receipt.storage_path]);

  const isImage = receipt.file_type.match(/jpg|jpeg|png|webp/i);
  const sizeClass = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];

  const iconSizeClass = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size];

  if (loading) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary`}
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div
        className={`${sizeClass} flex flex-col items-center justify-center rounded-lg border border-border-primary/50 bg-bg-tertiary`}
      >
        <LuFile className={`${iconSizeClass} text-text-muted`} />
        {size === 'lg' && (
          <p className="mt-1 text-xs text-text-muted">Not found</p>
        )}
      </div>
    );
  }

  if (isImage) {
    return (
      <div className={`group relative ${sizeClass} overflow-hidden rounded-lg border border-border-primary`}>
        <Image
          src={url}
          alt={receipt.filename}
          fill
          className="object-cover"
          unoptimized
          onError={() => setError(true)}
        />
        {showDownload && (
          <a
            href={url}
            download={receipt.filename}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <LuDownload className="h-5 w-5 text-white" />
          </a>
        )}
      </div>
    );
  }

  // File type icon for non-image files
  const getIcon = () => {
    if (receipt.file_type === 'pdf') {
      return <LuFileText className={`${iconSizeClass} text-error`} />;
    }
    return <LuFile className={`${iconSizeClass} text-text-muted`} />;
  };

  return (
    <div
      className={`${sizeClass} group relative flex flex-col items-center justify-center rounded-lg border border-border-primary bg-bg-tertiary`}
    >
      {getIcon()}
      {size === 'lg' && (
        <p className="mt-2 text-xs font-medium text-text-secondary text-center px-1 truncate">
          {receipt.filename}
        </p>
      )}
      {showDownload && (
        <a
          href={url}
          download={receipt.filename}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
        >
          <LuDownload className="h-5 w-5 text-white" />
        </a>
      )}
    </div>
  );
}
