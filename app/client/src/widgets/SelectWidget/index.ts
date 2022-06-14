import Widget from "./widget";
import IconSVG from "./icon.svg";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Select",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 20,
    placeholderText: "Select option",
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    serverSideFiltering: false,
    widgetName: "Select",
    defaultOptionValue: "GREEN",
    version: 1,
    isFilterable: true,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    labelTextSize: "0.875rem",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
  autocompleteDefinitions: {
    "!doc":
      "Select is used to capture user input/s from a specified list of permitted inputs. A Select can capture a single choice",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    isVisible: {
      "!type": "bool",
      "!doc": "Boolean value indicating if the widget is in visible state",
    },
    filterText: {
      "!type": "string",
      "!doc": "The filter text for Server side filtering",
    },
    selectedOptionValue: {
      "!type": "string",
      "!doc": "The value selected in a single select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionLabel: {
      "!type": "string",
      "!doc": "The selected option label in a single select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    isDisabled: "bool",
    options: "[dropdownOption]",
  },
};

export default Widget;
