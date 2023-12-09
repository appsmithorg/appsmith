export * from "ce/constants/messages";
import {
  createMessage,
  APPLICATION_INVITE as CE_APPLICATION_INVITE,
  INVITE_USERS_MESSAGE as CE_INVITE_USERS_MESSAGE,
  INVITE_USERS_PLACEHOLDER as CE_INVITE_USERS_PLACEHOLDER,
  INVITE_USERS_VALIDATION_EMAIL_LIST as CE_INVITE_USERS_VALIDATION_EMAIL_LIST,
  MEMBERS_TAB_TITLE as CE_MEMBERS_TAB_TITLE,
  SEARCH_USERS as CE_SEARCH_USERS,
  PAGE_SERVER_UNAVAILABLE_TITLE as CE_PAGE_SERVER_UNAVAILABLE_TITLE,
  INVITE_USERS_SUBMIT_SUCCESS as CE_INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USER_SUBMIT_SUCCESS as CE_INVITE_USER_SUBMIT_SUCCESS,
} from "ce/constants/messages";

/*
  For self hosted CE, it displays the string "Appsmith Community v1.10.0".
 */
export const APPSMITH_DISPLAY_VERSION = (edition: string, version: string) =>
  `Appsmith ${version}`;

// GAC begin
export const SHOW_LESS_GROUPS = () => `show less`;
export const SHOW_MORE_GROUPS = (count: number) => `show ${count} more`;
export const ADD_USERS = () => `Add users`;
export const ADD_GROUP = () => `Add group`;
export const ADD_ROLE = () => `Add role`;
export const SEARCH_PLACEHOLDER = () => `Search`;
export const SEARCH_GROUPS_PLACEHOLDER = () => `Search groups`;
export const SEARCH_ROLES_PLACEHOLDER = () => `Search roles`;
export const SEARCH_USERS_PLACEHOLDER = () => `Search users`;
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
export const ACL_EDIT_DESC = () => `Edit description`;
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
export const DEFAULT_ROLES_TOGGLE_TEXT = () => `Default roles`;
export const BOTTOM_BAR_SAVE_MESSAGE =
  () => `These changes will affect the users ability to interact with various
aspects of the application. Are you sure?`;
export const BOTTOM_BAR_SAVE_BTN = () => `Save changes`;
export const BOTTOM_BAR_CLEAR_BTN = () => `Clear`;
export const ACL_INVITE_MODAL_TITLE = () => `Add users`;
export const ACL_INVITE_MODAL_MESSAGE = () =>
  `Add email id(s) and select group(s)`;
export const INVITE_USERS_MESSAGE = (cloudHosting?: boolean) =>
  cloudHosting
    ? createMessage(CE_INVITE_USERS_MESSAGE)
    : `Invite users or groups`;
export const INVITE_USERS_PLACEHOLDER = (isFreeInstance?: boolean) =>
  isFreeInstance
    ? createMessage(CE_INVITE_USERS_PLACEHOLDER)
    : `Enter email address(es) or group(s)`;
export const INVITE_USERS_VALIDATION_EMAIL_LIST = (isFreeInstance?: boolean) =>
  isFreeInstance
    ? createMessage(CE_INVITE_USERS_VALIDATION_EMAIL_LIST)
    : `Invalid email address(es) or group(s) found`;
export const MEMBERS_TAB_TITLE = (length: number, isFreeInstance?: boolean) =>
  isFreeInstance
    ? createMessage(CE_MEMBERS_TAB_TITLE, length)
    : `Users / User Groups (${length})`;
export const SEARCH_USERS = (isFreeInstance?: boolean) =>
  isFreeInstance
    ? createMessage(CE_SEARCH_USERS)
    : `Search for users or groups`;
export const INVITE_USERS_SUBMIT_SUCCESS = (isFreeInstance?: boolean) =>
  isFreeInstance
    ? createMessage(CE_INVITE_USERS_SUBMIT_SUCCESS)
    : `The users/groups have been invited successfully`;
export const INVITE_USER_SUBMIT_SUCCESS = (isFreeInstance?: boolean) =>
  isFreeInstance
    ? createMessage(CE_INVITE_USER_SUBMIT_SUCCESS)
    : `The user/group have been invited successfully`;
export const APPLICATION_INVITE = (name: string, isFreeInstance?: boolean) =>
  isFreeInstance ? CE_APPLICATION_INVITE(name) : "Application invite";
