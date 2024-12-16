import type { PageErrorMessageProps } from "pages/common/ErrorPages/Components/PageErrorMessage";

export // TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMessage(format: (...strArgs: any[]) => string, ...args: any[]) {
  return format(...args);
}

/*
  For self hosted CE, it displays the string "Appsmith Community v1.10.0".
 */
export const APPSMITH_DISPLAY_VERSION = (edition: string, version: string) =>
  `Appsmith ${edition} ${version}`;
export const INTERCOM_CONSENT_MESSAGE = () =>
  `Can we have your email for better support?`;
export const YES = () => `Yes`;
export const ARE_YOU_SURE = () => `Are you sure?`;
export const CHAT_WITH_US = () => `Chat with us`;
export const ERROR_ADD_API_INVALID_URL = () =>
  `Unable to create API. Try adding a URL to the datasource`;
export const ERROR_MESSAGE_NAME_EMPTY = () => `Please select a name`;
export const ERROR_MESSAGE_CREATE_APPLICATION = () =>
  `We could not create the Application`;
export const APPLICATION_NAME_UPDATE = () => `Application name updated`;
export const ERROR_EMPTY_APPLICATION_NAME = () =>
  `Application name can't be empty`;
export const API_PATH_START_WITH_SLASH_ERROR = () => `Path cannot start with /`;
export const FIELD_REQUIRED_ERROR = () => `This field is required`;
export const INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR = (max: number) =>
  `Default text length must be less than or equal to ${max} characters`;
export const INPUT_TEXT_MAX_CHAR_ERROR = (max: number) =>
  `Input text length must be less than ${max} characters`;
export const INPUT_DEFAULT_TEXT_MAX_NUM_ERROR = () =>
  `Default Text value must be less than Max number allowed`;
export const INPUT_DEFAULT_TEXT_MIN_NUM_ERROR = () =>
  `Default Text value must be greater than Min number allowed`;
export const INPUT_INVALID_TYPE_ERROR = () =>
  `Type Mismatch. Please enter a valid value`;
export const VALID_FUNCTION_NAME_ERROR = () =>
  `Must be a valid variable name (camelCase)`;
export const UNIQUE_NAME_ERROR = () => `Name must be unique`;
export const NAME_SPACE_ERROR = () => `Name must not have spaces`;
export const APLHANUMERIC_HYPHEN_SLASH_SPACE_ERROR = () =>
  `Name must only contain alphanumeric characters, hyphen, slash, and space`;

export const FORM_VALIDATION_EMPTY_EMAIL = () => `Please enter an email`;
export const FORM_VALIDATION_INVALID_EMAIL = () =>
  `Please provide a valid email address`;
export const ENTER_VIDEO_URL = () => `Please provide a valid url`;
export const ENTER_AUDIO_URL = () => `Please provide a valid url`;

export const FORM_VALIDATION_EMPTY_PASSWORD = () => `Please enter the password`;
export const FORM_VALIDATION_PASSWORD_RULE = () =>
  `Please provide a password between 8 and 48 characters`;
export const FORM_VALIDATION_INVALID_PASSWORD = FORM_VALIDATION_PASSWORD_RULE;

export const LOGIN_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const LOGIN_PAGE_PASSWORD_INPUT_LABEL = () => `Password`;
export const LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER = () => `Enter your email`;
export const LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER = () =>
  `Enter your password`;
export const LOGIN_PAGE_INVALID_CREDS_ERROR = () =>
  `It looks like you may have entered incorrect/invalid credentials. Please try again or reset password using the button below.`;
export const LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK = () =>
  `Reset password`;
export const NEW_TO_APPSMITH = () => `Don't have an account?`;
export const LOGIN_PAGE_TITLE = () => `Sign in to your account`;
export const LOGIN_PAGE_SUBTITLE = () => `Sign in to your account`;

export const LOGIN_PAGE_LOGIN_BUTTON_TEXT = () => `Sign in`;
export const LOGIN_PAGE_FORGOT_PASSWORD_TEXT = () => `Forgot password`;
export const LOGIN_PAGE_REMEMBER_ME_LABEL = () => `Remember`;
export const LOGIN_PAGE_SIGN_UP_LINK_TEXT = () => `Sign up`;
export const SIGNUP_PAGE_TITLE = () => `Create your account`;
export const SIGNUP_PAGE_SUBTITLE = () => `Use your workspace email`;
export const SIGNUP_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER = () => `Enter your email`;
export const SIGNUP_PAGE_NAME_INPUT_PLACEHOLDER = () => `Name`;
export const SIGNUP_PAGE_NAME_INPUT_LABEL = () => `Name`;
export const SIGNUP_PAGE_PASSWORD_INPUT_LABEL = () => `Password`;
export const SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER = () =>
  `Enter your password`;
export const SIGNUP_PAGE_LOGIN_LINK_TEXT = () => `Sign in`;
export const SIGNUP_PAGE_NAME_INPUT_SUBTEXT = () => `How should we call you?`;
export const SIGNUP_PAGE_SUBMIT_BUTTON_TEXT = () => `Sign up`;
export const ALREADY_HAVE_AN_ACCOUNT = () => `Already have an account?`;
export const LOOKING_TO_SELF_HOST = () => "Looking to self-host Appsmith?";
export const VISIT_OUR_DOCS = () => "Visit our docs";

export const SIGNUP_PAGE_SUCCESS = () =>
  `Awesome! You have successfully registered.`;
export const SIGNUP_PAGE_SUCCESS_LOGIN_BUTTON_TEXT = () => `Login`;

export const RESET_PASSWORD_PAGE_PASSWORD_INPUT_LABEL = () => `New password`;
export const RESET_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER = () =>
  `New Password`;
export const RESET_PASSWORD_LOGIN_LINK_TEXT = () => `Back to sign in`;
export const RESET_PASSWORD_PAGE_TITLE = () => `Reset password`;
export const RESET_PASSWORD_SUBMIT_BUTTON_TEXT = () => `Reset`;
export const RESET_PASSWORD_PAGE_SUBTITLE = () =>
  `Create a new password for your account `;

export const RESET_PASSWORD_RESET_SUCCESS = () =>
  `Your password has been reset`; //`Your password has been reset. Please login` (see next entry));
export const RESET_PASSWORD_RESET_SUCCESS_LOGIN_LINK = () => `Login`;

export const RESET_PASSWORD_EXPIRED_TOKEN = () =>
  `The password reset link has expired. Please try generating a new link`;
export const RESET_PASSWORD_INVALID_TOKEN = () =>
  `The password reset link is invalid. Please try generating a new link`;
export const RESET_PASSWORD_FORGOT_PASSWORD_LINK = () => `Forgot password`;

export const FORGOT_PASSWORD_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER = () =>
  `Enter your email`;
export const FORGOT_PASSWORD_PAGE_TITLE = () => `Reset password`;
export const FORGOT_PASSWORD_PAGE_SUB_TITLE = () =>
  `Enter the email address associated with your account`;
export const FORGOT_PASSWORD_PAGE_SUBTITLE = () =>
  `We will send a reset link to the email below`;
export const FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT = () => `Send reset link`;
export const FORGOT_PASSWORD_SUCCESS_TEXT = (email: string) =>
  `A password reset link has been sent to your email address ${email} registered with Appsmith.`;

export const VERIFICATION_PENDING_TITLE = () => `Check your inbox`;
export const VERIFICATION_PENDING_BODY = () =>
  `To finish your account setup click on the verification link we have sent in an email to `;

export const VERIFICATION_PENDING_NOT_YOU = () => `Not you?`;

export const VERIFICATION_PENDING_NO_EMAIL = () =>
  `No email in your inbox or spam folder?`;

export const VERIFICATION_PENDING_RESEND_LINK = () => `Resend link`;

export const VERIFY_ERROR_ALREADY_VERIFIED_TITLE = () =>
  `Email already verified`;

export const VERIFY_ERROR_EXPIRED_TITLE = () => "Oops, this link has expired";

export const VERIFY_ERROR_MISMATCH_TITLE = () =>
  "This link seems damaged. Please request a new link";

export const PRIVACY_POLICY_LINK = () => `Privacy policy`;
export const TERMS_AND_CONDITIONS_LINK = () => `Terms and conditions`;

export const ERROR_500 = () =>
  `We apologize, something went wrong. We're trying to fix things.`;
export const ERROR_0 = () =>
  `We could not connect to our servers. Please check your network connection`;
export const ERROR_401 = () =>
  `We are unable to verify your identity. Please login again.`;
export const ERROR_413 = (maxFileSize: number) =>
  `Payload too large. File size cannot exceed ${maxFileSize}MB.`;
export const GENERIC_API_EXECUTION_ERROR = () => `API execution error`;
export const APPSMITH_HTTP_ERROR_413 = () => `413 CONTENT_TOO_LARGE`;
export const ERROR_403 = (entity: string, userEmail: string) =>
  `Sorry, but your account (${userEmail}) does not seem to have the required access to update this ${entity}. Please get in touch with your Appsmith admin to resolve this.`;
export const PAGE_NOT_FOUND_ERROR = () =>
  `The page you’re looking for either does not exist, or cannot be found`;
export const INVALID_URL_ERROR = () => `Invalid URL`;
export const INVALID_NAME_ERROR = () => `Invalid name`;
export const MAKE_APPLICATION_PUBLIC = () => "Make application public";
export const MAKE_APPLICATION_PUBLIC_TOOLTIP = () =>
  "A public app is accessible to anyone who can access your instance of appsmith";
export const INVITE_TAB = () => "Invite";
export const INVITE_USERS_VALIDATION_EMAIL_LIST = () =>
  `Invalid email address(es) found`;
export const INVITE_USERS_VALIDATION_ROLE_EMPTY = () => `Please select a role`;
export const APPLICATION_INVITE = (name: string) => `Invite users to ${name}`;
export const INVITE_USERS_EMAIL_LIST_PLACEHOLDER = () =>
  `Comma separated emails`;
export const INVITE_USERS_ROLE_SELECT_PLACEHOLDER = () => `Select role`;
export const INVITE_USERS_ROLE_SELECT_LABEL = () => `Role`;
export const INVITE_USERS_EMAIL_LIST_LABEL = () => `User emails`;
export const INVITE_USERS_ADD_EMAIL_LIST_FIELD = () => `Add more`;
export const INVITE_USERS_MESSAGE = () => `Invite users`;
export const INVITE_USERS_PLACEHOLDER = () => `Enter email address(es)`;
export const INVITE_USERS_SUBMIT_BUTTON_TEXT = () => `Invite users`;
export const INVITE_USERS_SUBMIT_SUCCESS = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cloudHosting?: boolean,
) => `The users have been invited successfully`;
export const INVITE_USER_SUBMIT_SUCCESS = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cloudHosting?: boolean,
) => `The user has been invited successfully`;
export const INVITE_USERS_VALIDATION_EMAILS_EMPTY = () =>
  `Please enter the user emails`;
export const INVITE_USER_RAMP_TEXT = () =>
  "Users will have access to all applications in the workspace. For application-level access, try out our ";
export const CUSTOM_ROLES_RAMP_TEXT = () =>
  "To build and assign custom roles, try out our ";
export const ASSIGN_CUSTOM_ROLE = () => "Assign Custom Role";
export const CUSTOM_ROLE_TEXT = () => "Custom role";
export const CUSTOM_ROLE_DISABLED_OPTION_TEXT = () =>
  "Can access specific applications or only certain pages and queries within an application";
export const USERS_HAVE_ACCESS_TO_ALL_APPS = () =>
  "Users will have access to all applications in this workspace";
export const USERS_HAVE_ACCESS_TO_ONLY_THIS_APP = () =>
  "Users will only have access to this application";
export const NO_USERS_INVITED = () => "You haven't invited any users yet";
export const BUSINESS_EDITION_TEXT = () => "business plan";
export const PARTNER_PROGRAM_CALLOUT = (
  email: string,
) => `${email} is outside your organisation. If you’re building this app
for someone else, you should check out our partner program.`;
export const PARTNER_PROGRAM_CALLOUT_LINK = () =>
  `Learn about Appsmith Partner Program`;
export const NEW_APPLICATION = () => `New application`;
export const APPLICATIONS = () => `Applications`;
export const FIXED_APPLICATIONS = () => `Classic Applications`;
export const ANVIL_APPLICATIONS = () => `New Applications`;

export const USER_PROFILE_PICTURE_UPLOAD_FAILED = () =>
  "Unable to upload display picture.";
export const UPDATE_USER_DETAILS_FAILED = () =>
  "Unable to update user details.";
export const USER_DISPLAY_PICTURE_FILE_INVALID = () =>
  "File content doesn't seem to be an image. Please verify.";
export const USER_DISPLAY_NAME_CHAR_CHECK_FAILED = () =>
  "No special characters allowed except .'-";
export const USER_DISPLAY_NAME_PLACEHOLDER = () => "Display name";
export const USER_DISPLAY_PICTURE_PLACEHOLDER = () => "Display picture";
export const USER_EMAIL_PLACEHOLDER = () => "Email";
export const USER_RESET_PASSWORD = () => "Reset password";

export const CREATE_PASSWORD_RESET_SUCCESS = () => `Your password has been set`;
export const CREATE_PASSWORD_RESET_SUCCESS_LOGIN_LINK = () => `Login`;

export const FORGOT_PASSWORD_PAGE_LOGIN_LINK = () => `Back to sign in`;
export const ADD_API_TO_PAGE_SUCCESS_MESSAGE = (actionName: string) =>
  `${actionName} API added to page`;
export const INPUT_WIDGET_DEFAULT_VALIDATION_ERROR = () => `Invalid input`;

export const AUTOFIT_ALL_COLUMNS = () => `Autofit all columns`;
export const AUTOFIT_THIS_COLUMN = () => `Autofit this column`;
export const AUTOFIT_COLUMN = () => `Autofit column`;

export const DATE_WIDGET_DEFAULT_VALIDATION_ERROR = () => "Date out of range";

export const TIMEZONE = () => `Timezone`;
export const ENABLE_TIME = () => `Enable Time`;

export const EDIT_APP = () => `Edit app`;
export const FORK_APP = () => `Fork app`;
export const SIGN_IN = () => `Sign in`;
export const SHARE_APP = () => `Share app`;
export const ALL_APPS = () => `All apps`;
export const KNOW_MORE = () => "Know more";

export const EDITOR_HEADER = {
  saving: () => "Saving",
  saveFailed: () => "Save failed",
  share: () => "Share",
  previewTooltip: {
    text: () => "Preview",
    shortcut: () => "P",
  },
};

// Homepage
export const CREATE_NEW_APPLICATION = () => `Create new`;
export const SEARCH_APPS = () => `Search for apps...`;
export const GETTING_STARTED = () => `Getting started`;
export const WORKSPACES_HEADING = () => `Workspaces`;
export const CREATE_A_NEW_WORKSPACE = () => `Create a new workspace`;
export const WELCOME_TOUR = () => `Welcome tour`;
export const NO_APPS_FOUND = () =>
  `Whale! Whale! This name doesn't ring a bell!`;
export const APPLICATION_CARD_LIST_ZERO_STATE = () =>
  `There are no applications in this workspace.`;
export const NEW_APPLICATION_CARD_LIST_ZERO_STATE = () =>
  `There are no new applications in this workspace.`;
export const CLASSIC_APPLICATION_CARD_LIST_ZERO_STATE = () =>
  `There are no classic applications in this workspace.`;
export const TRY_GUIDED_TOUR = () => `Try guided tour`;
export const JOIN_OUR_DISCORD = () => `Join our discord`;
export const WHATS_NEW = () => `What's new?`;
export const WORKSPACE_ACTION_BUTTON = () => "Create new";
export const NEW_APP = () => "Application";
export const NEW_APP_FROM_TEMPLATE = () => "Templates";
export const NO_WORKSPACE_HEADING = () => "Oops! No workspace found";
export const NO_WORKSPACE_DESCRIPTION = () =>
  "You can find workspace list on the left sidebar, try selecting one of them to access a workspace.";

// Lightning menu
export const LIGHTNING_MENU_DATA_API = () => `Use data from an API`;
export const LIGHTNING_MENU_DATA_QUERY = () => `Use data from a query`;
export const LIGHTNING_MENU_DATA_TOOLTIP = () => `Quick start data binding`;
export const LIGHTNING_MENU_DATA_WIDGET = () => `Use data from a widget`;
export const LIGHTNING_MENU_QUERY_CREATE_NEW = () => `Create new query`;
export const LIGHTNING_MENU_API_CREATE_NEW = () => `Create new API`;

export const LIGHTNING_MENU_OPTION_TEXT = () => `Plain text`;
export const LIGHTNING_MENU_OPTION_JS = () => `Write JS`;
export const LIGHTNING_MENU_OPTION_HTML = () => `Write HTML`;
export const CHECK_REQUEST_BODY = () =>
  `Please check your request configuration to debug`;
export const DONT_SHOW_THIS_AGAIN = () => `Don't show this again`;

export const TABLE_FILTER_COLUMN_TYPE_CALLOUT = () =>
  `Change column datatype to see filter operators`;

export const SAVE_HOTKEY_TOASTER_MESSAGE = () =>
  "Don't worry about saving, we've got you covered!";

