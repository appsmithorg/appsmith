import { ApplicationPayload } from "./ReduxActionConstants";

export type OrgRole = {
  id: string;
  name: string;
  displayName?: string;
  isDefault?: boolean;
};

export type Org = {
  id: string;
  name: string;
  website?: string;
  email?: string;
  logoUrl?: string;
  uploadProgress?: number;
  userPermissions?: string[];
};

export type OrgUser = {
  username: string;
  name: string;
  roleName: string;
  isDeleting: boolean;
  isChangingRole: boolean;
};

export type Organization = {
  applications: ApplicationPayload[];
  organization: Org;
  userRoles: OrgUser[];
};
