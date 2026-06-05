export type OnlyOfficeConfigInput = {
  artifactId: string;
  title: string;
  fileType: string;
};

export function buildOnlyOfficeEditorUrl(artifactId: string) {
  return `/api/onlyoffice/config/${artifactId}`;
}

export function buildOnlyOfficeConfig(input: OnlyOfficeConfigInput) {
  return {
    document: {
      fileType: input.fileType,
      key: input.artifactId,
      title: input.title,
    },
    documentType: "word",
    editorConfig: {
      callbackUrl: `/api/onlyoffice/callback/${input.artifactId}`,
    },
  };
}
