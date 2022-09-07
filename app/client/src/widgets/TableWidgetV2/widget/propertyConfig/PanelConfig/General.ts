import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import {
  getBasePropertyPath,
  hideByColumnType,
  updateColumnLevelEditability,
  updateInlineEditingOptionDropdownVisibilityHook,
} from "../../propertyUtils";
import { isColumnTypeEditable } from "../../utilities";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";

export default {
  sectionName: "General",
  children: [
    {
      propertyName: "isCellVisible",
      dependencies: ["primaryColumns", "columnType"],
      label: "Visible",
      helpText: "Controls the visibility of the cell in the column",
      defaultValue: true,
      controlType: "SWITCH",
      customJSControl: "TABLE_COMPUTE_VALUE",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
    },
    {
      propertyName: "isDisabled",
      label: "Disabled",
      defaultValue: false,
      controlType: "SWITCH",
      customJSControl: "TABLE_COMPUTE_VALUE",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      dependencies: ["primaryColumns", "columnOrder"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.ICON_BUTTON,
          ColumnTypes.MENU_BUTTON,
          ColumnTypes.BUTTON,
        ]);
      },
    },
    {
      propertyName: "isCompact",
      helpText: "Decides if menu items will consume lesser space",
      label: "Compact",
      controlType: "SWITCH",
      customJSControl: "TABLE_COMPUTE_VALUE",
      isJSConvertible: true,
      isBindProperty: true,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      isTriggerProperty: false,
      dependencies: ["primaryColumns", "columnOrder"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
    },
    {
      propertyName: "allowCellWrapping",
      dependencies: ["primaryColumns", "columnType"],
      label: "Cell Wrapping",
      helpText: "Allows content of the cell to be wrapped",
      defaultValue: true,
      controlType: "SWITCH",
      customJSControl: "TABLE_COMPUTE_VALUE",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.NUMBER,
          ColumnTypes.URL,
          ColumnTypes.DATE,
        ]);
      },
    },
    {
      propertyName: "isCellEditable",
      dependencies: [
        "primaryColumns",
        "columnOrder",
        "columnType",
        "childStylesheet",
        "inlineEditingSaveOption",
      ],
      label: "Editable",
      helpText: "Controls the cell's editablity",
      defaultValue: false,
      controlType: "SWITCH",
      customJSControl: "TABLE_COMPUTE_VALUE",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      updateHook: composePropertyUpdateHook([
        updateColumnLevelEditability,
        updateInlineEditingOptionDropdownVisibilityHook,
      ]),
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");
        const isDerived = get(props, `${baseProperty}.isDerived`, false);
        return !isColumnTypeEditable(columnType) || isDerived;
      },
    },
  ],
};
