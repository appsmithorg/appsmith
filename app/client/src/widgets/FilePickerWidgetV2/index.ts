import { BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";

import FileDataTypes from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "FilePicker",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["upload"],
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
    dynamicTyping: true,
    widgetName: "FilePicker",
    isDefaultClickDisabled: true,
    version: 1,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Hug,
    minWidth: BUTTON_MIN_WIDTH,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
  autoLayout: {
    defaults: {
      rows: 4,
      columns: 6.632,
    },
    autoDimension: {
      width: true,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "120px",
            maxWidth: "360px",
          };
        },
      },
    ],
    disableResizeHandles: {
      horizontal: true,
      vertical: true,
    },
  },
};

export default Widget;