export const WIDGET_SIDEBAR_TITLE = () => `Widgets`;
export const WIDGET_SIDEBAR_CAPTION = () =>
  `Drag a widget and drop it on the canvas`;
export const GOOGLE_RECAPTCHA_KEY_ERROR = () =>
  `Google reCAPTCHA token generation failed! Please check the reCAPTCHA site key.`;
export const GOOGLE_RECAPTCHA_DOMAIN_ERROR = () =>
  `Google reCAPTCHA token generation failed! Please check the allowed domains.`;

export const SERVER_API_TIMEOUT_ERROR = () =>
  `Appsmith server is taking too long to respond. Please try again after some time`;
export const DEFAULT_ERROR_MESSAGE = () => `There was an unexpected error`;
export const REMOVE_FILE_TOOL_TIP = () => "Remove Upload";
export const ERROR_FILE_TOO_LARGE = (fileSize: string) =>
  `File size should be less than ${fileSize}!`;
export const ERROR_DATEPICKER_MIN_DATE = () =>
  `Min date cannot be greater than current widget value`;
export const ERROR_DATEPICKER_MAX_DATE = () =>
  `Min date cannot be greater than current widget value`;
export const ERROR_WIDGET_DOWNLOAD = (err: string) => `Download failed. ${err}`;
export const ERROR_PLUGIN_ACTION_EXECUTE = (actionName: string) =>
  `${actionName} failed to execute`;
export const ACTION_EXECUTION_CANCELLED = (actionName: string) =>
  `${actionName} was cancelled`;
export const ERROR_FAIL_ON_PAGE_LOAD_ACTIONS = () =>
  `Failed to execute actions during page load`;
export const ERROR_ACTION_EXECUTE_FAIL = (actionName: string) =>
  `${actionName} action returned an error response`;
export const ACTION_MOVE_SUCCESS = (actionName: string, pageName: string) =>
  `${actionName} action moved to page ${pageName} successfully`;
export const ERROR_ACTION_MOVE_FAIL = (actionName: string) =>
  `Error while moving action ${actionName}`;
export const ACTION_COPY_SUCCESS = (actionName: string, pageName: string) =>
  `${actionName} action copied ${pageName.length > 0 ? "to page " + pageName : ""} successfully`;
export const ERROR_ACTION_COPY_FAIL = (actionName: string) =>
  `Error while copying action ${actionName}`;
export const ERROR_ACTION_RENAME_FAIL = (actionName: string) =>
  `Unable to update action name to ${actionName}`;

// Action Names Messages
export const ACTION_NAME_PLACEHOLDER = (type: string) =>
  `Name of the ${type} in camelCase`;
export const ACTION_INVALID_NAME_ERROR = () => "Please enter a valid name";
export const ACTION_NAME_CONFLICT_ERROR = (name: string) =>
  `${name} is already being used or is a restricted keyword.`;
export const ENTITY_EXPLORER_ACTION_NAME_CONFLICT_ERROR = (name: string) =>
  `${name} is already being used.`;

export const ACTION_ID_NOT_FOUND_IN_URL =
  "No correct API id or Query id found in the url.";
export const JS_OBJECT_ID_NOT_FOUND_IN_URL =
  "No correct JS Object id found in the url.";

export const DATASOURCE_CREATE = (dsName: string) =>
  `${dsName} datasource created`;
export const DATASOURCE_DELETE = (dsName: string) =>
  `${dsName} datasource deleted successfully`;
export const DATASOURCE_UPDATE = (dsName: string) =>
  `${dsName} datasource updated successfully`;
export const DATASOURCE_VALID = (dsName: string) =>
  `${dsName} datasource is valid`;
export const EDIT_DATASOURCE = () => "Edit configuration";
export const SAVE_DATASOURCE = () => "Save URL";
export const EDIT_DATASOURCE_TOOLTIP = () => "Edit datasource";
export const SAVE_DATASOURCE_TOOLTIP = () => "Save URL as a datasource";
export const SAVE_DATASOURCE_MESSAGE = () =>
  "Save the URL as a datasource to access authentication settings";
export const EDIT_DATASOURCE_MESSAGE = () =>
  "Edit datasource to access authentication settings";
export const OAUTH_ERROR = () => "OAuth Error";
export const OAUTH_2_0 = () => "OAuth 2.0";
export const ENABLE = () => "Enable";
export const UPGRADE = () => "Upgrade";
export const EDIT = () => "Edit";
export const CONFIGURE = () => "Configure";
export const UNEXPECTED_ERROR = () => "An unexpected error occurred";
export const EXPECTED_ERROR = () => "An error occurred";
export const NO_DATASOURCE_FOR_QUERY = () =>
  `Seems like you don’t have any Datasources to create a query`;
export const ACTION_EDITOR_REFRESH = () => "Refresh";
export const INVALID_FORM_CONFIGURATION = () => "Invalid form configuration";
export const ACTION_RUN_BUTTON_MESSAGE_FIRST_HALF = () => "🙌 Click on";
export const ACTION_RUN_BUTTON_MESSAGE_SECOND_HALF = () =>
  "after adding your query";
export const CREATE_NEW_DATASOURCE = () => "Create datasource";
export const CREATE_NEW_DATASOURCE_DATABASE_HEADER = () => "Databases";
export const CREATE_NEW_DATASOURCE_MOST_POPULAR_HEADER = () => "Most popular";
export const CREATE_NEW_DATASOURCE_REST_API = () => "REST API";
export const SAMPLE_DATASOURCES = () => "Sample datasources";
export const EDIT_DS_CONFIG = () => "Edit datasource configuration";

export const ERROR_EVAL_ERROR_GENERIC = () =>
  `Unexpected error occurred while evaluating the application`;

export const ERROR_EVAL_TRIGGER = (message: string) =>
  `Error occurred while evaluating trigger: ${message}`;

export const WIDGET_COPY = (widgetName: string) => `Copied ${widgetName}`;
export const ERROR_WIDGET_COPY_NO_WIDGET_SELECTED = () =>
  `Please select a widget to copy`;
export const ERROR_WIDGET_COPY_NOT_ALLOWED = () =>
  `This selected widget cannot be copied.`;
export const WIDGET_CUT = (widgetName: string) => `Cut ${widgetName}`;
export const ERROR_WIDGET_CUT_NO_WIDGET_SELECTED = () =>
  `Please select a widget to cut`;
export const ERROR_WIDGET_CUT_NOT_ALLOWED = () =>
  `This selected widget cannot be cut.`;
export const ERROR_PASTE_ANVIL_LAYOUT_SYSTEM_CONFLICT = () =>
  `Apps made with Anvil α are not compatible with widgets from the classic layout system`;
export const ERROR_PASTE_FIXED_LAYOUT_SYSTEM_CONFLICT = () =>
  `Apps using the classic layout system are not compatible with Anvil α widgets`;
export const SELECT_ALL_WIDGETS_MSG = () =>
  `All widgets in this page including modals have been selected`;
export const ERROR_ADD_WIDGET_FROM_QUERY = () => `Failed to add widget`;

export const REST_API_AUTHORIZATION_SUCCESSFUL = () =>
  "Authorization was successful!";
export const REST_API_AUTHORIZATION_FAILED = () =>
  "Authorization failed. Please check your details or try again.";
// Todo: improve this for appsmith_error error message
export const REST_API_AUTHORIZATION_APPSMITH_ERROR = () =>
  "Something went wrong.";

export const OAUTH_AUTHORIZATION_SUCCESSFUL = "Authorization was successful!";
export const OAUTH_AUTHORIZATION_FAILED =
  "Authorization failed. Please check your details or try again.";
// Todo: improve this for appsmith_error error message
export const OAUTH_AUTHORIZATION_APPSMITH_ERROR = "Something went wrong.";
export const OAUTH_APPSMITH_TOKEN_NOT_FOUND = "Appsmith token not found";

export const GSHEET_AUTHORIZATION_ERROR =
  "Authorisation failed, to continue using this data source authorize now.";
export const GSHEET_FILES_NOT_SELECTED =
  "Datasource does not have access to any files, please authorize google sheets to use this data source";
export const FILES_NOT_SELECTED_EVENT = () => "Files not selected";

export const LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE = () =>
  "Error saving a key in localStorage. You have exceeded the allowed storage size limit";
export const LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE = () =>
  "Error saving a key in localStorage. You have run out of disk space";
export const LOCAL_STORAGE_NOT_SUPPORTED_APP_MIGHT_NOT_WORK_AS_EXPECTED = () =>
  "LocalStorage is not supported on your device. Some features including the Appsmith store won't work.";

export const OMNIBAR_PLACEHOLDER = () =>
  `Search widgets, queries or create new`;
export const OMNIBAR_PLACEHOLDER_NAV = () => "Search widgets and queries";
export const CREATE_NEW_OMNIBAR_PLACEHOLDER = () =>
  "Create a new query, API or JS Object";
export const HELPBAR_PLACEHOLDER = () => "Search";
export const NO_SEARCH_DATA_TEXT = () => "No results found";

export const WIDGET_BIND_HELP = () =>
  "Having trouble taking inputs from widgets?";

export const BACK_TO_HOMEPAGE = () => "Go back to homepage";

// error pages
export const PAGE_NOT_FOUND_TITLE = () => "404";
export const PAGE_NOT_FOUND = () => "Page not found";
export const PAGE_SERVER_TIMEOUT_ERROR_CODE = () => "504";
export const PAGE_SERVER_TIMEOUT_TITLE = () =>
  "Appsmith server is taking too long to respond";
export const PAGE_SERVER_TIMEOUT_DESCRIPTION = () =>
  `Please retry after some time`;
export const PAGE_CLIENT_ERROR_TITLE = () => "Whoops something went wrong!";
export const PAGE_CLIENT_ERROR_DESCRIPTION = () =>
  "This is embarrassing, please contact Appsmith support for help";

export const PAGE_SERVER_UNAVAILABLE_ERROR_CODE = () => "503";

// Modules
export const CONVERT_MODULE_CTA_TEXT = () => "Create module";
export const CONVERT_MODULE_TO_NEW_PKG_OPTION = () => "Add to a new package";

// cloudHosting used in EE
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PAGE_SERVER_UNAVAILABLE_TITLE = (cloudHosting: boolean) =>
  "Appsmith server unavailable";

export const PAGE_SERVER_UNAVAILABLE_DESCRIPTION = () =>
  "Please try again later";

export const PAGE_SERVER_UNAVAILABLE_ERROR_MESSAGES = (
  cloudHosting: boolean,
): PageErrorMessageProps[] => {
  if (cloudHosting) {
    return [
      {
        text: "If the problem persists, please contact customer support",
        links: [
          {
            from: 40,
            to: 56,
            href: "mailto: support@appsmith.com?subject=Appsmith 503 Server Error",
          },
        ],
        addNewLine: true,
      },
    ];
  } else {
    return [
      {
        text: "If the problem persists, please contact your admin",
        addNewLine: true,
      },
      {
        text: "You can find more information on how to debug and access the logs here",
        links: [
          {
            from: 66,
            to: 70,
            href: "https://docs.appsmith.com/learning-and-resources/how-to-guides/how-to-get-container-logs",
          },
        ],
        addNewLine: true,
      },
      {
        text: "A quick view of the server logs is accessible here",
        links: [
          {
            from: 46,
            to: 50,
            href: "/supervisor/logtail/backend",
          },
        ],
      },
    ];
  }
};

// comments
export const POST = () => "Post";
export const CANCEL = () => "Cancel";
export const REMOVE = () => "Remove";
export const CREATE = () => "Create";

// Showcase Carousel
export const NEXT = () => "NEXT";
export const BACK = () => "BACK";
export const SKIP = () => "SKIP";

// Debugger
export const CLICK_ON = () => "🙌 Click on ";
export const PRESS = () => "🎉 Press ";
export const OPEN_THE_DEBUGGER = () => " to show/hide the debugger";
export const DEBUGGER_QUERY_RESPONSE_SECOND_HALF = () =>
  " to see more info in the debugger";
export const LOGS_FILTER_OPTION_ALL = () => "Show all logs";
export const LOGS_FILTER_OPTION_ERROR = () => "Error logs";
export const LOGS_FILTER_OPTION_CONSOLE = () => "Console logs";
export const LOGS_FILTER_OPTION_SYSTEM = () => "System logs";
export const NO_LOGS = () => "No logs to show";
export const NO_ERRORS = () => "No signs of trouble here!";
export const DEBUGGER_ERRORS = () => "Linter";
export const DEBUGGER_RESPONSE = () => "Response";
export const DEBUGGER_HEADERS = () => "Headers";
export const DEBUGGER_LOGS = () => "Logs";

export const INSPECT_ENTITY = () => "Inspect entity";
export const INSPECT_ENTITY_BLANK_STATE = () => "Select an entity to inspect";
export const VALUE_IS_INVALID = (propertyPath: string) =>
  `The value at ${propertyPath} is invalid`;
export const ACTION_CONFIGURATION_UPDATED = () => "Configuration updated";
export const WIDGET_PROPERTIES_UPDATED = () => "Widget properties were updated";
export const EMPTY_RESPONSE_FIRST_HALF = () => "🙌 Click on";
export const EMPTY_RESPONSE_LAST_HALF = () => "to get a response";
export const EMPTY_RESPONSE_RUN = () => "Click ‘Run’ to get a response";
export const EMPTY_JS_RESPONSE_LAST_HALF = () =>
  "to view response of selected function";
export const INVALID_EMAIL = () => "Please enter a valid email";
export const DEBUGGER_INTERCOM_TEXT = (text: string) =>
  `Hi, \nI'm facing the following error on Appsmith, can you please help? \n\n${text}`;
export const DEBUGGER_TRIGGER_ERROR = (propertyName: string) =>
  `Error occurred while evaluating trigger ${propertyName}`;

export const TROUBLESHOOT_ISSUE = () => "Troubleshoot issue";
export const DEBUGGER_OPEN_DOCUMENTATION = () => "Open documentation";
export const DEBUGGER_SEARCH_SNIPPET = () => "Browse code snippets";
export const DEBUGGER_APPSMITH_SUPPORT = () => "Get Appsmith support";

//action creator menu
export const NO_ACTION = () => `No action`;
export const EXECUTE_A_QUERY = () => `Execute a query`;
export const NAVIGATE_TO = () => `Navigate to`;
export const SHOW_ALERT = () => `Show alert`;
export const SHOW_MODAL = () => `Show modal`;
export const CLOSE_MODAL = () => `Close modal`;
export const CLOSE = () => `Close`;
export const STORE_VALUE = () => `Store value`;
export const REMOVE_VALUE = () => `Remove value`;
export const CLEAR_STORE = () => `Clear store`;
export const DOWNLOAD = () => `Download`;
export const COPY_TO_CLIPBOARD = () => `Copy to clipboard`;
export const RESET_WIDGET = () => `Reset widget`;
export const EXECUTE_JS_FUNCTION = () => `Execute a JS function`;
export const SET_INTERVAL = () => `Set interval`;
export const CLEAR_INTERVAL = () => `Clear interval`;
export const GET_GEO_LOCATION = () => `Get geolocation`;
export const WATCH_GEO_LOCATION = () => `Watch geolocation`;
export const STOP_WATCH_GEO_LOCATION = () => `Stop watching geolocation`;
export const POST_MESSAGE = () => `Post message`;

//js actions
export const JS_ACTION_COPY_SUCCESS = (actionName: string, pageName: string) =>
  `${actionName} copied to page ${pageName} successfully`;
export const ERROR_JS_ACTION_COPY_FAIL = (actionName: string) =>
  `Error while copying ${actionName}`;
export const JS_ACTION_DELETE_SUCCESS = (actionName: string) =>
  `${actionName} deleted successfully`;
export const JS_ACTION_MOVE_SUCCESS = (actionName: string, pageName: string) =>
  `${actionName} moved to page ${pageName} successfully`;
export const ERROR_JS_ACTION_MOVE_FAIL = (actionName: string) =>
  `Error while moving ${actionName}`;
export const ERROR_JS_COLLECTION_RENAME_FAIL = (actionName: string) =>
  `Unable to update JS collection name to ${actionName}`;
export const PARSE_JS_FUNCTION_ERROR = (message: string) =>
  `Syntax error: ${message}`;

export const EXECUTING_FUNCTION = () => `Executing function`;
export const UPDATING_JS_COLLECTION = () => `Updating...`;
export const EMPTY_JS_OBJECT = () =>
  `Nothing to show, write some code to get response`;
export const EXPORT_DEFAULT_BEGINNING = () =>
  `Start object with export default`;
export const ACTION_EXECUTION_FAILED = (actionName: string) =>
  `The action "${actionName}" has failed.`;
export const JS_EXECUTION_TRIGGERED = () => "Function triggered";
export const JS_EXECUTION_SUCCESS = () => "Function executed";
export const JS_EXECUTION_FAILURE = () => "Function execution failed";
export const JS_EXECUTION_FAILURE_TOASTER = () =>
  "There was an error while executing function";
export const JS_SETTINGS_ONPAGELOAD = () => "Run function on page load (Beta)";
export const JS_SETTINGS_ONPAGELOAD_SUBTEXT = () =>
  "Will refresh data every time page is reloaded";
