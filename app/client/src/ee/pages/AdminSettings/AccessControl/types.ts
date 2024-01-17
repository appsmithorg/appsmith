import type { IconNames } from "design-system";
import type { DebouncedFunc } from "lodash";
import type { ReactNode } from "react";

export interface BaseAclProps {
  id: string;
  name: string;
}

export type RoleProps = BaseAclProps & {
  autoCreated?: boolean;
  description?: string;
  tabs?: any;
  userPermissions?: string[];
  isSaving: boolean;
  isEditing?: boolean;
  isNew?: boolean;
};

export interface RoleEditProps {
  selected: RoleProps;
  onDelete: any;
}

export interface RoleTableResponse {
  data: RoleTable[];
  permissions: string[];
  name: string;
}

export type RoleTable = BaseAclProps & {
  permissions: number[];
  subRows?: RoleTable[];
  treeOpen?: boolean;
  type?: string;
};

export interface RoleTreeProps {
  tabData: any;
  expanded?: any;
  searchValue?: string;
  noData?: boolean;
  updateTabCount?: (val: number) => void;
  currentTabName: string;
  selected: RoleProps;
  showSaveModal: boolean;
  setShowSaveModal: (val: boolean) => void;
}

export type BaseGroupRoleProps = BaseAclProps & {
  autoCreated?: boolean;
  userPermissions?: string[];
  isProvisioned?: boolean;
};

export interface ActiveAllGroupsProps {
  activeGroups: Array<BaseGroupRoleProps>;
  allGroups?: Array<BaseGroupRoleProps>;
  activeOnly?: boolean;
  title?: string;
  searchValue?: string;
  addedAllGroups?: Array<BaseGroupRoleProps>;
  removedActiveGroups: Array<BaseGroupRoleProps>;
  onAddGroup?: (group: BaseGroupRoleProps) => void;
  onRemoveGroup: (group: BaseGroupRoleProps) => void;
  entityName: string;
}

export interface UsersInGroup {
  id: string;
  username: string;
  isProvisioned?: boolean;
}

export type GroupProps = BaseAclProps & {
  users: UsersInGroup[];
  roles: BaseGroupRoleProps[];
  allRoles: BaseGroupRoleProps[];
  userPermissions?: string[];
  isNew?: boolean;
  description?: string;
  isProvisioned?: boolean;
};

export interface GroupEditProps {
  selected: GroupProps;
  onDelete: any;
  isLoading: boolean;
}

export interface Permissions {
  roles: BaseGroupRoleProps[];
  allRoles: BaseGroupRoleProps[];
}

export interface ListingProps {
  data: any[];
  columns: any[];
  listMenuItems: any[];
  keyAccessor: string;
  isLoading: boolean;
  emptyState?: JSX.Element;
  listingType: string;
}

export interface InfiniteListingProps extends ListingProps {
  infiniteScroll: true;
  loadMore: () => void;
  hasMore: boolean;
}

export interface PageHeaderProps {
  buttonText?: string;
  searchPlaceholder: string;
  onButtonClick?: () => void;
  onSearch?: DebouncedFunc<(search: string) => void>;
  pageMenuItems: any[];
  title?: string;
  isHeaderEditable?: boolean;
  isEditingTitle?: boolean;
  onEditTitle?: (name: string) => void;
  isEditingDesc?: boolean;
  onEditDesc?: (desc: string) => void;
  searchValue: string;
  disableButton?: boolean;
  description?: string;
}

export interface GroupsForUser {
  groups: BaseGroupRoleProps[];
  allGroups: BaseGroupRoleProps[];
}

export interface PermissionsForUser {
  roles: BaseGroupRoleProps[];
  allRoles: BaseGroupRoleProps[];
}

export type UserProps = BaseAclProps & {
  groups: BaseGroupRoleProps[];
  roles: BaseGroupRoleProps[];
  allGroups: BaseGroupRoleProps[];
  allRoles: BaseGroupRoleProps[];
  username: string;
  userPermissions?: string[];
  photoId?: string;
  isProvisioned?: boolean;
};

export interface UserEditProps {
  selectedUser: UserProps;
  onDelete: (id: string) => void;
  searchPlaceholder: string;
  isLoading: boolean;
}

export interface UpdateRoleData {
  type: string;
  id: string;
  name: string;
  permissions: number[];
}

export interface TabProps {
  key: string;
  title: string;
  count?: number;
  panelComponent?: JSX.Element;
}

export interface MenuItemProps {
  icon?: IconNames;
  className?: string;
  onSelect?: (e: React.MouseEvent, ...rest: any) => void;
  text: string;
  label?: ReactNode;
  href?: string;
}

export enum ListingType {
  ROLES = "permissionGroups",
  GROUPS = "userGroups",
  USERS = "users",
}
