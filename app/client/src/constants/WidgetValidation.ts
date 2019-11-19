export const VALIDATION_TYPES = {
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  OBJECT: "OBJECT",
  TABLE_DATA: "TABLE_DATA",
};

export type ValidationType = (typeof VALIDATION_TYPES)[keyof typeof VALIDATION_TYPES];
export type Validator = (value: any) => boolean;