export const EVENT_GROUP_ADD_USER_TOP_BAR = () =>
  "Group details page > Top bar";
export const EVENT_GROUP_ADD_USER_EMPTY_STATE = () =>
  "Group details page > Users tab > Empty state";
export const EVENT_GROUP_INVITE_USER_TOP_BAR = () =>
  "Group details page > Top bar > Add user modal";
export const EVENT_GROUP_INVITE_USER_EMPTY_STATE = () =>
  "Group details page > Users tab > Empty state > Add user modal";
export const EVENT_USER_INVITE = () => "Users page > Add user modal";
export const EVENT_USERS_PAGE = () => "Users page";
export const EVENT_USER_ROLES_TAB = () => "User details page > Roles tab";
export const EVENT_USER_GROUPS_TAB = () => "User details page > Groups tab";
export const EVENT_GROUP_ROLES_TAB = () => "Group details page > Roles tab";
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
export const DATE_RANGE_LABEL = () => "Date range";
export const CLEAR_ALL = () => "Clear all";
export const ON_COPY_CONTENT = (input: string) =>
  `Audit log with id [${input}] copied to clipboard`;
export const EVENT_DESCRIPTION_LABEL = () => "Event description";
export const USER_LABEL = () => "User";
export const DATE_LABEL = () => "Date";
export const REFRESH = () => "Refresh";
// Audit logs end

// Branding
export const ADMIN_BRANDING_SETTINGS_TITLE = () => "Branding";
export const ADMIN_BRANDING_SETTINGS_SUBTITLE = () =>
  "Set your organization's logo and brand colors.";

// Billing
export const ADMIN_BILLING_SETTINGS_TITLE = () => "License & plans";
export const ADMIN_BILLING_SETTINGS_SUBTITLE = () =>
  "View customer portal to view usage and billing related information, and to manage your subscription.";
export const NO_ACTIVE_SUBSCRIPTION = () => "No active subscription";
export const LICENSE_GET_STARTED_HEADING = () =>
  "How do you want to get started?";
export const LICENSE_GET_STARTED_MESSAGE = () =>
  "Our free plan is great for solo developers and small teams.";
export const LICENSE_GET_STARTED_MESSAGE_NEXT = () =>
  "If you are trialing one of our paid plans and have a license key, choose Paid.";
export const LICENSE_KEY_FORM_INPUT_LABEL = () =>
  "If you already have a license, please enter the key to continue";
export const LICENSE_KEY_MODAL_INPUT_LABEL = () => "Enter license key";
export const LICENSE_KEY_CTA_LABEL = () => "Don’t have a license key?";
export const TRIAL_EXPIRY_WARNING = (gracePeriod: number, suffix: string) =>
  `Your trial will expire in ${gracePeriod} ${suffix}.`;
export const CONTINUE_USING_FEATURES = () =>
  `Upgrade to continue using all the features.`;
export const NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING = () =>
  `Contact your administrator to upgrade and continue using Appsmith.`;
export const TOTAL_USERS_MESSAGE = () => `Total users`;
export const NUMBER_OF_SELF_HOSTED_USERS = () =>
  ` Number of users on the self-hosted instance`;
export const BILLING_AND_USAGE = () => `Billing & usage`;
export const OPEN_CUSTOMER_PORTAL = () => `Open customer portal`;
export const BE_WELCOME_MESSAGE = () => "Welcome to Appsmith Business Edition";
export const BE_WELCOME_MESSAGE_ENTERPRISE = () =>
  "Welcome to Appsmith Enterprise Edition";
export const BE_TRIAL_BANNER_EXPIRY_MESSAGE = (
  gracePeriod: number,
  suffix: string,
) => `Trial ends in <span>${gracePeriod}</span> ${suffix}`;
export const UPGRADE_NOW = () => `Upgrade now`;
export const CLOSE = () => `Close`;
export const UPGRADE_TO_BUSINESS = () => `Upgrade to Business`;
export const ADD_KEY = () => `Add key`;
export const ACTIVATE_INSTANCE = () => `Activate instance`;
export const GET_TRIAL_LICENSE = () => `Get trial license`;
export const REQUIRED_LICENSE_KEY = () => `License key is required`;
export const INVALID_LICENSE_KEY = () => `License key is invalid`;
export const YOUR_LICENSE_KEY = () => `Your license key`;
export const UPDATE_LICENSE = () => `Update license`;
export const PREV_LICENSE_INVALID = () =>
  `The previous license will be invalid`;
