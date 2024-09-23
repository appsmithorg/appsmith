import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import {
  hideByColumnType,
  getColumnPath,
} from "widgets/TableWidgetV2/widget/propertyUtils";

export default [
  {
    helpText: "Sets the minimum allowed value",
    propertyName: "validation.min",
    label: "Min",
    controlType: "TABLE_INLINE_EDIT_VALIDATION_CONTROL",
    placeholderText: "1",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: {
      type: ValidationTypes.NUMBER,
      params: { default: -Infinity },
    },
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = getColumnPath(propertyPath);

      return hideByColumnType(
        props,
        path,
        [ColumnTypes.NUMBER, ColumnTypes.CURRENCY],
        true,
      );
    },
    dependencies: ["primaryColumns"],
  },
  {
    helpText: "Sets the maximum allowed value",
    propertyName: "validation.max",
    label: "Max",
    controlType: "TABLE_INLINE_EDIT_VALIDATION_CONTROL",
    placeholderText: "100",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: {
      type: ValidationTypes.NUMBER,
      params: { default: Infinity },
    },
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = getColumnPath(propertyPath);

      return hideByColumnType(
        props,
        path,
        [ColumnTypes.NUMBER, ColumnTypes.CURRENCY],
        true,
      );
    },
    dependencies: ["primaryColumns"],
  },
];
