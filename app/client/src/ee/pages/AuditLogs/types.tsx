import type { SelectOptionProps } from "design-system";

export interface UserLogType {
  id: string;
  email: string;
  name: string;
}

/**
 * @property {string} id It is the resourceId.
 */
export interface ResourceType {
  id: string;
  type: string;
  name: string;
}

export interface AppGitType {
  branch: string;
  default: string;
}

export interface ApplicationType {
  id: string;
  name: string;
  git?: AppGitType;
}

export interface WorkspaceType {
  id: string;
  name: string;
  destination?: WorkspaceType;
}

export interface MetadataType {
  ipAddress?: string;
  appsmithVersion: string;
  createdAt?: string;
}

export interface PageType {
  id: string;
  name: string;
}

export interface AuthenticationType {
  mode: string;
  action: string;
}

export interface UserGroupType {
  invitedUsers?: string[];
  removedUsers?: string[];
}

export interface PermissionGroupType {
  assignedUsers?: string[];
  unAssignedUsers?: string[];
  assignedUserGroups?: string[];
  unAssignedUserGroups?: string[];
}

export interface EnvironmentType {
  id: string;
  name: string;
}

export interface DatasourceType {
  id: string;
  name: string;
}

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
 * @property {EnvironmentType} environment contains the environment the log was generated for e.g datasource created in environment #envname
 * @property {DatasourceType} datasource contains the datasource information
 *
 */
export interface AuditLogType {
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
  environment?: EnvironmentType;
  datasource?: DatasourceType;
}

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
 * @param {string} environment The current environment the log was generated i.e. log.envionment.name
 *
 */
export interface DescriptionDataType {
  action: string;
  application: string;
  resource: string;
  workspace: string;
  page: string;
  userName: string;
  userEmail: string;
  environment: string;
}

export type DropdownOptionProps = Partial<SelectOptionProps>;
