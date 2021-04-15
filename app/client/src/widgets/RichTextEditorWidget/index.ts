import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Rich Text Editor",
  iconSVG: IconSVG,
  defaults: {
    defaultText: "This is the initial <b>content</b> of the editor",
    rows: 5,
    columns: 8,
    isDisabled: false,
    isVisible: true,
    widgetName: "RichTextEditor",
    isDefaultClickDisabled: true,
    inputType: "html",
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
