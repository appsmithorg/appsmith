import moment from "moment";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "DatePicker",
  iconSVG: IconSVG,
  hideCard: true,
  needsMeta: true,
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 4,
    label: "",
    dateFormat: "YYYY-MM-DD HH:mm",
    columns: 20,
    widgetName: "DatePicker",
    defaultDate: moment().format("YYYY-MM-DD HH:mm"),
    version: 1,
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
