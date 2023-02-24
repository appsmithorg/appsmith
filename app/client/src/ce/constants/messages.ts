export function createMessage(
  format: (...strArgs: any[]) => string,
  ...args: any[]
) {
  return format(...args);
}

/*
  For self hosted, it displays the string "Appsmith Community v1.10.0" or "Appsmith Business v1.10.0".
  For cloud hosting, it displays "Appsmith v1.10.0".
  This is because Appsmith Cloud doesn't support business features yet.
 */
export const APPSMITH_DISPLAY_VERSION = (
  edition: string,
  version: string,
  cloudHosting: boolean,
) => `Appsmith ${!cloudHosting ? edition : ""} ${version}`;
export const YES = () => `Yes`;
export const ARE_YOU_SURE = () => `Are you sure?`;
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
  `Please provide a password between 6 and 256 characters`;
export const FORM_VALIDATION_INVALID_PASSWORD = FORM_VALIDATION_PASSWORD_RULE;

export const LOGIN_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const LOGIN_PAGE_PASSWORD_INPUT_LABEL = () => `Password`;
export const LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER = () =>
  `Enter your email address`;
export const LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER = () =>
  `Enter your password`;
export const LOGIN_PAGE_INVALID_CREDS_ERROR = () =>
  `It looks like you may have entered incorrect/invalid credentials. Please try again or reset password using the button below.`;
export const LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK = () =>
  `Reset Password`;
export const NEW_TO_APPSMITH = () => `Don't have an account?`;
export const LOGIN_PAGE_TITLE = () => `Sign in`;
export const LOGIN_PAGE_SUBTITLE = () => `Sign in to your account`;

export const LOGIN_PAGE_LOGIN_BUTTON_TEXT = () => `sign in`;
export const LOGIN_PAGE_FORGOT_PASSWORD_TEXT = () => `Forgot Password`;
export const LOGIN_PAGE_REMEMBER_ME_LABEL = () => `Remember`;
export const LOGIN_PAGE_SIGN_UP_LINK_TEXT = () => `Sign up`;
export const SIGNUP_PAGE_TITLE = () => `Create your free account`;
export const SIGNUP_PAGE_SUBTITLE = () => `Use your workspace email`;
export const SIGNUP_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER = () => `Email`;
export const SIGNUP_PAGE_NAME_INPUT_PLACEHOLDER = () => `Name`;
export const SIGNUP_PAGE_NAME_INPUT_LABEL = () => `Name`;
export const SIGNUP_PAGE_PASSWORD_INPUT_LABEL = () => `Password`;
export const SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER = () => `Password`;
export const SIGNUP_PAGE_LOGIN_LINK_TEXT = () => `Sign in`;
export const SIGNUP_PAGE_NAME_INPUT_SUBTEXT = () => `How should we call you?`;
export const SIGNUP_PAGE_SUBMIT_BUTTON_TEXT = () => `Sign Up`;
export const ALREADY_HAVE_AN_ACCOUNT = () => `Already have an account?`;

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
export const FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER = () => `Email`;
export const FORGOT_PASSWORD_PAGE_TITLE = () => `Reset password`;
export const FORGOT_PASSWORD_PAGE_SUBTITLE = () =>
  `We will send a reset link to the email below`;
export const FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT = () => `Reset`;
export const FORGOT_PASSWORD_SUCCESS_TEXT = (email: string) =>
  `A password reset link has been sent to your email address ${email} registered with Appsmith.`;

export const PRIVACY_POLICY_LINK = () => `Privacy policy`;
export const TERMS_AND_CONDITIONS_LINK = () => `Terms and conditions`;

export const ERROR_500 = () =>
  `We apologize, something went wrong. We're trying to fix things.`;
export const ERROR_0 = () =>
  `We could not connect to our servers. Please check your network connection`;
export const ERROR_401 = () =>
  `We are unable to verify your identity. Please login again.`;
export const ERROR_403 = (entity: string, userEmail: string) =>
  `Sorry, but your account (${userEmail}) does not seem to have the required access to update this ${entity}. Please get in touch with your Appsmith admin to resolve this.`;
export const PAGE_NOT_FOUND_ERROR = () =>
  `The page you’re looking for either does not exist, or cannot be found`;
export const INVALID_URL_ERROR = () => `Invalid URL`;
export const MAKE_APPLICATION_PUBLIC = () => "Make application public";
export const MAKE_APPLICATION_PUBLIC_TOOLTIP = () =>
  "A public app is accessible to anyone who can access your instance of appsmith";
export const INVITE_TAB = () => "Invite";
export const INVITE_USERS_VALIDATION_EMAIL_LIST = () =>
  `Invalid email address(es) found`;
export const INVITE_USERS_VALIDATION_ROLE_EMPTY = () => `Please select a role`;

export const INVITE_USERS_EMAIL_LIST_PLACEHOLDER = () =>
  `Comma separated emails`;
export const INVITE_USERS_ROLE_SELECT_PLACEHOLDER = () => `Select role`;
export const INVITE_USERS_ROLE_SELECT_LABEL = () => `Role`;
export const INVITE_USERS_EMAIL_LIST_LABEL = () => `User emails`;
export const INVITE_USERS_ADD_EMAIL_LIST_FIELD = () => `Add more`;
export const INVITE_USERS_MESSAGE = () => `Invite users`;
export const INVITE_USERS_PLACEHOLDER = () => `Enter email address(es)`;
export const INVITE_USERS_SUBMIT_BUTTON_TEXT = () => `Invite users`;
export const INVITE_USERS_SUBMIT_SUCCESS = () =>
  `The users have been invited successfully`;
export const INVITE_USER_SUBMIT_SUCCESS = () =>
  `The user has been invited successfully`;
export const INVITE_USERS_VALIDATION_EMAILS_EMPTY = () =>
  `Please enter the user emails`;

export const CREATE_PASSWORD_RESET_SUCCESS = () => `Your password has been set`;
export const CREATE_PASSWORD_RESET_SUCCESS_LOGIN_LINK = () => `Login`;

export const DELETING_APPLICATION = () => `Deleting application...`;
export const DUPLICATING_APPLICATION = () => `Duplicating application...`;

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

export const EDIT_APP = () => `Edit App`;
export const FORK_APP = () => `Fork App`;
export const SIGN_IN = () => `Sign in`;

export const EDITOR_HEADER = {
  saving: () => "Saving",
  saveFailed: () => "Save failed",
  share: () => "SHARE",
  previewTooltip: {
    text: () => "Preview",
    shortcut: () => "P",
  },
};

