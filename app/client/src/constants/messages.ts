export function createMessage(
  format: (...strArgs: any[]) => string,
  ...args: any[]
) {
  return format(...args);
}

export const ERROR_MESSAGE_SELECT_ACTION = () => `Please select an action`;
export const ERROR_MESSAGE_SELECT_ACTION_TYPE = () =>
  `Please select an action type`;
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
export const INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR = () =>
  `Default Text length must be less than Max Chars allowed`;
export const VALID_FUNCTION_NAME_ERROR = () =>
  `Must be a valid variable name (camelCase)`;
export const UNIQUE_NAME_ERROR = () => `Name must be unique`;
export const NAME_SPACE_ERROR = () => `Name must not have spaces`;

export const FORM_VALIDATION_EMPTY_EMAIL = () => `Please enter an email`;
export const FORM_VALIDATION_INVALID_EMAIL = () =>
  `Please provide a valid email address`;
export const ENTER_VIDEO_URL = () => `Please provide a valid url`;

export const FORM_VALIDATION_EMPTY_PASSWORD = () => `Please enter the password`;
export const FORM_VALIDATION_PASSWORD_RULE = () =>
  `Please provide a password between 6 and 42 characters`;
export const FORM_VALIDATION_INVALID_PASSWORD = FORM_VALIDATION_PASSWORD_RULE;

export const LOGIN_PAGE_SUBTITLE = () => `Use your organization email`;
export const LOGIN_PAGE_TITLE = () => `Sign In to your account`;
export const LOGIN_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const LOGIN_PAGE_PASSWORD_INPUT_LABEL = () => `Password`;
export const LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER = () => `Email`;
export const LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER = () => `Password`;
export const LOGIN_PAGE_INVALID_CREDS_ERROR = () =>
  `It looks like you may have entered incorrect/invalid credentials. Please try again or reset password using the button below.`;
export const LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK = () =>
  `Reset Password`;
export const NEW_TO_APPSMITH = () => `New to Appsmith?`;

export const LOGIN_PAGE_LOGIN_BUTTON_TEXT = () => `sign in`;
export const LOGIN_PAGE_FORGOT_PASSWORD_TEXT = () => `Forgot Password`;
export const LOGIN_PAGE_REMEMBER_ME_LABEL = () => `Remember`;
export const LOGIN_PAGE_SIGN_UP_LINK_TEXT = () => `Sign up`;
export const SIGNUP_PAGE_TITLE = () => `Create your free account`;
export const SIGNUP_PAGE_SUBTITLE = () => `Use your organization email`;
export const SIGNUP_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER = () => ` Email`;
export const SIGNUP_PAGE_NAME_INPUT_PLACEHOLDER = () => `Name`;
export const SIGNUP_PAGE_NAME_INPUT_LABEL = () => `Name`;
export const SIGNUP_PAGE_PASSWORD_INPUT_LABEL = () => `Password`;
export const SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER = () => `Password`;
export const SIGNUP_PAGE_LOGIN_LINK_TEXT = () => `Sign In`;
export const SIGNUP_PAGE_NAME_INPUT_SUBTEXT = () => `How should we call you?`;
export const SIGNUP_PAGE_SUBMIT_BUTTON_TEXT = () => `Sign Up`;
export const ALREADY_HAVE_AN_ACCOUNT = () => `Already have an account?`;

export const SIGNUP_PAGE_SUCCESS = () =>
  `Awesome! You have successfully registered.`;
export const SIGNUP_PAGE_SUCCESS_LOGIN_BUTTON_TEXT = () => `Login`;

export const RESET_PASSWORD_PAGE_PASSWORD_INPUT_LABEL = () => `New Password`;
export const RESET_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER = () =>
  `New Password`;
export const RESET_PASSWORD_LOGIN_LINK_TEXT = () => `Back to Sign In`;
export const RESET_PASSWORD_PAGE_TITLE = () => `Reset Password`;
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
export const RESET_PASSWORD_FORGOT_PASSWORD_LINK = () => `Forgot Password`;

export const FORGOT_PASSWORD_PAGE_EMAIL_INPUT_LABEL = () => `Email`;
export const FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER = () => `Email`;
export const FORGOT_PASSWORD_PAGE_TITLE = () => `Reset Password`;
export const FORGOT_PASSWORD_PAGE_SUBTITLE = () =>
  `We will send a reset link to the email below`;
export const FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT = () => `Reset`;
export const FORGOT_PASSWORD_SUCCESS_TEXT = () =>
  `A password reset link has been sent to`;

