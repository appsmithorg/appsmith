import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Text",
  iconSVG: IconSVG,
  defaults: {
    text: "Label",
    fontSize: "PARAGRAPH", // Make these into appsmith defaults: For example. AppsmithFontSizes.PARAGRAPH
    fontStyle: "BOLD", // Make these into general defaults: For example. FontStyles.BOLD,
    textAlign: "LEFT", // Make these into general defaults: For example. TextAlignments.LEFT
    textColor: "#231F20", // Make these into appsmith defaults. For example. AppsmithColors.defaultText
    rows: 1,
    columns: 4,
    widgetName: "Text",
    version: 1,
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
