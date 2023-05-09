import { ResponsiveBehavior } from "utils/autoLayout/constants";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  isCanvas: false,
  type: Widget.getWidgetType(),
  name: "",
  hideCard: true,
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["typography", "paragraph", "label"],
  defaults: {
    rows: 10,
    columns: 10,
    widgetName: "Module",
    version: 1,
    responsiveBehavior: ResponsiveBehavior.Fill,
    // disable resize handles
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
  },
};

export default Widget;