export const PRIVACY_POLICY_LINK = () => `Privacy Policy`;
export const TERMS_AND_CONDITIONS_LINK = () => `Terms and Conditions`;

export const ERROR_500 = () =>
  `We apologize, Something went wrong. We're working to fix things.`;
export const ERROR_0 = () =>
  `We could not connect to our servers. Please check your network connection`;
export const ERROR_401 = () =>
  `We are unable to verify your identity. Please login again.`;
export const ERROR_403 = () =>
  `Permission Denied. Please contact your admin to gain access.`;
export const URL_HTTP_VALIDATION_ERROR = () => `Please enter a valid URL`;
export const NAVIGATE_TO_VALIDATION_ERROR = () =>
  `Please enter a valid URL or page name`;
export const PAGE_NOT_FOUND_ERROR = () =>
  `The page you’re looking for either does not exist, or cannot be found`;
export const INVALID_URL_ERROR = () => `Invalid URL`;

export const INVITE_USERS_VALIDATION_EMAIL_LIST = () =>
  `Invalid Email address(es) found`;
export const INVITE_USERS_VALIDATION_ROLE_EMPTY = () => `Please select a role`;

export const INVITE_USERS_EMAIL_LIST_PLACEHOLDER = () =>
  `Comma separated emails`;
export const INVITE_USERS_ROLE_SELECT_PLACEHOLDER = () => `Select Role`;
export const INVITE_USERS_ROLE_SELECT_LABEL = () => `Role`;
export const INVITE_USERS_EMAIL_LIST_LABEL = () => `User emails`;
export const INVITE_USERS_ADD_EMAIL_LIST_FIELD = () => `Add more`;
export const INVITE_USERS_SUBMIT_BUTTON_TEXT = () => `Invite Users`;
export const INVITE_USERS_SUBMIT_ERROR = () =>
  `We were unable to invite the users, please try again later`;
export const INVITE_USERS_SUBMIT_SUCCESS = () =>
  `The users have been invited successfully`;
export const INVITE_USER_SUBMIT_SUCCESS = () =>
  `The user has been invited successfully`;
export const INVITE_USERS_VALIDATION_EMAILS_EMPTY = () =>
  `Please enter the user emails`;

export const CREATE_PASSWORD_PAGE_PASSWORD_INPUT_LABEL = () => `New Password`;
export const CREATE_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER = () =>
  `New Password`;
export const CREATE_PASSWORD_LOGIN_LINK_TEXT = () =>
  `Already know the password? Login`;
export const CREATE_PASSWORD_PAGE_TITLE = () => `Set Password`;
export const CREATE_PASSWORD_SUBMIT_BUTTON_TEXT = () => `Create`;
export const CREATE_PASSWORD_PAGE_SUBTITLE = () =>
  `Set a new password for your account `;

export const CREATE_PASSWORD_RESET_SUCCESS = () => `Your password has been set`;
export const CREATE_PASSWORD_RESET_SUCCESS_LOGIN_LINK = () => `Login`;

export const CREATE_PASSWORD_EXPIRED_TOKEN = () =>
  `The invite link has expired. Please try requesting a new invite`;
export const CREATE_PASSWORD_INVALID_TOKEN = () =>
  `The invite link is invalid. Please try request a new invite`;

export const DELETING_APPLICATION = () => `Deleting application...`;
export const DUPLICATING_APPLICATION = () => `Duplicating application...`;

export const CURL_IMPORT_SUCCESS = () => `Curl command imported successfully`;
export const FORGOT_PASSWORD_PAGE_LOGIN_LINK = () => `Back to Sign In`;
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
export const SIGN_IN = () => `Sign In`;

export const LIGHTNING_MENU_DATA_API = () => `Use data from an API`;
export const LIGHTNING_MENU_DATA_QUERY = () => `Use data from a Query`;
export const LIGHTNING_MENU_DATA_TOOLTIP = () => `Quick start data binding`;
export const LIGHTNING_MENU_DATA_WIDGET = () => `Use data from a Widget`;
export const LIGHTNING_MENU_QUERY_CREATE_NEW = () => `Create new Query`;
export const LIGHTNING_MENU_API_CREATE_NEW = () => `Create new API`;

export const LIGHTNING_MENU_OPTION_TEXT = () => `Plain Text`;
export const LIGHTNING_MENU_OPTION_JS = () => `Write JS`;
export const LIGHTNING_MENU_OPTION_HTML = () => `Write HTML`;
export const CHECK_REQUEST_BODY = () => `Check Request body to debug?`;
export const DONT_SHOW_THIS_AGAIN = () => `Don't show this again`;
export const SHOW_REQUEST = () => `Show Request`;

