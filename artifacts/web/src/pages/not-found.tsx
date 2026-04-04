import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8">
      <h1 className="text-6xl font-display font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-emerald-400 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