// Homepage
export const CREATE_NEW_APPLICATION = () => `Create new`;
export const SEARCH_APPS = () => `Search for apps...`;
export const GETTING_STARTED = () => `GETTING STARTED`;
export const WORKSPACES_HEADING = () => `WORKSPACES`;
export const WELCOME_TOUR = () => `Welcome Tour`;
export const NO_APPS_FOUND = () =>
  `Whale! Whale! This name doesn't ring a bell!`;

// Lightning menu
export const LIGHTNING_MENU_DATA_API = () => `Use data from an API`;
export const LIGHTNING_MENU_DATA_QUERY = () => `Use data from a query`;
export const LIGHTNING_MENU_DATA_TOOLTIP = () => `Quick start data binding`;
export const LIGHTNING_MENU_DATA_WIDGET = () => `Use data from a widget`;
export const LIGHTNING_MENU_QUERY_CREATE_NEW = () => `Create new query`;
export const LIGHTNING_MENU_API_CREATE_NEW = () => `Create new API`;

export const LIGHTNING_MENU_OPTION_TEXT = () => `Plain Text`;
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
  `Google Re-Captcha token generation failed! Please check the Re-captcha site key.`;
export const GOOGLE_RECAPTCHA_DOMAIN_ERROR = () =>
  `Google Re-Captcha token generation failed! Please check the allowed domains.`;

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
  `${actionName} action copied to page ${pageName} successfully`;
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

export const DATASOURCE_CREATE = (dsName: string) =>
  `${dsName} datasource created`;
export const DATASOURCE_DELETE = (dsName: string) =>
  `${dsName} datasource deleted successfully`;
export const DATASOURCE_UPDATE = (dsName: string) =>
  `${dsName} datasource updated successfully`;
export const DATASOURCE_VALID = (dsName: string) =>
  `${dsName} datasource is valid`;
export const EDIT_DATASOURCE = () => "EDIT DATASOURCE";
export const SAVE_DATASOURCE = () => "SAVE AS DATASOURCE";
export const SAVE_DATASOURCE_MESSAGE = () =>
  "Save the URL as a datasource to access authentication settings";
export const EDIT_DATASOURCE_MESSAGE = () =>
  "Edit Datasource to access authentication settings";
export const OAUTH_ERROR = () => "OAuth Error";
export const OAUTH_2_0 = () => "OAuth 2.0";
export const ENABLE = () => "ENABLE";
export const UPGRADE = () => "UPGRADE";
export const EDIT = () => "EDIT";
export const UNEXPECTED_ERROR = () => "An unexpected error occurred";
export const EXPECTED_ERROR = () => "An error occurred";
export const NO_DATASOURCE_FOR_QUERY = () =>
  `Seems like you don’t have any Datasources to create a query`;
export const ACTION_EDITOR_REFRESH = () => "Refresh";
export const INVALID_FORM_CONFIGURATION = () => "Invalid form configuration";
export const ACTION_RUN_BUTTON_MESSAGE_FIRST_HALF = () => "🙌 Click on";
export const ACTION_RUN_BUTTON_MESSAGE_SECOND_HALF = () =>
  "after adding your query";
export const CREATE_NEW_DATASOURCE = () => "Create new datasource";

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
  "Data source is not authorized, please authorize to continue.";

export const LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE = () =>
  "Error saving a key in localStorage. You have exceeded the allowed storage size limit";
export const LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE = () =>
  "Error saving a key in localStorage. You have run out of disk space";
export const LOCAL_STORAGE_NOT_SUPPORTED_APP_MIGHT_NOT_WORK_AS_EXPECTED = () =>
  "LocalStorage is not supported on your device. Some features including the Appsmith store won't work.";

export const OMNIBAR_PLACEHOLDER = () =>
  `Search Widgets, Queries, Documentation`;
export const OMNIBAR_PLACEHOLDER_SNIPPETS = () => "Search code snippets";
export const OMNIBAR_PLACEHOLDER_NAV = () => "Search widgets and queries";
export const OMNIBAR_PLACEHOLDER_DOC = () => "Search documentation";
export const CREATE_NEW_OMNIBAR_PLACEHOLDER = () =>
  "Create a new Query, API or JS Object";
export const HELPBAR_PLACEHOLDER = () => "Search";
export const NO_SEARCH_DATA_TEXT = () => "No results found";

export const WIDGET_BIND_HELP = () =>
  "Having trouble taking inputs from widgets?";

export const BACK_TO_HOMEPAGE = () => "Go back to homepage";

// error pages
export const PAGE_NOT_FOUND_TITLE = () => "404";
export const PAGE_NOT_FOUND = () => "Page not found";
export const PAGE_SERVER_UNAVAILABLE_ERROR_CODE = () => "503";
export const PAGE_SERVER_UNAVAILABLE_TITLE = () =>
  "Appsmith server is unavailable";
export const PAGE_SERVER_UNAVAILABLE_DESCRIPTION = () =>
  "Please try again later";
export const PAGE_SERVER_TIMEOUT_ERROR_CODE = () => "504";
export const PAGE_SERVER_TIMEOUT_TITLE = () =>
  "Appsmith server is taking too long to respond";
export const PAGE_SERVER_TIMEOUT_DESCRIPTION = () =>
  `Please retry after some time`;
export const PAGE_CLIENT_ERROR_TITLE = () => "Whoops something went wrong!";
export const PAGE_CLIENT_ERROR_DESCRIPTION = () =>
  "This is embarrassing, please contact Appsmith support for help";

// comments
export const POST = () => "Post";
export const CANCEL = () => "Cancel";
export const REMOVE = () => "Remove";

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
export const LOGS_FILTER_OPTION_ALL = () => "Show All Logs";
export const LOGS_FILTER_OPTION_ERROR = () => "Error Logs";
export const LOGS_FILTER_OPTION_CONSOLE = () => "Console Logs";
export const LOGS_FILTER_OPTION_SYSTEM = () => "System Logs";
export const NO_LOGS = () => "No logs to show";
export const NO_ERRORS = () => "No signs of trouble here!";
export const DEBUGGER_ERRORS = () => "Errors";
export const DEBUGGER_LOGS = () => "Logs";
export const INSPECT_ENTITY = () => "Inspect entity";
export const INSPECT_ENTITY_BLANK_STATE = () => "Select an entity to inspect";
export const VALUE_IS_INVALID = (propertyPath: string) =>
  `The value at ${propertyPath} is invalid`;