export const TABLE_FILTER_COLUMN_TYPE_CALLOUT = () =>
  `Change column datatype to see filter operators`;

export const SAVE_HOTKEY_TOASTER_MESSAGE = () =>
  "Don't worry about saving, we've got you covered!";

export const WIDGET_SIDEBAR_TITLE = () => `Widgets`;
export const WIDGET_SIDEBAR_CAPTION = () =>
  `To add a widget, please drag and drop a widget on the canvas to the right`;
export const GOOGLE_RECAPTCHA_KEY_ERROR = () =>
  `Google Re-Captcha Token Generation failed! Please check the Re-captcha Site Key.`;
export const GOOGLE_RECAPTCHA_DOMAIN_ERROR = () =>
  `Google Re-Captcha Token Generation failed! Please check the allowed domains.`;

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

export const DATASOURCE_CREATE = (dsName: string) =>
  `${dsName} datasource created`;
export const DATASOURCE_DELETE = (dsName: string) =>
  `${dsName} datasource deleted successfully`;
export const DATASOURCE_UPDATE = (dsName: string) =>
  `${dsName} datasource updated successfully`;
export const DATASOURCE_VALID = (dsName: string) =>
  `${dsName} datasource is valid`;

export const ERROR_EVAL_ERROR_GENERIC = () =>
  `Unexpected error occurred while evaluating the application`;

export const ERROR_EVAL_TRIGGER = (message: string) =>
  `Error occurred while evaluating trigger: ${message}`;

export const WIDGET_DELETE = (widgetName: string) =>
  `${widgetName} widget deleted`;
export const WIDGET_BULK_DELETE = (widgetName: string) =>
  `${widgetName} widgets deleted`;
export const WIDGET_COPY = (widgetName: string) => `Copied ${widgetName}`;
export const ERROR_WIDGET_COPY_NO_WIDGET_SELECTED = () =>
  `Please select a widget to copy`;
export const ERROR_WIDGET_COPY_NOT_ALLOWED = () =>
  `This selected widget cannot be copied.`;
export const WIDGET_CUT = (widgetName: string) => `Cut ${widgetName}`;
export const ERROR_WIDGET_CUT_NO_WIDGET_SELECTED = () =>
  `Please select a widget to cut`;
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

export const SAAS_AUTHORIZATION_SUCCESSFUL = "Authorization was successful!";
export const SAAS_AUTHORIZATION_FAILED =
  "Authorization failed. Please check your details or try again.";
// Todo: improve this for appsmith_error error message
export const SAAS_AUTHORIZATION_APPSMITH_ERROR = "Something went wrong.";
export const SAAS_APPSMITH_TOKEN_NOT_FOUND = "Appsmith token not found";

export const LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE = () =>
  "Error saving a key in localStorage. You have exceeded the allowed storage size limit";
export const LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE = () =>
  "Error saving a key in localStorage. You have run out of disk space";
export const LOCAL_STORAGE_NOT_SUPPORTED_APP_MIGHT_NOT_WORK_AS_EXPECTED = () =>
  "Localstorage storage is not supported on your device. Some features including the appsmith store won't work.";

export const OMNIBAR_PLACEHOLDER = () =>
  `Search Widgets, Queries, Documentation`;
export const OMNIBAR_PLACEHOLDER_SNIPPETS = () => "Search Snippets";
export const OMNIBAR_PLACEHOLDER_NAV = () => "Search Widgets and Queries";
export const OMNIBAR_PLACEHOLDER_DOC = () => "Search Documentation";
export const HELPBAR_PLACEHOLDER = () => "Quick search & navigation";
export const NO_SEARCH_DATA_TEXT = () => "No results found";

export const WIDGET_BIND_HELP = () =>
  "Having trouble taking inputs from widgets?";

export const BACK_TO_HOMEPAGE = () => "Go back to homepage";

export const PAGE_NOT_FOUND = () => "Page not found";

export const RESOLVE = () => "Resolve";
export const UNRESOLVE = () => "Unresolve";

