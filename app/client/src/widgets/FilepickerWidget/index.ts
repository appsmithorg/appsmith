import Widget from "./widget";
import IconSVG from "./icon.svg";
import FileDataTypes from "./widget/FileDataTypes";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Filepicker",
  iconSVG: IconSVG,
  defaults: {
    rows: 1,
    files: [],
    label: "Select Files",
    columns: 4,
    maxNumFiles: 1,
    maxFileSize: 5,
    fileDataType: FileDataTypes.Base64,
    widgetName: "FilePicker",
    isDefaultClickDisabled: true,
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
