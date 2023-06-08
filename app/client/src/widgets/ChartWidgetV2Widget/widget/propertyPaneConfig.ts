import { ValidationTypes } from "constants/WidgetValidation";
import type { ChartWidgetV2WidgetProps } from ".";
import type { PropertyHookUpdates } from "constants/PropertyControlConstants";
import type { ChartType } from "../constants";
import { DefaultChartConfigs } from "../constants";

const chartTypeUpdateHook = (
  props: ChartWidgetV2WidgetProps,
  propertyPath: string,
  propertyValue: ChartType,
) => {
  console.log("***", "chart type is updated", propertyPath);
  const updates: PropertyHookUpdates[] = [
    { propertyPath, propertyValue },
    {
      propertyPath: "chartConfig",
      propertyValue: DefaultChartConfigs[propertyValue],
    },
  ];

  return updates;
};

export const propertyPaneConfig = [
  {
    sectionName: "Data",
    children: [
      {
        helpText: "Changes the visualisation of the chart data",
        propertyName: "chartType",
        label: "Chart type",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Line chart",
            value: "LINE_CHART",
          },
          {
            label: "Bar chart",
            value: "BAR_CHART",
          },
          {
            label: "Pie chart",
            value: "PIE_CHART",
          },
          {
            label: "Column chart",
            value: "COLUMN_CHART",
          },
          {
            label: "Area chart",
            value: "AREA_CHART",
          },
          {
            label: "Custom chart",
            value: "CUSTOM_ECHARTS_CHART",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        updateHook: chartTypeUpdateHook,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              "LINE_CHART",
              "BAR_CHART",
              "PIE_CHART",
              "COLUMN_CHART",
              "AREA_CHART",
              "CUSTOM_ECHARTS_CHART",
            ],
          },
        },
      },
      {
        helpText: "Populates the chart with the data",
        propertyName: "chartData",
        placeholderText: "Dataset for the chart",
        label: "Chart dataset",
        controlType: "CODE_EDITOR",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: ChartWidgetV2WidgetProps) =>
          props.chartType === "CUSTOM_ECHARTS_CHART",
        dependencies: ["chartType"],
        validation: { type: ValidationTypes.OBJECT },
      },
      {
        helpText: "Configuration for the chart",
        propertyName: "chartConfig",
        placeholderText: `Configuration for the chart`,
        label: "Chart configuration",
        controlType: "CODE_EDITOR",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: ChartWidgetV2WidgetProps) =>
          props.chartType === "CUSTOM_ECHARTS_CHART",
        dependencies: ["chartType"],
        validation: { type: ValidationTypes.OBJECT },
      },
      {
        helpText: "Creates an EChart with custom options",
        propertyName: "customChartData",
        placeholderText: "Custom EChart Options",
        label: "Custom Chart Data",
        controlType: "CODE_EDITOR",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: ChartWidgetV2WidgetProps) =>
          props.chartType !== "CUSTOM_ECHARTS_CHART",
        dependencies: ["chartType"],
        validation: { type: ValidationTypes.OBJECT },
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "when the chart data point is clicked",
        propertyName: "onDataPointClick",
        label: "onDataPointClick",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];

export const styleConfig = [
  {
    sectionName: "Border and shadow",
    children: [
      {
        propertyName: "borderRadius",
        label: "Border radius",
        helpText: "Rounds the corners of the icon button's outer border edge",
        controlType: "BORDER_RADIUS_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "boxShadow",
        label: "Box shadow",
        helpText:
          "Enables you to cast a drop shadow from the frame of the widget",
        controlType: "BOX_SHADOW_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
];
