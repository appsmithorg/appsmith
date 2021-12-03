import Widget from "./widget";
import IconSVG from "./icon.svg";
import moment from "moment";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "DatePicker",
  iconSVG: IconSVG,
  hideCard: true,
  needsMeta: true,
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    label: "",
    dateFormat: "YYYY-MM-DD HH:mm",
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "DatePicker",
    defaultDate: moment().format("YYYY-MM-DD HH:mm"),
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
