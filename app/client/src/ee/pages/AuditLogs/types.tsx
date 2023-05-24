import type { SelectOptionProps } from "design-system";

export type UserLogType = {
  id: string;
  email: string;
  name: string;
};

/**
 * @property {string} id It is the resourceId.
 */
export type ResourceType = {
  id: string;
  type: string;
  name: string;
};

export type AppGitType = {
  branch: string;
  default: string;
};

export type ApplicationType = {
  id: string;
  name: string;
  git?: AppGitType;
};

export type WorkspaceType = {
  id: string;
  name: string;
  destination?: WorkspaceType;
};

export type MetadataType = {
  ipAddress?: string;
  appsmithVersion: string;
  createdAt?: string;
};

export type PageType = {
  id: string;
  name: string;
};

export type AuthenticationType = {
  mode: string;
  action: string;
};

export type UserGroupType = {
  invitedUsers?: string[];
  removedUsers?: string[];
};

export type PermissionGroupType = {
  assignedUsers?: string[];
  unAssignedUsers?: string[];
  assignedUserGroups?: string[];
  unAssignedUserGroups?: string[];
};

/**
 * @property {string} id The id of the log in the database, aka "cursor".
 * @property {string} event is event name in the format <resource>.<action>
 *   (e.g. datasource.created)
 * @property {string} timestamp is the timestamp of the event. Displayed as local date string.
 * @property {UserLogType} user contains the information about the user who initiated the event.
 * @property {ResourceType} resource contains the resource information for the event.
 * @property {ApplicationType} application contains the application information where the event took place.
 * @property {WorkspaceType} workspace contains the workspace information where the event took place.
 * @property {MetadataType} metadata contains the meta information about the server/database.
 * @property {boolean} isOpen tracks which logs were opened earlier by user. UI only. Not shown to user.
 * @property {PageType} page contains page level data
 * @property {string[]} userPermissions contains userPermissions. BE only. Not shown to user.
 * @property {AuthenticationType} authentication contains information about the authentication setting change.
 *   It is a special case for `instance_setting.updated` event.
 * @property {string[]} invitedUsers contains list of users that are invited.
 */
export type AuditLogType = {
  id: string;
  event: string;
  timestamp: string;
  user: UserLogType;
  metadata: MetadataType;
  resource?: ResourceType;
  application?: ApplicationType;
  workspace?: WorkspaceType;
  instanceSettings?: any[];
  isOpen?: boolean;
  page?: PageType;
  userPermissions?: string[];
  authentication?: AuthenticationType;
  invitedUsers?: string[];
  userGroup?: UserGroupType;
  permissionGroup?: PermissionGroupType;
};

/**
 * @param {string} action examples: "created", "updated", "viewed"...
 * @param {string} application The name of the application;
 * this is used for any sub-application level events
 * @param {string} resource The name of the resource.
 * This represents the current resource that is being logged e.g. page etc.
 * @param {string} workspace The name of the workspace.
 * This is used for application and datasource events.
 * @param {string} page The name of the page.
 * This is used for queries and other sub-page level events e.g. query.
 * @param {string} userName The name of the user. log.user.name
 * @param {string} userEmail The email of the user. log.user.email
 */
export type DescriptionDataType = {
  action: string;
  application: string;
  resource: string;
  workspace: string;
  page: string;
  userName: string;
  userEmail: string;
};

export type DropdownOptionProps = Partial<SelectOptionProps>;
