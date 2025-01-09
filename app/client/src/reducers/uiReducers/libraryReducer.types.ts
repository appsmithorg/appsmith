import type { JSLibrary } from "../../workers/common/JSLibrary";

export enum InstallState {
  Queued,
  Installing,
  Failed,
  Success,
}

export interface LibraryState {
  installationStatus: Record<string, InstallState>;
  installedLibraries: JSLibrary[];
  isInstallerOpen: boolean;
}
