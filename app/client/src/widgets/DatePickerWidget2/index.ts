import Widget from "./widget";
import IconSVG from "./icon.svg";
import moment from "moment";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "DatePicker",
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
    minDate: "1920-12-31T18:30:00.000Z",
    maxDate: "2121-12-31T18:29:00.000Z",
    version: 2,
    isRequired: false,
    closeOnSelection: false,
    shortcuts: false,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
