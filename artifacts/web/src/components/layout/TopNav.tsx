import { useAuth } from "@workspace/replit-auth-web";
import { LogOut, Diamond } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TopNav() {
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
      {/* Gradient Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse-glow" />
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-primary/20">
            <Diamond className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        <h1 className="font-display font-bold text-lg tracking-wide text-foreground">
          Accountant's <span className="text-primary">Friend</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {user?.profileImageUrl && (
            <div className="relative">
              <img src={user.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full ring-2 ring-white/10" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
          )}
          {!user?.profileImageUrl && (
            <div className="relative w-8 h-8 rounded-full bg-secondary flex items-center justify-center ring-2 ring-white/10">
              <span className="text-xs font-bold">{user?.firstName?.charAt(0) || 'A'}</span>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground/80 hidden sm:block">
            {user?.firstName || user?.email || 'Accountant'}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={logout} 
          title="Log out"
          className="hover:bg-destructive/10 hover:text-destructive group transition-colors duration-300"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
        </Button>
      </div>
    </div>
  );
}