export const JS_SETTINGS_CONFIRM_EXECUTION = () =>
  "Request confirmation before calling function?";
export const JS_SETTINGS_CONFIRM_EXECUTION_SUBTEXT = () =>
  "Ask confirmation from the user every time before refreshing data";
export const JS_SETTINGS_EXECUTE_TIMEOUT = () =>
  "Function timeout (in milliseconds)";
export const FUNCTION_SETTINGS_HEADING = () => "Function settings";
export const NO_JS_FUNCTIONS = () => "There is no function in this JS Object";
export const NO_JS_FUNCTION_TO_RUN = (JSObjectName: string) =>
  `${JSObjectName} has no function`;
export const NO_JS_FUNCTION_RETURN_VALUE = (JSFunctionName: string) =>
  `${JSFunctionName} did not return any data. Did you add a return statement?`;
export const MORE_ON_QUERY_SETTINGS = () => "More on query settings";

export const REMOVE_CONFIRM_BEFORE_CALLING_HEADING = () =>
  `Remove 'Confirm before calling' `;
export const REMOVE_CONFIRM_BEFORE_CALLING_DESCRIPTION =
  () => `By turning off this setting, you won't be able to undo or turn on this setting again,
as it has been deprecated. Are you sure you want to proceed?`;

// Import/Export Application features
export const ERROR_IMPORTING_APPLICATION_TO_WORKSPACE = () =>
  "Error importing application. No workspace found";
export const IMPORT_APPLICATION_MODAL_TITLE = () => "Import application";
export const IMPORT_APPLICATION_MODAL_LABEL = () =>
  "Where would you like to import your application from?";
export const IMPORT_FROM_GIT_DISABLED_IN_ANVIL = () =>
  "Importing from Git repositories is not yet supported in Anvil α";
export const IMPORT_APP_FROM_FILE_TITLE = () => "Import from file";
export const UPLOADING_JSON = () => "Uploading JSON file";
export const UPLOADING_APPLICATION = () => "Uploading application";
export const IMPORT_APP_FROM_GIT_TITLE = () =>
  "Import from Git repository (Beta)";
export const IMPORT_APP_FROM_FILE_MESSAGE = () =>
  "Drag and drop your file or upload from your computer";
export const IMPORT_APP_FROM_GIT_MESSAGE = () =>
  "Import an application from its Git repository using its SSH URL";
export const IMPORT_FROM_GIT_REPOSITORY = () => "Import from Git repository";
export const RECONNECT_MISSING_DATASOURCE_CREDENTIALS = () =>
  "Reconnect missing datasource credentials";
export const RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION = () =>
  "Fill these with utmost care as the application will not behave normally otherwise";
export const RECONNECT_DATASOURCE_SUCCESS_MESSAGE1 = () =>
  "These datasources were imported successfully!";
export const RECONNECT_DATASOURCE_SUCCESS_MESSAGE2 = () =>
  "Please fill up the missing datasources";
export const ADD_MISSING_DATASOURCES = () => "Add missing datasources";
export const SKIP_TO_APPLICATION_TOOLTIP_HEADER = () =>
  "This action is irreversible.";
export const SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION = () =>
  `Skip this step to configure datasources later`;
export const SKIP_TO_APPLICATION = () => "Go to application";
export const SKIP_CONFIGURATION = () => "Skip configuration";
export const SELECT_A_METHOD_TO_ADD_CREDENTIALS = () =>
  "Select a method to add credentials";
export const DELETE_CONFIRMATION_MODAL_TITLE = () => `Are you sure?`;
export const DELETE_CONFIRMATION_MODAL_SUBTITLE = (
  name?: string | null,
  entityType?: string,
) =>
  `You want to remove ${name} from this ${
    entityType === "Application" ? "application" : "workspace"
  }`;
export const PARSING_ERROR = () =>
  "Syntax error: Unable to parse code, please check error logs to debug";
export const PARSING_WARNING = () =>
  "Linting errors: Please resolve linting errors before using these functions";
export const JS_FUNCTION_CREATE_SUCCESS = () =>
  "New JS function added successfully";
export const JS_FUNCTION_UPDATE_SUCCESS = () =>
  "JS Function updated successfully";
export const JS_FUNCTION_DELETE_SUCCESS = () =>
  "JS function deleted successfully";
export const JS_OBJECT_BODY_INVALID = () => "JS Object could not be parsed";
export const JS_ACTION_EXECUTION_ERROR = (jsFunctionName: string) =>
  `An error occured while trying to execute ${jsFunctionName}, please check error logs to debug`;
//Editor Page
export const EDITOR_HEADER_SAVE_INDICATOR = () => "Saved";

//Import Application Succesful
export const IMPORT_APP_SUCCESSFUL = () => "Application imported successfully";
//Unable to import application in workspace
export const UNABLE_TO_IMPORT_APP = () =>
  "Unable to import application in workspace";
//
export const ERROR_IN_EXPORTING_APP = () =>
  "Error exporting application. Please try again.";
//undo redo
export const WIDGET_REMOVED = (widgetName: string) =>
  `${widgetName} is removed`;
export const WIDGET_ADDED = (widgetName: string) =>
  `${widgetName} is added back`;
export const BULK_WIDGET_REMOVED = (widgetName: string) =>
  `${widgetName} widgets are removed`;
export const BULK_WIDGET_ADDED = (widgetName: string) =>
  `${widgetName} widgets are added back`;

export const ACTION_CONFIGURATION_CHANGED = (name: string) =>
  `${name}'s configuration has changed`;

// Generate page from DB Messages

export const UNSUPPORTED_PLUGIN_DIALOG_TITLE = () =>
  `We could not auto-generate a page from this Datasource`;

export const UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE = () =>
  `You can continue building your app with it using our drag & drop builder`;
export const UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING = () =>
  `Issue with auto generation`;

export const BUILD_FROM_SCRATCH_ACTION_SUBTITLE = () =>
  "Start from scratch and create your custom UI";

export const BUILD_FROM_SCRATCH_ACTION_TITLE = () => "Build with drag & drop";

export const GENERATE_PAGE_ACTION_TITLE = () => "Generate page with data";

export const GENERATE_PAGE_FORM_TITLE = () =>
  "Generate a page based on your data";
export const GENERATE_PAGE_FORM_SUB_TITLE = () =>
  "Use your datasource's schema to generate a simple CRUD page.";

export const GEN_CRUD_SUCCESS_MESSAGE = () =>
  "Hurray! Your application is ready for use.";
export const GEN_CRUD_INFO_DIALOG_TITLE = () => "How it works?";
export const GEN_CRUD_INFO_DIALOG_SUBTITLE = () =>
  "CRUD page is generated from selected datasource. You can use the form to modify data. Since all your data is already connected, you can add more queries and modify the bindings";
export const GEN_CRUD_COLUMN_HEADER_TITLE = () => "Column headers fetched";
export const GEN_CRUD_NO_COLUMNS = () => "No columns found";
export const GEN_CRUD_DATASOURCE_DROPDOWN_LABEL = () => "Select datasource";
export const GEN_CRUD_TABLE_HEADER_LABEL = () => "Table header index";
export const GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC = () =>
  "Row index of the column headers in the sheet table";
// Actions Right pane
export const SEE_CONNECTED_ENTITIES = () => "See all connected entities";
export const INCOMING_ENTITIES = () => "Incoming entities";
export const NO_INCOMING_ENTITIES = () => "No incoming entities";
export const OUTGOING_ENTITIES = () => "Outgoing entities";
export const NO_OUTGOING_ENTITIES = () => "No outgoing entities";
export const NO_CONNECTIONS = () => "No connections to show here";
export const BACK_TO_CANVAS = () => "Back to canvas";
export const SUGGESTED_WIDGET_DESCRIPTION = () =>
  "This will add a new widget to the canvas.";
export const ADD_NEW_WIDGET = () => "Add a widget";
export const SUGGESTED_WIDGETS = () => "Suggested widgets";
export const SUGGESTED_WIDGET_TOOLTIP = () => "Add to canvas";
export const WELCOME_TOUR_STICKY_BUTTON_TEXT = () => "Next mission";
export const BINDING_SECTION_LABEL = () => "Bindings";
export const ADD_NEW_WIDGET_SUB_HEADING = () =>
  "Select how you want to display data.";
export const CONNECT_EXISTING_WIDGET_LABEL = () => "Select a widget";
export const CONNECT_EXISTING_WIDGET_SUB_HEADING = () =>
  "Replace the data of an existing widget";
export const NO_EXISTING_WIDGETS = () => "Display data in a new widget";
export const BINDING_WALKTHROUGH_TITLE = () => "Display your data";
export const BINDING_WALKTHROUGH_DESC = () =>
  "You can replace data of an existing widget of your page or you can select a new widget.";
export const BINDINGS_DISABLED_TOOLTIP = () =>
  "You can display data when you have a successful response to your query";

// Data Sources pane
export const EMPTY_ACTIVE_DATA_SOURCES = () => "No active datasources found.";

// Datasource structure

export const SCHEMA_NOT_AVAILABLE = () =>
  "We can't show schema for this datasource";
export const TABLE_NOT_FOUND = () => "Table not found.";
export const DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT = (name: string) =>
  `Search tables in ${name}`;
export const SCHEMA_LABEL = () => "Schema";
export const STRUCTURE_NOT_FETCHED = () =>
  "We could not fetch the schema of the database.";
export const TEST_DATASOURCE_AND_FIX_ERRORS = () =>
  "Test the datasource and fix the errors.";
export const LOADING_SCHEMA = () => "Loading schema...";
export const SCHEMA_WALKTHROUGH_TITLE = () => "Query data fast";
export const SCHEMA_WALKTHROUGH_DESC = () =>
  "Select a template from a database table to quickly create your first query. ";
export const SUGGESTED_TAG = () => "Suggested";

// structure - View Mode

export const DATASOURCE_VIEW_DATA_TAB = () => "View data";
export const DATASOURCE_CONFIGURATIONS_TAB = () => "Configurations";
export const DATASOURCE_NO_RECORDS_TO_SHOW = () => "No data records to show";

// Git sync
export const CONNECTED_TO_GIT = () => "Connected to Git";

export const GIT_DISCONNECT_POPUP_TITLE = () =>
  `This will disconnect the Git repository from this application`;

export const GIT_DISCONNECT_POPUP_SUBTITLE = () =>
  `Git features will no more be shown for this application`;
export const GIT_DISCONNECT_POPUP_MAIN_HEADING = () => `Are you sure?`;

export const CONFIGURE_GIT = () => "Configure Git";
export const IMPORT_APP = () => "Import app via Git";
export const SETTINGS_GIT = () => "Settings";
export const IMPORT_APP_CTA = () => "Import app";

export const GIT_CONNECTION = () => "Git connection";
export const GIT_IMPORT = () => "Git import";
export const MERGE = () => "Merge";
export const GIT_SETTINGS = () => "Git settings";
export const CONNECT_TO_GIT = () => "Connect to Git repository";
export const CONNECT_TO_GIT_SUBTITLE = () =>
  "Checkout branches, make commits, and deploy your application";
export const REMOTE_URL = () => "Remote URL";
export const REMOTE_URL_INFO = () =>
  `Create an empty Git repository and paste the remote URL here.`;
export const IMPORT_URL_INFO = () => `Paste the remote URL here:`;
export const REMOTE_URL_VIA = () => "Remote URL via";

export const USER_PROFILE_SETTINGS_TITLE = () => "User settings";
export const GIT_USER_SETTINGS_TITLE = () => "Git author";

export const USE_DEFAULT_CONFIGURATION = () => "Use default configuration";
export const AUTHOR_NAME_ONLY = () => "Name";
export const AUTHOR_EMAIL_ONLY = () => "E-mail";
export const AUTHOR_NAME = () => "Author name";
export const AUTHOR_EMAIL = () => "Author email";
export const AUTHOR_NAME_CANNOT_BE_EMPTY = () => "Author name cannot be empty";
export const AUTHOR_EMAIL_CANNOT_BE_EMPTY = () =>
  "Author email cannot be empty";

export const NAME_YOUR_NEW_BRANCH = () => "Name your new branch";
export const SWITCH_BRANCHES = () => "Switch branches";

export const DOCUMENTATION = () => "Documentation";
export const DOCUMENTATION_TOOLTIP = () => "Open docs in new tab";
export const CONNECT = () => "Connect";
export const LATEST_DP_TITLE = () => "Latest deployed preview";
export const LATEST_DP_SUBTITLE = () => "last deployed";
export const CHECK_DP = () => "CHECK";
export const DEPLOY_TO_CLOUD = () => "Deploy to cloud";
export const DEPLOY_WITHOUT_GIT = () =>
  "Deploy your application without version control";
export const COMMIT_CHANGES = () => "Commit changes";
export const COMMIT_TO = () => "Commit to";
export const COMMIT_AND_PUSH = () => "Commit & push";
export const PULL_CHANGES = () => "Pull changes";
export const REGENERATE_SSH_KEY = (keyType: string, keySize: number) =>
  `Regenerate ${keyType} ${keySize} key`;
export const GENERATE_SSH_KEY = (keyType: string, keySize: number) =>
  `${keyType} ${keySize} key`;
export const SSH_KEY_PLATFORM = (name: string) => ` (${name})`;
export const SSH_KEY = () => "SSH key";
export const COPY_SSH_KEY = () => "Copy SSH key";
export const SSH_KEY_GENERATED = () => "SSH key generated";
export const REGENERATE_KEY_CONFIRM_MESSAGE = () =>
  "This might cause the application to break. This key needs to be updated in your Git repository too!";
export const DEPLOY_KEY_USAGE_GUIDE_MESSAGE = () =>
  "Paste this key in your repository settings and give it write access.";
export const COMMITTING_AND_PUSHING_CHANGES = () =>
  "Committing and pushing changes...";
export const DISCARDING_AND_PULLING_CHANGES = () =>
  "Discarding and pulling changes...";
export const DISCARD_SUCCESS = () => "Discarded changes successfully.";
export const DISCARD_AND_PULL_SUCCESS = () => "Pulled from remote successfully";

export const IS_MERGING = () => "Merging changes...";

export const MERGE_CHANGES = () => "Merge changes";
export const SELECT_BRANCH_TO_MERGE = () => "Select branch to merge";
export const CONNECT_GIT = () => "Connect Git";
export const CONNECT_GIT_BETA = () => "Connect Git (Beta)";
export const RETRY = () => "Retry";
export const CREATE_NEW_BRANCH = () => "Create new branch";
export const ERROR_WHILE_PULLING_CHANGES = () => "ERROR WHILE PULLING CHANGES";
export const SUBMIT = () => "Submit";
export const GIT_USER_UPDATED_SUCCESSFULLY = () =>
  "Git user updated successfully";
export const REMOTE_URL_INPUT_PLACEHOLDER = () =>
  "git@example.com:user/repository.git";
export const GIT_COMMIT_MESSAGE_PLACEHOLDER = () => "Your commit message here";
export const INVALID_USER_DETAILS_MSG = () => "Please enter valid user details";
export const PASTE_SSH_URL_INFO = () =>
  "Please enter a valid SSH URL of your repository";
export const GENERATE_KEY = () => "Generate key";
export const UPDATE_CONFIG = () => "Update config";
export const CONNECT_BTN_LABEL = () => "Connect";
export const IMPORT_BTN_LABEL = () => "Import";
export const FETCH_GIT_STATUS = () => "Fetching status...";
export const FETCH_MERGE_STATUS = () => "Checking mergeability...";
export const NO_MERGE_CONFLICT = () =>
  "This branch has no conflicts with the base branch.";
export const MERGE_CONFLICT_ERROR = () => "Merge conflicts found!";
export const FETCH_MERGE_STATUS_FAILURE = () => "Unable to fetch merge status";
export const GIT_UPSTREAM_CHANGES = () =>
  "Looks like there are pending upstream changes. We will pull the changes and push them to your repository.";
export const GIT_CONFLICTING_INFO = () =>
  "Please resolve the merge conflicts manually on your repository.";
export const CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES = () =>
  "You have uncommitted changes. Please commit or discard before pulling the remote changes.";
export const CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES = () =>
  "Your current branch has uncommitted changes. Please commit them before proceeding to merge.";

export const DISCONNECT_SERVICE_SUBHEADER = () =>
  "Changes to this section can disrupt user authentication. Proceed with caution.";
export const DISCONNECT_SERVICE_WARNING = () =>
  "will be removed as primary method of authentication";
export const AUTHENTICATION_METHOD_ENABLED = (methodName: string) => `
  ${methodName} authentication is enabled
`;

export const REVOKE_EXISTING_REPOSITORIES = () =>
  "Revoke existing repositories";
export const REVOKE_EXISTING_REPOSITORIES_INFO = () =>
  "To make space for newer repositories, you can remove existing repositories.";
export const CONTACT_SUPPORT = () => "Contact support";
export const CONTACT_SALES_MESSAGE_ON_INTERCOM = (workspaceName: string) =>
  `Hey there, thanks for getting in touch! We understand that you’d like to extend the number of private repos for your ${workspaceName}. Could you tell us how many private repositories you require and why? We'll get back to you in a short while.`;