// comments
export const ADD_COMMENT_PLACEHOLDER = () => "Add a comment. Use @ to mention";
export const PIN_COMMENT = () => "Pin Comment";
export const UNPIN_COMMENT = () => "Unpin Comment";
export const COPY_LINK = () => "Copy Link";
export const DELETE_COMMENT = () => "Delete Comment";
export const COMMENT_HAS_BEEN_DELETED = () => "Comment not found";
export const DELETE_THREAD = () => "Delete Thread";
export const EDIT_COMMENT = () => "Edit Comment";
export const COMMENTS = () => "Comments";
export const VIEW_LATEST = () => "View Latest";
export const POST = () => "Post";
export const CANCEL = () => "Cancel";
export const NO_COMMENTS_CLICK_ON_CANVAS_TO_ADD = () =>
  `No comments. \n Click anywhere on the canvas \nto start a conversation.`;
export const LINK_COPIED_SUCCESSFULLY = () => "Link copied to clipboard";
export const FULL_NAME = () => "Full Name";
export const DISPLAY_NAME = () => "Display Name";
export const EMAIL_ADDRESS = () => "Email Address";
export const FIRST_AND_LAST_NAME = () => "First and last name";
export const MARK_ALL_AS_READ = () => "Mark all as read";
export const INVITE_A_NEW_USER = () => "Invite a new user";
export const REMOVE = () => "Remove";
export const NO_NOTIFICATIONS_TO_SHOW = () => "No notifications to show";
export const UNREAD_MESSAGE = () => "Unread conversation";
export const UNSUBSCRIBE_EMAIL_SUCCESS = () =>
  "You have successfully unsubscribed from the corresponding comment thread";
export const UNSUBSCRIBE_EMAIL_MSG_1 = () =>
  "You will not receive any more email notifications for the corresponding comment thread.";
export const UNSUBSCRIBE_EMAIL_MSG_2 = () =>
  "Please note that you will be subscribed again if someone tags you in a comment or you reply to a comment.";
export const UNSUBSCRIBE_EMAIL_CONFIRM_MSG = () =>
  "Are you sure you want to unsubscribe?";
export const UNSUBSCRIBE_BUTTON_LABEL = () => "Unsubscribe me";

// Showcase Carousel
export const NEXT = () => "NEXT";
export const BACK = () => "BACK";
export const SKIP = () => "SKIP";

// Debugger
export const CLICK_ON = () => "🙌 Click on ";
export const PRESS = () => "🎉 Press ";
export const OPEN_THE_DEBUGGER = () => " to show / hide the debugger";
export const NO_LOGS = () => "No logs to show";
export const NO_ERRORS = () => "No signs of trouble here!";
export const DEBUGGER_ERRORS = () => "Errors";
export const DEBUGGER_LOGS = () => "Logs";
export const INSPECT_ENTITY = () => "Inspect Entity";
export const INSPECT_ENTITY_BLANK_STATE = () => "Select an entity to inspect";
export const VALUE_IS_INVALID = (propertyPath: string) =>
  `The value at ${propertyPath} is invalid`;
export const ACTION_CONFIGURATION_UPDATED = () => "Configuration updated";
export const WIDGET_PROPERTIES_UPDATED = () => "Widget properties were updated";
export const EMPTY_RESPONSE_FIRST_HALF = () => "🙌 Click on";
export const EMPTY_RESPONSE_LAST_HALF = () => "to get a response";
export const INVALID_EMAIL = () => "Please enter a valid email";
export const DEBUGGER_INTERCOM_TEXT = (text: string) =>
  `Hi, \nI'm facing the following error on appsmith, can you please help? \n\n${text}`;

export const TROUBLESHOOT_ISSUE = () => "Troubleshoot issue";

// Import/Export Application features
export const IMPORT_APPLICATION_MODAL_TITLE = () => "Import Application";

export const DELETE_CONFIRMATION_MODAL_TITLE = () => `Are you sure?`;
export const DELETE_CONFIRMATION_MODAL_SUBTITLE = (name?: string | null) =>
  `You want to remove ${name} from this organization`;

//Editor Page
export const EDITOR_HEADER_SAVE_INDICATOR = () => "Saved";

// Generate page from DB Messages

export const UNSUPPORTED_PLUGIN_DIALOG_TITLE = () =>
  `Couldn't auto generate a page from this datasource.`;

export const UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE = () =>
  `You can continue building your app with it using our Drag & Drop
  Builder`;
export const UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING = () => `Heads Up`;

export const BUILD_FROM_SCRATCH_ACTION_SUBTITLE = () =>
  "Start from scratch and create your custom UI";

export const BUILD_FROM_SCRATCH_ACTION_TITLE = () => "Build with Drag & Drop";

export const GENERATE_PAGE_ACTION_TITLE = () => "Generate from a Data Table";

export const GENERATE_PAGE_ACTION_SUBTITLE = () =>
  "Start with a simple CRUD UI and customize it";

