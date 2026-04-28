export enum InputTypes {
  TEXT = "TEXT",
  MULTI_LINE_TEXT = "MULTI_LINE_TEXT",
  NUMBER = "NUMBER",
  PHONE_NUMBER = "PHONE_NUMBER",
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  CURRENCY = "CURRENCY",
  NONE = "none",
}

export enum NumberInputStepButtonPosition {
  LEFT = "left",
  RIGHT = "right",
  NONE = "none",
}

/**
 * HTML5 inputmode attribute values
 * Controls the virtual keyboard displayed on mobile devices
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode
 */
export enum InputMode {
  // Shows numeric keypad with 0-9
  NUMERIC = "numeric",
  NONE = "none",
  // Shows numeric keypad with 0-9 and decimal point (.)
  DECIMAL = "decimal",
  // Shows phone keypad with 0-9, *, # and standard dial keys
  TEL = "tel",
  // Shows email keyboard with @, period, and other email-related keys
  EMAIL = "email",
  // Shows default text keyboard
  TEXT = "text",
  // Shows search optimized keyboard
  SEARCH = "search",
  // Shows URL optimized keyboard with / and .com
  URL = "url",
}
