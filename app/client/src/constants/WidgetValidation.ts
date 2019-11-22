// Always add a validator function in ./Validators for these types
export const VALIDATION_TYPES = {
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
  TABLE_DATA: "TABLE_DATA",
  DATE: "DATE",
};

export type ValidationResponse = {
  isValid: boolean;
  parsed: any;
};

export type ValidationType = (typeof VALIDATION_TYPES)[keyof typeof VALIDATION_TYPES];
export type Validator = (value: any) => ValidationResponse;
