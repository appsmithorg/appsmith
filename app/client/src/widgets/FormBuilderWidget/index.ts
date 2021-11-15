import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Form Builder",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    backgroundColor: "#fff",
    columns: 25,
    fixedFooter: true,
    rows: 40,
    schema: {},
    scrollContents: true,
    showReset: true,
    title: "Form",
    version: 1,
    widgetName: "FormBuilder",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
