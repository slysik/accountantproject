/**
 * Reusable skeleton loading placeholder.
 * Renders a pulsing block to indicate loading content.
 */
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-bg-tertiary ${className}`}
    />
  );
}

/** Card-shaped skeleton for summary cards, month cards, etc. */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
      <Skeleton className="mb-3 h-8 w-8" />
      <Skeleton className="mb-2 h-5 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/** Table row skeleton for expense tables. */
export function SkeletonTableRow() {
  return (
    <tr className="border-b border-border-primary/50">
      <td className="py-2.5 pr-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="py-2.5 pr-4">
        <Skeleton className="h-4 w-40" />
      </td>
      <td className="py-2.5 pr-4">
        <Skeleton className="h-4 w-16 ml-auto" />
      </td>
      <td className="py-2.5 pr-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="py-2.5">
        <Skeleton className="h-4 w-6 ml-auto" />
      </td>
    </tr>
  );
}

/** Full section skeleton for a data section (e.g., chart, table). */
export function SkeletonSection({ rows = 5 }: { rows?: number }) {
  return (
    <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </section>
  );
}

/** Folder tree skeleton for sidebar loading state. */
export function SkeletonFolderTree() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="h-4 w-4 flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
