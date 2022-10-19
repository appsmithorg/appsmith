import { MenuItemProps } from "design-system";
import { DebouncedFunc } from "lodash";

export type BaseAclProps = { id: string; name: string };

export type RoleProps = BaseAclProps & {
  /* isEditing: boolean;
     isDeleting: boolean;
     isAppsmithProvided: boolean; */
  description?: string;
  new?: boolean;
  tabs?: any;
  userPermissions?: string[];
};

export type RoleEditProps = {
  selected: RoleProps;
  onDelete: any;
  isLoading: boolean;
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
  entityName: string;
};

export type UsersInGroup = {
  id: string;
  username: string;
};

export type GroupProps = BaseAclProps & {
  users: UsersInGroup[];
  new?: boolean;
  roles: BaseAclProps[];
  allRoles: BaseAclProps[];
};

export type GroupEditProps = {
  selected: GroupProps;
  onDelete: any;
  isLoading: boolean;
  isSaving: boolean;
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
  roleName?: string;
};

export type UserEditProps = {
  selectedUser: UserProps;
  onDelete: (id: string) => void;
  searchPlaceholder: string;
  isLoading: boolean;
  isSaving: boolean;
};
