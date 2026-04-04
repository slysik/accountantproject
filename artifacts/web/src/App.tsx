import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import NotFound from "@/pages/not-found";
import { useState, createContext, useContext } from "react";

// Components
import { TopNav } from "./components/layout/TopNav";
import { Sidebar } from "./components/layout/Sidebar";
import { ImportWizard } from "./components/wizard/ImportWizard";

// Pages
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { MonthView } from "./pages/MonthView";
import { YearView } from "./pages/YearView";
import { Trash } from "./pages/Trash";

const queryClient = new QueryClient();

// Context so any child can trigger the import wizard
const ImportContext = createContext<() => void>(() => {});
export const useImport = () => useContext(ImportContext);

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  const openImport = () => setShowWizard(true);

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center animate-pulse" />
      <span className="text-muted-foreground font-medium">Loading…</span>
    </div>
  );
  
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ImportContext.Provider value={openImport}>
      <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
        <TopNav />
        <Sidebar onImportClick={openImport} />
        <main className="flex-1 overflow-y-auto pt-16">
          {children}
        </main>
        {showWizard && <ImportWizard onClose={() => setShowWizard(false)} />}
      </div>
    </ImportContext.Provider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/year/:year">
        <ProtectedLayout><YearView /></ProtectedLayout>
      </Route>
      <Route path="/year/:year/month/:month">
        <ProtectedLayout><MonthView /></ProtectedLayout>
      </Route>
      <Route path="/trash">
        <ProtectedLayout><Trash /></ProtectedLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
