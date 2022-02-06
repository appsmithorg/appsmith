import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Radio Group",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 8,
    columns: 20,
    animateLoading: true,
    label: "",
    options: [
      { label: "Yes", value: "Y" },
      { label: "No", value: "N" },
    ],
    defaultOptionValue: "Y",
    widgetName: "RadioGroup",
    version: 1,
    isRequired: false,
    isDisabled: false,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
