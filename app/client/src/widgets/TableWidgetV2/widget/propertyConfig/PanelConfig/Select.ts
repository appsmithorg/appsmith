import { ValidationTypes } from "constants/WidgetValidation";
import { get } from "lodash";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import {
  getBasePropertyPath,
  hideByColumnType,
  selectColumnOptionsValidation,
} from "../../propertyUtils";

export default {
  sectionName: "Select Properties",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(props, propertyPath, [ColumnTypes.SELECT], true);
  },
  children: [
    {
      propertyName: "selectOptions",
      helpText: "Options to be shown on the select dropdown",
      label: "Options",
      controlType: "TABLE_COMPUTE_VALUE",
      isJSConvertible: false,
      isBindProperty: true,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          expected: {
            type: 'Array<{ "label": string | number, "value": string | number}>',
            example: '[{"label": "abc", "value": "abc"}]',
          },
          fnString: selectColumnOptionsValidation.toString(),
        },
      },
      isTriggerProperty: false,
      dependencies: ["primaryColumns"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.SELECT]);
      },
    },
    {
      propertyName: "allowSameOptionsInNewRow",
      defaultValue: true,
      helpText:
        "Toggle to display same choices for new row and editing existing row in column",
      label: "Same options in new row",
      controlType: "SWITCH",
      isBindProperty: true,
      isJSConvertible: true,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps) => {
        return !props.allowAddNewRow;
      },
      dependencies: ["primaryColumns", "allowAddNewRow"],
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      propertyName: "newRowSelectOptions",
      helpText:
        "Options exclusively displayed in the column for new row addition",
      label: "New row options",
      controlType: "INPUT_TEXT",
      isJSConvertible: false,
      isBindProperty: true,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          expected: {
            type: 'Array<{ "label": string | number, "value": string | number}>',
            example: '[{"label": "abc", "value": "abc"}]',
          },
          fnString: selectColumnOptionsValidation.toString(),
        },
      },
      isTriggerProperty: false,
      dependencies: ["primaryColumns", "allowAddNewRow"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);

        if (baseProperty) {
          const columnType = get(props, `${baseProperty}.columnType`, "");
          const allowSameOptionsInNewRow = get(
            props,
            `${baseProperty}.allowSameOptionsInNewRow`,
          );

          if (
            columnType === ColumnTypes.SELECT &&
            props.allowAddNewRow &&
            !allowSameOptionsInNewRow
          ) {
            return false;
          } else {
            return true;
          }
        }
      },
    },
    {
      propertyName: "placeholderText",
      helpText: "Sets a Placeholder Text",
      label: "Placeholder",
      controlType: "INPUT_TEXT",
      placeholderText: "Enter placeholder text",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
    },
    {
      propertyName: "isFilterable",
      label: "Filterable",
      helpText: "Makes the dropdown list filterable",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      propertyName: "resetFilterTextOnClose",
      label: "Reset filter text on close",
      helpText: "Resets the filter text when the dropdown is closed",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      propertyName: "serverSideFiltering",
      helpText: "Enables server side filtering of the data",
      label: "Server Side Filtering",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
  ],
};
