export interface WorkspaceRole {
  id: string;
  name: string;
  displayName?: string;
  isDefault?: boolean;
}

export interface Workspace extends WorkspaceToken {
  id: string;
  name: string;
  website?: string;
  email?: string;
  logoUrl?: string;
  uploadProgress?: number;
  userPermissions?: string[];
}

export interface WorkspaceUserRoles {
  id?: string;
  name?: string;
  description?: string;
  entityType: ENTITY_TYPE;
  entityName?: string;
  entityId?: string;
  autoCreated: boolean;
}

export interface WorkspaceUser {
  name: string;
  username: string;
  userId: string;
  permissionGroupId: string;
  permissionGroupName: string;
  isDeleting: boolean;
  isChangingRole: boolean;
  photoId?: string;
  roles: WorkspaceUserRoles[];
}

export enum ENTITY_TYPE {
  WORKSPACE = "Workspace",
  APPLICATION = "Application",
}

export interface WorkspaceToken {
  userId?: string;
  token?: string;
}
