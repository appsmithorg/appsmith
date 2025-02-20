import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

export const autocompleteConfig = {
  "!doc":
    "MultiSelect is used to capture user input/s from a specified list of permitted inputs. A MultiSelect can capture multiple choices",
  "!url": "https://docs.appsmith.com/widget-reference/dropdown",
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  selectedOptionValues: {
    "!type": "string",
    "!doc": "The values selected in a multi select dropdown",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
  },
  selectedOptionLabels: {
    "!type": "string",
    "!doc": "The selected options's labels in a multi select dropdown",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
  },
  isDisabled: "bool",
  isValid: "bool",
  isDirty: "bool",
  options: "[$__dropdownOption__$]",
};
