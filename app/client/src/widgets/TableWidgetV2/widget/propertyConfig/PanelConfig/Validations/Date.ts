import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { hideByColumnType } from "widgets/TableWidgetV2/widget/propertyUtils";

export default [
  {
    helpText: "Sets the minimum allowed date",
    propertyName: "validation.minDate",
    label: "Min Date",
    controlType: "DATE_PICKER",
    placeholderText: "1",
    isBindProperty: true,
    isTriggerProperty: false,
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = propertyPath
        .split(".")
        .slice(0, 2)
        .join(".");

      return hideByColumnType(props, path, [ColumnTypes.DATE], true);
    },
    dependencies: ["primaryColumns"],
  },
  {
    helpText: "Sets the maximum allowed value",
    propertyName: "validation.maxDate",
    label: "Max Date",
    controlType: "DATE_PICKER",
    placeholderText: "100",
    isBindProperty: true,
    isTriggerProperty: false,
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = propertyPath
        .split(".")
        .slice(0, 2)
        .join(".");

      return hideByColumnType(props, path, [ColumnTypes.DATE], true);
    },
    dependencies: ["primaryColumns"],
  },
];