export const REPOSITORY_LIMIT_REACHED = () => "Repository limit reached";
export const REPOSITORY_LIMIT_REACHED_INFO = () =>
  "Adding and using upto 3 repositories is free. To add more repositories, kindly upgrade.";
export const APPLICATION_IMPORT_SUCCESS = () =>
  `Your application is ready to use.`;
export const APPLICATION_IMPORT_SUCCESS_DESCRIPTION = () =>
  "All your datasources are configured and ready to use.";
export const NONE_REVERSIBLE_MESSAGE = () =>
  "This action is non-reversible. Please proceed with caution.";
export const CONTACT_SUPPORT_TO_UPGRADE = () =>
  "Please contact support to upgrade. You can add unlimited private repositories in upgraded plan.";
export const REVOKE_CAUSE_APPLICATION_BREAK = () =>
  "Revoking your repository might cause the application to break.";
export const REVOKE_GIT = () => "Revoke access";
export const DISCONNECT = () => "Disconnect";
export const REVOKE = () => "Revoke";
export const REVOKE_ACCESS = () => "Revoke Access";
export const GIT_DISCONNECTION_SUBMENU = () => "Git Connection > Disconnect";
export const DISCONNECT_FROM_GIT = (name: string) =>
  `Disconnect ${name} from Git`;
export const GIT_REVOKE_ACCESS = (name: string) => `Revoke access to ${name}`;
export const GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS = (name: string) =>
  `Type “${name}” in the input box to revoke access.`;
export const APPLICATION_NAME = () => "Application name";
export const OPEN_REPO = () => "Open repository";
export const CONNECTING_REPO = () => "Connecting to Git repository";
export const IMPORTING_APP_FROM_GIT = () => "Importing application from Git";
export const CONFIRM_SSH_KEY = () =>
  "Please make sure your SSH key has write access.";
export const READ_DOCUMENTATION = () => "Read documentation";
export const LEARN_MORE = () => "Learn more";

export const I_UNDERSTAND = () => "I understand";
export const GIT_NO_UPDATED_TOOLTIP = () => "No new updates to push";

export const FIND_OR_CREATE_A_BRANCH = () => "Find or create a branch";
export const SYNC_BRANCHES = () => "Sync branches";

export const CONFLICTS_FOUND = () =>
  "Conflicts found. Please resolve them and pull again.";
export const UNCOMMITTED_CHANGES = () => "You have uncommitted changes";
export const NO_COMMITS_TO_PULL = () =>
  "No commits to pull. This branch is in sync with the remote repository";
export const CONFLICTS_FOUND_WHILE_PULLING_CHANGES = () =>
  "Conflicts found while pulling changes.";
export const NOT_LIVE_FOR_YOU_YET = () => "It's not live for you yet";
export const COMING_SOON = () => "Coming Soon!";
export const CONNECTING_TO_REPO_DISABLED = () =>
  "Connecting to a Git repository is disabled";
export const DURING_ONBOARDING_TOUR = () => "during the onboarding tour";
export const MERGED_SUCCESSFULLY = () => "Merged successfully";
export const DISCARD_CHANGES_WARNING = () =>
  "This action will replace your local changes with the latest remote version.";
export const DISCARD_CHANGES = () => "Discard & pull";

// GIT DEPLOY begin
export const DEPLOY = () => "Deploy";
export const DEPLOY_YOUR_APPLICATION = () => "Deploy your application";
export const CHANGES_APP_SETTINGS = () => "Application settings modified";
export const CHANGES_THEME = () => "Theme modified";
export const CHANGES_SINCE_LAST_DEPLOYMENT = () =>
  "Changes since last deployment";
export const CHANGES_ONLY_USER = () => "Changes since last commit";
export const CHANGES_MADE_SINCE_LAST_COMMIT = () =>
  "Changes made since last commit";
export const CHANGES_ONLY_MIGRATION = () =>
  "Appsmith update changes since last commit";
export const CHANGES_USER_AND_MIGRATION = () =>
  "Appsmith update and user changes since last commit";
export const CURRENT_PAGE_DISCARD_WARNING = (page: string) =>
  `Current page (${page}) is in the discard list.`;
export const DISCARD_MESSAGE = () =>
  `Some changes may reappear after discarding them, these changes support new features in Appsmith. You can safely commit them to your repository.`;
// GIT DEPLOY end

// GIT CHANGE LIST begin
export const CHANGES_FROM_APPSMITH = () =>
  "Some changes are platform upgrades from Appsmith.";
export const TRY_TO_PULL = () =>
  "We will try to pull before pushing your changes.";
export const NOT_PUSHED_YET = () =>
  "These are the commits that haven't been pushed to remote yet.";
// GIT CHANGE LIST end

// GIT DELETE BRANCH begin
export const DELETE = () => "Delete";
export const LOCAL_BRANCHES = () => "Local branches";
export const REMOTE_BRANCHES = () => "Remote branches";

export const DELETE_BRANCH_SUCCESS = (branchName: string) =>
  `Successfully deleted branch: ${branchName}`;

// warnings
export const DELETE_BRANCH_WARNING_CHECKED_OUT = (currentBranchName: string) =>
  `Cannot delete checked out branch. Please check out other branch before deleting ${currentBranchName}.`;
export const DELETE_BRANCH_WARNING_DEFAULT = (defaultBranchName: string) =>
  `Cannot delete default branch: ${defaultBranchName}`;
// GIT DELETE BRANCH end

// GIT ERRORS begin
export const ERROR_GIT_AUTH_FAIL = () =>
  "Please make sure that regenerated SSH key is added and has write access to the repository.";
export const ERROR_GIT_INVALID_REMOTE = () =>
  "Either the remote repository doesn't exist or is unreachable.";
// GIT ERRORS end

// Git Connect V2
export const CHOOSE_A_GIT_PROVIDER_STEP = () => "Choose a Git provider";
export const GENERATE_SSH_KEY_STEP = () => "Generate SSH key";
export const ADD_DEPLOY_KEY_STEP = () => "Add deploy key";
export const CHOOSE_GIT_PROVIDER_QUESTION = () =>
  "To begin with, choose your Git service provider";
export const IS_EMPTY_REPO_QUESTION = () =>
  "Do you have an existing empty repository to connect to Git?";
export const HOW_TO_CREATE_EMPTY_REPO = () => "How to create a new repository?";
export const IMPORT_APP_IF_NOT_EMPTY = () =>
  "If you already have an app connected to Git, you can import it to the workspace.";
export const IMPORT_ARTIFACT_IF_NOT_EMPTY = (artifactType: string) =>
  `If you already have an ${artifactType.toLocaleLowerCase()} connected to Git, you can import it to the workspace.`;
export const I_HAVE_EXISTING_ARTIFACT_REPO = (artifactType: string) =>
  `I have an existing appsmith ${artifactType.toLocaleLowerCase()} connected to Git`;
export const I_HAVE_EXISTING_REPO = () =>
  "I have an existing appsmith app connected to Git";
export const ERROR_REPO_NOT_EMPTY_TITLE = () =>
  "The repo you added isn't empty";
export const ERROR_REPO_NOT_EMPTY_MESSAGE = () =>
  "Kindly create a new repository and provide its remote SSH URL here. We require an empty repository to continue.";
export const READ_DOCS = () => "Read Docs";
export const COPY_SSH_URL_MESSAGE = () =>
  "To generate the SSH Key, in your repo, copy the Remote SSH URL & paste it in the input field below.";
export const REMOTE_URL_INPUT_LABEL = () => "Remote SSH URL";
export const HOW_TO_COPY_REMOTE_URL = () =>
  "How to copy & paste SSH remote URL";
export const ERROR_SSH_KEY_MISCONF_TITLE = () => "SSH key misconfiguration";
export const ERROR_SSH_KEY_MISCONF_MESSAGE = () =>
  "It seems that your SSH key hasn't been added to your repository. To proceed, please revisit the steps below and configure your SSH key correctly.";
export const ADD_DEPLOY_KEY_STEP_TITLE = () =>
  "Add deploy key & give write access";
export const HOW_TO_ADD_DEPLOY_KEY = () =>
  "How to paste SSH Key in repo and give write access?";
export const CONSENT_ADDED_DEPLOY_KEY = () =>
  "I've added the deploy key and gave it write access";
export const PREVIOUS_STEP = () => "Previous step";
export const GIT_AUTHOR = () => "Git author";
export const DISCONNECT_GIT = () => "Disconnect Git";
export const DISCONNECT_GIT_MESSAGE = () =>
  "This is irreversible. If you wish to reconnect, you will have to connect a new empty repository.";
export const AUTOCOMMIT = () => "Auto - commit";
export const AUTOCOMMIT_MESSAGE = () =>
  "Enable/disable auto migrations from Appsmith.";
export const AUTOCOMMIT_ENABLE = () => "Enable auto - commit";
export const AUTOCOMMIT_DISABLE = () => "Disable auto - commit";
export const AUTOCOMMIT_CONFIRM_DISABLE_MESSAGE = () =>
  "Disabling auto-commit may result in uncommitted system changes after an Appsmith instance upgrade, requiring manual handling and potential discrepancies in Git versioning.";
export const AUTOCOMMIT_IN_PROGRESS_MESSAGE = () =>
  "Auto-committing Appsmith upgrade changes...";
export const AUTOCOMMIT_ENABLED_TOAST = () =>
  "Auto-commit enabled successfully";
export const AUTOCOMMIT_DISABLED_TOAST = () =>
  "Auto-commit disabled successfully";
export const NEED_EMPTY_REPO_MESSAGE = () =>
  "You need an empty repository to connect to Git on Appsmith, please create one on your Git service provider to continue.";
export const GIT_IMPORT_WAITING = () =>
  "Please wait while we import the app...";
export const GIT_CONNECT_WAITING = () =>
  "Please wait while we connect to Git...";
export const CONNECT_GIT_TEXT = () => "Connect Git";
export const ERROR_SSH_RECONNECT_MESSAGE = () =>
  "We couldn't connect to the repo due to a missing deploy key. You can fix this in two ways:";
export const ERROR_SSH_RECONNECT_OPTION1 = () =>
  "Copy the SSH key below and add it to your repository.";
export const ERROR_SSH_RECONNECT_OPTION2 = () =>
  "If you want to connect a new repository, you can disconnect and do that instead.";
export const COPIED_SSH_KEY = () => "Copied SSH key";
export const NO_COPIED_SSH_KEY = () => "Could not copy SSH key";
// Git Connect V2 end

// Git Branch Protection
export const UPDATE = () => "Update";
export const DEFAULT_BRANCH = () => "Default branch";
export const DEFAULT_BRANCH_DESC = () =>
  "This is the base branch of the app. Users launching the app from the dashboard will see the deployed version from this branch.";
export const BRANCH_PROTECTION = () => "Branch protection";
export const BRANCH_PROTECTION_DESC = () =>
  "Protected branches enable you to enforce Git workflows. Changes to the app are not allowed in the protected branches.";
export const GO_TO_SETTINGS = () => "Go to settings";
export const NOW_PROTECT_BRANCH = () =>
  "You can now protect your default branch.";
export const APPSMITH_ENTERPRISE = () => "Appsmith Enterprise";
export const PROTECT_BRANCH_SUCCESS = () => "Changed protected branches";
export const UPDATE_DEFAULT_BRANCH_SUCCESS = (branchName: string) =>
  `Updated default branch ${!!branchName ? `to ${branchName}` : ""}`;
export const CONTACT_ADMIN_FOR_GIT = () =>
  "Please contact your workspace admin to connect your app to a git repo";
export const BRANCH_PROTECTION_CALLOUT_MSG = () =>
  "The branch is protected; please switch to or create a new branch to edit the app.";
export const BRANCH_PROTECTION_CALLOUT_CREATE_BRANCH = () =>
  "Create new branch";
export const BRANCH_PROTECTION_CALLOUT_UNPROTECT = () => "Unprotect branch";
export const BRANCH_PROTECTION_CALLOUT_UNPROTECT_LOADING = () =>
  "Unprotecting branch ...";
export const BRANCH_PROTECTION_PROTECTED = () => "Protected";
// Git Branch Protection end

// Git Connection Success
export const GIT_CONNECT_SUCCESS_TITLE = () => "Successfully connected to Git";
export const GIT_CONNECT_SUCCESS_MESSAGE = () =>
  "Now you can start collaborating with your team members by committing, merging and deploying your app";
export const GIT_CONNECT_SUCCESS_ACTION_CONTINUE = () =>
  "Continue to edit application";
export const GIT_CONNECT_SUCCESS_ACTION_SETTINGS = () => "Protect your branch";
export const GIT_CONNECT_SUCCESS_PROTECTION_MSG = () =>
  "We recommend protecting your default branch to have a seamless collaboration.";
export const GIT_CONNECT_SUCCESS_REPO_NAME = () => "Repository name";
export const GIT_CONNECT_SUCCESS_DEFAULT_BRANCH = () => "Default branch";
export const GIT_CONNECT_SUCCESS_DEFAULT_BRANCH_TOOLTIP = () =>
  "This is the base branch of the app. Users launching the app from the dashboard will see the deployed version from this branch.";
export const GIT_CONNECT_SUCCESS_PROTECTION_DOC_CTA = () =>
  "Learn more about branch protection";
// Git Connection Success end

export const GENERAL = () => "General";
export const BRANCH = () => "Branch";

export const CONTINUOUS_DELIVERY = () => "Continuous delivery";
export const CONFIGURE_CD_TITLE = () => "Configure continuous delivery";
export const CONFIGURE_CD_DESC = () =>
  "To automatically trigger a pull when changes occur on the remote branch, consider upgrading to our enterprise plan for enhanced functionality";
export const TRY_APPSMITH_ENTERPRISE = () => "Try Appsmith Enterprise";

export const NAV_DESCRIPTION = () =>
  `Navigate to any page, widget or file across this project.`;
export const ACTION_OPERATION_DESCRIPTION = () =>
  `Create a new query, API or JS Object`;
export const TABLE_WIDGET_VALIDATION_ASSIST_PROMPT = () =>
  `Access the current cell using `;

export const TRIGGER_ACTION_VALIDATION_ERROR = (
  functionName: string,
  argumentName: string,
  expectedType: string,
  received: string,
) =>
  `${functionName} expected ${expectedType} for '${argumentName}' argument but received ${received}`;

// Comment card tooltips
export const MORE_OPTIONS = () => "More options";
export const ADD_REACTION = () => "Add reaction";
export const RESOLVE_THREAD = () => "Resolve thread";
export const RESOLVED_THREAD = () => "Resolved thread";
export const EMOJI = () => "Emoji";

// Sniping mode messages
export const SNIPING_SELECT_WIDGET_AGAIN = () =>
  "Unable to detect the widget, please select the widget again.";

export const SNIPING_NOT_SUPPORTED = () =>
  "Binding on selection is not supported for this type of widget!";

//First Time User Onboarding
//Checklist page
export enum ONBOARDING_CHECKLIST_ACTIONS {
  CONNECT_A_DATASOURCE = "Connect datasource",
  CREATE_A_QUERY = "Create a query",
  ADD_WIDGETS = "Add widgets",
  CONNECT_DATA_TO_WIDGET = "Connect data to widget",
  DEPLOY_APPLICATIONS = "Deploy application",
}

export const ONBOARDING_CHECKLIST_BANNER_HEADER = () =>
  "Amazing work! You’ve explored the basics of Appsmith";
export const ONBOARDING_CHECKLIST_BANNER_BODY = () =>
  "You can carry on here, or explore the homepage to see how your projects are stored.";
export const ONBOARDING_CHECKLIST_BANNER_BUTTON = () => "Explore homepage";
export const ONBOARDING_SKIPPED_FIRST_TIME_USER = () =>
  "Skipped onboarding tour";
export const ONBOARDING_CHECKLIST_HEADER = () => "👋 Welcome to Appsmith!";
export const ONBOARDING_CHECKLIST_BODY = () =>
  "Let’s get you started on your first application, explore Appsmith yourself or follow our guide below to discover what Appsmith can do.";
export const ONBOARDING_CHECKLIST_COMPLETE_TEXT = () => "complete";

export const SIGNPOSTING_POPUP_SUBTITLE = () =>
  "Here’s what you need to do to build your first app:";
export const SIGNPOSTING_SUCCESS_POPUP = {
  title: () => "🎉 Awesome! You’ve explored the basics of Appsmith",
  subtitle: () =>
    "You can carry on building the app from here on. If you are still not sure, checkout our documentation or try guided tour.",
};

export const ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE = {
  bold: () => "Connect to a datasource",
  normal: () => "So your UI can talk to your data.",
};

export const ONBOARDING_CHECKLIST_CREATE_A_QUERY = {
  bold: () => "Write your first query",
  normal: () => "To get the data to present in widgets",
};

export const ONBOARDING_CHECKLIST_ADD_WIDGETS = {
  bold: () => "Drop a widget on the canvas",
  normal: () => "To start building your UI",
};

export const ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET = {
  bold: () => "Connect queries and widgets",
  normal: () => "using query names in bindings {{}}",
};

export const ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS = {
  bold: () => "Deploy your application",
  normal: () => "To see your live app and share it with end-users.",
};

