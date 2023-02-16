export * from "ce/constants/messages";
import {
  createMessage,
  INVITE_USERS_MESSAGE as CE_INVITE_USERS_MESSAGE,
  INVITE_USERS_PLACEHOLDER as CE_INVITE_USERS_PLACEHOLDER,
  INVITE_USERS_VALIDATION_EMAIL_LIST as CE_INVITE_USERS_VALIDATION_EMAIL_LIST,
  MEMBERS_TAB_TITLE as CE_MEMBERS_TAB_TITLE,
} from "ce/constants/messages";

// GAC begin
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
export const NO_PERMISSION_TO_UNASSIGN = () =>
  `You do not have permission to unassign this role.`;
export const DEFAULT_ROLES_PILL = () => `D`;
export const DEFAULT_ROLES_TOGGLE_TEXT = () => `Default Roles`;
export const BOTTOM_BAR_SAVE_MESSAGE = () => `These changes will affect the users ability to interact with various
aspects of the application. Are you sure?`;
export const BOTTOM_BAR_SAVE_BTN = () => `Save Changes`;
export const BOTTOM_BAR_CLEAR_BTN = () => `Clear`;
export const ACL_INVITE_MODAL_TITLE = () => `Add Users`;
export const ACL_INVITE_MODAL_MESSAGE = () =>
  `Add email id(s) and select group(s)`;
export const INVITE_USERS_MESSAGE = (cloudHosting?: boolean) =>
  cloudHosting
    ? createMessage(CE_INVITE_USERS_MESSAGE)
    : `Invite users or groups`;
export const INVITE_USERS_PLACEHOLDER = (cloudHosting?: boolean) =>
  cloudHosting
    ? createMessage(CE_INVITE_USERS_PLACEHOLDER)
    : `Enter email address(es) or group(s)`;
export const INVITE_USERS_VALIDATION_EMAIL_LIST = (cloudHosting?: boolean) =>
  cloudHosting
    ? createMessage(CE_INVITE_USERS_VALIDATION_EMAIL_LIST)
    : `Invalid email address(es) or group(s) found`;
export const MEMBERS_TAB_TITLE = (length: number, cloudHosting?: boolean) =>
  cloudHosting
    ? createMessage(CE_MEMBERS_TAB_TITLE, length)
    : `Users / User Groups (${length})`;
export const EVENT_GROUP_ADD_USER_TOP_BAR = () =>
  "Group Details page > Top bar";
export const EVENT_GROUP_ADD_USER_EMPTY_STATE = () =>
  "Group Details page > Users tab > Empty state";
export const EVENT_GROUP_INVITE_USER_TOP_BAR = () =>
  "Group Details page > Top bar > Add user modal";
export const EVENT_GROUP_INVITE_USER_EMPTY_STATE = () =>
  "Group Details page > Users tab > Empty state > Add user modal";
export const EVENT_USER_INVITE = () => "Users page > Add user modal";
export const EVENT_USERS_PAGE = () => "Users page";
export const EVENT_USER_ROLES_TAB = () => "User Details page > Roles tab";
export const EVENT_USER_GROUPS_TAB = () => "User Details page > Groups tab";
export const EVENT_GROUP_ROLES_TAB = () => "Group Details page > Roles tab";
// GAC end

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

// Branding
export const ADMIN_BRANDING_SETTINGS_TITLE = () => "Branding";
export const ADMIN_BRANDING_SETTINGS_SUBTITLE = () =>
  "Set your organization's logo and brand colors.";

// Billing
export const ADMIN_BILLING_SETTINGS_TITLE = () => "License & Billing";
export const ADMIN_BILLING_SETTINGS_SUBTITLE = () =>
  "View customer portal to view usage and billing related information, and to manage your subscription.";
export const NO_ACTIVE_SUBSCRIPTION = () => "No active subscription";
export const GET_STARTED_MESSAGE = () =>
  "Kindly choose one of the following option to get started";
export const LICENSE_KEY_FORM_INPUT_LABEL = () =>
  "If you already have a license, please enter the key to continue";
export const LICENSE_KEY_CTA_LABEL = () =>
  "If you do not have a license key, please visit our customer portal to start trial or buy a subscription";
export const TRIAL_EXPIRY_WARNING = (gracePeriod: number | string) =>
  `Your trial will expire in <span>${gracePeriod}</span> days.`;
export const CONTINUE_USING_FEATURES = () =>
  `to continue using all the features.`;
export const NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING = () =>
  `Please contact your administrator to upgrade and continue using all the features.`;
export const TOTAL_USERS_MESSAGE = () => `Total Users`;
export const NUMBER_OF_SELF_HOSTED_USERS = () =>
  ` Number of users on the self-hosted instance`;
export const BILLING_AND_USAGE = () => `Billing & Usage`;
export const OPEN_CUSTOMER_PORTAL = () => `Open Customer Portal`;
export const BE_WELCOME_MESSAGE = () => "Welcome to Appsmith Business Edition";
export const BE_TRIAL_BANNER_EXPIRY_MESSAGE = (gracePeriod: number | string) =>
  `Trial ends in <span>${gracePeriod}</span> days`;
export const UPGRADE_NOW = () => `Upgrade Now`;
export const CLOSE = () => `Close`;
export const UPGRADE_TO_BUSINESS = () => `Upgrade to Business`;
export const ADD_KEY = () => `Add Key`;
export const ACTIVATE_INSTANCE = () => `Activate Instance`;
export const GET_TRIAL_LICENSE = () => `Get Trial License`;
export const REQUIRED_LICENSE_KEY = () => `License key is required`;
export const INVALID_LICENSE_KEY = () => `License key is invalid`;
export const YOUR_LICENSE_KEY = () => `Your license key`;
export const UPDATE_LICENSE = () => `Update License`;
export const PREV_LICENSE_INVALID = () =>
  `The previous license will be invalid`;
export const ACTIVATE = () => `Activate`;
export const PASTE_LICENSE_KEY = () => `Paste your license key here`;
export const LICENSE_EXPIRY_DATE = (date: string) => `Valid until: ${date}`;
export const UPDATE = () => "UPDATE";

export const LICENSE_ERROR_TITLE = () => `No Active Subscription`;
export const LICENSE_ERROR_DESCRIPTION = () =>
  `You currently do not have an Active Subscription. Please contact your instance administrator to activate the instance.`;
