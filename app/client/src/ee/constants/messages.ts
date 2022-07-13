export * from "ce/constants/messages";

export const SHOW_LESS_GROUPS = () => `show less`;
export const SHOW_MORE_GROUPS = (count: number) => `show ${count} more`;
export const PERMISSION_GROUPS_UPDATED_SUCCESS = () =>
  `Permission groups updated successfully`;
export const RENAME_SUCCESSFUL = () => `Rename successful`;
export const DELETE_USER = () => `Delete User`;
export const NO_USERS_MESSAGE = () => `There are no users added to this group`;
export const ADD_USERS = () => `Add Users`;
export const CLONE_USER_GROUP = () => `Clone User Group`;
export const RENAME_USER_GROUP = () => `Rename User Group`;
export const DELETE_USER_GROUP = () => `Delete User Group`;
export const EDIT_USER_GROUP = () => `Edit User Group`;
export const SEARCH_PLACEHOLDER = () => `Search`;
export const SEARCH_USER_GROUPS_PLACEHOLDER = () => `Search user groups`;
export const SEARCH_PERMISSION_GROUPS_PLACEHOLDER = () =>
  `Search permission groups`;
export const USER_GROUPS_UPDATED_SUCCESS = () =>
  `User groups updated successfully`;
export const GROUP_DELETED = () => `Group deleted successfully`;
export const GROUP_CLONED = () => `Group cloned successfully`;
export const COPY_OF_GROUP = (group: string) => `Copy of ${group}`;
export const CLONE_PERMISSION_GROUP = () => `Clone Permission Group`;
export const RENAME_PERMISSION_GROUP = () => `Rename Permission Group`;
export const DELETE_PERMISSION_GROUP = () => `Delete Permission Group`;
export const EDIT_PERMISSION_GROUP = () => `Edit Permission Group`;
export const ADD_GROUP = () => `Add Group`;
export const SUCCESSFULLY_SAVED = () => `Successfully Saved`;
export const ENTER_GROUP_NAME = () => `Enter group name`;
export const ACTIVE_GROUPS = () => `Active Groups`;
export const ALL_GROUPS = () => `All Groups`;
export const NO_PERMISSION_GROUPS_MESSAGE = () => `There are no permissions assigned yet. Choose from the list of
permissions below to add them.`;
export const BOTTOM_BAR_SAVE_MESSAGE = () => `These changes will affect the users ability to interact with various
aspects of the application. Are you sure?`;
export const BOTTOM_BAR_SAVE_BTN = () => `Save Changes`;
export const BOTTOM_BAR_CLEAR_BTN = () => `Clear`;
