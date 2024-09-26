import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "Select widget lets the user choose one option from a dropdown list. It is similar to a SingleSelect Dropdown in its functionality",
  "!url": "https://docs.appsmith.com/widget-reference/radio",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  options: "[$__dropdownOption__$]",
  selectedOptionValue: "string",
  isRequired: "bool",
};
