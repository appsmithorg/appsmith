import Widget from "../InputWidgetV2/widget";
import { CONFIG as BaseConfig } from "../InputWidgetV2";

export const CONFIG = {
  ...BaseConfig,
  type: "TEXTAREA_WIDGET_V2",
  name: "Textarea",
  defaults: {
    ...BaseConfig.defaults,
    rows: 12,
    widgetName: "Textarea",
  },
};

export default Widget;