export const GENERATE_PAGE_FORM_TITLE = () => "Generate from Data";

export const GEN_CRUD_SUCCESS_MESSAGE = () =>
  "Hurray! Your application is ready to use.";
export const GEN_CRUD_SUCCESS_DESC = () =>
  "Search through your data in the table and update it using the form";
export const GEN_CRUD_INFO_DIALOG_TITLE = () => "How it works?";
export const GEN_CRUD_INFO_DIALOG_SUBTITLE = () =>
  "CRUD page is generated from selected datasource. You can use the Form to modify the data. Since all your data is already connected you can add more queries and modify the bindings";
export const GEN_CRUD_COLUMN_HEADER_TITLE = () => "Column Headers Fetched";
export const GEN_CRUD_NO_COLUMNS = () => "No columns found";
export const GEN_CRUD_DATASOURCE_DROPDOWN_LABEL = () => "Select Datasource";
export const GEN_CRUD_TABLE_HEADER_LABEL = () => "Table Header Index";
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
export const ADD_NEW_WIDGET = () => "Add New Widget";
export const SUGGESTED_WIDGETS = () => "Suggested widgets";
export const SUGGESTED_WIDGET_TOOLTIP = () => "Add to canvas";
export const WELCOME_TOUR_STICKY_BUTTON_TEXT = () => "Next Mission";

// Data Sources pane
export const EMPTY_ACTIVE_DATA_SOURCES = () => "No active datasources found.";

export const SNIPPET_EXECUTION_SUCCESS = () => `Snippet executed successfully.`;

export const SNIPPET_EXECUTION_FAILED = () => `Snippet execution failed.`;

export const SEARCH_ITEM_SELECT = () => `Hit ⏎ to insert`;
export const APPLY_SEARCH_CATEGORY = () => `⏎ Jump`;
// Git sync
export const GIT_CONNECTION = () => "Git Connections";
export const DEPLOY = () => "Deploy";
export const MERGE = () => "Merge";
export const SHARE_APPLICATION = () => "Share Application";
export const SETTINGS = () => "Settings";
export const CONNECT_TO_GIT = () => "Connect to Git Repository";
export const CONNECT_TO_GIT_SUBTITLE = () =>
  "Checkout branches, Make commits, add deploy your application";
export const REMOTE_URL_VIA = () => "REMOTE URL VIA";

export const USER_PROFILE_SETTINGS_TITLE = () => "USER SETTINGS";

export const AUTHOR_NAME = () => "AUTHOR NAME";
export const AUTHOR_EMAIL = () => "AUTHOR EMAIL";
export const USER_NAME = () => "USER NAME";
export const USER_PASSWORD = () => "PASSWORD";

export const DOCUMENTATION = () => "Documentation";
export const DOCUMENTATION_TOOLTIP = () => "Open Docs in Omnibar";
export const CONNECT_TO_GIT_REPOSITORY = () => "Connect to Git Repository";
export const CONNECT_TO_GIT_REPOSITORY_SUBTITLE = () =>
  "Checkout branches, make commits, add deploy your application";
export const CONNECT = () => "Connect";
export const DEPLOY_TO_CLOUD = () => "Deploy to cloud";
export const DEPLOY_WITHOUT_GIT = () =>
  "Deploy your application without version control";
export const DEPLOY_YOUR_APPLICATION = () => "Deploy your application";
export const COMMIT = () => "COMMIT";
export const PUSH = () => "PUSH";
export const PULL = () => "PULL";

export const SNIPPET_DESCRIPTION = () =>
  `Search and Insert code snippets to perform complex actions quickly.`;
export const DOC_DESCRIPTION = () =>
  `Find answers through appsmith documentation.`;
export const NAV_DESCRIPTION = () =>
  `Navigate to any page, widget or file across this project.`;
export const MERGE_CHANGES = () => "Merge Changes";
export const SELECT_BRANCH_TO_MERGE = () => "Select branch to merge";

export const DOWNLOAD_FILE_NAME_ERROR = () => "File name was not provided";

// Comment card tooltips
export const MORE_OPTIONS = () => "More Options";
export const ADD_REACTION = () => "Add Reaction";
export const RESOLVE_THREAD = () => "Resolve Thread";
export const EMOJI = () => "Emoji";

// Sniping mode messages
export const SNIPING_SELECT_WIDGET_AGAIN = () =>
  "Unable to detect the widget, please select the widget again.";

export const SNIPING_NOT_SUPPORTED = () =>
  "Binding on selection is not supported for this type of widget!";
