export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-md rounded-3xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold">Google sign-in failed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The OAuth callback could not be exchanged for a Supabase session.
          Check the browser console and your Supabase Auth configuration, then
          try again.
        </p>
      </div>
    </main>
  );
}
