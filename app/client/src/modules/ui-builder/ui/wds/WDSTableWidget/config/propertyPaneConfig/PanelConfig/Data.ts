import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import {
  ColumnTypes,
  DateInputFormat,
} from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import { get } from "lodash";
import {
  getBasePropertyPath,
  hideByColumnType,
  showByColumnType,
  uniqueColumnAliasValidation,
  updateCurrencyDefaultValues,
  updateMenuItemsSource,
  updateNumberColumnTypeTextAlignment,
} from "../../../widget/propertyUtils";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";
import { CurrencyDropdownOptions } from "widgets/CurrencyInputWidget/component/CurrencyCodeDropdown";

export default {
  sectionName: "Data",
  children: [
    {
      propertyName: "columnType",
      label: "Column type",
      helpText:
        "Type of column to be shown corresponding to the data of the column",
      controlType: "DROP_DOWN",
      options: [
        {
          label: "Button",
          value: ColumnTypes.BUTTON,
        },
        {
          label: "Button Group",
          value: ColumnTypes.BUTTON_GROUP,
        },
        {
          label: "Number",
          value: ColumnTypes.NUMBER,
        },
        {
          label: "Plain text",
          value: ColumnTypes.TEXT,
        },
        {
          label: "URL",
          value: ColumnTypes.URL,
        },
        {
          label: "Date",
          value: ColumnTypes.DATE,
        },
      ],
      updateHook: composePropertyUpdateHook([
        updateNumberColumnTypeTextAlignment,
        updateMenuItemsSource,
        updateCurrencyDefaultValues,
      ]),
      dependencies: ["primaryColumns", "columnOrder", "childStylesheet"],
      isBindProperty: false,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return showByColumnType(props, propertyPath, [
          ColumnTypes.EDIT_ACTIONS,
        ]);
      },
    },
    {
      helpText: "The alias that you use in selectedrow",
      propertyName: "alias",
      label: "Property Name",
      controlType: "INPUT_TEXT",
      helperText: () =>
        "Changing the name of the column overrides any changes to this field",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const columnId = propertyPath.match(/primaryColumns\.(.*)\.alias/);
        let isDerivedProperty = false;

        if (columnId && columnId[1] && props.primaryColumns[columnId[1]]) {
          isDerivedProperty = props.primaryColumns[columnId[1]].isDerived;
        }

        return (
          !isDerivedProperty ||
          hideByColumnType(props, propertyPath, [
            ColumnTypes.DATE,
            ColumnTypes.IMAGE,
            ColumnTypes.NUMBER,
            ColumnTypes.CURRENCY,
            ColumnTypes.TEXT,
            ColumnTypes.VIDEO,
            ColumnTypes.URL,
          ])
        );
      },
      dependencies: ["primaryColumns"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.FUNCTION,
        params: {
          expected: {
            type: "string",
            example: "abc",
            autocompleteDataType: AutocompleteDataType.STRING,
          },
          fnString: uniqueColumnAliasValidation.toString(),
        },
      },
    },
    {
      propertyName: "groupButtons",
      label: "Group Buttons",
      helpText: "Configure buttons in the group",
      controlType: "GROUP_BUTTONS",
      isBindProperty: false,
      isTriggerProperty: false,
      dependencies: ["primaryColumns", "columnOrder"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");
        return columnType !== ColumnTypes.BUTTON_GROUP;
      },
      panelConfig: {
        editableTitle: true,
        titlePropertyName: "label",
        panelIdPropertyName: "id",
        updateHook: (
          props: any,
          propertyPath: string,
          propertyValue: string,
        ) => {
          return [
            {
              propertyPath,
              propertyValue,
            },
          ];
        },
        contentChildren: [
          {
            sectionName: "Data",
            children: [
              {
                propertyName: "buttonType",
                label: "Button type",
                controlType: "ICON_TABS",
                fullWidth: true,
                helpText: "Sets button type",
                options: [
                  {
                    label: "Simple",
                    value: "SIMPLE",
                  },
                  {
                    label: "Menu",
                    value: "MENU",
                  },
                ],
                defaultValue: "SIMPLE",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: {
                  type: ValidationTypes.TEXT,
                  params: {
                    allowedValues: ["SIMPLE", "MENU"],
                  },
                },
              },
              {
                propertyName: "menuItems",
                helpText: "Menu items",
                label: "Menu items",
                controlType: "MENU_ITEMS",
                isBindProperty: false,
                isTriggerProperty: false,
                hidden: (props: any, propertyPath: string) => {
                  const buttonType = get(
                    props,
                    `${propertyPath.split(".", 2).join(".")}.buttonType`,
                    "",
                  );
                  return buttonType !== "MENU";
                },
                dependencies: ["groupButtons"],
                panelConfig: {
                  editableTitle: true,
                  titlePropertyName: "label",
                  panelIdPropertyName: "id",
                  updateHook: (
                    props: any,
                    propertyPath: string,
                    propertyValue: string,
                  ) => {
                    return [
                      {
                        propertyPath,
                        propertyValue,
                      },
                    ];
                  },
                  contentChildren: [
                    {
                      sectionName: "Label",
                      children: [
                        {
                          propertyName: "label",
                          helpText: "Sets the label of a menu item",
                          label: "Text",
                          controlType: "INPUT_TEXT",
                          placeholderText: "Enter label",
                          isBindProperty: true,
                          isTriggerProperty: false,
                          validation: { type: ValidationTypes.TEXT },
                        },
                      ],
                    },
                    {
                      sectionName: "General",
                      children: [
                        {
                          propertyName: "isVisible",
                          helpText: "Controls the visibility of menu item",
                          label: "Visible",
                          controlType: "SWITCH",
                          isJSConvertible: true,
                          isBindProperty: true,
                          isTriggerProperty: false,
                          validation: { type: ValidationTypes.BOOLEAN },
                        },
                        {
                          propertyName: "isDisabled",
                          helpText: "Disables menu item",
                          label: "Disabled",
                          controlType: "SWITCH",
                          isJSConvertible: true,
                          isBindProperty: true,
                          isTriggerProperty: false,
                          validation: { type: ValidationTypes.BOOLEAN },
                        },
                      ],
                    },
                    {
                      sectionName: "Icon",
                      children: [
                        {
                          propertyName: "iconName",
                          label: "Icon",
                          helpText: "Sets the icon to be used for a menu item",
                          controlType: "ICON_SELECT",
                          isJSConvertible: true,
                          isBindProperty: true,
                          isTriggerProperty: false,
                          validation: { type: ValidationTypes.TEXT },
                        },
                        {
                          propertyName: "iconAlign",
                          label: "Position",
                          helpText: "Sets the icon alignment of a menu item",
                          controlType: "ICON_TABS",
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
                          defaultValue: "left",
                          isBindProperty: false,
                          isTriggerProperty: false,
                          validation: { type: ValidationTypes.TEXT },
                        },
                      ],
                    },
                    {
                      sectionName: "Color",
                      children: [
                        {
                          propertyName: "backgroundColor",
                          helpText: "Sets the background color of a menu item",
                          label: "Background color",
                          controlType: "COLOR_PICKER",
                          isJSConvertible: true,
                          isBindProperty: true,
                          isTriggerProperty: false,
                          validation: { type: ValidationTypes.TEXT },
                        },
                        {
                          propertyName: "iconColor",
                          helpText: "Sets the icon color of a menu item",
                          label: "Icon Color",
                          controlType: "COLOR_PICKER",
                          isBindProperty: false,
                          isTriggerProperty: false,
                        },
                        {
                          propertyName: "textColor",
                          helpText: "Sets the text color of a menu item",
                          label: "Text color",
                          controlType: "COLOR_PICKER",
                          isBindProperty: false,
                          isTriggerProperty: false,
                        },
                      ],
                    },
                    {
                      sectionName: "Events",
                      children: [
                        {
                          propertyName: "onClick",
                          helpText: "when the menu item is clicked",
                          label: "onClick",
                          controlType: "ACTION_SELECTOR",
                          isJSConvertible: true,
                          isBindProperty: true,
                          isTriggerProperty: true,
                        },
                      ],
                    },
                  ],
                },
              },
              {
                propertyName: "label",
                helpText: "Sets the label of a button",
                label: "Label",
                controlType: "INPUT_TEXT",
                placeholderText: "Enter label",
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
              },
              {
                propertyName: "iconName",
                label: "Icon",
                helpText: "Sets the icon to be used for a button",
                controlType: "ICON_SELECT",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
              },
              {
                propertyName: "iconAlign",
                label: "Icon alignment",
                helpText: "Sets the icon alignment of a button",
                controlType: "ICON_TABS",
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
                defaultValue: "left",
                isBindProperty: false,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
              },
            ],
          },
          {
            sectionName: "General",
            children: [
              {
                propertyName: "isVisible",
                helpText: "Controls the visibility of the button",
                label: "Visible",
                controlType: "SWITCH",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.BOOLEAN },
              },
              {
                propertyName: "isDisabled",
                helpText: "Disables input to the button",
                label: "Disabled",
                controlType: "SWITCH",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.BOOLEAN },
              },
            ],
          },
          {
            sectionName: "Events",
            children: [
              {
                propertyName: "onClick",
                helpText: "when the button is clicked",
                label: "onClick",
                controlType: "ACTION_SELECTOR",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: true,
              },
            ],
          },
        ],
      },
    },
    {
      propertyName: "displayText",
      label: "Display text",
      helpText: "The text to be displayed in the column",
      controlType: "INPUT_TEXT",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== "url";
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "inputFormat",
      label: "Date format",
      helpText: "Date format of incoming data to the column",
      controlType: "DROP_DOWN",
      options: [
        {
          label: "UNIX timestamp (s)",
          value: DateInputFormat.EPOCH,
        },
        {
          label: "UNIX timestamp (ms)",
          value: DateInputFormat.MILLISECONDS,
        },
        {
          label: "YYYY-MM-DD",
          value: "YYYY-MM-DD",
        },
        {
          label: "YYYY-MM-DD HH:mm",
          value: "YYYY-MM-DD HH:mm",
        },
        {
          label: "ISO 8601",
          value: "YYYY-MM-DDTHH:mm:ss.SSSZ",
        },
        {
          label: "YYYY-MM-DDTHH:mm:ss",
          value: "YYYY-MM-DDTHH:mm:ss",
        },
        {
          label: "YYYY-MM-DD hh:mm:ss",
          value: "YYYY-MM-DD hh:mm:ss",
        },
        {
          label: "Do MMM YYYY",
          value: "Do MMM YYYY",
        },
        {
          label: "DD/MM/YYYY",
          value: "DD/MM/YYYY",
        },
        {
          label: "DD/MM/YYYY HH:mm",
          value: "DD/MM/YYYY HH:mm",
        },
        {
          label: "LLL",
          value: "LLL",
        },
        {
          label: "LL",
          value: "LL",
        },
        {
          label: "D MMMM, YYYY",
          value: "D MMMM, YYYY",
        },
        {
          label: "H:mm A D MMMM, YYYY",
          value: "H:mm A D MMMM, YYYY",
        },
        {
          label: "MM-DD-YYYY",
          value: "MM-DD-YYYY",
        },
        {
          label: "DD-MM-YYYY",
          value: "DD-MM-YYYY",
        },
        {
          label: "MM/DD/YYYY",
          value: "MM/DD/YYYY",
        },
        {
          label: "DD/MM/YYYY",
          value: "DD/MM/YYYY",
        },
        {
          label: "DD/MM/YY",
          value: "DD/MM/YY",
        },
        {
          label: "MM/DD/YY",
          value: "MM/DD/YY",
        },
      ],
      defaultValue: "YYYY-MM-DD HH:mm",
      isJSConvertible: true,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== ColumnTypes.DATE;
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              "YYYY-MM-DDTHH:mm:ss.SSSZ",
              DateInputFormat.EPOCH,
              DateInputFormat.MILLISECONDS,
              "YYYY-MM-DD",
              "YYYY-MM-DD HH:mm",
              "YYYY-MM-DDTHH:mm:ss.sssZ",
              "YYYY-MM-DDTHH:mm:ss",
              "YYYY-MM-DD hh:mm:ss",
              "Do MMM YYYY",
              "DD/MM/YYYY",
              "DD/MM/YYYY HH:mm",
              "LLL",
              "LL",
              "D MMMM, YYYY",
              "H:mm A D MMMM, YYYY",
              "MM-DD-YYYY",
              "DD-MM-YYYY",
              "MM/DD/YYYY",
              "DD/MM/YYYY",
              "DD/MM/YY",
              "MM/DD/YY",
            ],
          },
        },
      },
      isTriggerProperty: false,
    },
    {
      propertyName: "outputFormat",
      label: "Display format",
      helpText: "Date format to be shown to users",
      controlType: "DROP_DOWN",
      isJSConvertible: true,
      options: [
        {
          label: "UNIX timestamp (s)",
          value: DateInputFormat.EPOCH,
        },
        {
          label: "UNIX timestamp (ms)",
          value: DateInputFormat.MILLISECONDS,
        },
        {
          label: "YYYY-MM-DD",
          value: "YYYY-MM-DD",
        },
        {
          label: "YYYY-MM-DD HH:mm",
          value: "YYYY-MM-DD HH:mm",
        },
        {
          label: "ISO 8601",
          value: "YYYY-MM-DDTHH:mm:ss.SSSZ",
        },
        {
          label: "YYYY-MM-DDTHH:mm:ss",
          value: "YYYY-MM-DDTHH:mm:ss",
        },
        {
          label: "YYYY-MM-DD hh:mm:ss",
          value: "YYYY-MM-DD hh:mm:ss",
        },
        {
          label: "Do MMM YYYY",
          value: "Do MMM YYYY",
        },
        {
          label: "DD/MM/YYYY",
          value: "DD/MM/YYYY",
        },
        {
          label: "DD/MM/YYYY HH:mm",
          value: "DD/MM/YYYY HH:mm",
        },
        {
          label: "LLL",
          value: "LLL",
        },
        {
          label: "LL",
          value: "LL",
        },
        {
          label: "D MMMM, YYYY",
          value: "D MMMM, YYYY",
        },
        {
          label: "H:mm A D MMMM, YYYY",
          value: "H:mm A D MMMM, YYYY",
        },
        {
          label: "MM-DD-YYYY",
          value: "MM-DD-YYYY",
        },
        {
          label: "DD-MM-YYYY",
          value: "DD-MM-YYYY",
        },
        {
          label: "MM/DD/YYYY",
          value: "MM/DD/YYYY",
        },
        {
          label: "DD/MM/YYYY",
          value: "DD/MM/YYYY",
        },
        {
          label: "DD/MM/YY",
          value: "DD/MM/YY",
        },
        {
          label: "MM/DD/YY",
          value: "MM/DD/YY",
        },
      ],
      defaultValue: "YYYY-MM-DD",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== ColumnTypes.DATE;
      },
      dependencies: ["primaryColumns", "columnType"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              "YYYY-MM-DDTHH:mm:ss.SSSZ",
              "Epoch",
              "Milliseconds",
              "YYYY-MM-DD",
              "YYYY-MM-DD HH:mm",
              "YYYY-MM-DDTHH:mm:ss.sssZ",
              "YYYY-MM-DDTHH:mm:ss",
              "YYYY-MM-DD hh:mm:ss",
              "Do MMM YYYY",
              "DD/MM/YYYY",
              "DD/MM/YYYY HH:mm",
              "LLL",
              "LL",
              "D MMMM, YYYY",
              "H:mm A D MMMM, YYYY",
              "MM-DD-YYYY",
              "DD-MM-YYYY",
              "MM/DD/YYYY",
              "DD/MM/YYYY",
              "DD/MM/YY",
              "MM/DD/YY",
            ],
          },
        },
      },
      isTriggerProperty: false,
    },
    {
      helpText: "Changes the type of currency",
      propertyName: "currencyCode",
      label: "Currency",
      enableSearch: true,
      dropdownHeight: "156px",
      controlType: "DROP_DOWN",
      searchPlaceholderText: "Search by code or name",
      options: CurrencyDropdownOptions,
      virtual: true,
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          default: "USD",
          required: true,
          allowedValues: CurrencyDropdownOptions.map((option) => option.value),
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== ColumnTypes.CURRENCY;
      },
      dependencies: ["primaryColumns", "columnType"],
    },
    {
      helpText: "No. of decimals in currency input",
      propertyName: "decimals",
      label: "Decimals allowed",
      controlType: "DROP_DOWN",
      options: [
        {
          label: "0",
          value: 0,
        },
        {
          label: "1",
          value: 1,
        },
        {
          label: "2",
          value: 2,
        },
      ],
      isJSConvertible: false,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.NUMBER,
        params: {
          min: 0,
          max: 2,
          default: 0,
          required: true,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== ColumnTypes.CURRENCY;
      },
      dependencies: ["primaryColumns", "columnType"],
    },
    {
      propertyName: "thousandSeparator",
      helpText: "formats the currency with a thousand separator",
      label: "Thousand separator",
      controlType: "SWITCH",
      dependencies: ["primaryColumns", "columnType"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== ColumnTypes.CURRENCY;
      },
    },
    {
      propertyName: "notation",
      helpText: "Displays the currency in standard or compact notation",
      label: "Notation",
      controlType: "DROP_DOWN",
      options: [
        {
          label: "Standard",
          value: "standard",
        },
        {
          label: "Compact",
          value: "compact",
        },
      ],
      dependencies: ["primaryColumns", "columnType"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TEXT,
        params: { default: "standard", allowedValues: ["standard", "compact"] },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== ColumnTypes.CURRENCY;
      },
    },
  ],
};
