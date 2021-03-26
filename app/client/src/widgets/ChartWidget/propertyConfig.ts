import { ChartWidgetProps } from "widgets/ChartWidget";

export default [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Adds a title to the chart",
        placeholderText: "Enter title",
        propertyName: "chartName",
        label: "Title",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
      },
      {
        helpText: "Changes the visualisation of the chart data",
        propertyName: "chartType",
        label: "Chart Type",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Line Chart",
            value: "LINE_CHART",
          },
          {
            label: "Bar Chart",
            value: "BAR_CHART",
          },
          {
            label: "Pie Chart",
            value: "PIE_CHART",
          },
          {
            label: "Column Chart",
            value: "COLUMN_CHART",
          },
          {
            label: "Area Chart",
            value: "AREA_CHART",
          },
          {
            label: "Custom Chart",
            value: "CUSTOM_FUSION_CHART",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
      },
      {
        propertyName: "isVisible",
        label: "Visible",
        helpText: "Controls the visibility of the widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
      },
    ],
  },
  {
    helpText:
      "Manually configure a FusionChart, see https://www.fusioncharts.com",
    propertyName: "customFusionChartConfig",
    placeholderText: `Enter {type: "bar2d","dataSource": {}}`,
    label: "Custom Fusion Chart Configuration",
    controlType: "CUSTOM_FUSION_CHARTS_DATA",
    isBindProperty: true,
    isTriggerProperty: false,
    hidden: (x: any) => x.chartType !== "CUSTOM_FUSION_CHART",
  },
  {
    sectionName: "Chart Data",
    hidden: (props: ChartWidgetProps) =>
      props.chartType === "CUSTOM_FUSION_CHART",
    children: [
      {
        helpText: "Populates the chart with the data",
        propertyName: "chartData",
        placeholderText: 'Enter [{ "x": "val", "y": "val" }]',
        label: "Chart Series",
        controlType: "CHART_DATA",

        isBindProperty: false,
        isTriggerProperty: false,
        children: [
          {
            helpText: "Series Name",
            propertyName: "seriesName",
            label: "Series Name",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Series data",
            propertyName: "data",
            label: "Series Data",
            controlType: "INPUT_TEXT_AREA",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
    ],
  },
  {
    sectionName: "Axis",
    hidden: (props: ChartWidgetProps) =>
      props.chartType === "CUSTOM_FUSION_CHART",
    children: [
      {
        helpText: "Specifies the label of the x-axis",
        propertyName: "xAxisName",
        placeholderText: "Enter label text",
        label: "x-axis Label",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
      },
      {
        helpText: "Specifies the label of the y-axis",
        propertyName: "yAxisName",
        placeholderText: "Enter label text",
        label: "y-axis Label",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
      },
      {
        helpText: "Enables scrolling inside the chart",
        propertyName: "allowHorizontalScroll",
        label: "Allow horizontal scroll",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (x: any) => x.chartType === "CUSTOM_FUSION_CHART",
      },
    ],
  },
  {
    sectionName: "Actions",
    children: [
      {
        helpText: "Triggers an action when the chart data point is clicked",
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
