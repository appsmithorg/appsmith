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
export const ENTER_GROUP_NAME = () => `Enter group name`;
export const ACTIVE_ENTITIES = (entity: string) => `Active ${entity}s`;
export const ALL_ENTITIES = (entity: string) => `All ${entity}s`;
export const ADD_ENTITY = (entity: string) => `Add ${entity}`;
export const REMOVE_ENTITY = (entity: string) => `Remove ${entity}`;
export const REMOVE_USER = () => `Remove`;
export const ACL_DELETE = () => `Delete`;
export const ACL_CLONE = () => `Clone`;
export const ACL_RENAME = () => `Rename`;
export const ACL_EDIT = () => `Edit`;
export const NO_USERS_MESSAGE = () => `There are no users added to this group`;
export const NO_ROLES_MESSAGE = () => `There are no roles assigned yet. Choose from the list of
roles below to add them.`;
export const BOTTOM_BAR_SAVE_MESSAGE = () => `These changes will affect the users ability to interact with various
aspects of the application. Are you sure?`;
export const BOTTOM_BAR_SAVE_BTN = () => `Save Changes`;
export const BOTTOM_BAR_CLEAR_BTN = () => `Clear`;
export const ACL_INVITE_MODAL_TITLE = () => `Add Users`;
export const ACL_INVITE_MODAL_MESSAGE = () =>
  `Add email id(s) and select group(s)`;
/*export const INVITE_USERS_MESSAGE = () => `Invite users or user groups`;
export const INVITE_USERS_PLACEHOLDER = () => `Enter email address or group`;
export const INVITE_USERS_VALIDATION_EMAIL_LIST = () =>
  `Invalid Email address(es) or user group(s) found`;*/

// Audit logs begin
export const TRY_AGAIN_WITH_YOUR_FILTER = () => "Try again with your filter";
// Audit logs end
