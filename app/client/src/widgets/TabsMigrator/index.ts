import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "TabsMigrator",

  defaults: {
    isLoading: true,
    rows: 1,
    columns: 1,
    widgetName: "TabsMigrator",
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
