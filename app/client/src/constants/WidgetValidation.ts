import { WidgetProps } from "widgets/BaseWidget";
import { DataTree } from "entities/DataTree/dataTreeFactory";

// Always add a validator function in ./Validators for these types
export const VALIDATION_TYPES = {
  TEXT: "TEXT",
  REGEX: "REGEX",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
  TABLE_DATA: "TABLE_DATA",
  OPTIONS_DATA: "OPTIONS_DATA",
  DATE: "DATE",
  TABS_DATA: "TABS_DATA",
  CHART_DATA: "CHART_DATA",
  MARKERS: "MARKERS",
  ACTION_SELECTOR: "ACTION_SELECTOR",
  ARRAY_ACTION_SELECTOR: "ARRAY_ACTION_SELECTOR",
  SELECTED_TAB: "SELECTED_TAB",
  DEFAULT_OPTION_VALUE: "DEFAULT_OPTION_VALUE",
};

export type ValidationResponse = {
  isValid: boolean;
  parsed: any;
  message?: string;
  transformed?: any;
};

export type ValidationType = typeof VALIDATION_TYPES[keyof typeof VALIDATION_TYPES];
export type Validator = (
  value: any,
  props: WidgetProps,
  dataTree?: DataTree,
) => ValidationResponse;

export const ISO_DATE_FORMAT = "YYYY-MM-DDTHH:mm:ss.SSSZ";
