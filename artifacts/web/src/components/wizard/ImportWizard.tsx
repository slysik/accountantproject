import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, CheckCircle2, AlertCircle, ChevronRight, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parseCSV, ParsedExpense, formatCurrency } from "@/lib/expense-processor";
import { getCategoryName, getAllCategories } from "@/lib/categories";
import { useCreateExpenses, getGetFoldersQueryKey, getGetExpensesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface WizardProps {
  onClose: () => void;
}

export function ImportWizard({ onClose }: WizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [expenses, setExpenses] = useState<ParsedExpense[]>([]);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const createMutation = useCreateExpenses({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFoldersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        setStep(4);
      },
      onError: (err: any) => setError(err.message || "Failed to save expenses")
    }
  });

  const processFile = (file: File) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCSV(text, file.name);
        setExpenses(parsed);
        setStep(2);
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    } else {
      setError("Please drop a valid .csv file.");
    }
  };

  const handleSave = () => {
    createMutation.mutate({ data: { expenses } });
  };

  const updateCategory = (index: number, cat: string) => {
    const newExpenses = [...expenses];
    newExpenses[index].category = cat;
    setExpenses(newExpenses);
  };

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const steps = [
    { num: 1, title: "Upload" },
    { num: 2, title: "Review Data" },
    { num: 3, title: "Categories" },
    { num: 4, title: "Complete" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-panel w-full max-w-5xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden relative z-10 shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Import Expenses</h2>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mt-4 max-w-xl">
              {steps.map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className={cn(
                    "flex flex-col items-center justify-center relative z-10",
                    s.num <= step ? "text-primary" : "text-muted-foreground"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                      s.num < step ? "bg-primary border-primary text-primary-foreground" : 
                      s.num === step ? "bg-background border-primary text-primary shadow-[0_0_15px_rgba(34,197,94,0.3)]" : 
                      "bg-background border-white/10 text-muted-foreground"
                    )}>
                      {s.num < step ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn(
                      "h-[2px] flex-1 mx-2 rounded-full transition-colors duration-300",
                      s.num < step ? "bg-primary" : "bg-white/10"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 rounded-full h-10 w-10 flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-xl flex items-start gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}

          {step === 1 && (
            <div className="h-full flex flex-col items-center justify-center py-12">
              <div 
                className={cn(
                  "w-full max-w-2xl p-12 rounded-3xl border-2 border-transparent transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden",
                  isDragging 
                    ? "bg-primary/10 shadow-[0_0_30px_rgba(34,197,94,0.2)] scale-[1.02]" 
                    : "bg-white/5 hover:bg-white/10"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={cn("absolute inset-0 rounded-3xl pointer-events-none", !isDragging && "border-marching")} />
                <div className={cn(
                  "w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 relative z-10",
                  isDragging ? "bg-primary text-primary-foreground shadow-lg" : "bg-primary/20 text-primary"
                )}>
                  <UploadCloud className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-2 relative z-10">Upload Bank Export</h3>
                <p className="text-muted-foreground mb-2 max-w-md relative z-10">
                  Drag and drop your CSV file here, or click to browse. We'll automatically detect dates, amounts, and auto-categorize.
                </p>
                <p className="text-xs text-muted-foreground/50 mb-8 relative z-10">
                  Supports Chase, Bank of America, Wells Fargo, and most banks
                </p>
                
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  ref={fileInputRef}
                />
                <Button size="lg" className="px-8 font-bold relative z-10" onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                  Browse Files
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 h-full flex flex-col">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
                <div>
                  <h3 className="text-2xl font-bold">Review Data</h3>
                  <p className="text-muted-foreground mt-1">Make sure everything looks correct before categorization.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                  <div className="flex gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
                    <div className="px-3">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Items</div>
                      <div className="text-xl font-bold">{expenses.length}</div>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="px-3">
                      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total</div>
                      <div className="text-xl font-bold text-emerald-400">{formatCurrency(totalAmount)}</div>
                    </div>
                  </div>
                  <Button onClick={() => setStep(3)} className="gap-2 h-14 px-6 text-lg font-bold shadow-lg shadow-primary/20">
                    Continue <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden glass-panel flex-1 flex flex-col min-h-[400px]">
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-xl z-10">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Date</th>
                        <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Description</th>
                        <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {expenses.slice(0, 15).map((e, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-foreground/80 font-medium">{e.date}</td>
                          <td className="px-6 py-4 truncate max-w-[300px] text-foreground">{e.description}</td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-400">{formatCurrency(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {expenses.length > 15 && (
                  <div className="p-4 text-center text-sm font-medium text-muted-foreground bg-white/5 border-t border-white/10">
                    + {expenses.length - 15} more rows
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 h-full flex flex-col">
              <div className="flex justify-between items-end shrink-0">
                <div>
                  <h3 className="text-2xl font-bold">Review Categories</h3>
                  <p className="text-muted-foreground mt-1">We've auto-categorized where possible. Review and adjust.</p>
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={createMutation.isPending} 
                  className="gap-2 h-14 px-8 text-lg font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-shadow"
                >
                  {createMutation.isPending ? "Saving..." : "Save Expenses"}
                </Button>
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden glass-panel flex-1 flex flex-col min-h-[400px]">
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-xl z-10">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Date</th>
                        <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs w-1/3">Description</th>
                        <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs text-right">Amount</th>
                        <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs w-64">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {expenses.map((e, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-foreground/70 whitespace-nowrap font-medium">{e.date}</td>
                          <td className="px-6 py-4 text-foreground truncate max-w-[250px]" title={e.description}>{e.description}</td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-400">{formatCurrency(e.amount)}</td>
                          <td className="px-6 py-3">
                            <select 
                              className="w-full bg-black/40 border border-white/10 hover:border-white/20 hover:bg-black/60 rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer font-medium"
                              value={e.category}
                              onChange={(ev) => updateCategory(i, ev.target.value)}
                            >
                              {getAllCategories().map(cat => (
                                <option key={cat.id} value={cat.id} className="bg-card py-2">{cat.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center py-20 relative">
              {/* Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="confetti-piece"
                    style={{
                      backgroundColor: ['#22c55e', '#3b82f6', '#a855f7', '#eab308'][i % 4],
                      '--tx': `${(Math.random() - 0.5) * 600}px`,
                      '--ty': `${(Math.random() - 0.5) * 600}px`,
                      '--rot': `${Math.random() * 720}deg`,
                      animationDelay: `${Math.random() * 0.2}s`
                    } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-16 h-16 text-background" />
                </div>
              </div>
              <h3 className="text-4xl font-display font-bold mb-4">Import Complete!</h3>
              <p className="text-xl text-muted-foreground mb-10 text-center max-w-md">
                Successfully imported <span className="font-bold text-foreground">{expenses.length}</span> expenses. They are now organized by year and month.
              </p>
              <Button size="lg" className="h-14 px-10 text-lg font-bold relative z-10" onClick={onClose}>Return to Dashboard</Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
