export function assertOnlyOfficeSecret() {
  if (!process.env.ONLYOFFICE_JWT_SECRET) {
    throw new Error("Missing ONLYOFFICE_JWT_SECRET.");
  }
}
