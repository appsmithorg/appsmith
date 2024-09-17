import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import {
  getColumnPath,
  hideByColumnType,
} from "widgets/TableWidgetV2/widget/propertyUtils";

export default [
  {
    propertyName: "validation.minDate",
    helpText: "Sets the minimum allowed date",
    label: "Min Date",
    controlType: "DATE_PICKER",
    placeholderText: "1",
    isBindProperty: true,
    isTriggerProperty: false,
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = getColumnPath(propertyPath);

      return hideByColumnType(props, path, [ColumnTypes.DATE], true);
    },
    dependencies: ["primaryColumns"],
  },
  {
    propertyName: "validation.maxDate",
    helpText: "Sets the maximum allowed value",
    label: "Max Date",
    controlType: "DATE_PICKER",
    placeholderText: "100",
    isBindProperty: true,
    isTriggerProperty: false,
    hidden: (props: TableWidgetProps, propertyPath: string) => {
      const path = getColumnPath(propertyPath);

      return hideByColumnType(props, path, [ColumnTypes.DATE], true);
    },
    dependencies: ["primaryColumns"],
  },
];