export const ACTION_CONFIGURATION_UPDATED = () => "Configuration updated";
export const WIDGET_PROPERTIES_UPDATED = () => "Widget properties were updated";
export const EMPTY_RESPONSE_FIRST_HALF = () => "🙌 Click on";
export const EMPTY_RESPONSE_LAST_HALF = () => "to get a response";
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
export const SHOW_MESSAGE = () => `Show message`;
export const OPEN_MODAL = () => `Open modal`;
export const CLOSE_MODAL = () => `Close modal`;
export const STORE_VALUE = () => `Store value`;
export const REMOVE_VALUE = () => `Remove value`;
export const CLEAR_STORE = () => `Clear store`;
export const DOWNLOAD = () => `Download`;
export const COPY_TO_CLIPBOARD = () => `Copy to clipboard`;
export const RESET_WIDGET = () => `Reset widget`;
export const EXECUTE_JS_FUNCTION = () => `Execute a JS function`;
export const SET_INTERVAL = () => `Set interval`;
export const CLEAR_INTERVAL = () => `Clear interval`;
export const GET_GEO_LOCATION = () => `Get Geolocation`;
export const WATCH_GEO_LOCATION = () => `Watch Geolocation`;
export const STOP_WATCH_GEO_LOCATION = () => `Stop watching Geolocation`;
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
  `Unable to update js collection name to ${actionName}`;
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
export const JS_EXECUTION_SUCCESS = () => "JS Function executed successfully";
export const JS_EXECUTION_FAILURE = () => "JS Function execution failed";
export const JS_EXECUTION_FAILURE_TOASTER = () =>
  "There was an error while executing function";
export const JS_SETTINGS_ONPAGELOAD = () => "Run function on page load (Beta)";
export const JS_EXECUTION_SUCCESS_TOASTER = (actionName: string) =>
  `${actionName} ran successfully`;
export const JS_SETTINGS_ONPAGELOAD_SUBTEXT = () =>
  "Will refresh data every time page is reloaded";
export const JS_SETTINGS_CONFIRM_EXECUTION = () =>
  "Request confirmation before calling function?";
export const JS_SETTINGS_CONFIRM_EXECUTION_SUBTEXT = () =>
  "Ask confirmation from the user every time before refreshing data";
export const JS_SETTINGS_EXECUTE_TIMEOUT = () =>
  "Function Timeout (in milliseconds)";
export const ASYNC_FUNCTION_SETTINGS_HEADING = () => "Async Function Settings";
export const NO_ASYNC_FUNCTIONS = () =>
  "There is no asynchronous function in this JSObject";
export const NO_JS_FUNCTION_TO_RUN = (JSObjectName: string) =>
  `${JSObjectName} has no function`;
export const NO_JS_FUNCTION_RETURN_VALUE = (JSFunctionName: string) =>
  `${JSFunctionName} did not return any data. Did you add a return statement?`;

// Import/Export Application features
export const IMPORT_APPLICATION_MODAL_TITLE = () => "Import application";
export const IMPORT_APPLICATION_MODAL_LABEL = () =>
  "Where would you like to import your application from?";
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
export const ADD_MISSING_DATASOURCES = () => "Add missing Datasources";
export const SKIP_TO_APPLICATION_TOOLTIP_HEADER = () =>
  "This action is irreversible.";
export const SKIP_TO_APPLICATION_TOOLTIP_DESCRIPTION = () =>
  `You can always reconnect the datasources later but until then the application might be unuseable.`;
export const SKIP_TO_APPLICATION = () => "Skip to Application";
export const SELECT_A_METHOD_TO_ADD_CREDENTIALS = () =>
  "Select a method to add credentials";
export const DELETE_CONFIRMATION_MODAL_TITLE = () => `Are you sure?`;
export const DELETE_CONFIRMATION_MODAL_SUBTITLE = (name?: string | null) =>
  `You want to remove ${name} from this workspace`;
export const PARSING_ERROR = () =>
  "Syntax Error: Unable to parse code, please check error logs to debug";
export const PARSING_WARNING = () =>
  "Linting Errors: Please resolve linting errors before using these functions";
export const JS_FUNCTION_CREATE_SUCCESS = () =>
  "New JS function added successfully";
export const JS_FUNCTION_UPDATE_SUCCESS = () =>
  "JS Function updated successfully";
export const JS_FUNCTION_DELETE_SUCCESS = () =>
  "JS function deleted successfully";
export const JS_OBJECT_BODY_INVALID = () => "JS object could not be parsed";
export const JS_ACTION_EXECUTION_ERROR = (jsFunctionName: string) =>
  `An error occured while trying to execute ${jsFunctionName}, please check error logs to debug`;
//Editor Page
export const EDITOR_HEADER_SAVE_INDICATOR = () => "Saved";

//undo redo
export const WIDGET_REMOVED = (widgetName: string) =>
  `${widgetName} is removed`;
export const WIDGET_ADDED = (widgetName: string) =>
  `${widgetName} is added back`;
export const BULK_WIDGET_REMOVED = (widgetName: string) =>
  `${widgetName} widgets are removed`;
export const BULK_WIDGET_ADDED = (widgetName: string) =>
  `${widgetName} widgets are added back`;

// Generate page from DB Messages

export const UNSUPPORTED_PLUGIN_DIALOG_TITLE = () =>
  `Couldn't auto-generate a page from this datasource.`;

export const UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE = () =>
  `You can continue building your app with it using our drag & drop builder`;
export const UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING = () => `Heads up`;

export const BUILD_FROM_SCRATCH_ACTION_SUBTITLE = () =>
  "Start from scratch and create your custom UI";

export const BUILD_FROM_SCRATCH_ACTION_TITLE = () => "Build with drag & drop";

export const GENERATE_PAGE_ACTION_TITLE = () => "Generate Page With Data";

export const GENERATE_PAGE_FORM_TITLE = () => "Generate from data";

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
export const ADD_NEW_WIDGET = () => "Add new widget";
export const SUGGESTED_WIDGETS = () => "Suggested widgets";
export const SUGGESTED_WIDGET_TOOLTIP = () => "Add to canvas";
export const WELCOME_TOUR_STICKY_BUTTON_TEXT = () => "Next mission";

// Data Sources pane
export const EMPTY_ACTIVE_DATA_SOURCES = () => "No active datasources found.";
export const SCHEMA_NOT_AVAILABLE = () => "Schema not available";

export const SNIPPET_EXECUTION_SUCCESS = () => `Snippet executed successfully.`;

export const SNIPPET_EXECUTION_FAILED = () => `Snippet execution failed.`;

export const SNIPPET_INSERT = () => `Hit ⏎ to insert`;
export const SNIPPET_COPY = () => `Hit ⏎ to copy`;
export const SNIPPET_EXECUTE = () => `Hit ⏎ to run`;
export const APPLY_SEARCH_CATEGORY = () => `⏎ Jump`;

