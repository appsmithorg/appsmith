import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/wds/WDSTableWidget/constants";
import { ColumnTypes } from "widgets/wds/WDSTableWidget/constants";
import {
  hideByColumnType,
  updateColumnOrderWhenFrozen,
} from "../../../widget/propertyUtils";
import { StickyType } from "widgets/wds/WDSTableWidget/component/Constants";
import { BUTTON_VARIANTS } from "@design-system/widgets";
import capitalize from "lodash/capitalize";

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
      customJSControl: "TABLE_COMPUTE_VALUE",
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
      customJSControl: "TABLE_COMPUTE_VALUE",
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
    {
      propertyName: "allowCellWrapping",
      dependencies: ["primaryColumns", "columnType"],
      label: "Cell wrapping",
      helpText: "Allows content of the cell to be wrapped",
      defaultValue: false,
      controlType: "SWITCH",
      customJSControl: "TABLE_COMPUTE_VALUE",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.NUMBER,
          ColumnTypes.URL,
        ]);
      },
    },
    {
      propertyName: "sticky",
      helpText:
        "Choose column that needs to be frozen left or right of the table",
      controlType: "ICON_TABS",
      defaultValue: StickyType.NONE,
      label: "Column freeze",
      fullWidth: true,
      isBindProperty: true,
      isTriggerProperty: false,
      dependencies: ["primaryColumns", "columnOrder"],
      options: [
        {
          startIcon: "contract-left-line",
          value: StickyType.LEFT,
        },
        {
          startIcon: "column-freeze",
          value: StickyType.NONE,
        },
        {
          startIcon: "contract-right-line",
          value: StickyType.RIGHT,
        },
      ],
      updateHook: updateColumnOrderWhenFrozen,
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
      customJSControl: "TABLE_COMPUTE_VALUE",
      fullWidth: true,
      helpText: "Sets the variant of the button",
      options: Object.values(BUTTON_VARIANTS).map((variant) => ({
        label: capitalize(variant),
        value: variant,
      })),
      defaultValue: BUTTON_VARIANTS.filled,
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.values(BUTTON_VARIANTS),
            default: BUTTON_VARIANTS.filled,
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
