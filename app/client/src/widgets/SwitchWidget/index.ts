import IconSVG from "./icon.svg";
import Widget from "./widget";
import { LabelPosition } from "components/constants";
import { AlignWidgetTypes } from "widgets/constants";

export const CONFIG = {
  features: {
    dynamicHeight: true,
  },
  type: Widget.getWidgetType(),
  name: "Switch",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    label: "Label",
    rows: 4,
    columns: 12,
    defaultSwitchState: true,
    widgetName: "Switch",
    alignWidget: AlignWidgetTypes.LEFT,
    labelPosition: LabelPosition.Left,
    version: 1,
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
