import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";

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

export type WorkspaceUserRoles = {
  id: string;
  name: string;
  description: string;
  entityType: string;
  entityName: string;
  entityId: string;
  autoCreated: boolean;
};

export type WorkspaceUser = {
  name: string;
  username: string;
  userId: string;
  permissionGroupId: string;
  permissionGroupName: string;
  isDeleting: boolean;
  isChangingRole: boolean;
  photoId?: string;
  roles: WorkspaceUserRoles[];
};

export type Workspaces = {
  applications: ApplicationPayload[];
  workspace: Workspace;
  users: WorkspaceUser[];
};
