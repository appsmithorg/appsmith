import Widget from "./widget";
import IconSVG from "./icon.svg";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Input",
  hideCard: true,
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    label: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    columns: 20,
    widgetName: "Input",
    version: 1,
    defaultText: "",
    iconAlign: "left",
    autoFocus: false,
    labelStyle: "",
    resetOnSubmit: true,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
