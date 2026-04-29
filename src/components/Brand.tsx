import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 text-sm font-semibold", className)}
    >
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground text-background">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="tracking-tight">Founder Copilot</span>
    </Link>
  );
}

export function NavBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-foreground/10 bg-background/80 px-6 py-4 backdrop-blur">
      <Brand />
      <span className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/60">
        India · v0
      </span>
    </header>
  );
}