export const SIGNPOSTING_LAST_STEP_TOOLTIP = () => "Almost there!";
export const SIGNPOSTING_TOOLTIP = {
  DEFAULT: {
    content: () =>
      "Finish these 5 steps to learn the basics in-order to build an app & deploy it. This would take 5 mins of your time.",
  },
  CONNECT_A_DATASOURCE: {
    content: () => "Let's add a datasource",
  },
  CREATE_QUERY: {
    content: () => "Datasource connected. Let's write your first query now.",
  },
  ADD_WIDGET: {
    content: () => "The query seems fine, right? Let's build our UI next.",
  },
  CONNECT_DATA_TO_WIDGET: {
    content: () =>
      "That was easy. Connect the query you wrote in Step 2 to present data in this widget.",
  },
  DEPLOY_APPLICATION: {
    content: () =>
      "Deploy your app to see it live and share it with your users.",
  },
  DOCUMENTATION: {
    content: () => "Open documentation",
  },
};

export const ONBOARDING_CHECKLIST_FOOTER = () =>
  "Not sure where to start? Take the welcome tour";

export const ONBOARDING_TELEMETRY_POPUP = () =>
  "We only collect usage data to make Appsmith better for everyone. Visit admin settings to toggle this off.";

//Introduction modal
export const HOW_APPSMITH_WORKS = () =>
  "Here’s a quick overview of how Appsmith works. ";
export const ONBOARDING_INTRO_CONNECT_YOUR_DATABASE = () =>
  "Connect to your database or APIs";
export const DRAG_AND_DROP = () =>
  "Drag and drop pre-built widgets to build UI";
export const CUSTOMIZE_WIDGET_STYLING = () =>
  "Customise the styling of every widget. Then bind your data to the widget and use JS to write any logic.";
export const ONBOARDING_INTRO_PUBLISH = () =>
  "Publish & Share with permissions";
export const CHOOSE_ACCESS_CONTROL_ROLES = () =>
  "Instantly publish & share your apps with users. Choose from pre-defined access control roles.";
export const BUILD_MY_FIRST_APP = () => "Build on my own";
export const ONBOARDING_INTRO_FOOTER = () =>
  "Let’s start building your first application";
export const START_TUTORIAL = () => "Start tutorial";
export const WELCOME_TO_APPSMITH = () => "Welcome to Appsmith!";
export const QUERY_YOUR_DATABASE = () =>
  "Query your own database or API inside Appsmith. Write JS to construct dynamic queries.";
export const SIGNPOSTING_INFO_MENU = {
  documentation: () => "Open documentation",
};

//Statusbar
export const ONBOARDING_STATUS_STEPS_FIRST = () => "First, add a datasource";
export const ONBOARDING_STATUS_STEPS_FIRST_ALT = () => "Next, add a datasource";
export const ONBOARDING_STATUS_STEPS_SECOND = () => "Next, create a query";
export const ONBOARDING_STATUS_STEPS_THIRD = () => "Next, add a widget";
export const ONBOARDING_STATUS_STEPS_THIRD_ALT = () => "First, add a widget";
export const ONBOARDING_STATUS_STEPS_FOURTH = () =>
  "Next, connect data to widget";
export const ONBOARDING_STATUS_STEPS_FIVETH = () =>
  "Next, deploy your application";
export const ONBOARDING_STATUS_STEPS_SIXTH = () => "Completed 🎉";
export const ONBOARDING_STATUS_GET_STARTED = () => "Get started";

//Tasks
//1. datasource
export const ONBOARDING_TASK_DATASOURCE_HEADER = () =>
  "Start by adding your first datasource";
export const ONBOARDING_TASK_DATASOURCE_BODY = () =>
  "Adding a datasource makes creating applications more powerful. Don’t worry if you don’t have any data on hand, we have a sample dataset that you can use.";
export const ONBOARDING_TASK_DATASOURCE_BUTTON = () => "Add a datasource";
export const ONBOARDING_TASK_DATASOURCE_FOOTER_ACTION = () => "add a widget";
export const ONBOARDING_TASK_DATASOURCE_FOOTER = () => "first.";
//2. query
export const ONBOARDING_TASK_QUERY_HEADER = () => "Next, create a query";
export const ONBOARDING_TASK_QUERY_BODY = () =>
  "Great job adding a datasource! The next thing you can do is create a query on your data.";
export const ONBOARDING_TASK_QUERY_BUTTON = () => "Create a query";
export const ONBOARDING_TASK_QUERY_FOOTER_ACTION = () => "add a widget";
//2. widget
export const ONBOARDING_TASK_WIDGET_HEADER = () =>
  "Next, add a widget to start displaying data";
export const ONBOARDING_TASK_WIDGET_BODY = () =>
  "Great job adding a datasource! The next thing you can do is add widget to start visualizing your data.";
export const ONBOARDING_TASK_WIDGET_BUTTON = () => "Add a widget";
export const ONBOARDING_TASK_WIDGET_FOOTER_ACTION = () =>
  "deploy your application";
export const ONBOARDING_TASK_FOOTER = () => "Alternatively, you can also";

export const USE_SNIPPET = () => "Snippet";
export const SNIPPET_TOOLTIP = () => "Search code snippets";

//Welcome page
export const WELCOME_HEADER = () => "Almost there";
export const WELCOME_BODY = () => "Let's setup your account first";
export const WELCOME_ACTION = () => "Get started";
export const PRODUCT_UPDATES_CONFIRMATION_LABEL = () =>
  "I accept receiving security and product updates";

// API Editor
export const API_EDITOR_TAB_TITLES = {
  HEADERS: () => "Headers",
  PARAMS: () => "Params",
  BODY: () => "Body",
  PAGINATION: () => "Pagination",
  AUTHENTICATION: () => "Authentication",
  SETTINGS: () => "Settings",
};
export const ACTION_EXECUTION_MESSAGE = (actionType: string) =>
  `Sending the ${actionType} request`;
export const ACTION_EXECUTION_CANCEL = () => "Cancel request";

export const WELCOME_FORM_HEADER = () => "Let us get to know you better!";
export const WELCOME_FORM_FIRST_NAME = () => "First name";
export const WELCOME_FORM_LAST_NAME = () => "Last name";
export const WELCOME_FORM_EMAIL_ID = () => "Email";
export const WELCOME_FORM_CREATE_PASSWORD = () => "Enter password";
export const WELCOME_FORM_VERIFY_PASSWORD = () => "Verify password";
export const WELCOME_FORM_DATA_COLLECTION_HEADER = () =>
  "Usage data preference";
export const WELCOME_FORM_DATA_COLLECTION_BODY = () =>
  "Share anonymous usage data to help improve the product.";
export const WELCOME_FORM_DATA_COLLECTION_LINK = () => "See what is shared";
export const WELCOME_FORM_DATA_COLLECTION_LABEL_ENABLE = () =>
  "Share data & make Appsmith better!";
export const WELCOME_FORM_DATA_COLLECTION_LABEL_DISABLE = () =>
  "Don't share any data";
export const WELCOME_FORM_NEWLETTER_HEADER = () => "Stay in touch";
export const WELCOME_FORM_NEWLETTER_LABEL = () =>
  "Get updates about what we are cooking. We will not spam you.";
export const WELCOME_FORM_SUBMIT_LABEL = () => "Make your first app";

//help tooltips
export const ACCOUNT_TOOLTIP = () => "Your account";
export const RENAME_APPLICATION_TOOLTIP = () => "Rename application";
export const LOGO_TOOLTIP = () => "Back to homepage";
export const ADD_PAGE_TOOLTIP = () => "Add a new page";
export const ADD_DATASOURCE_TOOLTIP = () =>
  "Add datasource or create new query";
export const ADD_WIDGET_TOOLTIP = () => "Find and add a widget";
export const HELP_RESOURCE_TOOLTIP = () => "Help and resources";
export const COPY_ELEMENT = () => "Copy element";
export const SHOW_TEMPLATES = () => "Add a query";
export const LAYOUT_DROPDOWN_TOOLTIP = () =>
  "Choose how your application looks on desktop, tablet and mobile devices";
export const DEPLOY_BUTTON_TOOLTIP = () =>
  "Deploy the current version of the application";
export const SHARE_BUTTON_TOOLTIP = () => "Invite your team to Appsmith";
export const SHARE_BUTTON_TOOLTIP_WITH_USER = (length: number) => () =>
  `Shared with ${length} other`;
export const DEBUGGER_TOOLTIP = () => "Open Debugger";
export const PAGE_PROPERTIES_TOOLTIP = () => "Page properties";
export const CLEAR_LOG_TOOLTIP = () => "Clear logs";
export const ADD_JS_ACTION = () => "Add a new JS Object";
export const ENTITY_MORE_ACTIONS_TOOLTIP = () => "More actions";
export const NOTIFICATIONS_TOOLTIP = () => "Notifications";

// Navigation Menu
export const DEPLOY_MENU_OPTION = () => "Deploy";
export const CURRENT_DEPLOY_PREVIEW_OPTION = () => "Current deployed version";
export const CONNECT_TO_GIT_OPTION = () => "Connect to Git repository";
//
export const GO_TO_PAGE = () => "Go to page";
export const DEFAULT_PAGE_TOOLTIP = () => "Default page";
export const HIDDEN_TOOLTIP = () => "Hidden";
export const CLONE_TOOLTIP = () => "Clone";
export const DELETE_TOOLTIP = () => "Delete";
export const SETTINGS_TOOLTIP = () => "Settings";

//settings
export const ADMIN_SETTINGS = () => "Admin settings";
export const HELP = () => "Help";
export const RESTART_BANNER_BODY = () =>
  "Hang in there. This should be done soon.";
export const RESTART_BANNER_HEADER = () => "Restarting your server";
export const RESTART_ERROR_BODY = () =>
  "You can try restarting the server again for the settings to take place.";
export const RESTART_ERROR_HEADER = () => "Restarting failed";
export const RETRY_BUTTON = () => "Retry";
export const INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST = () =>
  "Hey! There is a new version of Appsmith available. Please consider refreshing your window.";
export const TEST_EMAIL_SUCCESS = (email: string) => () =>
  `Test email sent, please check the inbox of ${email}`;
export const TEST_EMAIL_SUCCESS_TROUBLESHOOT = () => "Troubleshoot";
export const TEST_EMAIL_FAILURE = () => "Sending test email failed";

export const ADMIN_SETTINGS_EMAIL_WARNING = () =>
  "Please ensure that the SMTP server is correctly configured. This will be used to send emails about forgot password and email verification.";
export const DISCONNECT_AUTH_ERROR = () =>
  "Cannot disconnect the only connected authentication method.";
export const MANDATORY_FIELDS_ERROR = () => "Mandatory fields cannot be empty";
export const FORM_LOGIN_DESC = () =>
  "Enable your workspace to sign in with Appsmith Form.";
export const GOOGLE_AUTH_DESC = () =>
  "Enable your workspace to sign in with Google (OAuth 2.0) single sign-on (SSO).";
export const GITHUB_AUTH_DESC = () =>
  "Enable your workspace to sign in with GitHub (OAuth 2.0) single sign-on (SSO).";
export const SAML_AUTH_DESC = () =>
  "Enable your workspace to sign in with your preferred SAML2 compliant provider.";
export const OIDC_AUTH_DESC = () =>
  "Enable your workspace to sign in with your preferred OIDC compliant provider.";
export const SAVE_BUTTON = () => "Save";
export const SAVE_AND_RESTART_BUTTON = () => "Save & Restart";
export const SAVE_AND_REFRESH_BUTTON = () => "Save & Refresh";
export const RESET_BUTTON = () => "Reset";
export const BUSINESS_TAG = () => "Business";
export const ENTERPRISE_TAG = () => "Enterprise";

// Upgrade pages begin
export const AVAILABLE_ON_BUSINESS = () => "Available on a business plan only";
export const EXCLUSIVE_TO_BUSINESS = (featureName: string) =>
  `The ${featureName} feature is exclusive to workspaces on the business plan`;
export const AVAILABLE_ON_ENTERPRISE = () => "Available on Appsmith Enterprise";
// Upgrade pages end

// Audit logs begin
export const AUDIT_LOGS = () => "Audit logs";
export const TRY_AGAIN_WITH_YOUR_FILTER = () => "Try again with your filter";

// Audit logs Upgrade page begin
export const INTRODUCING = (featureName: string) =>
  `Introducing ${featureName}`;
export const AUDIT_LOGS_UPGRADE_PAGE_SUB_HEADING = () =>
  "See a timestamped trail of events in your workspace. Filter by type of event, user, resource ID, and time. Drill down into each event to investigate further.";
export const SECURITY_AND_COMPLIANCE = () => "Security & compliance";
export const SECURITY_AND_COMPLIANCE_DETAIL1 = () =>
  "Proactively derisk misconfigured permissions, roll back changes from a critical security event, and keep checks against your compliance policies.";
export const SECURITY_AND_COMPLIANCE_DETAIL2 = () =>
  "Exports to popular compliance tools coming soon";
export const DEBUGGING = () => "Debugging";
export const DEBUGGING_DETAIL1 = () =>
  "Debug with a timeline of events filtered by user and resource ID, correlate them with end-user and app developer actions, and investigate back to the last known good state of your app.";
export const INCIDENT_MANAGEMENT = () => "Incident management";
export const INCIDENT_MANAGEMENT_DETAIL1 = () =>
  "Go back in time from an incident to see who did what, correlate events with breaking changes, and run RCAs to remediate incidents for now and the future.";
// Audit logs Upgrade page end
// Audit logs end

// Access control upgrade page begin
export const GRANULAR_ACCESS_CONTROL_FOR_TEAMS = () =>
  "granular access controls for teams";
export const ACCESS_CONTROL_UPGRADE_PAGE_SUB_HEADING = () =>
  "Control all permissions for all resources in your apps in a workspace. Manage permissions granularly by attributes. Use permissions and user groups to easily define access levels.";
export const SECURITY_APPS_LEAST_PRIVILEGE = () =>
  "Secure apps by the least privilege needed";
export const SECURITY_APPS_LEAST_PRIVILEGE_DETAIL1 = () =>
  `Create roles by the least privilege needed as defaults, <span>e.g.: View only</span>, assign them to users in groups, <span>e.g.: Marketing</span>, and modify for special access, <span>e.g.: Content creators_Execute queries</span>`;
export const PREVENT_ACCIDENTAL_DAMAGE = () =>
  "Prevent accidental damage to data";
export const PREVENT_ACCIDENTAL_DAMAGE_DETAIL1 = () =>
  `Assign edit and delete permissions to an entire group, then modify granularly so non-native users of your data don’t drop a table or bulk-delete streaming data records before you can say, “Retrieve”.`;
export const RESTRICT_PUBLIC_EXPOSURE = () =>
  "Restrict public exposure of sensitive data";
export const RESTRICT_PUBLIC_EXPOSURE_DETAIL1 = () =>
  "Proactively disallow groups of non-admin or non-super-admin users from publicly sharing your app or exporting app data out of your environment, domain, and security perimeters.";
export const ACCESS_CONTROL_UPGRADE_PAGE_FOOTER = () =>
  "Unlock granular access controls along with audit logs and SSO for enhanced security and reliability with an upgrade to our Business plan.";
// Access control upgrade page end

// Provisioning upgrade page begin
export const USER_PROVISIONING_FOR_ENTERPRISES = () =>
  "Manage Appsmith users via your identity provider";
export const PROVISIONING_UPGRADE_PAGE_SUB_HEADING = () =>
  `Add and remove Appsmith users centrally. Sync existing groups to Appsmith.`;
export const PROVISION_DEPROVISION_USERS = () =>
  "Provision and deprovision users from your IdP";
export const PROVISION_DEPROVISION_USERS_DETAIL1 = () =>
  `Control user authorization and access to Appsmith workspaces and apps via your IdP using the SCIM protocol.<div>&nbsp;</div><div><span style="font-style: italic;font-weight: normal;">More protocols coming soon</span></div>`;
export const AUTO_GROUP_SYNC = () => "Automatic group sync";
export const AUTO_GROUP_SYNC_DETAIL1 = () =>
  `Easily manage access for groups when you sync them to Appsmith from your IdP.`;
export const PROVISIONING_UPGRADE_PAGE_FOOTER = () =>
  "Secure your Appsmith apps with Granular Access Controls, Audit Logs, Custom SSO, and more on Appsmith Enterprise.";
// Provisioning upgrade page end

//
export const WELCOME_FORM_NON_SUPER_USER_ROLE_DROPDOWN = () =>
  "Tell us about your primary skillset";
export const WELCOME_FORM_NON_SUPER_USER_ROLE = () => "Role";
export const WELCOME_FORM_NON_SUPER_USER_USE_CASE = () =>
  "What would you like to use Appsmith for?";
export const WELCOME_FORM_NON_SUPER_USER_PROFICIENCY_LEVEL = () =>
  "What is your general development proficiency?";

export const WELCOME_FORM_PROFICIENCY_ERROR_MESSAGE = () =>
  "Please select a proficiency level";
export const WELCOME_FORM_USE_CASE_ERROR_MESSAGE = () =>
  "Please select an use case";

export const WELCOME_FORM_EMAIL_ERROR_MESSAGE = () =>
  "Enter a valid email address.";

