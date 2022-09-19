import { MenuItemProps } from "design-system";
import { DebouncedFunc } from "lodash";

export type RoleProps = {
  // isEditing: boolean;
  // isDeleting: boolean;
  id: string;
  name: string;
  description?: string;
  // isAppsmithProvided: boolean;
  new?: boolean;
};

export type RoleEditProps = {
  selected: RoleProps;
  onClone: any;
  onDelete: any;
  isLoading: boolean;
};

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
  type?: string;
}

export type RoleTreeProps = {
  tabData: any;
  expanded?: any;
  searchValue?: string;
  noData?: boolean;
};

export type ActiveAllGroupsProps = {
  activeGroups: Array<any>;
  allGroups?: Array<any>;
  activeOnly?: boolean;
  title?: string;
  searchValue?: string;
  addedAllGroups?: Array<any>;
  removedActiveGroups: Array<any>;
  onAddGroup?: (group: any) => void;
  onRemoveGroup: (group: any) => void;
};

export type GroupProps = {
  isEditing: boolean;
  isDeleting: boolean;
  name: string;
  id: string;
  allRoles: string[];
  activePermissions: string[];
  users: UserProps[];
  new?: boolean;
};

export type GroupEditProps = {
  selected: GroupProps;
  onDelete: any;
  // onClone: any;
  isLoading: boolean;
  isSaving: boolean;
};

export type Permissions = {
  activePermissions: string[];
  allRoles: string[];
};

export type ListingProps = {
  data: any[];
  columns: any[];
  listMenuItems: MenuItemProps[];
  keyAccessor: string;
  isLoading: boolean;
};

export type PageHeaderProps = {
  buttonText?: string;
  searchPlaceholder: string;
  onButtonClick?: () => void;
  onSearch?: DebouncedFunc<(search: string) => void>;
  pageMenuItems: MenuItemProps[];
  title?: string;
  isTitleEditable?: boolean;
  isEditingTitle?: boolean;
  onEditTitle?: (name: string) => void;
};

export type UserProps = {
  isChangingRole: boolean;
  isDeleting: boolean;
  name: string;
  allGroups: Array<string>;
  allRoles: Array<string>;
  username: string;
  userId: string;
  roleName?: string;
};

export type UserEditProps = {
  selectedUser: UserProps;
  onDelete: (userId: string) => void;
  searchPlaceholder: string;
  isLoading: boolean;
};
