import { DSLWidget } from "widgets/constants";
import { migrateChartWidgetReskinningData } from "./ChartWidgetReskinningMigrations";

const currentDslWithoutCustomConfig = {
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 4896,
  snapColumns: 64,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 1020,
  containerStyle: "none",
  snapRows: 125,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  version: 59,
  minHeight: 1292,
  dynamicTriggerPathList: [],
  parentColumnSpace: 1,
  dynamicBindingPathList: [],
  leftColumn: 0,
  children: [
    {
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      widgetName: "Chart1",
      allowScroll: false,
      displayName: "Chart",
      iconSVG: "/static/media/icon.6adbe31ed817fc4bfd66f9f0a6fc105c.svg",
      searchTags: ["graph", "visuals", "visualisations"],
      topRow: 13,
      bottomRow: 45,
      parentRowSpace: 10,
      type: "CHART_WIDGET",
      hideCard: false,
      chartData: {
        xbhibr5ak2: {
          seriesName: "Sales",
          data: [
            {
              x: "Product1",
              y: 20000,
            },
            {
              x: "Product2",
              y: 22000,
            },
            {
              x: "Product3",
              y: 32000,
            },
          ],
        },
      },
      animateLoading: true,
      parentColumnSpace: 28.875,
      leftColumn: 5,
      dynamicBindingPathList: [
        {
          key: "borderRadius",
        },
        {
          key: "boxShadow",
        },
      ],
      key: "echv58ig42",
      isDeprecated: false,
      rightColumn: 23,
      widgetId: "jl53hd277f",
      isVisible: true,
      version: 1,
      parentId: "0",
      labelOrientation: "auto",
      renderMode: "CANVAS",
      isLoading: false,
      yAxisName: "Revenue($)",
      chartName: "Sales Report",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      xAxisName: "Product Line",
      chartType: "COLUMN_CHART",
    },
  ],
};

const expectedDslWithoutCustomConfig = {
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 4896,
  snapColumns: 64,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 1020,
  containerStyle: "none",
  snapRows: 125,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  version: 59,
  minHeight: 1292,
  dynamicTriggerPathList: [],
  parentColumnSpace: 1,
  dynamicBindingPathList: [],
  leftColumn: 0,
  children: [
    {
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      widgetName: "Chart1",
      allowScroll: false,
      displayName: "Chart",
      iconSVG: "/static/media/icon.6adbe31ed817fc4bfd66f9f0a6fc105c.svg",
      searchTags: ["graph", "visuals", "visualisations"],
      topRow: 13,
      bottomRow: 45,
      parentRowSpace: 10,
      type: "CHART_WIDGET",
      hideCard: false,
      chartData: {
        xbhibr5ak2: {
          seriesName: "Sales",
          data: [
            {
              x: "Product1",
              y: 20000,
            },
            {
              x: "Product2",
              y: 22000,
            },
            {
              x: "Product3",
              y: 32000,
            },
          ],
        },
      },
      animateLoading: true,
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
      parentColumnSpace: 28.875,
      leftColumn: 5,
      dynamicBindingPathList: [
        {
          key: "borderRadius",
        },
        {
          key: "boxShadow",
        },
        {
          key: "accentColor",
        },
        {
          key: "fontFamily",
        },
      ],
      key: "echv58ig42",
      isDeprecated: false,
      rightColumn: 23,
      widgetId: "jl53hd277f",
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      isVisible: true,
      version: 1,
      parentId: "0",
      labelOrientation: "auto",
      renderMode: "CANVAS",
      isLoading: false,
      yAxisName: "Revenue($)",
      chartName: "Sales Report",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      xAxisName: "Product Line",
      chartType: "COLUMN_CHART",
    },
  ],
};

describe("Chart Widget Reskinning Migration - ", () => {
  it("should add accentColor and fontFamily properties with Dynamic values (without customFusionChartConfig)", () => {
    const migratedDsl = migrateChartWidgetReskinningData(
      (currentDslWithoutCustomConfig as unknown) as DSLWidget,
    );
    expect(migratedDsl).toEqual(expectedDslWithoutCustomConfig);
  });
});