export const WELCOME_FORM_STRONG_PASSWORD_ERROR_MESSAGE = () =>
  "Please enter a strong password.";

export const WELCOME_FORM_GENERIC_ERROR_MESSAGE = () =>
  "This field is required.";

export const WELCOME_FORM_PASSWORDS_NOT_MATCHING_ERROR_MESSAGE = () =>
  "Passwords don't match.";

export const QUERY_CONFIRMATION_MODAL_MESSAGE = () =>
  `Are you sure you want to run `;
export const ENTITY_EXPLORER_TITLE = () => "NAVIGATION";
export const MULTI_SELECT_PROPERTY_PANE_MESSAGE = () =>
  `Select a widget to see it's properties`;
export const WIDGET_MULTI_SELECT = () => "Multiple selected";
export const WIDGET_DEPRECATION_MESSAGE = (widgetName: string) =>
  `Drag the latest ${widgetName} to unlock new features and prevent end-of-life headaches for this widget.`;

export const LOCK_ENTITY_EXPLORER_MESSAGE = () => `Lock sidebar open`;
export const CLOSE_ENTITY_EXPLORER_MESSAGE = () => `Close sidebar`;
export const JS_TOGGLE_DISABLED_MESSAGE = "Clear the field to toggle back";
export const JS_TOGGLE_SWITCH_JS_MESSAGE =
  "Switch to JS mode to customize your data using javascript";
export const PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE =
  "No properties found based on your search";
export const PROPERTY_SEARCH_INPUT_PLACEHOLDER =
  "Search for controls, labels etc";
export const EXPLORER_BETA_ENTITY = () => "BETA";
export const BINDING_WIDGET_WALKTHROUGH_TITLE = () => "Widget properties";
export const BINDING_WIDGET_WALKTHROUGH_DESC = () =>
  `We’ve set the table data property for you. You can change it at anytime. The properties pane is a central hub for configuring widgets, allowing you to easily modify settings.`;

// API Pane
export const API_PANE_NO_BODY = () => "This request does not have a body";
export const API_PANE_AUTO_GENERATED_HEADER = () =>
  "This content-type header is auto-generated by appsmith based on body type of the API. Create a new header content-type to overwrite this value.";
export const API_PANE_DUPLICATE_HEADER = (headerName: string) =>
  `This is a duplicate header and will be overridden by the ${headerName} header added by you.`;

export const TABLE_WIDGET_TOTAL_RECORD_TOOLTIP = () =>
  "It stores the total no. of rows in the table. Helps in calculating the no. of pages that further allows to enable or disable the next/previous control in pagination.";
export const CREATE_DATASOURCE_TOOLTIP = () => "Add a new datasource";
export const ADD_QUERY_JS_TOOLTIP = () => "Add a new query/JS Object";
export const LIST_WIDGET_V2_TOTAL_RECORD_TOOLTIP = () =>
  "Count of all the records in the source data for the list. This helps us calculate the number of pages to be shown";

// Add datasource
export const GENERATE_APPLICATION_TITLE = () => "Generate page";
export const GENERATE_APPLICATION_DESCRIPTION = () =>
  "Quickly generate a page to perform CRUD operations on your database tables";
export const DELETE_WORKSPACE_SUCCESSFUL = () =>
  "Workspace deleted successfully";
// theming
export const CHANGE_APP_THEME = (name: string) => `Theme ${name} applied`;
export const SET_DEFAULT_SELECTED_THEME = (name: string) =>
  `Applied the ${name} theme, since custom theme was not found`;
export const SAVE_APP_THEME = (name: string) => `Theme ${name} saved`;
export const DELETE_APP_THEME = (name: string) => `Theme ${name} deleted`;
export const DELETE_APP_THEME_WARNING = () =>
  `Do you really want to delete this theme? This process cannot be undone.`;
export const APP_THEME_BETA_CARD_HEADING = () => `🎨 Theme your app`;
export const APP_THEME_BETA_CARD_CONTENT = () =>
  `Customize your app's look through global styles. Full widget support coming soon`;

export const UPGRADE_TO_EE = (authLabel: string) =>
  `Hello, I would like to upgrade and start using ${authLabel} authentication.`;
export const UPGRADE_TO_EE_FEATURE = (feature: string) =>
  `Hello, I would like to upgrade and start using the ${feature} feature.`;
export const UPGRADE_TO_EE_GENERIC = () => `Hello, I would like to upgrade`;
export const ADMIN_AUTH_SETTINGS_TITLE = () => "Authentication";
export const ADMIN_AUTH_SETTINGS_SUBTITLE = () =>
  "Select a protocol you want to authenticate users with";
export const DANGER_ZONE = () => "Danger zone";
export const DISCONNECT_AUTH_METHOD = () => "Disconnect";
export const DISCONNECT_CONFIRMATION = () => "Are you sure?";

// Branding
export const ADMIN_BRANDING_SETTINGS_TITLE_UPGRADE = () =>
  "Custom Branding for your workspaces";
export const ADMIN_BRANDING_SETTINGS_SUBTITLE_UPGRADE = () =>
  "Make your workspaces and apps look more yours in a few clicks as in the example below. Upload your logo and favicon, set your primary color, and preview the new look. To save a look you like, upgrade to our Business plan.";
export const ADMIN_BRANDING_COLOR_TOOLTIP = () =>
  `When you choose a primary color, we auto-magically fill in the secondary and accent colors. You can change them to get the look you want.`;
export const ADMIN_BRANDING_LOGO_SIZE_ERROR = () =>
  `Uploaded file must be less than 2MB`;
export const ADMIN_BRANDING_LOGO_DIMENSION_ERROR = () =>
  `Logo should  be atleast 256px in height`;
export const ADMIN_BRANDING_LOGO_FORMAT_ERROR = () =>
  `Uploaded file must be in .SVG .PNG, and .JPG formats`;
export const ADMIN_BRANDING_LOGO_REQUIREMENT = () =>
  `.SVG, .PNG, or .JPG only • Max 2MB`;
export const ADMIN_BRANDING_FAVICON_DIMENSION_ERROR = () =>
  `Uploaded file must have a max size of 32X32 pixels`;
export const ADMIN_BRANDING_FAVICON_SIZE_ERROR = () =>
  `Uploaded file must be less than 2MB`;
export const ADMIN_BRANDING_FAVICON_FORMAT_ERROR = () =>
  `Uploaded file must be in .ICO, .PNG, and .JPG formats`;
export const ADMIN_BRANDING_FAVICON_REQUIREMENT = () =>
  `.ICO, .PNG, or .JPG only • Max 32X32`;
export const ADMIN_BRANDING_COLOR_TOOLTIP_PRIMARY = () =>
  `Used on buttons, links, and other interactive elements.`;
export const ADMIN_BRANDING_COLOR_TOOLTIP_BACKGROUND = () =>
  `Used as background color for the auth pages`;
export const ADMIN_BRANDING_COLOR_TOOLTIP_HOVER = () =>
  `Used as hover color for the button.`;
export const ADMIN_BRANDING_COLOR_TOOLTIP_FONT = () =>
  `Used as text color for the buttons.`;
export const ADMIN_BRANDING_COLOR_TOOLTIP_DISABLED = () =>
  `Used as background color for disabled buttons.`;
export const ADMIN_BRANDING_UPGRADE_INTERCOM_MESSAGE = () =>
  `I would like to enable Custom Branding for my workspace and am interested in Appsmith Business.`;

// Guided tour
// -- STEPS ---
export const STEP_ONE_TITLE = () =>
  "First step is querying the database. Here we are querying a Postgres database populated with customers data.";
export const STEP_ONE_SUCCESS_TEXT = () =>
  "Excellent! You successfully queried the database and you can see the response of the query below. ";
export const STEP_ONE_BUTTON_TEXT = () => "Proceed to next step";
export const STEP_TWO_TITLE = () =>
  "Let’s display this response in a table. Select the table widget we’ve added for you.";
export const STEP_THREE_TITLE = () =>
  "Display the response of the query in a table.";
export const STEP_THREE_SUCCESS_TEXT = () =>
  "Great job! The table is now displaying the response of a query. You can use {{ }} in any input field to bind data to widgets.";
export const STEP_THREE_SUCCESS_BUTTON_TEXT = () => "Proceed to next step";
export const STEP_FOUR_TITLE = () =>
  "Let’s build a form to update a customer record ";
export const STEP_FOUR_HINT_BUTTON_TEXT = () => "Proceed";
export const STEP_FOUR_SUCCESS_TEXT = () =>
  "Awesome! You connected the input widget to table’s selected row. The input will always show the data from the selected row.";
export const STEP_FOUR_SUCCESS_BUTTON_TEXT = () => "Proceed to next step";
export const STEP_FIVE_TITLE = () =>
  "Connect all input fields in the Customer Update Form with the table";
export const STEP_FIVE_HINT_TEXT = () =>
  `Now let's connect rest of widgets in the container to the table's selected row`;
export const STEP_FIVE_SUCCESS_TEXT = () =>
  "Great work! All inputs are now connected to the table’s selected row";
export const STEP_FIVE_SUCCESS_BUTTON_TEXT = () => "Proceed to next step";
export const STEP_SIX_TITLE = () =>
  "Add an update button to trigger an update query";
export const STEP_SIX_SUCCESS_TEXT = () =>
  "Perfect! Your update button is ready to trigger an update query.";
export const STEP_SIX_SUCCESS_BUTTON_TEXT = () => "Proceed to next step";
export const STEP_SEVEN_TITLE = () =>
  "Trigger updateCustomerInfo query by binding to the button widget";
export const STEP_EIGHT_TITLE = () =>
  "After successfully triggering the update query, fetch the updated customer data. ";
export const STEP_EIGHT_SUCCESS_TEXT = () =>
  "Exceptional work! You’ve now built a way to see customer data and update it.";
export const STEP_NINE_TITLE = () => "Final step - test & deploy your app";
export const CONTINUE = () => "Continue";
export const PROCEED_TO_NEXT_STEP = () => "Proceed to next step";
export const PROCEED = () => "Proceed";
export const COMPLETE = () => "Complete";
// -- End Tutorial --
export const END_TUTORIAL = () => "End tutorial";
export const CANCEL_DIALOG = () => "Cancel";
// -- Intro content --
export const TITLE = () =>
  "In this tutorial we’ll build a tool to display customer information";
export const DESCRIPTION = () =>
  "This tool has a table that displays customer data and a form to update a particular customer record. Try out the tool below before you start building.";
export const BUTTON_TEXT = () => "Start building";
// -- Rating --
export const RATING_TITLE = () =>
  "Congratulations! You just built your first app in Appsmith.";
export const RATING_DESCRIPTION = () =>
  "You can now invite others to this application.";
export const RATING_TEXT = () => "Rate your experience";
// -- End Message --
export const END_TITLE = () => "What’s next? Start building your own apps.";
export const END_DESCRIPTION = () =>
  "Inspect properties of queries, components, etc.";
export const END_BUTTON_TEXT = () => "Start building an app";

export const CONTEXT_RENAME = () => "Rename";
export const CONTEXT_SHOW_BINDING = () => "Show bindings";
export const CONTEXT_MOVE = () => "Move to page";
export const CONTEXT_COPY = () => "Copy to page";
export const CONTEXT_DUPLICATE = () => "Duplicate";
export const CONTEXT_DELETE = () => "Delete";
export const CONFIRM_CONTEXT_DELETE = () => "Are you sure?";
export const CONFIRM_CONTEXT_DELETING = () => "Deleting";
export const CONTEXT_NO_PAGE = () => "No pages";
export const CONTEXT_REFRESH = () => "Refresh";
export const CONTEXT_CLONE = () => "Clone";
export const CONTEXT_SETTINGS = () => "Settings";
export const CONTEXT_PARTIAL_EXPORT = () => "Export";
export const CONTEXT_PARTIAL_IMPORT = () => "Import";
export const CONTEXT_SET_AS_HOME_PAGE = () => "Set as home page";
export const PAGE = () => "Page";
export const PAGES = () => "Pages";

// Entity explorer
export const ADD_DATASOURCE_BUTTON = () => "Add datasource";
export const ADD_WIDGET_BUTTON = () => "Add widget";
export const ADD_QUERY_JS_BUTTON = () => "Add query/JS";
export const EMPTY_WIDGET_MAIN_TEXT = () => "No widget to display";
export const EMPTY_WIDGET_BUTTON_TEXT = () => "New widget";
export const EMPTY_QUERY_JS_MAIN_TEXT = () => "No query/JS to display";
export const EMPTY_QUERY_JS_BUTTON_TEXT = () => "New query/JS";
export const EMPTY_DATASOURCE_MAIN_TEXT = () => "No datasource to display";
export const EMPTY_DATASOURCE_BUTTON_TEXT = () => "New datasource";
export const SEARCH_DATASOURCES = () => "Search datasources";

// Templates
export const MORE = () => "More";
export const SHOW_LESS = () => "Show less";
export const CHOOSE_WHERE_TO_FORK = () => "Choose where to fork the template";
export const SELECT_WORKSPACE = () => "Select workspace";
export const FORK_TEMPLATE = () => "Fork template";
export const TEMPLATES = () => "Templates";
export const FORK_THIS_TEMPLATE = () => "Use template";
export const FORK_THIS_TEMPLATE_BUILDING_BLOCK = () => "Use building block";
export const COULDNT_FIND_TEMPLATE = () =>
  "Couldn’t find what you are looking for?";
export const COULDNT_FIND_TEMPLATE_DESCRIPTION = () =>
  "Submit suggestions for templates you'd like to see or upvote requests raised by others and our team will work on it.";
export const REQUEST_TEMPLATE = () => "Request for a template";
export const REQUEST_BUILDING_BLOCK = () => "Request a building block";
export const SEARCH_TEMPLATES = () => "Search templates";
export const INTRODUCING_TEMPLATES = () => "Introducing templates";
export const TEMPLATE_NOTIFICATION_DESCRIPTION = () =>
  "Use these templates to learn, create, and build apps even faster";
export const GO_BACK = () => "Back";
export const OVERVIEW = () => "Overview";
export const FUNCTION = () => "Function";
export const INDUSTRY = () => "Use case";
export const DATASOURCES = () => "Datasources";
export const NOTE = () => "Note: ";
export const NOTE_MESSAGE = () => "You can add your datasources as well";
export const WIDGET_USED = () => "Widgets";
export const SIMILAR_TEMPLATES = () => "Similar templates";
export const VIEW_ALL_TEMPLATES = () => "View all templates";
export const FILTERS = () => "Filters";
export const FILTER_SELECTALL = () => "Select all";
export const FILTER_SELECT_PAGE = () => "Add selected page";
export const FILTER_SELECT_PAGES = () => "Add selected pages";
export const FORKING_TEMPLATE = () => "Setting up the template";
export const FETCHING_TEMPLATES = () => "Loading template details";
export const FETCHING_TEMPLATE_LIST = () => "Loading templates list";

export const TEMPLATES_BACK_BUTTON = () => "Back";
export const SKIP_START_WITH_USE_CASE_TEMPLATES = () =>
  "Skip this step, I’ll do it later";

export const IMAGE_LOAD_ERROR = () => "Unable to display the image";

export const REDIRECT_URL_TOOLTIP = () =>
  "This URL will be used while configuring your Identity Provider's Callback/Redirect URL";
export const ENTITY_ID_TOOLTIP = () =>
  "This URL will be used while configuring your Identity Provider's Entity ID URL";

export const FORK_APP_MODAL_LOADING_TITLE = () =>
  "Fetching workspaces to fork to...";
export const FORK_APP_MODAL_EMPTY_TITLE = () =>
  "No workspace available to fork to";
export const FORK_APP_MODAL_SUCCESS_TITLE = () =>
  "Choose where to fork the app";
export const FORK = () => `Fork`;

export const CLEAN_URL_UPDATE = {
  name: () => "Update URLs",
  shortDesc: () =>
    "All URLs in your applications will update to a new readable format that includes the application and page names.",
  description: [
    () =>
      "All URLs in your applications will be updated to match our new style. This will make your apps easier to find, and URLs easier to remember.",
    (url: string) =>
      `The current app’s URL will be:<br /><code style="line-break: anywhere; padding: 2px 4px; line-height: 22px">${url}</code>`,
  ],
  disclaimer: () =>
    "Existing references to <strong>appsmith.URL.fullpath</strong> and <strong>appsmith.URL.pathname</strong> properties will behave differently.",
};

export const MEMBERS_TAB_TITLE = (
  length: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFreeInstance?: boolean,
) => `Users (${length})`;
export const SEARCH_USERS = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFreeInstance?: boolean,
) => `Search for users`;

export const CREATE_PAGE = () => "New blank page";
export const CANVAS_NEW_PAGE_CARD = () => "Create new page";
export const ADD_PAGE_FROM_TEMPLATE = () => "Add page from template";
export const INVALID_URL = () =>
  "Please enter a valid URL, for example, https://example.com";
export const SAVE_OR_DISCARD_DATASOURCE_WARNING = () =>
  `Unsaved changes will be lost if you exit this page, save the changes before exiting.`;

