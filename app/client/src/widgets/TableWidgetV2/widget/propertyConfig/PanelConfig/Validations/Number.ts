import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { hideByColumnType } from "widgets/TableWidgetV2/widget/propertyUtils";

export default [
  {
    helpText: "Sets the minimum allowed value",
    propertyName: "validation.min",
    label: "Min",
    controlType: "INPUT_TEXT",
    placeholderText: "1",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: {
      type: ValidationTypes.NUMBER,
      params: { default: -Infinity },
    },
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = propertyPath
        .split(".")
        .slice(0, 2)
        .join(".");

      return hideByColumnType(props, path, [ColumnTypes.NUMBER], true);
    },
    dependencies: ["primaryColumns"],
  },
  {
    helpText: "Sets the maximum allowed value",
    propertyName: "validation.max",
    label: "Max",
    controlType: "INPUT_TEXT",
    placeholderText: "100",
    isBindProperty: true,
    isTriggerProperty: false,
    validation: {
      type: ValidationTypes.NUMBER,
      params: { default: Infinity },
    },
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = propertyPath
        .split(".")
        .slice(0, 2)
        .join(".");

      return hideByColumnType(props, path, [ColumnTypes.NUMBER], true);
    },
    dependencies: ["primaryColumns"],
  },
];
