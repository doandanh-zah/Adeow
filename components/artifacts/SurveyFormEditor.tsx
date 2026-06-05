type SurveyFormEditorProps = {
  artifactId: string;
};

export function SurveyFormEditor({ artifactId }: SurveyFormEditorProps) {
  return (
    <section className="flex h-[calc(100vh-74px)] items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-5xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="font-mono text-xs tracking-[0.16em] text-slate-400 uppercase">
          Survey Placeholder
        </p>
        <p className="mt-3 text-sm text-slate-500">Artifact {artifactId}</p>
      </div>
    </section>
  );
}
