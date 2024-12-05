export const TABLE_WIDGET_FILTER_OPERATORS = {
  PRIMITIVE: {
    CONTAINS: { label: "contains", value: "contains", type: "input" },
    DOES_NOT_CONTAIN: {
      label: "does not contain",
      value: "doesNotContain",
      type: "input",
    },
    STARTS_WITH: { label: "starts with", value: "startsWith", type: "input" },
    ENDS_WITH: { label: "ends with", value: "endsWith", type: "input" },
    IS_EXACTLY: { label: "is exactly", value: "isExactly", type: "input" },
  },
  DATE: {
    IS: { label: "is", value: "is", type: "date" },
    IS_BEFORE: { label: "is before", value: "isBefore", type: "date" },
    IS_AFTER: { label: "is after", value: "isAfter", type: "date" },
    IS_NOT: { label: "is not", value: "isNot", type: "date" },
  },
  NUMBER: {
    IS_EQUAL_TO: { label: "is equal to", value: "isEqualTo", type: "input" },
    NOT_EQUAL_TO: { label: "not equal to", value: "notEqualTo", type: "input" },
    GREATER_THAN: {
      label: "greater than",
      value: "greaterThan",
      type: "input",
    },
    GREATER_THAN_OR_EQUAL_TO: {
      label: "greater than or equal to",
      value: "greaterThanEqualTo",
      type: "input",
    },
    LESS_THAN: { label: "less than", value: "lessThan", type: "input" },
    LESS_THAN_OR_EQUAL_TO: {
      label: "less than or equal to",
      value: "lessThanEqualTo",
      type: "input",
    },
  },
  BOOLEAN: {
    IS_CHECKED: { label: "is checked", value: "isChecked", type: "" },
    IS_UNCHECKED: { label: "is unchecked", value: "isUnChecked", type: "" },
  },
  EMPTY: { label: "empty", value: "empty", type: "" },
  NOT_EMPTY: { label: "not empty", value: "notEmpty", type: "" },
};
