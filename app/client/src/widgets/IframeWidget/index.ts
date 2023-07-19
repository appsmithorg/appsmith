import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import type { PropertyValueMap } from "widgets/constants";

const isAirgappedInstance = isAirgapped();

const DEFAULT_IFRAME_SOURCE = !isAirgappedInstance
  ? "https://www.example.com"
  : "";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Iframe",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["embed"],
  defaults: {
    source: DEFAULT_IFRAME_SOURCE,
    borderOpacity: 100,
    borderWidth: 1,
    rows: 32,
    columns: 24,
    widgetName: "Iframe",
    version: 1,
    animateLoading: true,
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
  methods: {
    getSnipingModeConfig: (propValueMap: PropertyValueMap) => {
      return [
        {
          propertyPath: "source",
          propertyValue: propValueMap.data,
        },
      ];
    },
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
