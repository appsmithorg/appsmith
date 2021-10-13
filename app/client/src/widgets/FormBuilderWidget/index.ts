import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Form Builder",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    backgroundColor: "#fff",
    rows: 40,
    columns: 25,
    widgetName: "FormBuilder",
    children: [],
    schema: [],
    primaryFields: [],
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
