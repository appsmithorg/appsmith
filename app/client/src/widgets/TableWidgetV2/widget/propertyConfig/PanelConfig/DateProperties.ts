import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import { allowedFirstDayOfWeekRange } from "../../propertyUtils";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";

export default {
  sectionName: "Date Settings",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    const columnType = get(props, `${propertyPath}.columnType`, "");
    const isEditable = get(props, `${propertyPath}.isEditable`, "");
    return columnType !== ColumnTypes.DATE || !isEditable;
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
            type: "0 : sunday\n1 : monday\n2 : tuesday\n3 : wednesday\n4 : thursday\n5 : friday\n6 : saturday",
            example: "0",
            autocompleteDataType: AutocompleteDataType.STRING,
          },
        },
      },
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
    },
  ],
};