export const APP_SETTINGS_PANE_HEADER = () => "Settings";
export const APP_SETTINGS_CLOSE_TOOLTIP = () => "Close settings panel";

export const GENERAL_SETTINGS_SECTION_HEADER = () => "General";
export const GENERAL_SETTINGS_SECTION_CONTENT_HEADER = () => "General settings";
export const GENERAL_SETTINGS_SECTION_HEADER_DESC = () => "App name and icon";
export const GENERAL_SETTINGS_APP_NAME_LABEL = () => "App name";
export const GENERAL_SETTINGS_NAME_EMPTY_MESSAGE = () =>
  "App name cannot be empty";
export const GENERAL_SETTINGS_NAME_SPECIAL_CHARACTER_ERROR = () =>
  "Only alphanumeric or '-()' are allowed";
export const GENERAL_SETTINGS_APP_ICON_LABEL = () => "App icon";

export const THEME_SETTINGS_SECTION_HEADER = () => "Theme";
export const THEME_SETTINGS_SECTION_CONTENT_HEADER = () => "Theme settings";
export const THEME_SETTINGS_SECTION_HEADER_DESC = () =>
  "Set theme, color and font";

export const PAGE_SETTINGS_SECTION_HEADER = () => "Page settings";
export const PAGE_SETTINGS_SECTION_CONTENT_HEADER = () => "settings";
export const PAGE_SETTINGS_PAGE_NAME_LABEL = () => "Page name";
export const PAGE_SETTINGS_NAME_EMPTY_MESSAGE = () =>
  "Page name cannot be empty";
export const PAGE_SETTINGS_NAME_SPECIAL_CHARACTER_ERROR = () =>
  "Only alphanumeric or '-' are allowed";
export const PAGE_SETTINGS_PAGE_URL_LABEL = () => "Change page URL";
export const PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_1 = () => "Please";
export const PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_2 = () => "update";
export const PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_3 = () =>
  "your app URL to the new format to set the page URL.";
export const PAGE_SETTINGS_SHOW_PAGE_NAV = () => "Show page navigation";
export const PAGE_SETTINGS_SHOW_PAGE_NAV_TOOLTIP = () =>
  "Show or hide the page in the appsmith navbar in view mode";
export const PAGE_SETTINGS_SET_AS_HOMEPAGE = () => "Set as home page";
export const PAGE_SETTINGS_SET_AS_HOMEPAGE_TOOLTIP = () =>
  "This is the current home page, you can change this by setting another page as the home page";
export const PAGE_SETTINGS_SET_AS_HOMEPAGE_TOOLTIP_NON_HOME_PAGE = () =>
  "Set this page as your home page. This will override your previously set home page.";
export const PAGE_SETTINGS_ACTION_NAME_CONFLICT_ERROR = (name: string) =>
  `${name} is already being used.`;

export const CODE_EDITOR_LOADING_ERROR = (message?: string) =>
  `Failed to load the code editor${message ? `: ${message}` : ""}`;

export const UPDATE_VIA_IMPORT_SETTING = {
  settingHeader: () => "Update through file import",
  settingDesc: () => "Update app by importing file",
  settingLabel: () => "Import",
  settingContent: () =>
    "This action will override your existing application. Please exercise caution while selecting the file to import.",
  settingActionButtonTxt: () => "Import",
  disabledForGit: () =>
    "This feature is not supported for apps connected to Git version control. Please use git pull to update and sync your app.",
};

export const IN_APP_EMBED_SETTING = {
  applicationUrl: () => "application url",
  allowEmbeddingLabel: () => "Embedding enabled",
  allowEmbeddingTooltip: () =>
    "This app can be embedded in all domains, including malicious ones",
  forkApplicationConfirmation: {
    title: () => "Allow developers to fork this app to their workspace?",
    body: () => "Forking allows developers to copy your app to their workspace",
    cancel: () => "Cancel",
    confirm: () => "Allow forking",
  },
  copy: () => "Copy",
  copied: () => "Copied",
  limitEmbeddingLabel: () => "Embedding restricted",
  limitEmbeddingTooltip: () => "This app can be embedded in approved URLs only",
  disableEmbeddingLabel: () => "Embedding disabled",
  disableEmbeddingTooltip: () =>
    "This app cannot be embedded anywhere on the internet",
  embed: () => "Embed",
  embedSnippetTitle: () => "Embed URL",
  change: () => "Change",
  copiedEmbedCode: () => "Embed code copied to clipboard",
  embedSize: () => "Embed size",
  previewEmbeddedApp: () => "Preview embedded app",
  sectionHeader: () => "Share & Embed",
  sectionContentHeader: () => "Share",
  sectionHeaderDesc: () => "Make public, embed properties",
  showNavigationBar: () => "Show navigation bar",
  forkContentHeader: () => "Fork",
  forkLabel: () => "Make application forkable",
  forkLabelTooltip: () =>
    "Forking allows developers to copy your app to their workspace",
  upgradeHeading: () =>
    "Embedding in public mode is supported in the free plan. To make your app public, please contact your administrator.",
  upgradeHeadingForInviteModal: () => "Public apps",
  upgradeSubheadingForInviteModal: () =>
    "Make your app public by visiting the share settings, and easily embed your Appsmith app into legacy applications",
  privateAppsText: () => "Private apps",
  rampSubtextModal: () =>
    "Embed private Appsmith apps and seamlessly authenticate users through SSO in our Enterprise Plan",
  rampSubtextSidebar: () =>
    "To embed private Appsmith apps and seamlessly authenticate users through SSO, try our ",
  rampLinktext: () => "Try Enterprise",
  rampLinktextvariant2: () => "Enterprise Plan",
  upgradeContent: () => "Private embedding is now available in",
  appsmithEnterpriseEdition: () => "Appsmith Enterprise Plan.",
  secondaryHeadingForAppSettings: () =>
    "Make your app public to embed your Appsmith app into legacy applications",
  secondaryHeading: () =>
    "Embedding in public mode is supported in the free plan. To make your app public, please contact your administrator.",
};

export const APP_NAVIGATION_SETTING = {
  sectionHeader: () => "Navigation",
  sectionHeaderDesc: () => "Customize the navigation bar",
  showNavbarLabel: () => "Show navbar",
  orientationLabel: () => "Orientation",
  navStyleLabel: () => "Variant",
  positionLabel: () => "Position",
  itemStyleLabel: () => "Item style",
  colorStyleLabel: () => "Background color",
  logoLabel: () => "Logo",
  logoConfigurationLabel: () => "Logo configuration",
  showSignInLabel: () => "Show sign in",
  showSignInTooltip: () =>
    "Toggle to show the sign-in button for users who are not logged in.",
  logoUploadFormatError: () => `Uploaded file must be in .PNG or .JPG formats.`,
  logoUploadSizeError: () => `Uploaded file must be less than 1MB.`,
  showLogoLabel: () => "Show logo",
  showApplicationTitleLabel: () => "Show application title",
};

export const LOCK_SIDEBAR_MESSAGE = () => `Lock sidebar open`;
export const CLOSE_SIDEBAR_MESSAGE = () => `Close sidebar`;

// Datasource/New query
export const NEW_QUERY_BUTTON_TEXT = () => "New query";
export const NEW_API_BUTTON_TEXT = () => "New API";
export const NEW_AI_BUTTON_TEXT = () => "New AI Query";
export const GENERATE_NEW_PAGE_BUTTON_TEXT = () => "Generate new page";
export const RECONNECT_BUTTON_TEXT = () => "Reconnect";
export const SAVE_BUTTON_TEXT = () => "Save";
export const TEST_BUTTON_TEXT = () => "Test configuration";
export const SAVE_AND_AUTHORIZE_BUTTON_TEXT = () => "Save & Authorize";
export const SAVE_AND_RE_AUTHORIZE_BUTTON_TEXT = () => "Save & Re-Authorize";
export const DISCARD_POPUP_DONT_SAVE_BUTTON_TEXT = () => "Don't save";
export const GSHEET_AUTHORISED_FILE_IDS_KEY = () => "userAuthorizedSheetIds";
export const GOOGLE_SHEETS_INFO_BANNER_MESSAGE = () =>
  "Appsmith will require access to your google drive to access google sheets.";
export const GOOGLE_SHEETS_AUTHORIZE_DATASOURCE = () => "Authorize datasource";
export const GOOGLE_SHEETS_LEARN_MORE = () => "Learn more";
export const DATASOURCE_SCHEMA_NOT_AVAILABLE = () => "Schema is not available";
export const DATASOURCE_INTERCOM_TEXT = () =>
  "Do you need help setting up a Google Sheets datasource?";
export const GOOGLE_SHEETS_ASK_FOR_SUPPORT = () => "Ask for support";
export const GOOGLE_SHEETS_FILE_PICKER_TITLE = () =>
  "Select Google Sheets to query";
export const DATASOURCE_GENERATE_PAGE_BUTTON = () => "Generate new page";
export const FETCHING_DATASOURCE_PREVIEW_DATA = () => "Loading data";
export const SCHEMA_PREVIEW_NO_DATA = () =>
  "No data records to show or the table header begins with an index other than 1";
export const GSHEET_SPREADSHEET_LABEL = () => "Spreadsheets";
export const GSHEET_SPREADSHEET_LOADING = () => "Loading Spreadsheets";
export const GSHEET_SHEET_LOADING = () => "Loading Sheets";
export const GSHEET_DATA_LOADING = () => "Loading attributes";
export const GSHEET_SEARCH_PLACEHOLDER = () => "Search for spreadsheet";

//Layout Conversion flow
export const CONVERT = () => "Convert layout";
export const BUILD_RESPONSIVE = () => "Build responsive apps";
export const BUILD_RESPONSIVE_TEXT = () =>
  "Appsmith will convert your application's UI to auto-layout, a new mode designed for building mobile-friendly apps in no time";
export const BUILD_FIXED_LAYOUT = () => "Use fixed-layout";
export const BUILD_FIXED_LAYOUT_TEXT = () =>
  "Appsmith will convert your application’s UI to fixed layout, the default mode.";
export const USE_SNAPSHOT = () => "Use snapshot";
export const USE_SNAPSHOT_HEADER = () => "Use snapshot";
export const DISCARD_SNAPSHOT_HEADER = () => "Discarding a snapshot";
export const SAVE_SNAPSHOT = () =>
  "Save a snapshot of your current layout for 5 days";
export const SAVE_SNAPSHOT_TEXT = () =>
  "We save a snapshot of your current layout so you can go back if auto-layout doesn't work for you in this beta.";
export const CREATE_SNAPSHOT = () => "Creating a snapshot";
export const CONVERTING_APP = () => "Converting your app";
export const RESTORING_SNAPSHOT = () => "Removing changes made";
export const REFRESH_THE_APP = () => "Refresh the app";
export const CONVERT_ANYWAYS = () => "Convert anyways";
export const CONVERSION_SUCCESS_HEADER = () => "All done";
export const DISCARD_SNAPSHOT_TEXT = () =>
  "You are about to discard this snapshot:";
export const CONVERSION_SUCCESS_TEXT = () =>
  "Check all your pages and start using your new layout";
export const CONVERSION_WARNING_HEADER = () =>
  "All done, some adjustments needed";
export const CONVERSION_WARNING_TEXT = () =>
  "You might need to manually position some of the widgets your layout contains";
export const CONVERSION_ERROR_HEADER = () => "Conversion failed";
export const CONVERSION_ERROR = () =>
  "Appsmith ran into a critical error while trying to convert to auto-layout";
export const SEND_REPORT = () => "Send us a report";
export const CONVERSION_ERROR_TEXT = () => "No changes were made to your app";
export const DROPDOWN_LABEL_TEXT = () => "Target canvas size";
export const CONVERSION_WARNING = () => "Conversion will change your layout";
export const SNAPSHOT_LABEL = () =>
  "To revert back to the original state use this snapshot";
export const USE_SNAPSHOT_TEXT = () =>
  "Your app will look and work exactly like it used to before the conversion. Widgets, datasources, queries, JS Objects added and any changes you made after conversion will not be present.";
export const SNAPSHOT_WARNING_MESSAGE = () =>
  "Any changes you made after conversion will not be present.";
export const CONVERT_TO_FIXED_TITLE = () => "Convert to fixed layout";
export const CONVERT_TO_FIXED_BUTTON = () => "Convert to fixed layout (Beta)";
export const CONVERT_TO_AUTO_TITLE = () => "Convert to auto-layout";
export const CONVERT_TO_AUTO_BUTTON = () => "Convert to auto-layout (Beta)";
export const SNAPSHOT_BANNER_MESSAGE = () =>
  "Confirm this layout is per expectations before you discard the snapshot. Use the snapshot to go back.";
export const USE_SNAPSHOT_CTA = () => "Use snapshot";
export const DISCARD_SNAPSHOT_CTA = () => "Discard snapshot";
export const MORE_DETAILS = () => "More details";
export const CONVERSION_ERROR_MESSAGE_HEADER = () =>
  "To resolve this error please:";
export const CONVERSION_ERROR_MESSAGE_TEXT_ONE = () =>
  "Check your internet connection.";
export const CONVERSION_ERROR_MESSAGE_TEXT_TWO = () =>
  "Send us a report. Sending a report will only inform us that the failure happened and will give us your email address to reach out to.";
export const SNAPSHOT_TIME_FROM_MESSAGE = (
  timeSince: string,
  readableDate: string,
) => `Snapshot from ${timeSince} ago (${readableDate})`;
export const SNAPSHOT_TIME_TILL_EXPIRATION_MESSAGE = (
  timeTillExpiration: string,
) => `Snapshot of your previous layout expires in ${timeTillExpiration}`;
export const DISCARD = () => "Discard";
// Alert options and labels for showMessage types
export const ALERT_STYLE_OPTIONS = [
  { label: "Info", value: "'info'", id: "info" },
  {
    label: "Success",
    value: "'success'",
    id: "success",
  },
  { label: "Error", value: "'error'", id: "error" },
  { label: "Warning", value: "'warning'", id: "warning" },
];

export const customJSLibraryMessages = {
  ADD_JS_LIBRARY: () => "Add JS libraries",
  REC_LIBRARY: () => "Recommended libraries",
  INSTALLATION_SUCCESSFUL: (accessor: string) =>
    `Installation Successful. You can access the library via ${accessor}`,
  INSTALLATION_FAILED: () => "Installation failed",
  INSTALLED_ALREADY: (accessor: string) =>
    `This library is already installed. You could access it via ${accessor}.`,
  UNINSTALL_FAILED: (name: string) =>
    `Couldn't uninstall ${name}. Please try again after sometime.`,
  UNINSTALL_SUCCESS: (accessor: string) =>
    `${accessor} is uninstalled successfully.`,
  LEARN_MORE_DESC: () => "Learn more about Custom JS libraries",
  UNSUPPORTED_LIB: () => `Library is unsupported`,
  UNSUPPORTED_LIB_DESC: () =>
    `Unfortunately, this library cannot be supported due to platform limitations. Please try installing a different library.`,
  LEARN_MORE: () => `Learn more`,
  REPORT_ISSUE: () => `Report issue`,
  AUTOCOMPLETE_FAILED: (name: string) =>
    `Code completion for ${name} will not work.`,
  CLIENT_LOAD_FAILED: (url: string) => `Failed to load the script at ${url}.`,
  LIB_OVERRIDE_ERROR: (
    name: string,
  ) => `The library ${name} is already installed.
  If you are trying to install a different version, uninstall the library first.`,
  DEFS_FAILED_ERROR: (name: string) =>
    `Failed to generate autocomplete definitions for ${name}.`,
  IMPORT_URL_ERROR: (url: string) =>
    `The script at ${url} cannot be installed.`,
  NAME_COLLISION_ERROR: (accessors: string) =>
    `Name collision detected: ${accessors}`,
};

// Business Plan upgrade page
export const MOVE_TO_BUSINESS_EDITION = (trailingChar: string) =>
  `Move to Business plan${trailingChar ? trailingChar : ""}`;

//Datasource environment
export const START_SWITCH_ENVIRONMENT = (environment: string) =>
  `Switching your environment to ${environment.toLowerCase()}, and running all associated pageload actions`;
export const SWITCH_ENVIRONMENT_SUCCESS = (environment: string) =>
  `Environment switched to ${environment.toLowerCase()} successfully`;
export const SWITCH_ENV_DISABLED_TOOLTIP_TEXT = (): string =>
  "To access environments for datasources, try out our ";

export const TEST_DATASOURCE_SUCCESS = (
  datasourceName: string,
  environmentName: string,
) => {
  return environmentName
    ? `Test was successful, ${datasourceName} ${environmentName.toLowerCase()} environment is correctly configured.`
    : `Test was successful, ${datasourceName} is correctly configured.`;
};

export const TEST_DATASOURCE_ERROR = () =>
  "Test failed, couldn't establish a connection";

// Camera widget
export const DEFAULT_CAMERA_LABEL = () => "Default mobile camera";
export const DEFAULT_CAMERA_LABEL_DESCRIPTION = () =>
  "Default choice for mobile users. Not applicable for other devices";
export const FRONT_CAMERA_LABEL = () => "Front (Selfie)";
export const BACK_CAMERA_LABEL = () => "Back (Rear)";

// Color picker
export const FULL_COLOR_PICKER_LABEL = () => "Full color picker";

