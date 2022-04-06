import FileDataTypes from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "FilePicker",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    files: [],
    selectedFiles: [],
    allowedFileTypes: [],
    label: "Select Files",
    columns: 16,
    maxNumFiles: 1,
    maxFileSize: 5,
    fileDataType: FileDataTypes.Base64,
    widgetName: "FilePicker",
    isDefaultClickDisabled: true,
    version: 1,
    isRequired: false,
    isDisabled: false,
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
