import { ValidationTypes } from "constants/WidgetValidation";

export default [
  {
    helpText:
      "Adds a validation to the cell value which displays an error on failure",
    propertyName: "validation.regex",
    label: "Regex",
    controlType: "INPUT_TEXT",
    placeholderText: "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.REGEX },
  },
  {
    helpText: "Shows the validity of the cell validity",
    propertyName: "validation.isEditableCellValid",
    label: "Valid",
    controlType: "TABLE_INLINE_EDIT_VALIDATION",
    isJSConvertible: false,
    dependencies: ["primaryColumns", "columnOrder"],
    isBindProperty: true,
    isTriggerProperty: false,
    validation: {
      type: ValidationTypes.BOOLEAN,
      params: {
        default: true,
      },
    },
  },
  {
    helpText:
      "The error message to display if the regex or valid property check fails",
    propertyName: "validation.errorMessage",
    label: "Error Message",
    controlType: "INPUT_TEXT",
    placeholderText: "Not a valid value!",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.TEXT },
  },
  {
    propertyName: "validation.isEditableCellRequired",
    label: "Required",
    helpText: "Makes input to the widget mandatory",
    controlType: "SWITCH",
    isJSConvertible: true,
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.BOOLEAN },
  },
];
