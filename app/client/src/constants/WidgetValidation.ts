import { EXECUTION_PARAM_KEY } from "constants/AppsmithActionConstants/ActionConstants";
import type { ValidationConfig } from "./PropertyControlConstants";

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
  ARRAY_OF_TYPE_OR_TYPE = "ARRAY_OF_TYPE_OR_TYPE",
  UNION = "UNION",
  OBJECT_WITH_FUNCTION = "OBJECT_WITH_FUNCTION",
}

export interface ValidationResponse {
  isValid: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: any;
  messages?: Array<Error>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformed?: any;
  isParsedValueTheSame?: boolean;
}

export type Validator = (
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
  propertyPath: string,
) => ValidationResponse;

export const ISO_DATE_FORMAT = "YYYY-MM-DDTHH:mm:ss.sssZ";

export const DATATREE_INTERNAL_KEYWORDS = {
  actionPaths: "actionPaths",
  pageList: "pageList",
  [EXECUTION_PARAM_KEY]: EXECUTION_PARAM_KEY,
};

export const DATA_TREE_KEYWORDS = {
  appsmith: "appsmith",
  ...DATATREE_INTERNAL_KEYWORDS,
};
