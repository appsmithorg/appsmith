import {
  FieldType,
  FILE_TYPE_OPTIONS,
  NAVIGATION_TARGET_FIELD_OPTIONS,
  RESET_CHILDREN_OPTIONS,
} from "./constants";
import { ALERT_STYLE_OPTIONS } from "../../../ce/constants/messages";
import { AppsmithFunctionConfigType, FieldProps } from "./types";

export const APPSMITH_FUNCTION_CONFIG: AppsmithFunctionConfigType = {
  [FieldType.ALERT_TEXT_FIELD]: {
    label: () => "Message",
    defaultText: "",
    options: () => null,
  },
  [FieldType.URL_FIELD]: {
    label: () => "Enter URL",
    defaultText: "",
    options: () => null,
  },
  [FieldType.QUERY_PARAMS_FIELD]: {
    label: () => "Query Params",
    defaultText: "",
    options: () => null,
  },
  [FieldType.KEY_TEXT_FIELD]: {
    label: () => "Key",
    defaultText: "",
    options: () => null,
  },
  [FieldType.VALUE_TEXT_FIELD]: {
    label: () => "Value",
    defaultText: "",
    options: () => null,
  },
  [FieldType.DOWNLOAD_DATA_FIELD]: {
    label: () => "Data to download",
    defaultText: "",
    options: () => null,
  },
  [FieldType.DOWNLOAD_FILE_NAME_FIELD]: {
    label: () => "File name with extension",
    defaultText: "",
    options: () => null,
  },
  [FieldType.COPY_TEXT_FIELD]: {
    label: () => "Text to be copied to clipboard",
    defaultText: "",
    options: () => null,
  },
  [FieldType.CALLBACK_FUNCTION_FIELD]: {
    label: () => "Callback function",
    defaultText: "",
    options: () => null,
  },
  [FieldType.DELAY_FIELD]: {
    label: () => "Delay (ms)",
    defaultText: "",
    options: () => null,
  },
  [FieldType.ID_FIELD]: {
    label: () => "Id",
    defaultText: "",
    options: () => null,
  },
  [FieldType.CLEAR_INTERVAL_ID_FIELD]: {
    label: () => "Id",
    defaultText: "",
    options: () => null,
  },
  [FieldType.SHOW_MODAL_FIELD]: {
    label: () => "Modal Name",
    options: (props: FieldProps) => props.modalDropdownList,
    defaultText: "Select Modal",
  },
  [FieldType.CLOSE_MODAL_FIELD]: {
    label: () => "Modal Name",
    options: (props: FieldProps) => props.modalDropdownList,
    defaultText: "Select Modal",
  },
  [FieldType.RESET_CHILDREN_FIELD]: {
    label: () => "Reset Children",
    options: () => RESET_CHILDREN_OPTIONS,
    defaultText: "true",
  },
  [FieldType.WIDGET_NAME_FIELD]: {
    label: () => "Widget",
    options: (props: FieldProps) => props.widgetOptionTree,
    defaultText: "Select Widget",
  },
  [FieldType.PAGE_SELECTOR_FIELD]: {
    label: () => "Choose Page",
    options: (props: FieldProps) => props.pageDropdownOptions,
    defaultText: "Select Page",
  },
  [FieldType.ALERT_TYPE_SELECTOR_FIELD]: {
    label: () => "Type",
    options: () => ALERT_STYLE_OPTIONS,
    defaultText: "Select type",
  },
  [FieldType.DOWNLOAD_FILE_TYPE_FIELD]: {
    label: () => "Type",
    options: () => FILE_TYPE_OPTIONS,
    defaultText: "Select file type (optional)",
  },
  [FieldType.NAVIGATION_TARGET_FIELD]: {
    label: () => "Target",
    options: () => NAVIGATION_TARGET_FIELD_OPTIONS,
    defaultText: NAVIGATION_TARGET_FIELD_OPTIONS[0].label,
  },
  [FieldType.ACTION_SELECTOR_FIELD]: {
    label: (props: FieldProps) => props.label || "",
    options: (props: FieldProps) => props.integrationOptionTree,
    defaultText: "Select Action",
  },
  [FieldType.ON_SUCCESS_FIELD]: {
    label: () => "",
    options: (props: FieldProps) => props.integrationOptionTree,
    defaultText: "Select Action",
  },
  [FieldType.ON_ERROR_FIELD]: {
    label: () => "",
    options: (props: FieldProps) => props.integrationOptionTree,
    defaultText: "Select Action",
  },
  [FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD]: {
    label: () => "Type",
    defaultText: "",
    options: () => null,
  },
  [FieldType.KEY_VALUE_FIELD]: {
    label: () => "",
    defaultText: "Select Action",
    options: (props: FieldProps) => props.integrationOptionTree,
  },
  [FieldType.ARGUMENT_KEY_VALUE_FIELD]: {
    label: (props: FieldProps) => props.field.label || "",
    defaultText: "",
    options: () => null,
  },
  [FieldType.MESSAGE_FIELD]: {
    label: () => "",
    defaultText: "",
    options: () => null,
  },
  [FieldType.TARGET_ORIGIN_FIELD]: {
    label: () => "",
    defaultText: "",
    options: () => null,
  },
};
