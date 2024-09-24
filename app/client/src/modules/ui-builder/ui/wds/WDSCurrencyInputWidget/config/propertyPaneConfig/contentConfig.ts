import { CurrencyTypeOptions } from "constants/Currency";
import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { propertyPaneContentConfig as WdsInputWidgetPropertyPaneContentConfig } from "modules/ui-builder/ui/wds/WDSInputWidget/config/propertyPaneConfig/contentConfig";

import * as validations from "./validations";
import { countryToFlag } from "../../widget/helpers";

const inputTypeSectionConfig = WdsInputWidgetPropertyPaneContentConfig.find(
  (config) => config.sectionName === "Type",
);

export const propertyPaneContentConfig = [
  inputTypeSectionConfig,
  {
    sectionName: "Data",
    children: [
      {
        helpText:
          "Sets the default text of the widget. The text is updated if the default text changes",
        propertyName: "defaultText",
        label: "Default value",
        controlType: "INPUT_TEXT",
        placeholderText: "42",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: validations.defaultValueValidation,
            expected: {
              type: "number",
              example: `100`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        dependencies: ["decimals"],
      },
      {
        helpText: "Changes the type of currency",
        propertyName: "defaultCurrencyCode",
        label: "Currency",
        enableSearch: true,
        dropdownHeight: "156px",
        controlType: "DROP_DOWN",
        searchPlaceholderText: "Search by code or name",
        options: CurrencyTypeOptions.map((item) => {
          return {
            leftElement: countryToFlag(item.code),
            searchText: item.label,
            label: `${item.currency} - ${item.currency_name}`,
            value: item.currency,
            id: item.symbol_native,
          };
        }),
        virtual: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
        },
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
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            min: 0,
            max: 2,
          },
        },
      },
    ],
  },
  {
    sectionName: "Label",
    children: [],
  },
  {
    sectionName: "Validation",
    children: [
      {
        propertyName: "isRequired",
        label: "Required",
        helpText: "Makes input to the widget mandatory",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
];
