import { UploadCloud, FileText, PieChart, CheckCircle, ShieldCheck, Zap, FileDown, Upload } from "lucide-react";
import { useImport } from "@/App";
import { useAuth } from "@workspace/replit-auth-web";

export function Dashboard() {
  const openImport = useImport();
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 max-w-5xl mx-auto text-center space-y-12 page-enter">
      {/* Welcome Hero */}
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Let's get your books in order. Follow these simple steps to automate your Schedule C.
        </p>
      </div>

      {/* 3 Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-4xl font-display font-bold text-white/5 group-hover:text-primary/10 transition-colors">1</div>
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-1">Import your first CSV</h3>
          <p className="text-sm text-muted-foreground">Upload your bank statement and let us do the heavy lifting.</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-4xl font-display font-bold text-white/5 group-hover:text-blue-500/10 transition-colors">2</div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
            <PieChart className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">Review auto-categorization</h3>
          <p className="text-sm text-muted-foreground">We automatically map transactions to IRS tax categories.</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-4xl font-display font-bold text-white/5 group-hover:text-purple-500/10 transition-colors">3</div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <FileDown className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">Export for tax time</h3>
          <p className="text-sm text-muted-foreground">Generate clean spreadsheets ready for your accountant.</p>
        </div>
      </div>

      {/* Main CTA */}
      <div className="w-full max-w-3xl mx-auto pt-4">
        <button 
          onClick={openImport}
          className="w-full stat-card glow-border p-10 rounded-3xl flex flex-col items-center gap-6 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <UploadCloud className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
          </div>
          <div>
            <h3 className="font-bold text-3xl mb-2 text-foreground">Import CSV</h3>
            <p className="text-muted-foreground text-lg mb-4">Drop your bank statement here to start</p>
          </div>
        </button>
      </div>

      {/* Key stats strip */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 pb-8">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-sm">
          <Zap className="w-4 h-4 text-yellow-500" /> 25+ IRS Categories
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-blue-500" /> CSV from any bank
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-sm">
          <FileText className="w-4 h-4 text-purple-500" /> Excel & QBO Export
        </div>
      </div>
    </div>
  );
}