export const ACTIVATE = () => `Activate`;
export const PASTE_LICENSE_KEY = () => `Paste your license key here`;
export const LICENSE_EXPIRY_DATE = (date: string) => `Valid until: ${date}`;
export const UPDATE = () => "Update";

export const LICENSE_ERROR_TITLE = () => `No active subscription`;
export const LICENSE_ERROR_DESCRIPTION = () =>
  `Your instance is currently inactive. Please contact your instance administrator to reactivate the instance.`;
export const VISIT_CUSTOMER_PORTAL = () => `Get it now`;
export const VISIT_PORTAL = () => `Visit portal`;

export const LICENSE_REFRESHED_SUCCESSFULLY = () =>
  `Your license has been refreshed successfully`;
export const NOT_AVAILABLE = () => `Not available`;
export const ACTIVE = () => `Active`;
export const TRIAL = () => `Trial`;
export const CUSTOMER_PORTAL = () => `Customer portal`;
export const LICENSE_KEY = () => `License key`;
export const ALREADY_UPGRADED = () => `Already upgraded?`;
export const PAYMENT_FAILED = () => `Your most recent payment has failed.`;
export const PAYMENT_FAILED_TEXT = (count: number, suffix: string) =>
  `Your most recent payment has failed. Update your payment methods or your instances will stop working in ${count} ${suffix}.`;
export const ENTERPRISE = () => `Enterprise`;
export const SELF_SERVE = () => `Business`;
export const AIRGAPPED = () => `Airgapped`;
export const FREE = () => `Free`;
export const VISIT_PORTAL_CTA = () => `Visit portal`;
export const SUBMIT_BUTTON = () => "Submit";
export const LICENSE_FORM_DESCIPTION = () =>
  "Your previous license will be invalid";
export const GET_STARTED = () => `Get started`;
export const FREE_SUBTEXT = () => "Self-host our free plan";
export const PAID = () => `Paid`;
export const PAID_SUBTEXT = () => "Self-host our paid plans";
export const ADD_LICENSE = () => "Add license";
export const PLAN = () => "Plan";
export const LICENSE = () => "License";
export const REMOVE_LICENSE_KEY = () => `Remove license key`;
export const REMOVE = () => `Remove`;
export const REMOVE_LICENSE_KEY_MODAL_TEXT = () =>
  "If you remove your license key, you will lose access to all paid features. To learn more about how this will impact your instance, refer to our documentation.";
export const REMOVE_LICENSE_KEY_MODAL_SUBTEXT = () =>
  `We will enable form login by default for all users and we strongly recommend enabling email verification for enhanced security measures.`;
export const LEARN_MORE = () => "Learn more";
export const CONFIRM = () => "Confirm";
export const Name = () => "Name";
export const START_DATE = () => "Subscription start date";
export const END_DATE = () => "Subscription end date";
export const EMAIL = () => "Registered email ID";
export const MANAGE = () => "Manage plans";
export const PASTE_LICENSE = () => "Paste your license key here to activate.";
export const DONT_HAVE_LICENSE = () => "Don't have a license?";
export const GET_ONE_NOW = () => "Get one now.";
export const DOWNGRADE_CALLOUT_TEXT_PAID = () =>
  "Your license key is no longer valid. Contact us to continue using all the features.";
export const TRIAL_EXPIRED_TEXT = () =>
  "Your trial has expired. Upgrade to continue using all the features.";
export const PAID_EXPIRED_TEXT = () =>
  "Your license key is no longer valid. Get a new license to continue using all the features.";
export const DOWNGRADE_CALLOUT_TEXT_TRIAL = () =>
  "Your trial license has expired. Upgrade to continue using all the features.";
export const DOWNGRADE_CALLOUT_SUBTEXT_1_ACTIVE = () =>
  "If you decide to downgrade, you will lose access to the features that are exclusive to your current plan. To learn more about how this will impact your instance, refer to our documentation.";
export const DOWNGRADE_CALLOUT_SUBTEXT_1_EXPIRED = () =>
  "If you decide to downgrade, you will lose access to all paid features. To learn more about how this will impact your instance, refer to our documentation.";
export const DOWNGRADE_CALLOUT_SUBTEXT_2 = () =>
  "Additionally, we will enable form login by default for all users and we strongly recommend enabling email verification for enhanced security measures.";
