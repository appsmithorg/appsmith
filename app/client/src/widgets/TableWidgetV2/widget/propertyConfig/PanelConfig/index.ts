import { ValidationTypes } from "constants/WidgetValidation";
import {
  ColumnTypes,
  ICON_NAMES,
  TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import {
  getBasePropertyPath,
  hideByColumnType,
  removeBoxShadowColorProp,
  showByColumnType,
  updateIconAlignment,
} from "../../propertyUtils";

import ColumnControl from "./ColumnControl";
import Styles from "./Styles";
import ButtonProperties from "./ButtonProperties";
import MenuItems from "./MenuItems";
import Events from "./Events";
import Data from "./Data";
import General from "./General";
import Basic from "./Basic";
import SaveButtonProperties from "./SaveButtonProperties";
import DiscardButtonproperties from "./DiscardButtonproperties";
import { ButtonVariantTypes } from "components/constants";
import Validations from "./Validation";

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  dependencies: ["primaryColumns", "columnOrder"],
  children: [
    ColumnControl,
    Validations,
    ButtonProperties,
    SaveButtonProperties,
    DiscardButtonproperties,
    MenuItems,
    Styles,
    Events,
  ],

  // TODO(aswathkk): Once we remove feature flag, refactor the following configs in to separate files
  contentChildren: [
    Data,
    Basic,
    General,
    Validations,
    {
      sectionName: "Save Button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(
          props,
          propertyPath,
          [ColumnTypes.EDIT_ACTIONS],
          true,
        );
      },
      children: [
        {
          sectionName: "Label",
          collapsible: false,
          children: [
            {
              propertyName: "saveActionLabel",
              label: "Text",
              controlType: "TABLE_COMPUTE_VALUE",
              dependencies: ["primaryColumns"],
              isBindProperty: true,
              isTriggerProperty: false,
            },
          ],
        },
        {
          sectionName: "General",
          collapsible: false,
          children: [
            {
              propertyName: "onSave",
              label: "onSave",
              controlType: "ACTION_SELECTOR",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                const baseProperty = getBasePropertyPath(propertyPath);
                const columnType = get(props, `${baseProperty}.columnType`, "");
                return columnType !== ColumnTypes.EDIT_ACTIONS;
              },
              dependencies: ["primaryColumns"],
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: true,
            },
            {
              propertyName: "isSaveVisible",
              dependencies: ["primaryColumns"],
              label: "Visible",
              helpText: "Controls the visibility of the save button",
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
              propertyName: "isSaveDisabled",
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
              dependencies: ["primaryColumns"],
            },
          ],
        },
      ],
    },
    {
      sectionName: "Discard Button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(
          props,
          propertyPath,
          [ColumnTypes.EDIT_ACTIONS],
          true,
        );
      },
      children: [
        {
          sectionName: "Label",
          collapsible: false,
          children: [
            {
              propertyName: "discardActionLabel",
              label: "Text",
              controlType: "TABLE_COMPUTE_VALUE",
              dependencies: ["primaryColumns"],
              isBindProperty: true,
              isTriggerProperty: false,
            },
          ],
        },
        {
          sectionName: "General",
          collapsible: false,
          children: [
            {
              propertyName: "onDiscard",
              label: "onDiscard",
              controlType: "ACTION_SELECTOR",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                const baseProperty = getBasePropertyPath(propertyPath);
                const columnType = get(props, `${baseProperty}.columnType`, "");
                return columnType !== ColumnTypes.EDIT_ACTIONS;
              },
              dependencies: ["primaryColumns"],
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: true,
            },
            {
              propertyName: "isDiscardVisible",
              dependencies: ["primaryColumns"],
              label: "Visible",
              helpText: "Controls the visibility of the discard button",
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
              propertyName: "isDiscardDisabled",
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
              dependencies: ["primaryColumns"],
            },
          ],
        },
      ],
    },
    {
      sectionName: "Events",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        if (showByColumnType(props, propertyPath, [ColumnTypes.IMAGE], true)) {
          return false;
        } else {
          const columnType = get(props, `${propertyPath}.columnType`, "");
          const isEditable = get(props, `${propertyPath}.isEditable`, "");
          return (
            !(
              columnType === ColumnTypes.TEXT ||
              columnType === ColumnTypes.NUMBER ||
              columnType === ColumnTypes.CHECKBOX
            ) || !isEditable
          );
        }
      },
      children: [
        // Image onClick
        {
          propertyName: "onClick",
          label: "onClick",
          controlType: "ACTION_SELECTOR",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            const baseProperty = getBasePropertyPath(propertyPath);
            const columnType = get(props, `${baseProperty}.columnType`, "");
            return columnType !== ColumnTypes.IMAGE;
          },
          dependencies: ["primaryColumns", "columnOrder"],
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
        },
        {
          propertyName: "onSubmit",
          label: "onSubmit",
          controlType: "ACTION_SELECTOR",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            const baseProperty = getBasePropertyPath(propertyPath);
            const columnType = get(props, `${baseProperty}.columnType`, "");
            const isEditable = get(props, `${baseProperty}.isEditable`, "");
            return (
              !(
                columnType === ColumnTypes.TEXT ||
                columnType === ColumnTypes.NUMBER
              ) || !isEditable
            );
          },
          dependencies: ["primaryColumns", "inlineEditingSaveOption"],
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
        },
        {
          propertyName: "onOptionChange",
          label: "onOptionChange",
          controlType: "ACTION_SELECTOR",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            const baseProperty = getBasePropertyPath(propertyPath);
            const columnType = get(props, `${baseProperty}.columnType`, "");
            const isEditable = get(props, `${baseProperty}.isEditable`, "");
            return columnType !== ColumnTypes.SELECT || !isEditable;
          },
          dependencies: ["primaryColumns"],
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
        },
        {
          propertyName: "onCheckChange",
          label: "onCheckChange",
          controlType: "ACTION_SELECTOR",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.CHECKBOX,
            ]);
          },
          dependencies: ["primaryColumns"],
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
        },
      ],
    },
  ],
  styleChildren: [
    {
      sectionName: "General",
      children: [
        {
          propertyName: "buttonVariant",
          label: "Button Variant",
          controlType: "DROP_DOWN",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          helpText: "Sets the variant",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.ICON_BUTTON,
              ColumnTypes.BUTTON,
            ]);
          },
          dependencies: ["primaryColumns", "columnOrder"],
          options: [
            {
              label: "Primary",
              value: ButtonVariantTypes.PRIMARY,
            },
            {
              label: "Secondary",
              value: ButtonVariantTypes.SECONDARY,
            },
            {
              label: "Tertiary",
              value: ButtonVariantTypes.TERTIARY,
            },
          ],
          defaultValue: ButtonVariantTypes.PRIMARY,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                default: ButtonVariantTypes.PRIMARY,
                allowedValues: [
                  ButtonVariantTypes.PRIMARY,
                  ButtonVariantTypes.SECONDARY,
                  ButtonVariantTypes.TERTIARY,
                ],
              },
            },
          },
        },
        {
          propertyName: "menuVariant",
          label: "Button Variant",
          controlType: "DROP_DOWN",
          customJSControl: "TABLE_COMPUTE_VALUE",
          helpText: "Sets the variant of the menu button",
          options: [
            {
              label: "Primary",
              value: ButtonVariantTypes.PRIMARY,
            },
            {
              label: "Secondary",
              value: ButtonVariantTypes.SECONDARY,
            },
            {
              label: "Tertiary",
              value: ButtonVariantTypes.TERTIARY,
            },
          ],
          isJSConvertible: true,
          dependencies: ["primaryColumns", "columnOrder"],
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.MENU_BUTTON,
            ]);
          },
          isBindProperty: true,
          isTriggerProperty: false,
          defaultValue: ButtonVariantTypes.PRIMARY,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                default: ButtonVariantTypes.PRIMARY,
                allowedValues: [
                  ButtonVariantTypes.PRIMARY,
                  ButtonVariantTypes.SECONDARY,
                  ButtonVariantTypes.TERTIARY,
                ],
              },
            },
          },
        },
      ],
    },
    {
      sectionName: "Icon",
      children: [
        {
          propertyName: "menuButtoniconName",
          label: "Icon",
          helpText: "Sets the icon to be used for the menu button",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.MENU_BUTTON,
            ]);
          },
          updateHook: updateIconAlignment,
          dependencies: ["primaryColumns", "columnOrder"],
          controlType: "ICON_SELECT",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
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
          options: [
            {
              icon: "VERTICAL_LEFT",
              value: "left",
            },
            {
              icon: "VERTICAL_RIGHT",
              value: "right",
            },
          ],
          isBindProperty: false,
          isTriggerProperty: false,
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.MENU_BUTTON,
            ]);
          },
          dependencies: ["primaryColumns", "columnOrder"],
          validation: {
            type: ValidationTypes.TEXT,
            params: {
              allowedValues: ["center", "left", "right"],
            },
          },
        },
      ],
    },
    {
      sectionName: (props: TableWidgetProps, propertyPath: string) => {
        const columnType = get(props, `${propertyPath}.columnType`);
        return columnType === ColumnTypes.CHECKBOX
          ? "Alignment"
          : "Text Formatting";
      },
      children: [
        {
          propertyName: "textSize",
          label: "Text Size",
          controlType: "DROP_DOWN",
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          options: [
            {
              label: "S",
              value: "0.875rem",
              subText: "0.875rem",
            },
            {
              label: "M",
              value: "1rem",
              subText: "1rem",
            },
            {
              label: "L",
              value: "1.25rem",
              subText: "1.25rem",
            },
            {
              label: "XL",
              value: "1.875rem",
              subText: "1.875rem",
            },
          ],
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
            },
          },
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.TEXT,
              ColumnTypes.DATE,
              ColumnTypes.NUMBER,
              ColumnTypes.URL,
            ]);
          },
        },
        {
          propertyName: "fontStyle",
          label: "Emphasis",
          controlType: "BUTTON_TABS",
          options: [
            {
              icon: "BOLD_FONT",
              value: "BOLD",
            },
            {
              icon: "ITALICS_FONT",
              value: "ITALIC",
            },
            {
              icon: "UNDERLINE",
              value: "UNDERLINE",
            },
          ],
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
            },
          },
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.TEXT,
              ColumnTypes.DATE,
              ColumnTypes.NUMBER,
              ColumnTypes.URL,
            ]);
          },
        },
        {
          propertyName: "horizontalAlignment",
          label: (props: TableWidgetProps, propertyPath: string) => {
            const basePropertyPath = getBasePropertyPath(propertyPath);
            const columnType = get(props, `${basePropertyPath}.columnType`);
            return columnType === ColumnTypes.CHECKBOX
              ? "Horizontal Alignment"
              : "Text Align";
          },
          controlType: "ICON_TABS",
          options: [
            {
              icon: "LEFT_ALIGN",
              value: "LEFT",
            },
            {
              icon: "CENTER_ALIGN",
              value: "CENTER",
            },
            {
              icon: "RIGHT_ALIGN",
              value: "RIGHT",
            },
          ],
          defaultValue: "LEFT",
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["LEFT", "CENTER", "RIGHT"],
              },
            },
          },
          isTriggerProperty: false,
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.TEXT,
              ColumnTypes.DATE,
              ColumnTypes.NUMBER,
              ColumnTypes.URL,
              ColumnTypes.CHECKBOX,
            ]);
          },
        },
        {
          propertyName: "verticalAlignment",
          label: "Vertical Alignment",
          controlType: "ICON_TABS",
          options: [
            {
              icon: "VERTICAL_TOP",
              value: "TOP",
            },
            {
              icon: "VERTICAL_CENTER",
              value: "CENTER",
            },
            {
              icon: "VERTICAL_BOTTOM",
              value: "BOTTOM",
            },
          ],
          defaultValue: "LEFT",
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["TOP", "CENTER", "BOTTOM"],
              },
            },
          },
          isTriggerProperty: false,
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.TEXT,
              ColumnTypes.DATE,
              ColumnTypes.NUMBER,
              ColumnTypes.URL,
              ColumnTypes.CHECKBOX,
            ]);
          },
        },
      ],
    },
    {
      sectionName: "Color",
      children: [
        {
          propertyName: "buttonColor",
          label: "Button Color",
          controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
          helpText: "Changes the color of the button",
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.BUTTON,
              ColumnTypes.ICON_BUTTON,
            ]);
          },
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          isTriggerProperty: false,
        },
        {
          propertyName: "menuColor",
          helpText:
            "Sets the custom color preset based on the menu button variant",
          label: "Button Color",
          controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.MENU_BUTTON,
            ]);
          },
          dependencies: ["primaryColumns", "columnOrder", "childStylesheet"],
        },
        {
          propertyName: "cellBackground",
          label: "Cell Background",
          controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          isTriggerProperty: false,
        },
        {
          propertyName: "textColor",
          label: "Text Color",
          controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          isTriggerProperty: false,
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.TEXT,
              ColumnTypes.DATE,
              ColumnTypes.NUMBER,
              ColumnTypes.URL,
            ]);
          },
        },
      ],
    },
    {
      sectionName: "Save Button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(
          props,
          propertyPath,
          [ColumnTypes.EDIT_ACTIONS],
          true,
        );
      },
      children: [
        {
          sectionName: "General",
          collapsible: false,
          children: [
            {
              propertyName: "saveButtonColor",
              label: "Button Color",
              controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
              helpText: "Changes the color of the button",
              isJSConvertible: true,
              customJSControl: "TABLE_COMPUTE_VALUE",
              dependencies: ["primaryColumns"],
              isBindProperty: true,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                  params: {
                    regex: /^(?![<|{{]).+/,
                  },
                },
              },
              isTriggerProperty: false,
            },
            {
              propertyName: "saveButtonVariant",
              label: "Button Variant",
              controlType: "DROP_DOWN",
              customJSControl: "TABLE_COMPUTE_VALUE",
              isJSConvertible: true,
              helpText: "Sets the variant of the save button",
              dependencies: ["primaryColumns"],
              options: [
                {
                  label: "Primary",
                  value: ButtonVariantTypes.PRIMARY,
                },
                {
                  label: "Secondary",
                  value: ButtonVariantTypes.SECONDARY,
                },
                {
                  label: "Tertiary",
                  value: ButtonVariantTypes.TERTIARY,
                },
              ],
              defaultValue: ButtonVariantTypes.PRIMARY,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                  params: {
                    default: ButtonVariantTypes.PRIMARY,
                    allowedValues: [
                      ButtonVariantTypes.PRIMARY,
                      ButtonVariantTypes.SECONDARY,
                      ButtonVariantTypes.TERTIARY,
                    ],
                  },
                },
              },
            },
            {
              propertyName: "saveBorderRadius",
              label: "Border Radius",
              customJSControl: "TABLE_COMPUTE_VALUE",
              isJSConvertible: true,
              helpText:
                "Rounds the corners of the save button's outer border edge",
              controlType: "BORDER_RADIUS_OPTIONS",
              dependencies: ["primaryColumns"],
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                },
              },
            },
          ],
        },
        {
          sectionName: "Icon",
          collapsible: false,
          children: [
            {
              propertyName: "saveActionIconName",
              label: "Icon",
              helpText: "Sets the icon to be used for the save action button",
              dependencies: ["primaryColumns", "columnOrder"],
              controlType: "ICON_SELECT",
              customJSControl: "TABLE_COMPUTE_VALUE",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                  params: {
                    allowedValues: ICON_NAMES,
                  },
                },
              },
            },
            {
              propertyName: "saveIconAlign",
              label: "Position",
              helpText: "Sets the icon alignment of the save button",
              controlType: "ICON_TABS",
              defaultValue: "left",
              options: [
                {
                  icon: "VERTICAL_LEFT",
                  value: "left",
                },
                {
                  icon: "VERTICAL_RIGHT",
                  value: "right",
                },
              ],
              isBindProperty: false,
              isTriggerProperty: false,
              dependencies: ["primaryColumns"],
              validation: {
                type: ValidationTypes.TEXT,
                params: {
                  allowedValues: ["center", "left", "right"],
                },
              },
            },
          ],
        },
      ],
    },
    {
      sectionName: "Discard Button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(
          props,
          propertyPath,
          [ColumnTypes.EDIT_ACTIONS],
          true,
        );
      },
      children: [
        {
          sectionName: "General",
          collapsible: false,
          children: [
            {
              propertyName: "discardButtonColor",
              label: "Button Color",
              controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
              helpText: "Changes the color of the button",
              isJSConvertible: true,
              customJSControl: "TABLE_COMPUTE_VALUE",
              dependencies: ["primaryColumns"],
              isBindProperty: true,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                  params: {
                    regex: /^(?![<|{{]).+/,
                  },
                },
              },
              isTriggerProperty: false,
            },
            {
              propertyName: "discardButtonVariant",
              label: "Button Variant",
              controlType: "DROP_DOWN",
              customJSControl: "TABLE_COMPUTE_VALUE",
              isJSConvertible: true,
              helpText: "Sets the variant of the discard button",
              dependencies: ["primaryColumns"],
              options: [
                {
                  label: "Primary",
                  value: ButtonVariantTypes.PRIMARY,
                },
                {
                  label: "Secondary",
                  value: ButtonVariantTypes.SECONDARY,
                },
                {
                  label: "Tertiary",
                  value: ButtonVariantTypes.TERTIARY,
                },
              ],
              defaultValue: ButtonVariantTypes.PRIMARY,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                  params: {
                    default: ButtonVariantTypes.PRIMARY,
                    allowedValues: [
                      ButtonVariantTypes.PRIMARY,
                      ButtonVariantTypes.SECONDARY,
                      ButtonVariantTypes.TERTIARY,
                    ],
                  },
                },
              },
            },
            {
              propertyName: "discardBorderRadius",
              label: "Border Radius",
              customJSControl: "TABLE_COMPUTE_VALUE",
              isJSConvertible: true,
              helpText:
                "Rounds the corners of the discard button's outer border edge",
              controlType: "BORDER_RADIUS_OPTIONS",
              dependencies: ["primaryColumns"],
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                },
              },
            },
          ],
        },
        {
          sectionName: "Icon",
          collapsible: false,
          children: [
            {
              propertyName: "discardActionIconName",
              label: "Icon",
              helpText:
                "Sets the icon to be used for the discard action button",
              dependencies: ["primaryColumns", "columnOrder"],
              controlType: "ICON_SELECT",
              customJSControl: "TABLE_COMPUTE_VALUE",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TABLE_PROPERTY,
                params: {
                  type: ValidationTypes.TEXT,
                  params: {
                    allowedValues: ICON_NAMES,
                  },
                },
              },
            },
            {
              propertyName: "discardIconAlign",
              label: "Position",
              helpText: "Sets the icon alignment of the discard button",
              controlType: "ICON_TABS",
              defaultValue: "left",
              options: [
                {
                  icon: "VERTICAL_LEFT",
                  value: "left",
                },
                {
                  icon: "VERTICAL_RIGHT",
                  value: "right",
                },
              ],
              isBindProperty: false,
              isTriggerProperty: false,
              dependencies: ["primaryColumns"],
              validation: {
                type: ValidationTypes.TEXT,
                params: {
                  allowedValues: ["left", "right"],
                },
              },
            },
          ],
        },
      ],
    },
    {
      sectionName: "Border and Shadow",
      children: [
        {
          propertyName: "borderRadius",
          label: "Border Radius",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          helpText: "Rounds the corners of the icon button's outer border edge",
          controlType: "BORDER_RADIUS_OPTIONS",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.ICON_BUTTON,
              ColumnTypes.MENU_BUTTON,
              ColumnTypes.BUTTON,
            ]);
          },
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
            },
          },
        },
        {
          propertyName: "boxShadow",
          label: "Box Shadow",
          helpText:
            "Enables you to cast a drop shadow from the frame of the widget",
          controlType: "BOX_SHADOW_OPTIONS",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          updateHook: removeBoxShadowColorProp,
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.ICON_BUTTON,
              ColumnTypes.MENU_BUTTON,
              ColumnTypes.BUTTON,
            ]);
          },
          dependencies: ["primaryColumns", "columnOrder"],
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TABLE_PROPERTY,
            params: {
              type: ValidationTypes.TEXT,
            },
          },
        },
      ],
    },
  ],
};
