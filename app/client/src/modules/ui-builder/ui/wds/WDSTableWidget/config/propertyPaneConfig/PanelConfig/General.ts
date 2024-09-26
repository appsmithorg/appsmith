import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import { ColumnTypes } from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import { hideByColumnType } from "../../../widget/propertyUtils";
import { BUTTON_VARIANTS } from "@appsmith/wds";
import { objectKeys } from "@appsmith/utils";

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
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
    },
    {
      propertyName: "isDisabled",
      label: "Disabled",
      helpText: "Controls the disabled state of the button",
      defaultValue: false,
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
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
      isJSConvertible: true,
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
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
  ],
};

export const GeneralStyle = {
  sectionName: "General",
  children: [
    {
      propertyName: "buttonVariant",
      label: "Button variant",
      controlType: "DROP_DOWN",
      fullWidth: true,
      helpText: "Sets the variant of the button",
      options: objectKeys(BUTTON_VARIANTS).map((variant) => ({
        label: BUTTON_VARIANTS[variant],
        value: variant,
      })),
      defaultValue: objectKeys(BUTTON_VARIANTS)[0],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: objectKeys(BUTTON_VARIANTS),
            default: objectKeys(BUTTON_VARIANTS)[0],
          },
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.ICON_BUTTON,
          ColumnTypes.BUTTON,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
    },
  ],
};
