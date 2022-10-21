import { MenuItemProps } from "design-system";
import { DebouncedFunc } from "lodash";

export type BaseAclProps = { id: string; name: string };

export type RoleProps = BaseAclProps & {
  /* isAppsmithProvided: boolean; */
  description?: string;
  tabs?: any;
  userPermissions?: string[];
};

export type RoleEditProps = {
  selected: RoleProps;
  onDelete: any;
  isLoading: boolean;
  isNew: boolean;
};

export type RoleTableResponse = {
  data: RoleTable[];
  permissions: string[];
  name: string;
};

export type RoleTable = BaseAclProps & {
  permissions: number[];
  subRows?: RoleTable[];
  treeOpen?: boolean;
  type?: string;
};

export type RoleTreeProps = {
  tabData: any;
  expanded?: any;
  searchValue?: string;
  noData?: boolean;
  updateTabCount?: (val: number) => void;
  currentTabName: string;
  roleId: string;
};

export type ActiveAllGroupsProps = {
  activeGroups: Array<BaseAclProps>;
  allGroups?: Array<BaseAclProps>;
  activeOnly?: boolean;
  title?: string;
  searchValue?: string;
  addedAllGroups?: Array<any>;
  removedActiveGroups: Array<any>;
  onAddGroup?: (group: BaseAclProps) => void;
  onRemoveGroup: (group: BaseAclProps) => void;
  entityName: string;
};

export type UsersInGroup = {
  id: string;
  username: string;
};

export type GroupProps = BaseAclProps & {
  users: UsersInGroup[];
  roles: BaseAclProps[];
  allRoles: BaseAclProps[];
  userPermissions?: string[];
};

export type GroupEditProps = {
  selected: GroupProps;
  onDelete: any;
  isLoading: boolean;
  isSaving: boolean;
  isNew: boolean;
};

export type Permissions = {
  roles: BaseAclProps[];
  allRoles: BaseAclProps[];
};

export type ListingProps = {
  data: any[];
  columns: any[];
  listMenuItems: MenuItemProps[];
  keyAccessor: string;
  isLoading: boolean;
  emptyState?: JSX.Element;
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
  searchValue: string;
};

export type GroupsForUser = {
  groups: BaseAclProps[];
  allGroups: BaseAclProps[];
};

export type PermissionsForUser = {
  roles: BaseAclProps[];
  allRoles: BaseAclProps[];
};

export type UserProps = BaseAclProps & {
  groups: BaseAclProps[];
  roles: BaseAclProps[];
  allGroups: BaseAclProps[];
  allRoles: BaseAclProps[];
  username: string;
  userPermissions?: string[];
};

export type UserEditProps = {
  selectedUser: UserProps;
  onDelete: (id: string) => void;
  searchPlaceholder: string;
  isLoading: boolean;
  isSaving: boolean;
};

export type UpdateRoleData = {
  type: string;
  id: string;
  name: string;
  permissions: number[];
};