// Column selector modal
export const EDIT_FIELDS = () => "Edit fields";
export const FIELDS_CONFIGURATION = () => "Fields Configuration";
export const SAVE_CHANGES = () => "Save changes";
export const COLUMN_TYPE = () => "Column type";
export const COLUMN_NAME = () => "Column name";
export const EDIT_FIELDS_DISABLED_TOOLTIP_TEXT = () =>
  "Select a table to edit fields";

export const SAVE_CHANGES_DISABLED_TOOLTIP_TEXT = () =>
  "You have to select at least 1 field to save";

export const NO_CONNECTABLE_WIDGET_FOUND = () =>
  "Add a table or list widget with data to get the values from";

export const CONNECT_BUTTON_TEXT = () => "Connect data";

export const NO_FIELDS_ADDED = () => "No fields added";

// One click binding control
export const DATASOURCE_DROPDOWN_OPTIONS = {
  CONNECT_TO_QUERY: () => "Connect to query",
  CONNECT_TO: () => "Connect to",
  CHOOSE_DATASOURCE_TO_CONNECT: () => "Choose datasource to connect",
  CREATE_OR_EDIT_RECORDS: () => "Create or Edit records",
  WRITE_JSON_SCHEMA: () => "Write JSON schema",
  SELECT_A_DATASOURCE: () => "Select a datasource",
  CONNECT_DATA: () => "Connect data",
  OTHER_ACTIONS: () => "Other actions",
};

export const COMMUNITY_TEMPLATES = {
  tabTitle: () => "Showcase",
  cancel: () => "Cancel",
  publishSuccessPage: {
    title: () => "Live on Appsmith community",
    description: () =>
      "This application is live on community as a template for users to fork and remix.",
    viewTemplateButton: () => "View template",
  },
  publishFormPage: {
    title: () => "Publish to community",
    footer: {
      publishButton: () => "Publish to community",
      tnCText: () =>
        "I understand publishing this app will allow users outside my workspace to fork it to their workspace.",
    },
    preview: {
      thumbnail: () => "Thumbnail will be generated automatically",
    },
    templateForm: {
      titleInputLabel: () => "Title",
      titleInputPlaceholder: () => "Title of the template",
      titleRequiredError: () => `Please provide title`,

      excerptInputLabel: () => "Headline",
      excerptInputPlaceholder: () => "One line excerpt",

      descriptionInputLabel: () => "Description",
      descriptionInputPlaceholder: () => "Description of the template",

      useCasesInputLabel: () => "Use-cases",
      useCasesInputPlaceholder: () => "Select use cases",
    },
    authorDetails: {
      title: () => "Author details",
      displayNameLabel: () => "Display name",
      displayNamePlaceholder: () => "Display name",
      nameRequiredError: () => `Please provide name`,

      emailLabel: () => "Email",
      emailPlaceholder: () => "Email",
    },
    applicationSettings: {
      title: () => "Application settings",
      publicSetting: () => "Make application public",
      forkableSetting: () => "Make application forkable",
    },
    publishedInfo: {
      title: () => "What is published?",
      correct: [
        () => "Widgets & their properties",
        () => "Queries & JS Objects",
        () => "Datasource types",
      ],
      incorrect: [
        () => "Datasource credentials",
        () => "API authentication details",
        () => "Environment variables",
        () => "Git credentials",
      ],
    },
    publishedFailedError: () => "Unable to publish",
  },
  modals: {
    unpublishedInfo: {
      title: () => "Publish to Appsmith community",
      description: () =>
        "Publish this app to Appsmith community for the public to view, fork, and remix.",
      publishBtn: () => "Start publishing",
    },
    publishedInfo: {
      title: () => "Live on Appsmith community!",
      description: () =>
        "This application is live on community as a template for users to fork and remix.",
      viewTemplate: () => "View template",
    },
  },
};

// Interim data state info
export const EMPTY_TABLE_TITLE_TEXT = () => "Empty table";
export const EMPTY_SCHEMA_TITLE_TEXT = () => "Empty schema";
export const EMPTY_TABLE_MESSAGE_TEXT = () =>
  "There are no data records to show";
export const EMPTY_SCHEMA_MESSAGE_TEXT = () =>
  "There are no schema records to show";
export const NO_COLUMNS_MESSAGE_TEXT = () => "There are no columns to show";
export const LOADING_RECORDS_TITLE_TEXT = () => "Loading columns";
export const LOADING_SCHEMA_TITLE_TEXT = () => "Loading schema";
export const LOADING_RECORDS_MESSAGE_TEXT = () => "This may take a few seconds";
export const FAILED_RECORDS_TITLE_TEXT = () => "Failed to load datasource";
export const FAILED_RECORDS_MESSAGE_TEXT = () =>
  "Please check the datasource configuration and retry.";
export const DATASOURCE_SWITCHER_MENU_GROUP_NAME = () => "Select a datasource";
export const CANT_SHOW_SCHEMA = () =>
  "We can’t show the schema for this datasource";
export const COLUMNS_TITLE = () => "Columns";
export const COLUMNS_SEARCH_PLACEHOLDER = (tableName: string) =>
  `Search columns in ${tableName}`;
export const NO_ACCESS_TITLE_TEXT = () =>
  "You do not have access to this datasource";
export const NO_ACCESS_MESSAGE_TEXT = () =>
  "Please contact your workspace administrator to gain access";

export const DATA_PANE_TITLE = () => "Datasources in your workspace";
export const DATASOURCE_LIST_BLANK_DESCRIPTION = () =>
  "Connect a datasource to write your first query";
export const DATASOURCE_BLANK_STATE_MESSAGE = () => "No datasources to display";

// Create New Apps Intermediary step
export const CREATE_NEW_APPS_STEP_TITLE = () => "How would you like to start?";
export const CREATE_NEW_APPS_STEP_SUBTITLE = () =>
  "Choose an option that fits your approach, and let's shape your app together.";
export const START_FROM_TEMPLATE_TITLE = () => "Start with template";
export const START_FROM_TEMPLATE_SUBTITLE = () =>
  "Begin with an app for a specific scenario. We'll guide you through tailoring your app.";
export const START_FROM_SCRATCH_TITLE = () => "Start from scratch";
export const START_FROM_SCRATCH_SUBTITLE = () =>
  "Create an app from the ground up. Design every detail of your app on a blank canvas.";
export const START_WITH_DATA_TITLE = () => "Start with data";
export const START_WITH_DATA_SUBTITLE = () =>
  "Get started with connecting your data, and easily craft a functional application.";
export const START_WITH_DATA_CONNECT_HEADING = () => "Connect your datasource";
export const START_WITH_DATA_CONNECT_SUBHEADING = () =>
  "Select an option to establish a connection. Your data's security is our priority.";
export const START_WITH_TEMPLATE_CONNECT_HEADING = () => "Select a template";
export const START_WITH_TEMPLATE_CONNECT_SUBHEADING = () =>
  "Choose an option below to embark on your app-building adventure!";

export const EDITOR_PANE_TEXTS = {
  queries_tab: () => "Queries",
  js_tab: () => "JS",
  ui_tab: () => "UI",
  query_blank_state: () => "No queries to display",
  js_blank_state: () => "No JS objects to display",
  query_blank_state_description: () =>
    "Write your first query or API to access data",
  js_blank_state_description: () =>
    "Use JS to transform your data or write business logic",
  widget_blank_state_description: () =>
    "Drag & drop UI elements to create your app",
  query_add_button: () => "New query / API",
  js_add_button: () => "New JS object",
  js_blank_object_item: () => "Blank JS object",
  widget_add_button: () => "New UI element",
  query_create_tab_title: () => "Create new query from",
  widgets_create_tab_title: () => "Drag & drop UI elements",
  js_create_tab_title: () => "Create JS object from",
  js_create_modules: () => "JS modules (Beta)",
  queries_create_from_existing: () => "Datasources",
  queries_create_new: () => "Quick actions",
  queries_create_modules: () => "Query modules (Beta)",
  loading_building_blocks: () => "Loading building blocks",
  empty_search_result: (type: string) => `No ${type} match your search`,
  search_objects: {
    jsObject: () => "JS object",
    queries: () => "queries",
    datasources: () => "datasources",
  },
};

export const PARTIAL_IMPORT_EXPORT = {
  export: {
    modalHeading: () => "Export",
    modalSubHeading: () => "Select entities below to export from the Page",
    cta: () => "Export selected entities",
    sections: {
      jsObjects: () => "JS objects",
      databases: () => "Databases",
      queries: () => "Queries",
      customLibs: () => "Custom libraries",
      widgets: () => "Widgets",
    },
  },
  import: {
    modalHeading: () => "Import",
    modalSubheading: () => "Import partial application from file",
  },
};

export const DATASOURCE_SECURELY_TITLE = () => "Secure & fast connection";

export const CUSTOM_WIDGET_FEATURE = {
  addEvent: {
    addCTA: () => "Add",
    cancelCTA: () => "Cancel",
    addEventCTA: () => "Add Event",
    nameLabel: () => "Name",
    errors: {
      restricted: () => "Event name is restricted",
      duplicate: () => "Event name already exists",
    },
  },
  editSource: {
    editSourceCTA: () => "Edit source",
    goToSourceCTA: () => "Go to source editor",
  },
  builder: {
    header: () => "Custom Widget Builder",
    close: () => "Close",
    connectionLost: () =>
      "Connection lost because the custom widget was deselected. Please reselect this widget to continue editing.",
    editor: {
      css: {
        contextTooltipScss: () => "Supports SCSS syntax.",
        contextTooltipVariables: () => "You can use following css variables.",
        placeholder: () =>
          "/* you can access string and number properties of your model using `var(--appsmith-model-<property-name>)`*/",
      },
      html: {
        placeholder: () =>
          "<!-- no need to write html, head, body tags, it is handled by the widget -->",
      },
      js: {
        placeholder: () =>
          "// no need to write window onLoad, it is handled by the widget",
      },
    },
  },
  templateKey: {
    blank: () => "Blank",
    vanillaJs: () => "Vanilla JS",
    react: () => "React",
    vue: () => "Vue",
  },
  template: {
    modal: {
      header: () => "Are you sure?",
      body: () =>
        "This will replace the current changes in the HTML, CSS and JS files.",
      successCTA: () => "Replace",
      cancelCTA: () => "Cancel",
    },
    buttonCTA: () => "Templates",
    revert: () => "Revert to Original",
  },
  layout: {
    tab: () => "Tabs",
    split: () => "Splits",
  },
  referrences: {
    title: () => "References",
    tooltip: {
      open: () => "Open references",
      close: () => "Close references",
    },
    liveModel: {
      helpMessage: [
        () => "- Use `appsmith.model` to access your model in javascript",
        () =>
          "- Use `appsmith.updateModel()` to update your model from javascript",
      ],
      label: () => "Live Model",
    },
    events: {
      helpMessage: [
        () =>
          "- Use `appsmith.triggerEvent(&lt;EVENT_NAME&gt;)` to trigger an event",
        () =>
          "- `appsmith.triggerEvent()` also accepts context data as second arg",
      ],
      label: () => "Events",
      emptyMessage: () =>
        "You haven’t created any events. Return to the app editor to add events to this custom widget.",
    },
    help: {
      message: () =>
        "Learn how custom widgets work, and how to access data from the rest of your app within this widget.",
      buttonCTA: () => "Documentation",
    },
  },
  debugger: {
    title: () => "Console",
    emptyMessage: () => "Errors and logs will appear here",
    helpDropdown: {
      stackoverflow: () => "Search StackOverflow",
    },
    noOnReadyWarning: (url: string) =>
      `Missing appsmith.onReady() function call. Initiate your component inside 'appsmith.onReady()' for your custom widget to work as expected. For more information - ${url}`,
  },
  preview: {
    eventFired: () => "Event fired:",
    modelUpdated: () => "Model updated",
  },
};

export const WIDGET_PANEL_EMPTY_MESSAGE = () =>
  "We couldn’t find any UI elements called";

export const UI_ELEMENT_PANEL_SEARCH_TEXT = () => "Search UI elements";

export const HTTP_PROTOCOL_INPUT_PLACEHOLDER = () => `Select HTTP Protocol`;

export const ADD_PAGE_FROM_TEMPLATE_MODAL = {
  title: () => "Add page(s) from a template",
  buildingBlocksTitle: () => "Building Blocks",
};

export const HEADER_TITLES = {
  DATA: () => "Data",
  PAGES: () => "Pages",
  EDITOR: () => "Editor",
  SETTINGS: () => "Settings",
  LIBRARIES: () => "Libraries",
};

export const PASTE_FAILED = (str: string): string => `Paste failed! ${str}`;

export const CREATE_A_NEW_ITEM = (item: string) => `Create a new ${item}`;

export const MAXIMIZE_BUTTON_TOOLTIP = () =>
  `Expand code editor to full-screen`;
export const MINIMIZE_BUTTON_TOOLTIP = () => `Open code editor next to the UI`;
export const SPLITPANE_ANNOUNCEMENT = {
  TITLE: () => "Code and UI, side-by-side",
  DESCRIPTION: () =>
    "Write queries and JS functions while you refer to the UI on the side! This is a beta version that we will continue to improve with your feedback.",
};

export const CANVAS_VIEW_MODE_TOOLTIP = (shortcutKey: string) =>
  `💡 ${shortcutKey} click a widget to navigate to UI mode.`;

export const EMPTY_CANVAS_HINTS = {
  DRAG_DROP_WIDGET_HINT: () => "Drag and drop a widget here",
  DRAG_DROP_BUILDING_BLOCK_HINT: {
    TITLE: () => "Drag & drop a building block",
    DESCRIPTION: () => "Make a working app in seconds using functional blocks",
  },
};

export const BETA_TAG = () => `Beta`;

export const BUTTON_WIDGET_DEFAULT_LABEL = () => "Do something";

export const PAGE_ENTITY_NAME = "Page";

export const EMPTY_DATASOURCE_TOOLTIP_SIDEBUTTON = () =>
  "Create a datasource to power your app with data.";

export const FIELD_REQUIRED_MESSAGE = () => `This field is required`;

export const PREPARED_STATEMENT_WARNING = {
  MESSAGE: () =>
    "Prepared statements are currently enabled, which may be causing the query error. Turn them off and try running the query again",
  LINK: () => "Open settings",
};

export const JS_EDITOR_SETTINGS = {
  TITLE: () => "Settings",
  ON_LOAD_TITLE: () => "Choose the functions to run on page load",
};

export const CUSTOM_WIDGET_BUILDER_TAB_TITLE = {
  AI: () => "AI",
  HTML: () => "HTML",
  STYLE: () => "Style",
  JS: () => "Javascript",
};

export const REQUEST_NEW_INTEGRATIONS = {
  UNABLE_TO_FIND: () => "Can’t find what you are looking for?",
  REQUEST_NEW_BUTTON: () => "Request a new integration",
  REQUEST_BUTTON: () => "Request integration",
  CANCEL_BUTTON: () => "Cancel",
  REQUEST_MODAL_HEADING: () => "Request a new integration",
  REQUEST_MODAL_INTEGRATION: {
    LABEL: () => "Integration",
    PLACEHOLDER: () => "E.g. Zendesk, JIRA, Slack, others",
    NAME: "integration",
    ERROR: () => "Please enter integration name",
  },
  REQUEST_MODAL_USECASE: {
    LABEL: () => "Tell us more about your case",
    PLACEHOLDER: () =>
      "E.g. I want to create an app to manage my customers’ account.",
    NAME: "useCase",
  },
  REQUEST_MODAL_EMAIL: {
    LABEL: () => "Email",
    DESCRIPTION: () =>
      "Appsmith might use this email exclusively to follow up on your integration request.",
    NAME: "email",
    ERROR: () => "Please enter email",
  },
  SUCCESS_TOAST_MESSAGE: () => "Thank you! We are looking into your request.",
};

export const PREMIUM_DATASOURCES = {
  RELEVANT_EMAIL_DESCRIPTION: () =>
    "Unblock advanced integrations. Let our team guide you in selecting the plan that fits your needs. Schedule a call now to see how Appsmith can transform your workflows!",
  NON_RELEVANT_EMAIL_DESCRIPTION: () =>
    "Unblock advanced integrations. Let our team guide you in selecting the plan that fits your needs. Give us your email and the Appsmith team will reach out to you soon.",
  LEARN_MORE: () => "Learn more about Premium",
  SCHEDULE_CALL: () => "Schedule a call",
  SUBMIT: () => "Submit",
  SUCCESS_TOAST_MESSAGE: () =>
    "Thank you! The Appsmith Team will contact you shortly.",
  FORM_EMAIL: {
    LABEL: () => "Email",
    DESCRIPTION: () =>
      "Appsmith might use this email to follow up on your integration interest.",
    NAME: "email",
    ERROR: () => "Please enter email",
  },
  PREMIUM_TAG: () => "Premium",
  SOON_TAG: () => "Soon",
  COMING_SOON_SUFFIX: () => "Coming soon",
  COMING_SOON_DESCRIPTION: () =>
    "The Appsmith Team is actively working on it. We’ll let you know when this integration is live. ",
  NOTIFY_ME: () => "Notify me",
};
