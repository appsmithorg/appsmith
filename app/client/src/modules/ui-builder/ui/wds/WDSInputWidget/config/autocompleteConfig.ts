import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "An input text field is used to capture a users textual input such as their names, numbers, emails etc. Inputs are used in forms and can have custom validations.",
  "!url": "https://docs.appsmith.com/widget-reference/input",
  parsedText: {
    "!type": "string",
    "!doc": "The text value of the input",
    "!url": "https://docs.appsmith.com/widget-reference/input",
  },
  isValid: "bool",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  isDisabled: "bool",
  isReadOnly: "bool",
};
