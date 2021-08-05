import Widget from "./widget";
import IconSVG from "./icon.svg";
import moment from "moment";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Date Time Picker",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    label: "",
    dateFormat: "YYYY-MM-DD HH:mm",
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "DatePicker",
    defaultDate: moment().toISOString(),
    minDate: "2001-01-01 00:00",
    maxDate: "2041-12-31 23:59",
    version: 2,
    isRequired: false,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
