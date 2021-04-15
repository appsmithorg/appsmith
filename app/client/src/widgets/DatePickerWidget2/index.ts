import Widget from "./widget";
import IconSVG from "./icon.svg";
import moment from "moment";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Date Time Picker",
  iconSVG: IconSVG,
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 1,
    label: "",
    dateFormat: "DD/MM/YYYY HH:mm",
    columns: 5,
    widgetName: "DatePicker",
    defaultDate: moment().toISOString(),
    version: 2,
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
