import { WidgetProps } from "widgets/BaseWidget";

// Always add a validator function in ./Validators for these types
export const VALIDATION_TYPES = {
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
  TABLE_DATA: "TABLE_DATA",
  OPTIONS_DATA: "OPTIONS_DATA",
  DATE: "DATE",
  CHART_DATA: "CHART_DATA",
  ACTION_SELECTOR: "ACTION_SELECTOR",
  ARRAY_ACTION_SELECTOR: "ARRAY_ACTION_SELECTOR",
};

export type ValidationResponse = {
  isValid: boolean;
  parsed: any;
  message?: string;
};

export type ValidationType = typeof VALIDATION_TYPES[keyof typeof VALIDATION_TYPES];
export type Validator = (value: any, props?: WidgetProps) => ValidationResponse;
