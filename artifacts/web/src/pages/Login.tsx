import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/Button";
import { Diamond, ShieldCheck, PieChart, FileSpreadsheet } from "lucide-react";
import { Redirect } from "wouter";

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/" />;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background page-enter">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-background">
        <div className="absolute inset-0 mesh-grid opacity-30 animate-bg-drift" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-2xl p-8">
        <div className="glass-panel glow-border p-12 rounded-[2rem] flex flex-col items-center text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-xl shadow-primary/30 mb-8 ring-1 ring-white/20">
            <Diamond className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">Accountant's Friend</h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-md">Intelligent expense tracking & categorization for self-employed professionals.</p>

          <div className="flex flex-wrap justify-center gap-3 w-full mb-12">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-md">
              <PieChart className="w-4 h-4 text-primary" />
              <span>IRS Schedule C</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-md">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>Smart CSV import</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Excel & QBO</span>
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col items-center">
            <Button 
              onClick={login} 
              size="lg" 
              className="w-full py-7 text-lg rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/10 border-0 font-bold transition-transform hover:scale-[1.02]"
            >
              Sign in to continue
            </Button>
            <p className="text-xs text-muted-foreground/60 mt-4 tracking-wide uppercase font-medium">
              Trusted by self-employed professionals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
