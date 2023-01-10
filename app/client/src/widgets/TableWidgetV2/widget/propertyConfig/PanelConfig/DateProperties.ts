import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import {
  allowedFirstDayOfWeekRange,
  showByColumnType,
} from "../../propertyUtils";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";

export default {
  sectionName: "Date Settings",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    if (showByColumnType(props, propertyPath, [ColumnTypes.IMAGE], true)) {
      return false;
    } else {
      const columnType = get(props, `${propertyPath}.columnType`, "");
      const isEditable = get(props, `${propertyPath}.isEditable`, "");
      return columnType !== ColumnTypes.DATE || !isEditable;
    }
  },
  children: [
    {
      propertyName: "firstDayOfWeek",
      label: "First Day Of Week",
      helpText: "Defines the first day of the week for calendar",
      controlType: "INPUT_TEXT",
      defaultValue: "0",
      inputType: "NUMBER",
      isBindProperty: true,
      isTriggerProperty: false,
      dependencies: ["primaryColumns", "columnType"],
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          fnString: allowedFirstDayOfWeekRange.toString(),
          expected: {
            type:
              "0 : sunday\n1 : monday\n2 : tuesday\n3 : wednesday\n4 : thursday\n5 : friday\n6 : saturday",
            example: "0",
            autocompleteDataType: AutocompleteDataType.STRING,
          },
        },
      },
      // hidden: (props: TableWidgetProps, propertyPath: string) => {
      //   const baseProperty = getBasePropertyPath(propertyPath);
      //   const columnType = get(props, `${baseProperty}.columnType`, "");
      //   return columnType !== ColumnTypes.DATE;
      // },
    },
    {
      propertyName: "shortcuts",
      label: "Show Shortcuts",
      helpText: "Choose to show shortcut menu",
      controlType: "SWITCH",
      isJSConvertible: false,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      dependencies: ["primaryColumns", "columnType"],
      // hidden: (props: TableWidgetProps, propertyPath: string) => {
      //   return hideByColumnType(props, propertyPath, [ColumnTypes.DATE]);
      // },
    },
    // {
    //   propertyName: "timePrecision",
    //   label: "Time Precision",
    //   controlType: "DROP_DOWN",
    //   helpText: "Sets the different time picker or hide.",
    //   defaultValue: TimePrecision.MINUTE,
    //   options: [
    //     {
    //       label: "None",
    //       value: TimePrecision.NONE,
    //     },
    //     {
    //       label: "Minute",
    //       value: TimePrecision.MINUTE,
    //     },
    //     {
    //       label: "Second",
    //       value: TimePrecision.SECOND,
    //     },
    //   ],
    //   isJSConvertible: true,
    //   isBindProperty: true,
    //   isTriggerProperty: false,
    //   validation: {
    //     type: ValidationTypes.TEXT,
    //     params: {
    //       allowedValues: [
    //         TimePrecision.NONE,
    //         TimePrecision.MINUTE,
    //         TimePrecision.SECOND,
    //       ],
    //       default: TimePrecision.MINUTE,
    //     },
    //   },
    //   dependencies: ["primaryColumns", "columnType"],
    //   hidden: (props: TableWidgetProps, propertyPath: string) => {
    //     const baseProperty = getBasePropertyPath(propertyPath);
    //     const columnType = get(props, `${baseProperty}.columnType`, "");
    //     return columnType !== ColumnTypes.DATE;
    //   },
    // },
  ],
};
