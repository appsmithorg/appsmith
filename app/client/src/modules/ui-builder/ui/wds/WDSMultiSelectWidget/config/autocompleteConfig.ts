import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "Select is used to capture user input/s from a specified list of permitted inputs. A Select can capture a single choice",
  "!url": "https://docs.appsmith.com/widget-reference/dropdown",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  selectedOptionValues: {
    "!type": "string",
    "!doc": "The value selected in a single select dropdown",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
  },
  selectedOptionLabels: {
    "!type": "string",
    "!doc": "The selected option label in a single select dropdown",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
  },
  isDisabled: "bool",
  isValid: "bool",
  isDirty: "bool",
  options: "[$__dropdownOption__$]",
};