export const DOWNGRADE_CALLOUT_TEXT = () =>
  "Your license key is valid. However, please note that your new key corresponds to a lower tier plan than your current plan.";
export const LICENSE_EXPIRED_HEADING_TRIAL = () => "Continue using Appsmith";
export const LICENSE_TRIAL_EXPIRED_COMMMUNITY_DOWNGRADE = () =>
  "Downgrade to our free plan";
export const LICENSE_TRIAL_EXPIRED_CONTINUE = () =>
  "Continue with our paid plan";
export const LICENSE_PAID_EXPIRED_CONTINUE = () =>
  "Start again with our paid plan";
export const LICENSE_EXPIRED_HEADING_PAID = () => "Restart with Appsmith";
export const CONTACT_US = () => "Contact us";
export const NEED_NEW_LICENSE = () => "Need a new license?";
export const KEY = () => `Key`;
export const MIGRATIONS = () => `Migrations`;
export const MIGRATIONS_TEXT = () =>
  `We are updating your instance. Please allow us some time to complete the migration.`;
export const MIGRATIONS_ERROR_TEXT = () =>
  `Updating your instance failed. Please restart the server again for the license changes to take place.`;
export const DOWNGRADE = () => `Downgrade`;
export const CURRENT_PLAN = () => `Current plan`;
export const VISIT_DOCS = () => `Visit docs`;

// Welcome form EE
export const WELCOME_FORM_SUBMIT_LABEL = () => "Next";

// Auth pages
export const SIGNUP_PAGE_TITLE = () => `Create your account`;

// error pages
export const PAGE_SERVER_UNAVAILABLE_TITLE = (cloudHosting: boolean) => {
  if (cloudHosting) {
    return CE_PAGE_SERVER_UNAVAILABLE_TITLE(cloudHosting);
  } else {
    return "Server unavailable";
  }
};

// Environments start
export const ENVIRONMENT_FILTER_DISABLED_TOOLTIP = (
  PluginName = "This",
  envName = "staging",
) =>
  `Production and ${envName.toLowerCase()} configurations are the same since ${PluginName.toLowerCase()} datasource doesn't support environments.`;
export const ENV_INFO_MODAL_CHECKBOX_LABEL = () =>
  "I understand, don't tell me again.";
export const ENV_INFO_MODAL_HEADER = () =>
  "All application changes will be deployed";
export const ENV_INFO_MODAL_DESCRIPTION = () =>
  "To isolate application changes between Staging and Production, connect your apps to a Git repo and create branches for Staging and Production.";
export const ENV_INFO_MODAL_DOCUMENATION_LINK_TEXT = () =>
  "Learn more about environments";
export const ENV_INFO_CALLOUT_TOOLTIP = () =>
  "Widgets, layouts, results from queries and code";
export const ENV_INFO_CALLOUT_CONTENT_1 = () => "End-users will see all ";
export const ENV_INFO_CALLOUT_CONTENT_2 = () => "application-level";
export const ENV_INFO_CALLOUT_CONTENT_3 = () =>
  " changes irrespective of whether you made them while connected to any datasource environment.";
export const ENV_INFO_MODAL_DISMISS_ACTION = () => "Don't show me again";
export const MANAGE_ENV_TITLE = () =>
  "List of datasource environments within your workspace";
export const MANAGE_ENV_CREATE_MODAL_TITLE = () => "Create new environment";
export const MANAGE_ENV_EDIT_MODAL_TITLE = () => "Update environment";
export const MANAGE_ENV_MODAL_INPUT_LABEL = () => "Environment Name";
export const MANAGE_ENV_MODAL_DELETE_DESC = (
  envName: string,
  workspaceName: string,
  configuredDatasources: number,
) =>
  `Deleting ${envName} environment from ${workspaceName} will permanently remove ${envName.toLowerCase()} configurations for all ${configuredDatasources} datasources.`;
export const MANAGE_ENV_MODAL_INPUT_PLACEHOLDER = () =>
  "Enter environment name";
export const MANAGE_ENV_ERROR_SP_CHAR_MESSAGE = () =>
  "Environment cannot contain any special characters except “_”";
export const MANAGE_ENV_ERROR_START_WITH_SP_CHAR_NUM_MESSAGE = () =>
  "Environment name cannot start with a number or “_” character";
export const MANAGE_ENV_ERROR_DUPLICATE_NAME_MESSAGE = () =>
  "You cannot have two environments with the same name.";
