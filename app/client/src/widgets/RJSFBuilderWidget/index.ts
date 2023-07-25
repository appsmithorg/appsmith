import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "RJSFBuilder", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  features: {
    dynamicHeight: {
      sectionIndex: 0, // Index of the property pane "General" section
      active: false,
    },
  },
  defaults: {
    widgetName: "RJSFBuilder",
    rows: 30,
    columns: 40,
    version: 1,
    schema: undefined,
    uischema: undefined,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
  },
};

export default Widget;
