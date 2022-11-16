import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { hideByColumnType } from "../../propertyUtils";

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
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.ARRAY,
          params: {
            unique: ["value"],
            children: {
              type: ValidationTypes.OBJECT,
              params: {
                required: true,
                allowedKeys: [
                  {
                    name: "label",
                    type: ValidationTypes.TEXT,
                    params: {
                      default: "",
                      requiredKey: true,
                    },
                  },
                  {
                    name: "value",
                    type: ValidationTypes.TEXT,
                    params: {
                      default: "",
                      requiredKey: true,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      isTriggerProperty: false,
      dependencies: ["primaryColumns"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.SELECT]);
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
