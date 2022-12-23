import { ValidationTypes } from "constants/WidgetValidation";
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
    // validation: {
    //   type: ValidationTypes.S,
    //   params: { default: "1921-01-01T00:00:00.000+05:30" },
    // },
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
    // validation: {
    //   type: ValidationTypes.NUMBER,
    //   params: { default: "2121-12-31T23:59:00.000+05:30" },
    // },
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
