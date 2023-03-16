import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import {
  showByColumnType,
  getColumnPath,
} from "widgets/TableWidgetV2/widget/propertyUtils";

export default [
  {
    propertyName: "validation.regex",
    helpText:
      "Adds a validation to the cell value which displays an error on failure",
    label: "Regex",
    controlType: "TABLE_INLINE_EDIT_VALIDATION_CONTROL",
    placeholderText: "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.REGEX },
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = getColumnPath(propertyPath);

      return showByColumnType(props, path, [ColumnTypes.DATE], true);
    },
  },
  {
    propertyName: "validation.isColumnEditableCellValid",
    helpText: "Shows the validity of the cell validity",
    label: "Valid",
    controlType: "TABLE_INLINE_EDIT_VALID_PROPERTY_CONTROL",
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
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = getColumnPath(propertyPath);
      return showByColumnType(props, path, [ColumnTypes.DATE], true);
    },
  },
  {
    propertyName: "validation.errorMessage",
    helpText:
      "The error message to display if the regex or valid property check fails",
    label: "Error Message",
    controlType: "TABLE_INLINE_EDIT_VALIDATION_CONTROL",
    placeholderText: "Not a valid value!",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.TEXT },
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = getColumnPath(propertyPath);
      return showByColumnType(props, path, [ColumnTypes.DATE], true);
    },
  },
  {
    propertyName: "validation.isColumnEditableCellRequired",
    helpText: "Makes input to the widget mandatory",
    label: "Required",
    controlType: "SWITCH",
    customJSControl: "TABLE_INLINE_EDIT_VALIDATION_CONTROL",
    isJSConvertible: true,
    isBindProperty: true,
    isTriggerProperty: false,
    validation: { type: ValidationTypes.BOOLEAN },
  },
];
