import { APPSMITH_NAMESPACED_FUNCTIONS as EE_APPSMITH_NAMESPACED_FUNCTIONS } from "ee/entities/Engine/actionHelpers";

export enum APPSMITH_GLOBAL_FUNCTIONS {
  navigateTo = "navigateTo",
  showAlert = "showAlert",
  showModal = "showModal",
  closeModal = "closeModal",
  storeValue = "storeValue",
  removeValue = "removeValue",
  clearStore = "clearStore",
  download = "download",
  copyToClipboard = "copyToClipboard",
  resetWidget = "resetWidget",
  setInterval = "setInterval",
  clearInterval = "clearInterval",
  postWindowMessage = "postWindowMessage",
  logoutUser = "logoutUser",
}

export enum APPSMITH_NAMESPACED_FUNCTIONS {
  getGeolocation = "appsmith.geolocation.getCurrentPosition",
  watchGeolocation = "appsmith.geolocation.watchPosition",
  stopWatchGeolocation = "appsmith.geolocation.clearWatch",
}

export enum APPSMITH_INTEGRATIONS {
  none = "none",
  integration = "integration",
  jsFunction = "jsFunction",
}

export const AppsmithFunction = {
  ...APPSMITH_INTEGRATIONS,
  ...APPSMITH_GLOBAL_FUNCTIONS,
  ...APPSMITH_NAMESPACED_FUNCTIONS,
  ...EE_APPSMITH_NAMESPACED_FUNCTIONS,
};

export const AppsmithFunctionsWithFields = [
  ...Object.values(APPSMITH_NAMESPACED_FUNCTIONS),
  ...Object.keys(APPSMITH_GLOBAL_FUNCTIONS),
];

export const RESET_CHILDREN_OPTIONS = [
  { label: "true", value: "true", id: "true" },
  { label: "false", value: "false", id: "false" },
];

export const FILE_TYPE_OPTIONS = [
  { label: "Select file type (optional)", value: "", id: "" },
  { label: "Plain text", value: "'text/plain'", id: "text/plain" },
  { label: "HTML", value: "'text/html'", id: "text/html" },
  { label: "CSV", value: "'text/csv'", id: "text/csv" },
  { label: "JSON", value: "'application/json'", id: "application/json" },
  { label: "JPEG", value: "'image/jpeg'", id: "image/jpeg" },
  { label: "PNG", value: "'image/png'", id: "image/png" },
  { label: "SVG", value: "'image/svg+xml'", id: "image/svg+xml" },
];

export const NAVIGATION_TARGET_FIELD_OPTIONS = [
  {
    label: "Same window",
    value: "'SAME_WINDOW'",
    id: "SAME_WINDOW",
  },
  {
    label: "New window",
    value: "'NEW_WINDOW'",
    id: "NEW_WINDOW",
  },
];

export const ViewTypes = {
  SELECTOR_VIEW: "SELECTOR_VIEW",
  KEY_VALUE_VIEW: "KEY_VALUE_VIEW",
  TEXT_VIEW: "TEXT_VIEW",
  BOOL_VIEW: "BOOL_VIEW",
  TAB_VIEW: "TAB_VIEW",
  NO_VIEW: "NO_VIEW",
  ACTION_SELECTOR_VIEW: "ACTION_SELECTOR_VIEW",
};

export const NAVIGATE_TO_TAB_OPTIONS = {
  PAGE_NAME: "page-name",
  URL: "url",
};

export const NEW_MODAL_LABEL = "New Modal";
const SELECT_OPTIONS_LABEL = "Select file type (optional)";

export const DEFAULT_LABELS = [NEW_MODAL_LABEL, SELECT_OPTIONS_LABEL];

export const DEFAULT_SELECTOR_VIEW_TEXT = "Select Action";

export const EMPTY_BINDING = "{{}}";
export const EMPTY_BINDING_WITH_EMPTY_OBJECT = "{{{}}}";

export enum FieldType {
  PARAMS_FIELD = "PARAMS_FIELD",
  ACTION_SELECTOR_FIELD = "ACTION_SELECTOR_FIELD",
  ON_SUCCESS_FIELD = "ON_SUCCESS_FIELD",
  ON_ERROR_FIELD = "ON_ERROR_FIELD",
  SHOW_MODAL_FIELD = "SHOW_MODAL_FIELD",
  CLOSE_MODAL_FIELD = "CLOSE_MODAL_FIELD",
  PAGE_SELECTOR_FIELD = "PAGE_SELECTOR_FIELD",
  KEY_VALUE_FIELD = "KEY_VALUE_FIELD",
  URL_FIELD = "URL_FIELD",
  ALERT_TEXT_FIELD = "ALERT_TEXT_FIELD",
  ALERT_TYPE_SELECTOR_FIELD = "ALERT_TYPE_SELECTOR_FIELD",
  KEY_TEXT_FIELD_REMOVE_VALUE = "KEY_TEXT_FIELD_REMOVE_VALUE",
  KEY_TEXT_FIELD_STORE_VALUE = "KEY_TEXT_FIELD_STORE_VALUE",
  VALUE_TEXT_FIELD = "VALUE_TEXT_FIELD",
  QUERY_PARAMS_FIELD = "QUERY_PARAMS_FIELD",
  DOWNLOAD_DATA_FIELD = "DOWNLOAD_DATA_FIELD",
  DOWNLOAD_FILE_NAME_FIELD = "DOWNLOAD_FILE_NAME_FIELD",
  DOWNLOAD_FILE_TYPE_FIELD = "DOWNLOAD_FILE_TYPE_FIELD",
  COPY_TEXT_FIELD = "COPY_TEXT_FIELD",
  NAVIGATION_TARGET_FIELD = "NAVIGATION_TARGET_FIELD",
  WIDGET_NAME_FIELD = "WIDGET_NAME_FIELD",
  RESET_CHILDREN_FIELD = "RESET_CHILDREN_FIELD",
  ARGUMENT_KEY_VALUE_FIELD = "ARGUMENT_KEY_VALUE_FIELD",
  CALLBACK_FUNCTION_FIELD_SET_INTERVAL = "CALLBACK_FUNCTION_FIELD_SET_INTERVAL",
  CALLBACK_FUNCTION_FIELD_GEOLOCATION = "CALLBACK_FUNCTION_FIELD_GEOLOCATION",
  DELAY_FIELD = "DELAY_FIELD",
  ID_FIELD = "ID_FIELD",
  CLEAR_INTERVAL_ID_FIELD = "CLEAR_INTERVAL_ID_FIELD",
  MESSAGE_FIELD = "MESSAGE_FIELD",
  TARGET_ORIGIN_FIELD = "TARGET_ORIGIN_FIELD",
  SOURCE_FIELD = "SOURCE_FIELD",
  PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD = "PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD",
  API_AND_QUERY_SUCCESS_FAILURE_TAB_FIELD = "API_AND_QUERY_SUCCESS_FAILURE_TAB_FIELD",
  CALLBACK_FUNCTION_API_AND_QUERY = "CALLBACK_FUNCTION_API_AND_QUERY",
  ADD_ACTION = "ADD_ACTION",
}

export const Variants = {
  mainBlock: "mainBlock",
  callbackBlock: "callbackBlock",
  hoverBorder: "hoverBorder",
};