// Git sync
export const CONNECTED_TO_GIT = () => "Connected to Git";

export const GIT_DISCONNECT_POPUP_TITLE = () =>
  `This will disconnect the Git repository from this application`;

export const GIT_DISCONNECT_POPUP_SUBTITLE = () =>
  `Git features will no more be shown for this application`;
export const GIT_DISCONNECT_POPUP_MAIN_HEADING = () => `Are you sure?`;

export const GIT_CONNECTION = () => "Git Connection";
export const GIT_IMPORT = () => "Git Import";
export const MERGE = () => "Merge";
export const GIT_SETTINGS = () => "Git Settings";
export const CONNECT_TO_GIT = () => "Connect to Git repository";
export const CONNECT_TO_GIT_SUBTITLE = () =>
  "Checkout branches, make commits, and deploy your application";
export const REMOTE_URL = () => "Remote URL";
export const REMOTE_URL_INFO = () =>
  `Create an empty Git repository and paste the remote URL here.`;
export const IMPORT_URL_INFO = () => `Paste the remote URL here:`;
export const REMOTE_URL_VIA = () => "Remote URL via";

export const USER_PROFILE_SETTINGS_TITLE = () => "User settings";

export const USE_DEFAULT_CONFIGURATION = () => "Use default configuration";
export const AUTHOR_NAME = () => "Author name";
export const AUTHOR_NAME_CANNOT_BE_EMPTY = () => "Author name cannot be empty";
export const AUTHOR_EMAIL = () => "Author email";

export const NAME_YOUR_NEW_BRANCH = () => "Name your new branch";
export const SWITCH_BRANCHES = () => "Switch branches";

export const DOCUMENTATION = () => "Documentation";
export const DOCUMENTATION_TOOLTIP = () => "Open Docs in Omnibar";
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
export const PULL_CHANGES = () => "PULL CHANGES";
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

export const IS_MERGING = () => "Merging changes...";

export const MERGE_CHANGES = () => "Merge changes";
export const SELECT_BRANCH_TO_MERGE = () => "Select branch to merge";
export const CONNECT_GIT = () => "Connect Git";
export const CONNECT_GIT_BETA = () => "Connect Git (Beta)";
export const RETRY = () => "RETRY";
export const CREATE_NEW_BRANCH = () => "CREATE NEW BRANCH";
export const ERROR_WHILE_PULLING_CHANGES = () => "ERROR WHILE PULLING CHANGES";
export const SUBMIT = () => "SUBMIT";
export const GIT_USER_UPDATED_SUCCESSFULLY = () =>
  "Git user updated successfully";
export const REMOTE_URL_INPUT_PLACEHOLDER = () =>
  "git@example.com:user/repository.git";
export const GIT_COMMIT_MESSAGE_PLACEHOLDER = () => "Your commit message here";
export const COPIED_SSH_KEY = () => "Copied SSH key";
export const INVALID_USER_DETAILS_MSG = () => "Please enter valid user details";
export const PASTE_SSH_URL_INFO = () =>
  "Please enter a valid SSH URL of your repository";
export const GENERATE_KEY = () => "Generate key";
export const UPDATE_CONFIG = () => "UPDATE CONFIG";
export const CONNECT_BTN_LABEL = () => "CONNECT";
export const IMPORT_BTN_LABEL = () => "IMPORT";
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
  "You have uncommitted changes. Please commit before pulling the remote changes.";
export const CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES = () =>
  "Your current branch has uncommitted changes. Please commit them before proceeding to merge.";

export const DISCONNECT_SERVICE_SUBHEADER = () =>
  "Changes to this section can disrupt user authentication. Proceed with caution.";
export const DISCONNECT_SERVICE_WARNING = () =>
  "will be removed as primary method of authentication";
export const AUTHENTICATION_METHOD_ENABLED = (methodName: string) => `
  ${methodName} authentication method is enabled
`;

export const REVOKE_EXISTING_REPOSITORIES = () =>
  "Revoke Existing Repositories";
export const REVOKE_EXISTING_REPOSITORIES_INFO = () =>
  "To make space for newer repositories, you can remove existing repositories.";
export const CONTACT_SUPPORT = () => "Contact Support";
export const CONTACT_SALES_MESSAGE_ON_INTERCOM = (workspaceName: string) =>
  `Hey there, thanks for getting in touch! We understand that you’d like to extend the number of private repos for your ${workspaceName}. Could you tell us how many private repositories you require and why? We'll get back to you in a short while.`;
export const REPOSITORY_LIMIT_REACHED = () => "Repository Limit Reached";
export const REPOSITORY_LIMIT_REACHED_INFO = () =>
  "Adding and using upto 3 repositories is free. To add more repositories, kindly upgrade.";
export const APPLICATION_IMPORT_SUCCESS = (username: string) =>
  `${username}! Your application is ready to use.`;
export const APPLICATION_IMPORT_SUCCESS_DESCRIPTION = () =>
  "All your datasources are configured and ready to use.";
export const NONE_REVERSIBLE_MESSAGE = () =>
  "This action is non-reversible. Please proceed with caution.";
export const CONTACT_SUPPORT_TO_UPGRADE = () =>
  "Please contact support to upgrade. You can add unlimited private repositories in upgraded plan.";
export const REVOKE_CAUSE_APPLICATION_BREAK = () =>
  "Revoking your repository might cause the application to break.";
export const REVOKE_GIT = () => "Revoke access";
export const DISCONNECT = () => "DISCONNECT";
export const REVOKE = () => "REVOKE";
export const REVOKE_ACCESS = () => "REVOKE ACCESS";
export const GIT_DISCONNECTION_SUBMENU = () => "Git Connection > Disconnect";
export const DISCONNECT_FROM_GIT = (name: string) =>
  `Disconnect ${name} from Git`;
export const GIT_REVOKE_ACCESS = (name: string) => `Revoke Access To ${name}`;
export const GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS = (name: string) =>
  `Type “${name}” in the input box to revoke access.`;
export const APPLICATION_NAME = () => "Application name";
export const OPEN_REPO = () => "OPEN REPOSITORY";
export const CONNECTING_REPO = () => "Connecting to Git repository";
export const IMPORTING_APP_FROM_GIT = () => "Importing application from Git";
export const CONFIRM_SSH_KEY = () =>
  "Please make sure your SSH key has write access.";
export const READ_DOCUMENTATION = () => "Read documentation";
export const LEARN_MORE = () => "Learn More";
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
  "Discarding these changes will pull previous changes from Git.";
