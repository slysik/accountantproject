import { useParams } from "wouter";
import { useGetExpenses, useUpdateExpense, useDeleteMonth, useDeleteExpense, getGetExpensesQueryKey, getGetFoldersQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/expense-processor";
import { getCategoryName, getAllCategories } from "@/lib/categories";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Trash2, Search, FileDown, ArrowDownToLine, ChevronDown, PieChart, LayoutGrid } from "lucide-react";
import { formatMonthDisplay } from "@/lib/date-utils";
import { useState, useMemo } from "react";
import { generateCSV, generateExcelReport, generateQBO } from "@/lib/export";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Helper for category dot colors
const getCategoryColor = (catId: string) => {
  const colors: Record<string, string> = {
    meals: "bg-orange-500",
    travel: "bg-blue-500",
    car_truck: "bg-cyan-500",
    supplies: "bg-yellow-500",
    insurance: "bg-indigo-500",
    office: "bg-purple-500",
    contract_labor: "bg-pink-500",
    legal_professional: "bg-rose-500",
    utilities: "bg-sky-500",
    advertising: "bg-fuchsia-500",
    rent_lease: "bg-teal-500",
    suspected_personal: "bg-red-500",
    other: "bg-slate-500",
    uncategorized: "bg-slate-400"
  };
  return colors[catId] || "bg-emerald-500";
};

export function MonthView() {
  const { year, month } = useParams();
  const [search, setSearch] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: expenses, isLoading } = useGetExpenses({ year, month });
  
  const updateMutation = useUpdateExpense({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() }) }
  });
  
  const deleteMutation = useDeleteExpense({
    mutation: { 
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFoldersQueryKey() });
      }
    }
  });

  const deleteMonthMutation = useDeleteMonth({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFoldersQueryKey() });
      }
    }
  });

  const filtered = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => 
      e.description.toLowerCase().includes(search.toLowerCase()) || 
      getCategoryName(e.category).toLowerCase().includes(search.toLowerCase())
    );
  }, [expenses, search]);

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  const topCategory = useMemo(() => {
    if (!filtered.length) return null;
    const sums: Record<string, number> = {};
    filtered.forEach(e => {
      sums[e.category] = (sums[e.category] || 0) + Number(e.amount);
    });
    const top = Object.entries(sums).sort((a, b) => b[1] - a[1])[0];
    return { name: getCategoryName(top[0]), amount: top[1] };
  }, [filtered]);

  const handleExport = (format: 'csv' | 'excel' | 'qbo') => {
    if (format === 'csv') generateCSV(filtered);
    if (format === 'excel') generateExcelReport(filtered);
    if (format === 'qbo') generateQBO(filtered);
    setIsExportOpen(false);
  };

  const amountColor = (amount: number) => {
    if (amount > 1000) return "text-emerald-300 font-bold";
    if (amount > 100) return "text-emerald-400 font-semibold";
    return "text-emerald-500 font-medium";
  };

  return (
    <div className="h-full flex flex-col pb-8 animate-fade-in-up">
      {/* Header Area */}
      <div className="p-8 pb-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-sm font-bold tracking-widest text-primary/80 mb-1 uppercase flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> {year}
            </div>
            <h1 className="text-4xl font-display font-bold">{formatMonthDisplay(`${year}-${month}`)}</h1>
          </div>
          
          <div className="flex gap-3 relative">
            <div className="relative">
              <Button 
                variant="outline" 
                className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                onClick={() => setIsExportOpen(!isExportOpen)}
              >
                <FileDown className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel shadow-2xl z-50 overflow-hidden py-1 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-muted-foreground" /> CSV File
                  </button>
                  <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-muted-foreground" /> Excel Report
                  </button>
                  <button onClick={() => handleExport('qbo')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                    <ArrowDownToLine className="w-4 h-4 text-muted-foreground" /> QuickBooks (QBO)
                  </button>
                </div>
              )}
            </div>
            <Button 
              variant="destructive" 
              className="gap-2 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white border-transparent"
              onClick={() => {
                if(confirm("Delete all expenses for this month?")) {
                  deleteMonthMutation.mutate({ data: { year: year!, month: month! } });
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete Month
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card p-5 rounded-2xl">
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2"><PieChart className="w-4 h-4" /> Total Spending</div>
            <div className="text-3xl font-display font-bold text-emerald-400">{formatCurrency(total)}</div>
          </div>
          <div className="stat-card p-5 rounded-2xl">
            <div className="text-sm text-muted-foreground mb-2">Transactions</div>
            <div className="text-3xl font-display font-bold">{filtered?.length || 0}</div>
          </div>
          <div className="stat-card p-5 rounded-2xl">
            <div className="text-sm text-muted-foreground mb-2">Status</div>
            <div className="mt-1"><Badge variant="emerald" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 text-sm">Categorized</Badge></div>
          </div>
          <div className="stat-card p-5 rounded-2xl">
            <div className="text-sm text-muted-foreground mb-2">Top Category</div>
            {topCategory ? (
              <div>
                <div className="text-xl font-bold truncate">{topCategory.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{formatCurrency(topCategory.amount)}</div>
              </div>
            ) : (
              <div className="text-xl text-muted-foreground">-</div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isSearchFocused ? "text-primary animate-pulse-glow rounded-full" : "text-muted-foreground")} />
          <input 
            type="text" 
            placeholder="Search descriptions or categories..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-panel border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary outline-none text-base transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="px-8 flex-1 flex flex-col">
        <div className="border border-white/10 rounded-2xl overflow-hidden glass-panel flex flex-col h-full max-h-[calc(100vh-400px)]">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-white/5 border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs">Date</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs w-2/5">Description</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs">Category</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-xs text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-5 w-24 skeleton" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-full max-w-[200px] skeleton" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-40 skeleton rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 skeleton ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 skeleton rounded-md" /></td>
                  </tr>
                ))}
                
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No expenses found</h3>
                      <p className="text-muted-foreground">Try adjusting your search criteria.</p>
                    </td>
                  </tr>
                )}

                {!isLoading && filtered.map(expense => (
                  <tr key={expense.id} className="expense-row group bg-card/20">
                    <td className="px-6 py-4 text-foreground/70 whitespace-nowrap font-medium">{expense.date}</td>
                    <td className="px-6 py-4 font-medium truncate max-w-[300px]" title={expense.description}>{expense.description}</td>
                    <td className="px-6 py-3">
                      <div className="relative flex items-center">
                        <div className={cn("absolute left-3 w-2.5 h-2.5 rounded-full z-10 pointer-events-none", getCategoryColor(expense.category))} />
                        <select
                          value={expense.category}
                          onChange={(e) => updateMutation.mutate({ id: expense.id, data: { category: e.target.value }})}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg pl-8 pr-8 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer w-full text-sm font-medium appearance-none transition-colors"
                        >
                          {getAllCategories().map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-card text-foreground py-2">{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </td>
                    <td className={cn("px-6 py-4 text-right", amountColor(Number(expense.amount)))}>
                      {formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          if(confirm("Delete this expense?")) deleteMutation.mutate({ id: expense.id });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-all"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
