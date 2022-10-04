import { MenuItemProps } from "design-system";
import { DebouncedFunc } from "lodash";

export type BaseAclProps = { id: string; name: string };

export type RoleProps = BaseAclProps & {
  /* isEditing: boolean;
     isDeleting: boolean;
     isAppsmithProvided: boolean; */
  description?: string;
  new?: boolean;
};

export type RoleEditProps = {
  selected: RoleProps;
  onDelete: any;
  isLoading: boolean;
};

export type RoleTableResponse = {
  data: RoleTable[];
  permission: string[];
  name: string;
};

export type RoleTable = BaseAclProps & {
  permission: number[];
  subRows?: RoleTable[];
  treeOpen?: boolean;
  type?: string;
};

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
  entityName: string;
};

export type GroupProps = BaseAclProps & {
  isEditing: boolean;
  isDeleting: boolean;
  users: UserProps[];
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

export type UserProps = {
  isChangingRole: boolean;
  isDeleting: boolean;
  name: string;
  groups: BaseAclProps[];
  roles: BaseAclProps[];
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