export const ENV_WALKTHROUGH_A_TITLE = () => "Datasource environments";
export const ENV_WALKTHROUGH_A_BODY = () =>
  `Appsmith now supports having different environment configurations for your datasources.\n\nYou can use this dropdown to select the active environment for your application.`;
export const ENV_WALKTHROUGH_A_FOOTER_TEXT = () =>
  "Step 2: Configure your environment";
export const ENV_WALKTHROUGH_A_FOOTER_BTN_TEXT = () => "Next";
export const ENV_WALKTHROUGH_B_TITLE = () => "Configure environments";
export const ENV_WALKTHROUGH_B_BODY = () =>
  `Select the desired environment option from the selector.\n\nFill in the relevant information to configure the environment for your datasource and save.`;
// Environments end

// Provisioning begin
export const PROVISIONING_TITLE = () => "User provisioning & Group sync";
export const PROVISIONING_DESC = () =>
  "Supports your IdP via SCIM for now. Other provisioning specifications coming soon.";
export const SCIM_CARD_TITLE = () =>
  "System for Cross-domain Identity Management";
export const SCIM_CARD_SUB_TEXT = () =>
  "Configure your identity providers like Okta, Azure Active Directory and others to manage authorization and access in Appsmith.";
export const SCIM_CALLOUT_HEADING = () => "How to setup SCIM";
export const SCIM_CALLOUT_LIST = [
  "Enable SAML on Appsmith before you input SCIM config details.",
  "See our SCIM config documentation below to get set-up instructions for supported providers.",
  "Copy the endpoint URL and the API key right away into your IdP's console.",
];
export const CONNECTION_ACTIVE = () => "Connection Active";
export const CONNECTION_INACTIVE = () => "Connection Inactive";
export const OPEN_DOCUMENTATION = () => "Open documentation";
export const SCIM_API_ENDPOINT = () => "SCIM API endpoint";
export const SCIM_API_ENDPOINT_HELP_TEXT = () =>
  "Paste this URL in your IdP service providers console.";
export const API_KEY_TO_SETUP_SCIM = () => "API key to setup SCIM";
export const COPY_PASTE_API_KEY_CALLOUT = () =>
  "Copy and paste your API key into your IdP's console right away. You can't do this later.";
export const GENERATE_API_KEY = () => "Generate API key";
export const RECONFIGURE_API_KEY = () => "Re-configure API key";
export const DISABLE_SCIM = () => "Disable SCIM";
export const LAST_SYNC_MESSAGE = (lastUpdated: string) =>
  `Last sync ${lastUpdated ? `happened ${lastUpdated} ago` : "never happened"}`;
export const DISABLE_SCIM_MODAL_TITLE = () => "Disable SCIM config";
export const DISABLE_SCIM_MODAL_BUTTON = () => "Disable this SCIM config";
export const RADIO_GROUP_HEADING = () =>
  "If you would still like to disable this config, choose one of the below options";
export const DISABLE_SCIM_MODAL_CONFIRMATION = () => "I understand and confirm";
export const CONNECTION_INACTIVE_CALLOUT_ON_MODAL = () =>
  "This connection will be disabled. Any updates in your IdP will not sync with Appsmith.";
export const KEEP_PROVISIONED_RESOURCES = () =>
  "Keep users and groups from this connection";
export const REMOVE_PROVISIONED_RESOURCES = () =>
  "Remove users and groups from this connection";
export const KEEP_RESOURCES_SUB_TEXT_ON_MODAL = () =>
  "This will keep all users and groups linked to Appsmith via this SCIM connection, but any updates in your IdP provider will not sync with Appsmith";
export const REMOVE_RESOURCES_SUB_TEXT_ON_MODAL = () =>
  "This will permanently remove all users and groups linked to Appsmith from this SCIM connection.";
export const DISABLE_SCIM_WARNING = () =>
  "We strongly advise disabling provisioning in your IdP to remove users from Appsmith. This step ensures seamless user management and avoids potential conflicts while re-configuring SCIM with Appsmith in the future.";
export const RECONFIGURE_API_KEY_MODAL_TITLE = () => "Re-configure API key";
export const RECONFIGURE_API_KEY_MODAL_CONTENT = () =>
  "Regenerating your API key will invalidate the current key, leading to API failures. Please proceed with key regeneration only if you intend to replace your existing key on your IdP. Exercise caution to avoid disruption of services relying on the current API key.";
