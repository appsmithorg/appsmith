import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "A combo box combines a text input with a listbox, allowing users to filter a list of options to items matching a query.",
  "!url": "https://docs.appsmith.com/widget-reference/radio",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  options: "[$__dropdownOption__$]",
  selectedOptionValue: "string",
  isRequired: "bool",
};
