import type { ReactNode } from "react";

type ArtifactEditorShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function ArtifactEditorShell({
  title,
  subtitle,
  children,
}: ArtifactEditorShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-sm font-semibold tracking-[0.08em] text-slate-900 uppercase">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </header>
      <div className="flex-1">{children}</div>
    </main>
  );
}