export const DISCARD_CHANGES = () => "Discard changes";

// GIT DEPLOY begin
export const DEPLOY = () => "Deploy";
export const DEPLOY_YOUR_APPLICATION = () => "Deploy your application";
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

// JS Snippets
export const SNIPPET_DESCRIPTION = () =>
  `Search and insert code snippets to perform complex actions quickly.`;
export const DOC_DESCRIPTION = () =>
  `Find answers through Appsmith documentation.`;
export const NAV_DESCRIPTION = () =>
  `Navigate to any page, widget or file across this project.`;
export const ACTION_OPERATION_DESCRIPTION = () =>
  `Create a new Query, API or JS Object`;

export const TRIGGER_ACTION_VALIDATION_ERROR = (
  functionName: string,
  argumentName: string,
  expectedType: string,
  received: string,
) =>
  `${functionName} expected ${expectedType} for '${argumentName}' argument but received ${received}`;

// Comment card tooltips
export const MORE_OPTIONS = () => "More Options";
export const ADD_REACTION = () => "Add Reaction";
export const RESOLVE_THREAD = () => "Resolve Thread";
export const RESOLVED_THREAD = () => "Resolved Thread";
export const EMOJI = () => "Emoji";

// Sniping mode messages
export const SNIPING_SELECT_WIDGET_AGAIN = () =>
  "Unable to detect the widget, please select the widget again.";

export const SNIPING_NOT_SUPPORTED = () =>
  "Binding on selection is not supported for this type of widget!";

