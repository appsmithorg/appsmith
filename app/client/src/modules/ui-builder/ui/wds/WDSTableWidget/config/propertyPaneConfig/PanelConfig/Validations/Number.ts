import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import { ColumnTypes } from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import {
  hideByColumnType,
  getColumnPath,
} from "modules/ui-builder/ui/wds/WDSTableWidget/widget/propertyUtils";

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
