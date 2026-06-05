type SharedArtifactPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedArtifactPage({
  params,
}: SharedArtifactPageProps) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-mono text-xs tracking-[0.16em] text-slate-400 uppercase">
          Shared Artifact Placeholder
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Public artifact route reserved for token <span className="font-mono">{token}</span>.
        </p>
      </div>
    </main>
  );
}
