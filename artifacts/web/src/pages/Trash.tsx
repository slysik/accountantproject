import { useGetExpenses, useRestoreExpense, useDeleteMonth, getGetExpensesQueryKey, getGetFoldersQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/expense-processor";
import { getCategoryName } from "@/lib/categories";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export function Trash() {
  const queryClient = useQueryClient();
  const { data: expenses, isLoading } = useGetExpenses({ trash: "true" });
  
  const restoreMutation = useRestoreExpense({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFoldersQueryKey() });
      }
    }
  });

  const [showEmptyNotice, setShowEmptyNotice] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) return (
    <div className="p-8 h-full flex flex-col space-y-4 animate-fade-in-up">
      <div className="h-16 w-64 skeleton mb-4" />
      <div className="flex-1 skeleton rounded-2xl" />
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in-up max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.15)]">
            <Trash2 className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Trash Bin</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" /> Soft-deleted items are permanently removed after 30 days.
            </p>
          </div>
        </div>
        
        {expenses && expenses.length > 0 && (
          <Button variant="destructive" className="gap-2" onClick={() => setShowEmptyNotice(true)}>
            <Trash2 className="w-4 h-4" /> Empty Trash
          </Button>
        )}
      </div>

      {showEmptyNotice && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between">
          <p className="text-sm font-medium text-yellow-200">Bulk empty is coming soon. For now, expenses auto-delete after 30 days.</p>
          <button onClick={() => setShowEmptyNotice(false)} className="text-yellow-400 hover:text-yellow-200 text-sm font-bold ml-4">Dismiss</button>
        </div>
      )}

      <div className="border border-white/10 rounded-2xl overflow-hidden glass-panel flex-1 flex flex-col max-h-[calc(100vh-200px)]">
        {expenses?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-32 h-32 mb-6 rounded-full bg-white/5 flex items-center justify-center relative">
              <Trash2 className="w-12 h-12 text-muted-foreground/30" />
              <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Your trash is empty</h3>
            <p className="text-muted-foreground max-w-md">Items you delete will appear here for 30 days before being permanently removed from your account.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs">Date</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs w-2/5">Description</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs">Category</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses?.map(expense => (
                  <tr key={expense.id} className="expense-row group bg-card/20">
                    <td className="px-6 py-4 text-foreground/70 font-medium whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4 font-medium truncate max-w-[250px]">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-foreground/80">
                        {getCategoryName(expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400/70 line-through">{formatCurrency(Number(expense.amount))}</td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                        onClick={() => restoreMutation.mutate({ id: expense.id })}
                        disabled={restoreMutation.isPending}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Restore
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
