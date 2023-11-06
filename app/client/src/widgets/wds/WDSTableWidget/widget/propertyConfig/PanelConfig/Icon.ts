import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ICON_NAMES } from "widgets/TableWidgetV2/constants";
import { hideByColumnType, updateIconAlignment } from "../../propertyUtils";
import { ColumnTypes } from "widgets/wds/WDSTableWidget/constants";

export default {
  sectionName: "Icon",
  children: [
    {
      propertyName: "menuButtoniconName",
      label: "Icon",
      helpText: "Sets the icon to be used for the menu button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      updateHook: updateIconAlignment,
      dependencies: ["primaryColumns", "columnOrder"],
      controlType: "ICON_SELECT",
      customJSControl: "TABLE_COMPUTE_VALUE",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ICON_NAMES,
          },
        },
      },
    },
    {
      propertyName: "iconAlign",
      label: "Position",
      helpText: "Sets the icon alignment of the menu button",
      controlType: "ICON_TABS",
      defaultValue: "left",
      fullWidth: false,
      options: [
        {
          startIcon: "skip-left-line",
          value: "left",
        },
        {
          startIcon: "skip-right-line",
          value: "right",
        },
      ],
      isBindProperty: false,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: ["left", "right"],
        },
      },
    },
  ],
};