export const RECONFIGURE_API_KEY_MODAL_CANCEL_BUTTON = () => "Cancel";
export const RECONFIGURE_API_KEY_MODAL_SUBMIT_BUTTON = () => "Re-configure";
export const LOGO_DIFFERENT_TOOLTIP = () =>
  "Logo is different from the brand logo set.";
export const RESET_LOGO_TOOLTIP = () => "Reset logo";
// Provisioning end

// Modules start
export const SEARCH_APPS_PACKAGES_AND_WORKFLOWS = () =>
  "Search for apps, packages or workflows";
export const SEARCH_APPS_AND_PACKAGES = () => "Search for apps or packages";
export const WORKSPACE_ACTION_BUTTON = () => "Create new";
export const NEW_PACKAGE = () => "New package";
export const NEW_APP = () => "New app";
export const EMPTY_PACKAGE_LIST = () =>
  "There are no packages in this workspace.";
export const FETCH_PACKAGES_ERROR = () => "Failed to fetch Packages";
export const FETCH_PACKAGE_ERROR = () => "Failed to fetch Package";
export const CREATE_PACKAGE_ERROR = () => "Failed to create package";
export const QUERY_MODULES_TITLE = () => "Queries";
export const ADD_QUERY_MODULE_TOOLTIP = () => "Add a new query module";
export const CREATE_NEW_QUERY_MODULE = () => "New query";
export const EMPTY_QUERY_MODULES_MSG = () => "No queries to show here.";
export const NEW_QUERY_BUTTON = () => "New query";
export const RENAME_PACKAGE_TOOLTIP = () => "Rename package";
export const ADD_QUERY_BUTTON = () => "Add query";
export const PACKAGE_NAME_CANT_BE_EMPTY = () => "Package name can't be empty";
export const ERROR_DELETING_PACKAGE = () => "Error while deleting Package";
export const INVALID_INPUT_NAME = () =>
  "Input names can only contain alphanumeric and should start with an alphabet";
export const MODULE_INSTANCE_EMPTY_INPUT = () =>
  "No inputs parameters defined for this query.";
export const MODULE_INSTANCE_RENAME_ERROR = (name: string) =>
  `Unable to update module instance name to ${name}`;
export const NEW_REUSABLE_QUERY_BUTTON_TEXT = () => "New reusable query";
export const NEW_REUSABLE_API_BUTTON_TEXT = () => "New reusable API";
// Modules end

//Worflows start
export const SEARCH_APPS_AND_WORKFLOWS = () => "Search for apps or workflows";
export const NEW_WORKFLOW = () => "New workflow";
export const FETCH_WORKFLOW_ERROR = () => "Failed to fetch Workflow";
export const CREATE_WORKFLOW_ERROR = () => "Failed to create workflow";
export const EMPTY_WORKFLOW_LIST = () =>
  "There are no workflows in this workspace.";
export const RENAME_WORKFLOW_TOOLTIP = () => "Rename workflow";
// Workflows end

// AI begin
export const AI_RESPONSE_LOADING = () =>
  "your code is being generated, give it a few seconds";
export const AI_RECENT_PROMPTS = () => "Recent prompts";
export const AI_POPOVER_TITLE = () => "Appsmith’s coding assistant";
export const AI_JS_EXPR_PLACEHOLDER = () =>
  "I can generate JavaScript code, Ask me something.";
export const AI_SQL_PLACEHOLDER = () =>
  "I can generate SQL queries, Ask me something.";
export const AI_JS_FUNC_PLACEHOLDER = () =>
  "I can complete JS Object functions, Ask me something.";
export const AI_USE_THIS_BUTTON_LABEL = () => "Use this";
export const AI_CONN_TIMEOUT_ERROR_MESSAGE = () =>
  "Connection timed out, its taking too long to generate code for you. Can you try again.";
export const AI_TOO_MANY_REQUESTS_ERROR_MESSAGE = () =>
  "Too many requests. You have already used 50 requests today. Please try again tomorrow or contact Appsmith team.";
export const AI_GENERATION_ERROR_MESSAGE = () =>
  "We can not generate a response for this prompt, to get accurate responses we need prompts to be more specific.";
export const AI_PROMPT_HELP_TEXT = () => "Press enter to send the prompt";
export const AI_PROMPT_EXAMPLE_PREFIX = () => "Example: ";
export const AI_INCORRECT_FEEDBACK_BUTTON_LABEL = () => "Incorrect response";
// AI end
