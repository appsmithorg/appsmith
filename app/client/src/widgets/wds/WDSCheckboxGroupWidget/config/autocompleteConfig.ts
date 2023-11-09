import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "Checkbox group widget allows users to easily configure multiple checkboxes together.",
  "!url": "https://docs.appsmith.com/widget-reference/checkbox-group",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  isDisabled: "bool",
  isValid: "bool",
  options: "[$__dropdownOption__$]",
  selectedValues: "[string]",
};
