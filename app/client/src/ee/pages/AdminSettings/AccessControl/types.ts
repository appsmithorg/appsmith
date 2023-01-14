import { MenuItemProps } from "design-system";
import { DebouncedFunc } from "lodash";

export type BaseAclProps = { id: string; name: string };

export type RoleProps = BaseAclProps & {
  autoCreated?: boolean;
  description?: string;
  tabs?: any;
  userPermissions?: string[];
  isSaving: boolean;
  isEditing?: boolean;
  isNew?: boolean;
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
  selected: RoleProps;
  showSaveModal: boolean;
  setShowSaveModal: (val: boolean) => void;
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
  isNew?: boolean;
  description?: string;
};

export type GroupEditProps = {
  selected: GroupProps;
  onDelete: any;
  isLoading: boolean;
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
  listingType: string;
};

export type PageHeaderProps = {
  buttonText?: string;
  searchPlaceholder: string;
  onButtonClick?: () => void;
  onSearch?: DebouncedFunc<(search: string) => void>;
  pageMenuItems: MenuItemProps[];
  title?: string;
  isHeaderEditable?: boolean;
  isEditingTitle?: boolean;
  onEditTitle?: (name: string) => void;
  isEditingDesc?: boolean;
  onEditDesc?: (desc: string) => void;
  searchValue: string;
  disableButton?: boolean;
  description?: string;
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
};

export type UpdateRoleData = {
  type: string;
  id: string;
  name: string;
  permissions: number[];
};

export enum ListingType {
  ROLES = "permissionGroups",
  GROUPS = "userGroups",
  USERS = "users",
}
