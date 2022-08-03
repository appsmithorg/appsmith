import { ValidationTypes } from "constants/WidgetValidation";
import {
  ColumnTypes,
  DateInputFormat,
  TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import {
  getBasePropertyPath,
  hideByColumnType,
  SelectColumnOptionsValidations,
  showByColumnType,
  uniqueColumnAliasValidation,
  updateColumnLevelEditability,
  updateInlineEditingOptionDropdownVisibilityHook,
  updateNumberColumnTypeTextAlignment,
  updateThemeStylesheetsInColumns,
} from "../../propertyUtils";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { isColumnTypeEditable } from "../../utilities";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";

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

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  dependencies: ["primaryColumns", "columnOrder"],
  children: [
    ColumnControl,
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
    {
      sectionName: "Events",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        if (
          !hideByColumnType(
            props,
            propertyPath,
            [
              ColumnTypes.BUTTON,
              ColumnTypes.ICON_BUTTON,
              ColumnTypes.IMAGE,
              ColumnTypes.EDIT_ACTIONS,
            ],
            true,
          )
        ) {
          return false;
        } else {
          const columnType = get(props, `${propertyPath}.columnType`, "");
          const isEditable = get(props, `${propertyPath}.isEditable`, "");
          return (
            !(
              columnType === ColumnTypes.TEXT ||
              columnType === ColumnTypes.NUMBER
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
      ],
    },
  ],
  styleChildren: [
    {
      sectionName: "Color",
      children: [
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
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            return hideByColumnType(props, propertyPath, [
              ColumnTypes.TEXT,
              ColumnTypes.DATE,
              ColumnTypes.NUMBER,
              ColumnTypes.URL,
              ColumnTypes.EDIT_ACTIONS,
            ]);
          },
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
      sectionName: "Text Formatting",
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
          label: "Text Align",
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
              ColumnTypes.EDIT_ACTIONS,
            ]);
          },
        },
      ],
    },
  ],
};
