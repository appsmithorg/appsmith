import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Image",
  iconSVG: IconSVG,
  defaults: {
    defaultImage: getAssetUrl(`${ASSETS_CDN_URL}/widgets/default.png`),
    imageShape: "RECTANGLE",
    maxZoomLevel: 1,
    enableRotation: false,
    enableDownload: false,
    objectFit: "cover",
    image: "",
    rows: 12,
    columns: 12,
    widgetName: "Image",
    version: 1,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    setterConfig: Widget.getSetterConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
  },
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "280px",
            minHeight: "40px",
          };
        },
      },
    ],
  },
};

export default Widget;
