import Widget from "./widget";
import IconSVG from "./icon.svg";
import moment from "moment";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "DatePicker",
  iconSVG: IconSVG,
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 1,
    label: "",
    dateFormat: "DD/MM/YYYY HH:mm",
    columns: 5,
    widgetName: "DatePicker",
    defaultDate: moment().format("DD/MM/YYYY HH:mm"),
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
