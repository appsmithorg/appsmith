import { ResponsiveBehavior } from "layoutSystems/autolayout/utils/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import type { SnipingModeProperty, PropertyUpdates } from "widgets/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

const isAirgappedInstance = isAirgapped();

const DEFAULT_IFRAME_SOURCE = !isAirgappedInstance
  ? "https://www.example.com"
  : "";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Iframe",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.DISPLAY],
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
    getSnipingModeUpdates: (
      propValueMap: SnipingModeProperty,
    ): PropertyUpdates[] => {
      return [
        {
          propertyPath: "source",
          propertyValue: propValueMap.data,
          isDynamicPropertyPath: true,
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
