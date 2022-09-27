// TODO : create type
import { FieldType } from "./constants";

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
};