//First Time User Onboarding
//Checklist page
export enum ONBOARDING_CHECKLIST_ACTIONS {
  CONNECT_A_DATASOURCE = "CONNECT DATASOURCE",
  CREATE_A_QUERY = "CREATE A QUERY",
  ADD_WIDGETS = "ADD WIDGETS",
  CONNECT_DATA_TO_WIDGET = "CONNECT DATA TO WIDGET",
  DEPLOY_APPLICATIONS = "DEPLOY APPLICATION",
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

export const ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE = {
  bold: () => "Connect your datasource",
  normal: () => "to start building an application.",
};

export const ONBOARDING_CHECKLIST_CREATE_A_QUERY = {
  bold: () => "Create a query",
  normal: () => "of your datasource.",
};

export const ONBOARDING_CHECKLIST_ADD_WIDGETS = {
  bold: () => "Start visualising your application",
  normal: () => "using widgets.",
};

export const ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET = {
  bold: () => "Connect your data to the widgets",
  normal: () => "using JavaScript.",
};

export const ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS = {
  bold: () => "Deploy your application,",
  normal: () => "and see your creation live.",
};

export const ONBOARDING_CHECKLIST_FOOTER = () =>
  "Not sure where to start? Take the welcome tour";

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
export const START_TUTORIAL = () => "START TUTORIAL";
export const WELCOME_TO_APPSMITH = () => "Welcome to Appsmith!";
export const QUERY_YOUR_DATABASE = () =>
  "Query your own database or API inside Appsmith. Write JS to construct dynamic queries.";

//Statusbar
export const ONBOARDING_STATUS_STEPS_FIRST = () => "First: Add a datasource";
export const ONBOARDING_STATUS_STEPS_FIRST_ALT = () => "Next: Add a datasource";
export const ONBOARDING_STATUS_STEPS_SECOND = () => "Next: Create a query";
export const ONBOARDING_STATUS_STEPS_THIRD = () => "Next: Add a widget";
export const ONBOARDING_STATUS_STEPS_THIRD_ALT = () => "First: Add a widget";
export const ONBOARDING_STATUS_STEPS_FOURTH = () =>
  "Next: Connect data to widget";
export const ONBOARDING_STATUS_STEPS_FIVETH = () =>
  "Next: Deploy your application";
export const ONBOARDING_STATUS_STEPS_SIXTH = () => "Completed 🎉";
export const ONBOARDING_STATUS_GET_STARTED = () => "GET STARTED";

//Tasks
//1. datasource
export const ONBOARDING_TASK_DATASOURCE_HEADER = () =>
  "Start by adding your first Datasource";
export const ONBOARDING_TASK_DATASOURCE_BODY = () =>
  "Adding a datasource makes creating applications more powerful. Don’t worry if you don’t have any data on hand, we have a sample dataset that you can use.";
export const ONBOARDING_TASK_DATASOURCE_BUTTON = () => "+ Add a datasource";
export const ONBOARDING_TASK_DATASOURCE_FOOTER_ACTION = () => "Add a widget";
export const ONBOARDING_TASK_DATASOURCE_FOOTER = () => "first.";
//2. query
export const ONBOARDING_TASK_QUERY_HEADER = () => "Next, create a query";
export const ONBOARDING_TASK_QUERY_BODY = () =>
  "Great job adding a datasource! The next thing you can do is create a query on your data.";
export const ONBOARDING_TASK_QUERY_BUTTON = () => "+ Create a query";
export const ONBOARDING_TASK_QUERY_FOOTER_ACTION = () => "Add a widget";
//2. widget
export const ONBOARDING_TASK_WIDGET_HEADER = () =>
  "Next, add a widget to start displaying data";
export const ONBOARDING_TASK_WIDGET_BODY = () =>
  "Great job adding a datasource! The next thing you can do is add widget to start visualizing your data.";
export const ONBOARDING_TASK_WIDGET_BUTTON = () => "+ Add a widget";
export const ONBOARDING_TASK_WIDGET_FOOTER_ACTION = () =>
  "deploy your application";
export const ONBOARDING_TASK_FOOTER = () => "Alternatively, you can also";

export const USE_SNIPPET = () => "Snippet";
export const SNIPPET_TOOLTIP = () => "Search code snippets";

//Welcome page
export const WELCOME_HEADER = () => "Welcome!";
export const WELCOME_BODY = () =>
  "Let us setup your account so you can make awesome applications!";
export const WELCOME_ACTION = () => "Get started";

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

export const WELCOME_FORM_HEADER = () => "Let us get to know you better!";
export const WELCOME_FORM_FULL_NAME = () => "Full Name";
export const WELCOME_FORM_EMAIL_ID = () => "Email Id";
export const WELCOME_FORM_CREATE_PASSWORD = () => "Create Password";
export const WELCOME_FORM_VERIFY_PASSWORD = () => "Verify Password";
export const WELCOME_FORM_ROLE_DROPDOWN = () => "What Role Do You Play?";
export const WELCOME_FORM_ROLE_DROPDOWN_PLACEHOLDER = () => "- Select a role -";
export const WELCOME_FORM_ROLE = () => "Role";
export const WELCOME_FORM_CUSTOM_USE_CASE = () => "Use case";
export const WELCOME_FORM_USE_CASE = () => "Tell Us About Your Use Case";
export const WELCOME_FORM_USE_CASE_PLACEHOLDER = () => "- Select a use case -";
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
export const WELCOME_FORM_SUBMIT_LABEL = () => "Make your first App";

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
export const CURRENT_DEPLOY_PREVIEW_OPTION = () => "Current Deployed Version";
export const CONNECT_TO_GIT_OPTION = () => "Connect to Git Repository";
//
export const GO_TO_PAGE = () => "Go to page";
export const DEFAULT_PAGE_TOOLTIP = () => "Default page";
export const HIDDEN_TOOLTIP = () => "Hidden";
export const CLONE_TOOLTIP = () => "Clone";
export const DELETE_TOOLTIP = () => "Delete";
export const SETTINGS_TOOLTIP = () => "Settings";
//settings
export const ADMIN_SETTINGS = () => "Admin Settings";
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
export const TEST_EMAIL_FAILURE = () => "Sending Test Email Failed";
export const DISCONNECT_AUTH_ERROR = () =>
  "Cannot disconnect the only connected authentication method.";
export const MANDATORY_FIELDS_ERROR = () => "Mandatory fields cannot be empty";

// Audit logs begin
export const AUDIT_LOGS = () => "Audit Logs";
export const TRY_AGAIN_WITH_YOUR_FILTER = () => "Try again with your filter";

// Audit logs Upgrade page begin
export const INTRODUCING = (featureName: string) =>
  `Introducing ${featureName}`;
export const AUDIT_LOGS_UPGRADE_PAGE_SUB_HEADING = () =>
  "See a timestamped trail of events in your workspace. Filter by type of event, user, resource ID, and time. Drill down into each event to investigate further.";
export const SECURITY_AND_COMPLIANCE = () => "Security & Compliance";
export const SECURITY_AND_COMPLIANCE_DETAIL1 = () =>
  "Proactively derisk misconfigured permissions, roll back changes from a critical security event, and keep checks against your compliance policies.";
export const SECURITY_AND_COMPLIANCE_DETAIL2 = () =>
  "Exports to popular compliance tools coming soon";
export const DEBUGGING = () => "Debugging";
export const DEBUGGING_DETAIL1 = () =>
  "Debug with a timeline of events filtered by user and resource ID, correlate them with end-user and app developer actions, and investigate back to the last known good state of your app.";
export const INCIDENT_MANAGEMENT = () => "Incident Management";
export const INCIDENT_MANAGEMENT_DETAIL1 = () =>
  "Go back in time from an incident to see who did what, correlate events with breaking changes, and run RCAs to remediate incidents for now and the future.";
export const AVAILABLE_ON_BUSINESS = () => "Available on a business plan only";
export const EXCLUSIVE_TO_BUSINESS = (featureName: string) =>
  `The ${featureName} feature is exclusive to workspaces on the Business Plan`;
// Audit logs Upgrade page end
// Audit logs end

// Access control upgrade page begin
export const GRANULAR_ACCESS_CONTROL_FOR_TEAMS = () =>
  "Granular Access Controls for teams";
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
  "Unlock granular access controls along with audit logs and SSO for enhanced security and reliability with an upgrade to our Business edition.";
// Access control upgrade page end

//
export const WELCOME_FORM_NON_SUPER_USER_ROLE_DROPDOWN = () =>
  "Tell us more about what you do at work?";
export const WELCOME_FORM_NON_SUPER_USER_ROLE = () => "Role";
export const WELCOME_FORM_NON_SUPER_USER_USE_CASE = () =>
  "What are you planning to use Appsmith for?";
export const QUERY_CONFIRMATION_MODAL_MESSAGE = () =>
  `Are you sure you want to run `;
export const ENTITY_EXPLORER_TITLE = () => "NAVIGATION";
export const MULTI_SELECT_PROPERTY_PANE_MESSAGE = () =>
  `Select a widget to see it's properties`;
export const WIDGET_DEPRECATION_MESSAGE = (widgetName: string) =>
  `The ${widgetName}widget you are currently using is now deprecated.`;
export const DEPRECATION_WIDGET_REPLACEMENT_MESSAGE = (
  replacingWidgetName: string,
) =>
  ` You can drag a new ${replacingWidgetName} widget and configure it in place of the deprecated widget.`;
export const LOCK_ENTITY_EXPLORER_MESSAGE = () => `Lock sidebar open`;
export const CLOSE_ENTITY_EXPLORER_MESSAGE = () => `Close sidebar`;
export const JS_TOGGLE_DISABLED_MESSAGE = "Clear the field to toggle back";
export const PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE =
  "No Properties found based on your search";
export const PROPERTY_SEARCH_INPUT_PLACEHOLDER =
  "Search for controls, labels etc";

// API Pane
export const API_PANE_NO_BODY = () => "This request does not have a body";
export const API_PANE_AUTO_GENERATED_HEADER = () =>
  "This content-type header is auto-generated by appsmith based on body type of the API. Create a new header content-type to overwrite this value.";
export const API_PANE_DUPLICATE_HEADER = (headerName: string) =>
  `This is a duplicate header and will be overridden by the ${headerName} header added by you.`;

export const TABLE_WIDGET_TOTAL_RECORD_TOOLTIP = () =>
  "It stores the total no. of rows in the table. Helps in calculating the no. of pages that further allows to enable or disable the next/previous control in pagination.";
export const CREATE_DATASOURCE_TOOLTIP = () => "Add a new datasource";
export const ADD_QUERY_JS_TOOLTIP = () => "Add a new query / JS Object";

// Add datasource
export const GENERATE_APPLICATION_TITLE = () => "Generate Page";
export const GENERATE_APPLICATION_DESCRIPTION = () =>
  "Quickly generate a page to perform CRUD operations on your database tables";
export const DELETE_WORKSPACE_SUCCESSFUL = () =>
  "Workspace deleted successfully";
// theming
export const CHANGE_APP_THEME = (name: string) => `Theme ${name} Applied`;
export const SET_DEFAULT_SELECTED_THEME = (name: string) =>
  `Applied the ${name} theme, since custom theme was not found`;
export const SAVE_APP_THEME = (name: string) => `Theme ${name} Saved`;
export const DELETE_APP_THEME = (name: string) => `Theme ${name} Deleted`;
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
export const ADMIN_AUTH_SETTINGS_TITLE = () => "Select Authentication Method";
export const ADMIN_AUTH_SETTINGS_SUBTITLE = () =>
  "Select a protocol you want to authenticate users with";
export const DANGER_ZONE = () => "Danger Zone";
export const DISCONNECT_AUTH_METHOD = () => "Disconnect";
export const DISCONNECT_CONFIRMATION = () => "Are you sure?";

// Branding
export const ADMIN_BRANDING_SETTINGS_TITLE = () =>
  "Custom branding for your workspaces";
export const ADMIN_BRANDING_SETTINGS_SUBTITLE = () =>
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
export const STEP_ONE_BUTTON_TEXT = () => "PROCEED TO NEXT STEP";
export const STEP_TWO_TITLE = () =>
  "Let’s display this response in a table. Select the table widget we’ve added for you.";
export const STEP_THREE_TITLE = () =>
  "Display the response of the query in a table.";
export const STEP_THREE_SUCCESS_TEXT = () =>
  "Great job! The table is now displaying the response of a query. You can use {{ }} in any input field to bind data to widgets.";
export const STEP_THREE_SUCCESS_BUTTON_TEXT = () => "PROCEED TO NEXT STEP";
export const STEP_FOUR_TITLE = () =>
  "Let’s build a form to update a customer record ";
export const STEP_FOUR_HINT_BUTTON_TEXT = () => "PROCEED";
export const STEP_FOUR_SUCCESS_TEXT = () =>
  "Awesome! You connected the input widget to table’s selected row. The input will always show the data from the selected row.";
export const STEP_FOUR_SUCCESS_BUTTON_TEXT = () => "PROCEED TO NEXT STEP";
export const STEP_FIVE_TITLE = () =>
  "Connect all input fields in the Customer Update Form with the table";
export const STEP_FIVE_HINT_TEXT = () =>
  `Now let's connect rest of widgets in the container to Table's selected row`;
export const STEP_FIVE_SUCCESS_TEXT = () =>
  "Great work! All inputs are now connected to the  table’s selected row";
export const STEP_FIVE_SUCCESS_BUTTON_TEXT = () => "PROCEED TO NEXT STEP";
export const STEP_SIX_TITLE = () =>
  "Add an update button to trigger an update query";
export const STEP_SIX_SUCCESS_TEXT = () =>
  "Perfect! Your update button is ready to trigger an update query.";
export const STEP_SIX_SUCCESS_BUTTON_TEXT = () => "PROCEED TO NEXT STEP";
export const STEP_SEVEN_TITLE = () =>
  "Trigger updateCustomerInfo query by binding to the button widget";
export const STEP_EIGHT_TITLE = () =>
  "After successfully triggering the update query, fetch the updated customer data. ";
export const STEP_EIGHT_SUCCESS_TEXT = () =>
  "Exceptional work! You’ve now built a way to see customer data and update it.";
export const STEP_NINE_TITLE = () => "Final step: Test & deploy your app";
export const CONTINUE = () => "CONTINUE";
export const PROCEED_TO_NEXT_STEP = () => "PROCEED TO NEXT STEP";
export const PROCEED = () => "PROCEED";
export const COMPLETE = () => "COMPLETE";
// -- Modal --
export const DEVIATION = () => "You are deviating from the tutorial";
export const END_CONFIRMATION = () => "Are you sure you want to end?";
export const CANCEL_DIALOG = () => "CANCEL";
// -- End Tutorial --
export const END_TUTORIAL = () => "END TUTORIAL";
// -- Intro content --
export const TITLE = () =>
  "In this tutorial we’ll build a tool to display customer information";
export const DESCRIPTION = () =>
  "This tool has a table that displays customer data and a form to update a particular customer record. Try out the tool below before you start building.";
export const BUTTON_TEXT = () => "Start Building";
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
export const END_BUTTON_TEXT = () => "START BUILDING AN APP";

export const CONTEXT_EDIT_NAME = () => "Edit Name";
export const CONTEXT_SHOW_BINDING = () => "Show Bindings";
export const CONTEXT_MOVE = () => "Move to page";
export const CONTEXT_COPY = () => "Copy to page";
export const CONTEXT_DELETE = () => "Delete";
export const CONFIRM_CONTEXT_DELETE = () => "Are you sure?";
export const CONFIRM_CONTEXT_DELETING = () => "Deleting";
export const CONTEXT_NO_PAGE = () => "No pages";
export const CONTEXT_REFRESH = () => "Refresh";
export const CONTEXT_CLONE = () => "Clone";
export const CONTEXT_SETTINGS = () => "Settings";
export const CONTEXT_SET_AS_HOME_PAGE = () => "Set as Home Page";
export const PAGE = () => "Page";
export const PAGES = () => "Pages";

// Entity explorer
export const ADD_DATASOURCE_BUTTON = () => "ADD DATASOURCE";
export const ADD_WIDGET_BUTTON = () => "ADD WIDGET";
export const ADD_QUERY_JS_BUTTON = () => "ADD QUERY/JS";
export const EMPTY_WIDGET_MAIN_TEXT = () => "No widget to display";
export const EMPTY_WIDGET_BUTTON_TEXT = () => "NEW WIDGET";
export const EMPTY_QUERY_JS_MAIN_TEXT = () => "No query/JS to display";
export const EMPTY_QUERY_JS_BUTTON_TEXT = () => "NEW QUERY/JS";
export const EMPTY_DATASOURCE_MAIN_TEXT = () => "No datasource to display";
export const EMPTY_DATASOURCE_BUTTON_TEXT = () => "NEW DATASOURCE";

// Templates
export const MORE = () => "MORE";
export const SHOW_LESS = () => "SHOW LESS";
export const CHOOSE_WHERE_TO_FORK = () => "Choose where to fork the template";
export const SELECT_WORKSPACE = () => "Select Workspace";
export const FORK_TEMPLATE = () => "FORK TEMPLATE";
export const TEMPLATES = () => "TEMPLATES";
export const FORK_THIS_TEMPLATE = () => "Use template";
export const COULDNT_FIND_TEMPLATE = () =>
  "Couldn’t find what you are looking for?";
export const COULDNT_FIND_TEMPLATE_DESCRIPTION = () =>
  "A github issue portal will be opened up for you to create an issue regarding what type of template you need.";
export const REQUEST_TEMPLATE = () => "Request for a template";
export const SEARCH_TEMPLATES = () => "Search templates";
export const INTRODUCING_TEMPLATES = () => "Introducing Templates";
export const TEMPLATE_NOTIFICATION_DESCRIPTION = () =>
  "Use these templates to learn, create, and build apps even faster";
export const GO_BACK = () => "GO BACK";
export const OVERVIEW = () => "Overview";
export const FUNCTION = () => "Function";
export const INDUSTRY = () => "Use Case";
export const DATASOURCES = () => "Datasources";
export const NOTE = () => "Note:";
export const NOTE_MESSAGE = () => "You can add your datasources as well";
export const WIDGET_USED = () => "Widgets";
export const SIMILAR_TEMPLATES = () => "Similar Templates";
export const VIEW_ALL_TEMPLATES = () => "VIEW ALL TEMPLATES";
export const FILTERS = () => "FILTERS";
export const TEMPLATE_CARD_TITLE = () => "Start from a template";
export const TEMPLATE_CARD_DESCRIPTION = () =>
  "Create app from template by selecting pages";
export const FILTER_SELECTALL = () => "Select all";
export const FILTER_SELECT_PAGES = () => "ADD SELECTED PAGES";
export const FORKING_TEMPLATE = () => "Setting up the template";
export const FETCHING_TEMPLATES = () => "Loading template details";
export const FETCHING_TEMPLATE_LIST = () => "Loading templates list";

export const TEMPLATES_BACK_BUTTON = () => "BACK TO TEMPLATES";

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
export const FORK = () => `FORK`;

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
  cloudHosting?: boolean,
) => `Users (${length})`;

