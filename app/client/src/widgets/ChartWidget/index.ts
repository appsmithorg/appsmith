import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/anvil/utils/constants";
import { generateReactKey } from "widgets/WidgetUtils";
import {
  DefaultEChartConfig,
  DefaultEChartsBasicChartsData,
  DefaultFusionChartConfig,
  LabelOrientation,
} from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { WIDGET_TAGS } from "constants/WidgetConstants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Chart",
  iconSVG: IconSVG,
  tags: [WIDGET_TAGS.DISPLAY],
  needsMeta: true,
  searchTags: ["graph", "visuals", "visualisations"],
  defaults: {
    rows: 32,
    columns: 24,
    widgetName: "Chart",
    chartType: "COLUMN_CHART",
    chartName: "Sales Report",
    allowScroll: false,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
    showDataPointLabel: false,
    customEChartConfig: `{{\n${JSON.stringify(
      DefaultEChartConfig,
      null,
      2,
    )}\n}}`,
    chartData: {
      [generateReactKey()]: DefaultEChartsBasicChartsData,
    },
    xAxisName: "Product Line",
    yAxisName: "Revenue($)",
    labelOrientation: LabelOrientation.AUTO,
    customFusionChartConfig: DefaultFusionChartConfig,

    /**
     * TODO, @sbalaji92
     * need to remove this once widget properties get added to dynamic binding path list
     * in WidgetAdditionSagas/dynamicBindingPathList function
     * */
    dynamicBindingPathList: [{ key: "customEChartConfig" }],
  },

  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
  },
  methods: {
    getEditorCallouts: Widget.editorCallouts,
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
