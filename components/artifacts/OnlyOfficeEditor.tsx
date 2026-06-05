type OnlyOfficeEditorProps = {
  artifactId: string;
};

export function OnlyOfficeEditor({ artifactId }: OnlyOfficeEditorProps) {
  return (
    <section className="flex h-[calc(100vh-74px)] items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-5xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="font-mono text-xs tracking-[0.16em] text-slate-400 uppercase">
          ONLYOFFICE Placeholder
        </p>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">
          Artifact {artifactId}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Phase 0 giữ route editor riêng. Wiring signed config và callback sẽ được nối ở Phase 1.
        </p>
      </div>
    </section>
  );
}