export const CREATE_PAGE = () => "New Blank Page";
export const CANVAS_NEW_PAGE_CARD = () => "Create New Page";
export const GENERATE_PAGE = () => "Generate page from data table";
export const GENERATE_PAGE_DESCRIPTION = () =>
  "Start app with a simple CRUD UI and customize it";
export const ADD_PAGE_FROM_TEMPLATE = () => "Add Page From Template";
export const INVALID_URL = () =>
  "Please enter a valid URL, for example, https://example.com";
export const SAVE_OR_DISCARD_DATASOURCE_WARNING = () =>
  `Unsaved changes will be lost if you exit this page, save the changes before exiting.`;

export const APP_SETTINGS_PANE_HEADER = () => "Settings";
export const APP_SETTINGS_CLOSE_TOOLTIP = () => "Close settings panel";

export const GENERAL_SETTINGS_SECTION_HEADER = () => "General";
export const GENERAL_SETTINGS_SECTION_CONTENT_HEADER = () => "General Settings";
export const GENERAL_SETTINGS_SECTION_HEADER_DESC = () =>
  "App name, icon and share";
export const GENERAL_SETTINGS_APP_NAME_LABEL = () => "App Name";
export const GENERAL_SETTINGS_NAME_EMPTY_MESSAGE = () =>
  "App name cannot be empty";
