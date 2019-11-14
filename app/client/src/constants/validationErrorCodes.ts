export const ERROR_CODES = {
  NO_ERROR: "NO_ERROR",
  TYPE_ERROR: "TYPE_ERROR",
};

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_CODES_MESSAGES: Record<ErrorCode, string> = {
  NO_ERROR: "",
  TYPE_ERROR: "This input is not of a valid type",
};
