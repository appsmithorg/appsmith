import Widget from "./widget";
import IconSVG from "./icon.svg";
import FileDataTypes from "./widget/FileDataTypes";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "FilePicker",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    files: [],
    selectedFiles: [],
    defaultSelectedFiles: [],
    allowedFileTypes: [],
    label: "Select Files",
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    maxNumFiles: 1,
    maxFileSize: 5,
    fileDataType: FileDataTypes.Base64,
    widgetName: "FilePicker",
    isDefaultClickDisabled: true,
    version: 1,
    isRequired: false,
    isDisabled: false,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