export const GENERAL_SETTINGS_NAME_SPECIAL_CHARACTER_ERROR = () =>
  "Only alphanumeric or '-()' are allowed";
export const GENERAL_SETTINGS_APP_ICON_LABEL = () => "App Icon";

export const THEME_SETTINGS_SECTION_HEADER = () => "Theme";
export const THEME_SETTINGS_SECTION_CONTENT_HEADER = () => "Theme Settings";
export const THEME_SETTINGS_SECTION_HEADER_DESC = () =>
  "Set theme, color and font";

export const PAGE_SETTINGS_SECTION_HEADER = () => "Page settings";
export const PAGE_SETTINGS_SECTION_CONTENT_HEADER = () => "Settings";
export const PAGE_SETTINGS_PAGE_NAME_LABEL = () => "Page Name";
export const PAGE_SETTINGS_NAME_EMPTY_MESSAGE = () =>
  "Page name cannot be empty";
export const PAGE_SETTINGS_NAME_SPECIAL_CHARACTER_ERROR = () =>
  "Only alphanumeric or '-' are allowed";
export const PAGE_SETTINGS_PAGE_URL_LABEL = () => "Change Page URL";
export const PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_1 = () => "Please";
export const PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_2 = () => "update";
export const PAGE_SETTINGS_PAGE_URL_VERSION_UPDATE_3 = () =>
  "your app URL to new readable format to change this";
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

export const IN_APP_EMBED_SETTING = {
  applicationUrl: () => "application url",
  allowEmbeddingLabel: () => "Embedding enabled",
  allowEmbeddingTooltip: () =>
    "This app can be embedded in all domains, including malicious ones",
  copy: () => "Copy",
  copied: () => "Copied",
  limitEmbeddingLabel: () => "Embedding restricted",
  limitEmbeddingTooltip: () => "This app can be embedded in approved URLs only",
  disableEmbeddingLabel: () => "Embedding disabled",
  disableEmbeddingTooltip: () =>
    "This app cannot be embedded anywhere on the Internet",
  embed: () => "Embed",
  embedSnippetTitle: () => "Copy embed code",
  change: () => "Change",
  copiedEmbedCode: () => "Embed code copied to clipboard",
  embedSize: () => "Embed size",
  previewEmbeddedApp: () => "PREVIEW EMBEDDED APP",
  sectionHeader: () => "Share & Embed",
  sectionContentHeader: () => "Share",
  sectionHeaderDesc: () => "Make public, embed properties",
  showNavigationBar: () => "Show navigation bar",
};

export const NEW_QUERY_BUTTON_TEXT = () => "New Query";
export const NEW_API_BUTTON_TEXT = () => "New API";
export const GENERATE_NEW_PAGE_BUTTON_TEXT = () => "GENERATE NEW PAGE";
export const RECONNECT_BUTTON_TEXT = () => "RECONNECT";
export const SAVE_BUTTON_TEXT = () => "SAVE";
export const SAVE_AND_AUTHORIZE_BUTTON_TEXT = () => "SAVE AND AUTHORIZE";
export const DISCARD_POPUP_DONT_SAVE_BUTTON_TEXT = () => "DON'T SAVE";

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
  ADD_JS_LIBRARY: () => "Add JS Libraries",
  REC_LIBRARY: () => "Recommended Libraries",
  INSTALLATION_SUCCESSFUL: (accessor: string) =>
    `Installation Successful. You can access the library via ${accessor}`,
  INSTALLATION_FAILED: () => "Installation failed",
  INSTALLED_ALREADY: (accessor: string) =>
    `This library is already installed. You could access it via ${accessor}.`,
  UNINSTALL_FAILED: (name: string) =>
    `Couldn't uninstall ${name}. Please try again after sometime.`,
  UNINSTALL_SUCCESS: (accessor: string) =>
    `${accessor} is uninstalled successfully.`,
  LEARN_MORE_DESC: () => "Learn more about Custom JS Libraries",
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

// Business Edition upgrade page
export const MOVE_TO_BUSINESS_EDITION = (trailingChar: string) =>
  `Move to Business Edition${trailingChar ? trailingChar : ""}`;
