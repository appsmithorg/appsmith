import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "An input text field is used to capture a currency value. Inputs are used in forms and can have custom validations.",
  "!url": "https://docs.appsmith.com/widget-reference/currency-input",
  parsedText: {
    "!type": "string",
    "!doc": "The formatted text value of the input",
    "!url": "https://docs.appsmith.com/widget-reference/currency-input",
  },
  rawText: {
    "!type": "number",
    "!doc": "The value of the input",
    "!url": "https://docs.appsmith.com/widget-reference/currency-input",
  },
  isValid: "bool",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  isDisabled: "bool",
  isReadOnly: "bool",
  countryCode: {
    "!type": "string",
    "!doc": "Selected country code for Currency",
  },
  currencyCode: {
    "!type": "string",
    "!doc": "Selected Currency code",
  },
};
