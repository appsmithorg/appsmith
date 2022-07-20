export type PermissionTableResponse = {
  data: PermissionTable[];
  permission: string[];
  name: string;
};

export interface PermissionTable {
  id: string;
  name: string;
  permission: number[];
  subRows?: PermissionTable[];
  treeOpen?: boolean;
}
