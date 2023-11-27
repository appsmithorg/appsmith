import { ISDCodeOptions } from "constants/ISDCodes_v2";
import type { ISDCodeProps } from "constants/ISDCodes_v2";
import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

import { countryToFlag } from "../../helpers";
import { defaultValueValidation } from "./validations";

export const propertyPaneContentConfig = [
  {
    sectionName: "Data",
    children: [
      {
        helpText:
          "Sets the default text of the widget. The text is updated if the default text changes",
        propertyName: "defaultText",
        label: "Default value",
        controlType: "INPUT_TEXT",
        placeholderText: "(000) 000-0000",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultValueValidation,
            expected: {
              type: "string",
              example: `(000) 000-0000`,
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
      },
      {
        helpText: "Changes the country code",
        propertyName: "defaultDialCode",
        label: "Default country code",
        enableSearch: true,
        dropdownHeight: "156px",
        controlType: "DROP_DOWN",
        searchPlaceholderText: "Search by code or country name",
        options: ISDCodeOptions.map((item: ISDCodeProps) => {
          return {
            leftElement: countryToFlag(item.dial_code),
            searchText: item.name,
            label: `${item.name} (${item.dial_code})`,
            value: item.dial_code,
            id: item.dial_code,
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
        propertyName: "allowDialCodeChange",
        label: "Change country code",
        helpText: "Search by country",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
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
