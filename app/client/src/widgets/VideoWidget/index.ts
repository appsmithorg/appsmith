import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Video",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["youtube"],
  defaults: {
    rows: 28,
    columns: 24,
    widgetName: "Video",
    url: getAssetUrl(`${ASSETS_CDN_URL}/widgets/bird.mp4`),
    autoPlay: false,
    version: 1,
    animateLoading: true,
    backgroundColor: "#000",
    responsiveBehavior: ResponsiveBehavior.Fill,
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
            minHeight: "300px",
          };
        },
      },
    ],
  },
};

export default Widget;
