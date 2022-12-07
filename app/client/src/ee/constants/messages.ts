export * from "ce/constants/messages";

export const SHOW_LESS_GROUPS = () => `show less`;
export const SHOW_MORE_GROUPS = (count: number) => `show ${count} more`;
export const ADD_USERS = () => `Add Users`;
export const ADD_GROUP = () => `Add Group`;
export const ADD_ROLE = () => `Add Role`;
export const SEARCH_PLACEHOLDER = () => `Search`;
export const SEARCH_GROUPS_PLACEHOLDER = () => `Search groups`;
export const SEARCH_ROLES_PLACEHOLDER = () => `Search roles`;
export const SEARCH_USERS_PLACEHOLDER = () => `Search Users`;
export const ACL_DELETED_SUCCESS = () => `Deleted successfully`;
export const ACL_CLONED_SUCCESS = () => `Cloned successfully`;
export const SUCCESSFULLY_SAVED = () => `Saved successfully`;
export const ENTER_ENTITY_NAME = () => `Enter name`;
export const ENTER_ENTITY_DESC = () =>
  `Enter description (max characters: 140)`;
export const ACTIVE_ENTITIES = (entity: string) => `Active ${entity}s`;
export const ALL_ENTITIES = (entity: string) => `All ${entity}s`;
export const ADD_ENTITY = (entity: string) => `Add ${entity}`;
export const REMOVE_ENTITY = (entity: string) => `Remove ${entity}`;
export const REMOVE_USER = () => `Remove`;
export const ACL_DELETE = () => `Delete`;
export const ACL_CLONE = () => `Clone`;
export const ACL_RENAME = () => `Rename`;
export const ACL_EDIT = () => `Edit`;
export const ACL_EDIT_DESC = () => `Edit Description`;
export const NO_USERS_MESSAGE = () => `There are no users added to this group`;
export const NO_ACTIVE_ENTITIES_MESSAGE = (
  entity: string,
) => `There are no ${entity}s assigned. Choose from the list of
${entity}s below to add them.`;
export const EMPTY_ENTITIES_MESSAGE = (entity: string) =>
  `There are no ${entity}s created.`;
export const BOTTOM_BAR_SAVE_MESSAGE = () => `These changes will affect the users ability to interact with various
aspects of the application. Are you sure?`;
export const BOTTOM_BAR_SAVE_BTN = () => `Save Changes`;
export const BOTTOM_BAR_CLEAR_BTN = () => `Clear`;
export const ACL_INVITE_MODAL_TITLE = () => `Add Users`;
export const ACL_INVITE_MODAL_MESSAGE = () =>
  `Add email id(s) and select group(s)`;
/*export const INVITE_USERS_MESSAGE = () => `Invite users or groups`;
export const INVITE_USERS_PLACEHOLDER = () => `Enter email address or group`;
export const INVITE_USERS_VALIDATION_EMAIL_LIST = () =>
  `Invalid Email address(es) or user group(s) found`;*/

// Audit logs begin
export const TRY_AGAIN_WITH_YOUR_FILTER = () => "Try again with your filter";
export const LOADING = () => "Loading...";
export const RESOURCE_ID_LABEL = () => "Resource ID";
export const RESOURCE_ID_PLACEHOLDER = () => "Type or paste resource id";
export const EVENTS_LABEL = () => "Events";
export const EVENTS_PLACEHOLDER = () => "Select events";
export const USERS_LABEL = () => "Users";
export const USERS_PLACEHOLDER = () => "Select users";
export const DATE_RANGE_LABEL = () => "Date Range";
export const CLEAR_ALL = () => "clear all";
export const ON_COPY_CONTENT = (input: string) =>
  `Audit log with id [${input}] copied to clipboard`;
export const EVENT_DESCRIPTION_LABEL = () => "Event description";
export const USER_LABEL = () => "User";
export const DATE_LABEL = () => "Date";
export const REFRESH = () => "REFRESH";
// Audit logs end
