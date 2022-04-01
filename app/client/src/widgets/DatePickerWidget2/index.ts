import moment from "moment";
import { TimePrecision } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "DatePicker",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 4,
    label: "",
    dateFormat: "YYYY-MM-DD HH:mm",
    columns: 20,
    widgetName: "DatePicker",
    defaultDate: moment().toISOString(),
    minDate: "1920-12-31T18:30:00.000Z",
    maxDate: "2121-12-31T18:29:00.000Z",
    version: 2,
    isRequired: false,
    closeOnSelection: true,
    shortcuts: false,
    firstDayOfWeek: 0,
    timePrecision: TimePrecision.MINUTE,
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
