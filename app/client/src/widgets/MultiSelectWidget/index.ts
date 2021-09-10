import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    label: "",
    options: [
      { label: "Hashirama Senju", value: "First" },
      { label: "Tobirama Senju", value: "Second" },
      { label: "Hiruzen Sarutobi", value: "Third" },
      { label: "Minato Namikaze", value: "Fourth" },
      { label: "Tsunade Senju", value: "Fifth" },
      { label: "Kakashi Hatake", value: "Sixth" },
      { label: "Naruto Uzumaki", value: "Seventh" },
    ],
    widgetName: "MultiSelect",
    serverSideFiltering: false,
    defaultOptionValue: ["First", "Seventh"],
    version: 1,
    isRequired: false,
    isDisabled: false,
    placeholderText: "select option(s)",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
