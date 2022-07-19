import { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";

export type WorkspaceRole = {
  id: string;
  name: string;
  displayName?: string;
  isDefault?: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  website?: string;
  email?: string;
  logoUrl?: string;
  uploadProgress?: number;
  userPermissions?: string[];
};

export type WorkspaceUser = {
  username: string;
  name: string;
  roleName: string;
  isDeleting: boolean;
  isChangingRole: boolean;
};

export type Workspaces = {
  applications: ApplicationPayload[];
  workspace: Workspace;
  userRoles: WorkspaceUser[];
};
