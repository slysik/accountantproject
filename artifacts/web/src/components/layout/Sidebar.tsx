import { Link, useLocation } from "wouter";
import { Folder, ChevronRight, ChevronDown, Trash2, Home, Upload, HelpCircle, FileText } from "lucide-react";
import { useGetFolders, useDeleteYear, getGetFoldersQueryKey } from "@workspace/api-client-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

export function Sidebar({ onImportClick }: { onImportClick: () => void }) {
  const [location] = useLocation();
  const { data: folders } = useGetFolders();
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [confirmDeleteYear, setConfirmDeleteYear] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const deleteYear = useDeleteYear({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFoldersQueryKey() });
      }
    }
  });

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  return (
    <div className="w-72 border-r border-white/5 bg-card/30 backdrop-blur-xl h-screen flex flex-col pt-16">
      
      <div className="p-4 space-y-3 flex-shrink-0">
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm",
            location === "/" ? "bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
          )}
        >
          <Home className="w-5 h-5" />
          Dashboard
        </Link>
        <button 
          onClick={onImportClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm bg-primary text-primary-foreground hover:bg-emerald-400 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
      </div>

      <div className="px-4 py-2 mt-2">
        <div className="h-px w-full bg-white/5 mb-4" />
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Folders</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {folders?.map(folder => (
          <div key={folder.year} className="space-y-1">
            <div 
              className={cn(
                "group flex items-center justify-between px-2 py-2 rounded-xl cursor-pointer transition-colors",
                location.startsWith(`/year/${folder.year}`) && !location.includes('month') ? "bg-white/10" : "hover:bg-white/5"
              )}
              onClick={() => toggleYear(folder.year)}
            >
              <div className="flex items-center gap-2 flex-1">
                {expandedYears[folder.year] ? 
                  <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                }
                <Folder className="w-4 h-4 text-primary" fill="currentColor" fillOpacity={0.2} />
                <span className="font-medium text-sm text-foreground/90">{folder.year}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">${Math.round(folder.totalExpenses / 1000)}k</span>
                {confirmDeleteYear === folder.year ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="px-2 py-0.5 text-xs font-bold rounded bg-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-colors"
                      onClick={() => {
                        deleteYear.mutate({ data: { year: folder.year } });
                        setConfirmDeleteYear(null);
                      }}
                    >Yes</button>
                    <button
                      className="px-2 py-0.5 text-xs font-bold rounded bg-white/10 text-foreground/70 hover:bg-white/20 transition-colors"
                      onClick={() => setConfirmDeleteYear(null)}
                    >No</button>
                  </div>
                ) : (
                  <button 
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteYear(folder.year);
                    }}
                    title="Delete Year"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {expandedYears[folder.year] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-8 pr-2 space-y-1 py-1">
                    {folder.months.map(month => {
                      const isActive = location === `/year/${folder.year}/month/${month.month}`;
                      
                      // Calculate size of circle dot based on total relative to 10k
                      const dotSize = Math.max(4, Math.min(8, 4 + (month.total / 5000) * 4));
                      
                      return (
                        <Link
                          key={month.month}
                          href={`/year/${folder.year}/month/${month.month}`}
                          className={cn(
                            "flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors text-sm group",
                            isActive ? "bg-primary/20 text-primary font-medium" : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className={cn("rounded-full", isActive ? "bg-primary" : "bg-muted-foreground")}
                              style={{ width: dotSize, height: dotSize }} 
                            />
                            <span>{month.name}</span>
                          </div>
                          <span className={cn("text-xs transition-opacity opacity-70 group-hover:opacity-100", isActive ? "text-primary/80" : "text-muted-foreground")}>
                            {month.expenseCount}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {folders?.length === 0 && (
          <div className="px-4 py-8 flex flex-col items-center text-center">
            <div className="w-full p-6 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center gap-3 relative">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <Folder className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No data yet</p>
              <p className="text-xs text-muted-foreground/60">Import a CSV to begin</p>
              
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary animate-bounce font-bold text-xl">
                ↑
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 mt-auto border-t border-white/5 space-y-1">
        <Link 
          href="/trash"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm relative",
            location === "/trash" ? "bg-destructive/20 text-destructive-foreground" : "text-foreground/70 hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <Trash2 className="w-5 h-5" />
          Trash Bin
          <span className="absolute right-3 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        </Link>
        <button 
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm text-foreground/70 hover:bg-white/5 hover:text-foreground"
          onClick={() => window.open('https://github.com/vsawhney/accountantproject#readme', '_blank')}
        >
          <HelpCircle className="w-5 h-5" />
          Need Help?
        </button>
      </div>
    </div>
  );
}
