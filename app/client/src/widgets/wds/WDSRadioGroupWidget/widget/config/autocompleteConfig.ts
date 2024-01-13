import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "Radio widget lets the user choose only one option from a predefined set of options. It is quite similar to a SingleSelect Dropdown in its functionality",
  "!url": "https://docs.appsmith.com/widget-reference/radio",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  options: "[$__dropdownOption__$]",
  selectedOptionValue: "string",
  isRequired: "bool",
};
