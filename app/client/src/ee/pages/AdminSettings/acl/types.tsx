export type RoleTableResponse = {
  data: RoleTable[];
  permission: string[];
  name: string;
};

export interface RoleTable {
  id: string;
  name: string;
  permission: number[];
  subRows?: RoleTable[];
  treeOpen?: boolean;
}
