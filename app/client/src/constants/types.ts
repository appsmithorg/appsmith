import type { ValidationResponse } from "./WidgetValidation";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";

export type Validator = (
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
  propertyPath: string,
) => ValidationResponse;

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

export interface ValidationConfig {
  type: ValidationTypes;
  params?: ValidationConfigParams;
}

interface ValidationConfigParams {
  min?: number; // min allowed for a number
  max?: number; // max allowed for a number
  natural?: boolean; // is a positive integer
  default?: unknown; // default for any type
  unique?: boolean | string[]; // unique in an array (string if a particular path is unique)
  required?: boolean; // required type
  // required is now used to check if value is an empty string.
  requiredKey?: boolean; //required key
  regex?: RegExp; // validator regex for text type
  allowedKeys?: Array<{
    // Allowed keys in an object type
    name: string;
    type: ValidationTypes;
    params?: ValidationConfigParams;
  }>;
  allowedValues?: unknown[]; // Allowed values in a string and array type
  children?: ValidationConfig; // Children configurations in an ARRAY or OBJECT_ARRAY type
  fn?: (
    value: unknown,
    props: any,
    _?: any,
    moment?: any,
  ) => ValidationResponse; // Function in a FUNCTION type
  fnString?: string; // AUTO GENERATED, SHOULD NOT BE SET BY WIDGET DEVELOPER
  expected?: CodeEditorExpected; // FUNCTION type expected type and example
  strict?: boolean; //for strict string validation of TEXT type
  ignoreCase?: boolean; //to ignore the case of key
  type?: ValidationTypes; // Used for ValidationType.ARRAY_OF_TYPE_OR_TYPE to define sub type
  types?: ValidationConfig[]; // Used for ValidationType.UNION to define sub type
  params?: ValidationConfigParams; // Used for ValidationType.ARRAY_OF_TYPE_OR_TYPE to define sub type params
  passThroughOnZero?: boolean; // Used for ValidationType.NUMBER to allow 0 to be passed through. Deafults value is true
  limitLineBreaks?: boolean; // Used for ValidationType.TEXT to limit line breaks in a large json object.
  defaultValue?: unknown; // used for ValidationType.UNION when none the union type validation is success
  defaultErrorMessage?: string; // used for ValidationType.UNION when none the union type validation is success
}
