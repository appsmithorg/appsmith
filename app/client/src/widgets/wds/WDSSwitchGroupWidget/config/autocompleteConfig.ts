import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "Switch group widget allows users to create many switch components which can easily by used in a form",
  "!url": "https://docs.appsmith.com/widget-reference/switch-group",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  isDisabled: "bool",
  options: "[$__dropdownOption__$]",
  selectedValues: "[string]",
};
