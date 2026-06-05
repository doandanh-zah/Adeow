import { ArtifactEditorShell } from "@/components/artifacts/ArtifactEditorShell";
import { OnlyOfficeEditor } from "@/components/artifacts/OnlyOfficeEditor";

type ArtifactPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ArtifactPage({ params }: ArtifactPageProps) {
  const { id } = await params;

  return (
    <ArtifactEditorShell
      title="Artifact Editor"
      subtitle="Dedicated route reserved for ONLYOFFICE-backed documents."
    >
      <OnlyOfficeEditor artifactId={id} />
    </ArtifactEditorShell>
  );
}
