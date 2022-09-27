// TODO : create type
import {
  FieldType,
  FILE_TYPE_OPTIONS,
  NAVIGATION_TARGET_FIELD_OPTIONS,
  RESET_CHILDREN_OPTIONS,
} from "./constants";
import { ALERT_STYLE_OPTIONS } from "../../../ce/constants/messages";

export const APPSMITH_FUNCTION_CONFIG = {
  [FieldType.ALERT_TEXT_FIELD]: {
    fieldLabel: "Message",
  },
  [FieldType.URL_FIELD]: {
    fieldLabel: "Enter URL",
  },
  [FieldType.QUERY_PARAMS_FIELD]: {
    fieldLabel: "Query Params",
  },
  [FieldType.KEY_TEXT_FIELD]: {
    fieldLabel: "Key",
  },
  [FieldType.VALUE_TEXT_FIELD]: {
    fieldLabel: "Value",
  },
  [FieldType.DOWNLOAD_DATA_FIELD]: {
    fieldLabel: "Data to download",
  },
  [FieldType.DOWNLOAD_FILE_NAME_FIELD]: {
    fieldLabel: "File name with extension",
  },
  [FieldType.COPY_TEXT_FIELD]: {
    fieldLabel: "Text to be copied to clipboard",
  },
  [FieldType.CALLBACK_FUNCTION_FIELD]: {
    fieldLabel: "Callback function",
  },
  [FieldType.DELAY_FIELD]: {
    fieldLabel: "Delay (ms)",
  },
  [FieldType.ID_FIELD]: {
    fieldLabel: "Id",
  },
  [FieldType.CLEAR_INTERVAL_ID_FIELD]: {
    fieldLabel: "Id",
  },
  [FieldType.SHOW_MODAL_FIELD]: {
    label: "Modal Name",
    // TODO - add type
    options: (props: any) => props.modalDropdownList,
    defaultText: "Select Modal",
  },
  [FieldType.CLOSE_MODAL_FIELD]: {
    label: "Modal Name",
    // TODO - add type
    options: (props: any) => props.modalDropdownList,
    defaultText: "Select Modal",
  },
  [FieldType.RESET_CHILDREN_FIELD]: {
    label: "Reset Children",
    options: () => RESET_CHILDREN_OPTIONS,
    defaultText: "true",
  },
  [FieldType.WIDGET_NAME_FIELD]: {
    label: "Widget",
    // TODO - add type
    options: (props: any) => props.widgetOptionTree,
    defaultText: "Select Widget",
  },
  [FieldType.PAGE_SELECTOR_FIELD]: {
    label: "Choose Page",
    // TODO - add type
    options: (props: any) => props.pageDropdownOptions,
    defaultText: "Select Page",
  },
  [FieldType.ALERT_TYPE_SELECTOR_FIELD]: {
    label: "Type",
    options: () => ALERT_STYLE_OPTIONS,
    defaultText: "Select type",
  },
  [FieldType.DOWNLOAD_FILE_TYPE_FIELD]: {
    label: "Type",
    options: () => FILE_TYPE_OPTIONS,
    defaultText: "Select file type (optional)",
  },
  [FieldType.NAVIGATION_TARGET_FIELD]: {
    label: "Target",
    options: () => NAVIGATION_TARGET_FIELD_OPTIONS,
    defaultText: NAVIGATION_TARGET_FIELD_OPTIONS[0].label,
  },
  // TODO: add type
  [FieldType.ACTION_SELECTOR_FIELD]: {
    label: (props: any) => props.label || "",
    options: (props: any) => props.integrationOptionTree,
    defaultText: "Select Action",
  },
  [FieldType.ON_SUCCESS_FIELD]: {
    label: "",
    options: (props: any) => props.integrationOptionTree,
    defaultText: "Select Action",
  },
  [FieldType.ON_ERROR_FIELD]: {
    label: "",
    options: (props: any) => props.integrationOptionTree,
    defaultText: "Select Action",
  },
};
