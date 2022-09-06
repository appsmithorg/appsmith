import { EXECUTION_PARAM_KEY } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationConfig } from "./PropertyControlConstants";

// Always add a validator function in ./worker/validation for these types
export enum ValidationTypes {
  TEXT = "TEXT",
  REGEX = "REGEX",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
  OBJECT_ARRAY = "OBJECT_ARRAY",
  NESTED_OBJECT_ARRAY = "NESTED_OBJECT_ARRAY",
  DATE_ISO_STRING = "DATE_ISO_STRING",
  IMAGE_URL = "IMAGE_URL",
  FUNCTION = "FUNCTION",
  SAFE_URL = "SAFE_URL",
  TABLE_PROPERTY = "TABLE_PROPERTY",
}

export type ValidationResponse = {
  isValid: boolean;
  parsed: any;
  messages?: string[];
  transformed?: any;
};

export type Validator = (
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
  propertyPath: string,
) => ValidationResponse;

export const ISO_DATE_FORMAT = "YYYY-MM-DDTHH:mm:ss.sssZ";

export const DATA_TREE_KEYWORDS = {
  actionPaths: "actionPaths",
  appsmith: "appsmith",
  pageList: "pageList",
  [EXECUTION_PARAM_KEY]: EXECUTION_PARAM_KEY,
};
