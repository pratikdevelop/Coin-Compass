import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export function SignInPrompt({ what }: { what: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">Sign in to save {what} to your account.</p>
      <Link
        to="/auth"
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <LogIn className="size-4" /> Sign in or create an account
      </Link>
    </div>
  );
}
