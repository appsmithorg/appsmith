import { ValidationTypes } from "constants/WidgetValidation";
import { get } from "lodash";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { CurrencyDropdownOptions } from "widgets/CurrencyInputWidget/component/CurrencyCodeDropdown";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes, DateInputFormat } from "widgets/TableWidgetV2/constants";
import {
  getBasePropertyPath,
  hideByColumnType,
  uniqueColumnAliasValidation,
} from "../../../propertyUtils";
import { columnTypeConfig, columnTypeWithHtmlConfig } from "./ColumnType";

export default {
  sectionName: "Data",
  children: [
    columnTypeConfig,
    columnTypeWithHtmlConfig,
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
      propertyName: "displayText",
      label: "Display text",
      helpText: "The text to be displayed in the column",
      controlType: "TABLE_COMPUTE_VALUE",
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
      helpText:
        "The value computed & shown in each cell. Use {{currentRow}} to reference each row in the table. This property is not accessible outside the column settings.",
      propertyName: "computedValue",
      label: "Computed value",
      controlType: "TABLE_COMPUTE_VALUE",
      additionalControlData: {
        isArrayValue: true,
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.DATE,
          ColumnTypes.IMAGE,
          ColumnTypes.NUMBER,
          ColumnTypes.TEXT,
          ColumnTypes.VIDEO,
          ColumnTypes.URL,
          ColumnTypes.CHECKBOX,
          ColumnTypes.SWITCH,
          ColumnTypes.SELECT,
          ColumnTypes.CURRENCY,
          ColumnTypes.HTML,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
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
      customJSControl: "TABLE_COMPUTE_VALUE",
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
        },
      },
      isTriggerProperty: false,
    },
    {
      propertyName: "outputFormat",
      label: "Display format",
      helpText: "Date format to be shown to users",
      controlType: "DROP_DOWN",
      customJSControl: "TABLE_COMPUTE_VALUE",
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
      defaultValue: "YYYY-MM-DD HH:mm",
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
      customJSControl: "TABLE_COMPUTE_VALUE",
      searchPlaceholderText: "Search by code or name",
      options: CurrencyDropdownOptions,
      virtual: true,
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            default: "USD",
            required: true,
            allowedValues: CurrencyDropdownOptions.map(
              (option) => option.value,
            ),
          },
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
      customJSControl: "TABLE_COMPUTE_VALUE",
      dependencies: ["primaryColumns", "columnType"],
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
      customJSControl: "TABLE_COMPUTE_VALUE",
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
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            default: "standard",
            allowedValues: ["standard", "compact"],
          },
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");

        return columnType !== ColumnTypes.CURRENCY;
      },
    },
  ],
};
