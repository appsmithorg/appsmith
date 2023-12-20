type ID = string;

export interface Package {
  id: ID;
  name: string; // Name of the package.
  icon: string;
  color: string;
  workspaceId: ID; // ID of the workspace where the package is created.
  description?: string; // Description that will show up in package installation section.
  modifiedBy: string;
  modifiedAt: string;
  userPermissions: string[];
}

export const DEFAULT_PACKAGE_ICON = "package";

export type PackageMetadata = Package;
