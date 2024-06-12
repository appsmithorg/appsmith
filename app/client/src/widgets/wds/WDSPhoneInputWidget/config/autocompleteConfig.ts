import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "An input text field is used to capture a phone number. Inputs are used in forms and can have custom validations.",
  "!url": "https://docs.appsmith.com/widget-reference/phone-input",
  parsedText: {
    "!type": "string",
    "!doc": "The formatted text value of the input",
    "!url": "https://docs.appsmith.com/widget-reference/phone-input",
  },
  rawText: {
    "!type": "string",
    "!doc": "The unformatted text value of the input",
    "!url": "https://docs.appsmith.com/widget-reference/phone-input",
  },
  isValid: "bool",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  isDisabled: "bool",
  isReadOnly: "bool",
  countryCode: {
    "!type": "string",
    "!doc": "Selected country code for Phone Number",
  },
  dialCode: {
    "!type": "string",
    "!doc": "Selected dialing code for Phone Number",
  },
};
