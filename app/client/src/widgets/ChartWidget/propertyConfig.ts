import { ChartWidgetProps } from "widgets/ChartWidget";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { CUSTOM_CHART_TYPES } from "constants/CustomChartConstants";

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
        validation: { type: ValidationTypes.TEXT },
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
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              "LINE_CHART",
              "BAR_CHART",
              "PIE_CHART",
              "COLUMN_CHART",
              "AREA_CHART",
              "CUSTOM_FUSION_CHART",
            ],
          },
        },
      },
      {
        propertyName: "isVisible",
        label: "Visible",
        helpText: "Controls the visibility of the widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Chart Data",
    children: [
      {
        helpText:
          "Manually configure a FusionChart, see https://docs.appsmith.com/widget-reference/chart#custom-chart",
        placeholderText: `Enter {"type": "bar2d","dataSource": {}}`,
        propertyName: "customFusionChartConfig",
        label: "Custom Fusion Chart Configuration",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.OBJECT,
          params: {
            allowedKeys: [
              {
                type: ValidationTypes.TEXT,
                name: "type",
                params: {
                  allowedValues: CUSTOM_CHART_TYPES,
                  default: "",
                  required: true,
                },
              },
              {
                type: ValidationTypes.OBJECT,
                name: "dataSource",
                params: {
                  allowedKeys: [
                    {
                      name: "chart",
                      type: ValidationTypes.OBJECT,
                      params: {
                        default: {},
                      },
                    },
                    {
                      name: "data",
                      type: ValidationTypes.ARRAY,
                      params: {
                        default: [],
                        children: {
                          type: ValidationTypes.OBJECT,
                          params: {
                            allowedKeys: [
                              {
                                name: "label",
                                type: ValidationTypes.TEXT,
                              },
                              {
                                name: "value",
                                type: ValidationTypes.NUMBER,
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        hidden: (props: ChartWidgetProps) =>
          props.chartType !== "CUSTOM_FUSION_CHART",
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        helpText: "Populates the chart with the data",
        propertyName: "chartData",
        placeholderText: 'Enter [{ "x": "val", "y": "val" }]',
        label: "Chart Series",
        controlType: "CHART_DATA",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: ChartWidgetProps) =>
          props.chartType === "CUSTOM_FUSION_CHART",
        children: [
          {
            helpText: "Series Name",
            propertyName: "seriesName",
            label: "Series Name",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Series data",
            propertyName: "data",
            label: "Series Data",
            controlType: "INPUT_TEXT_AREA",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              children: {
                type: ValidationTypes.OBJECT,
                params: {
                  allowedKeys: [
                    {
                      name: "x",
                      type: ValidationTypes.TEXT,
                    },
                    {
                      name: "y",
                      type: ValidationTypes.NUMBER,
                    },
                  ],
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
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
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Specifies the label of the y-axis",
        propertyName: "yAxisName",
        placeholderText: "Enter label text",
        label: "y-axis Label",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
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
      {
        propertyName: "setAdaptiveYMin",
        label: "Y-axis Minimum",
        helpText: "Define the minimum scale for Y axis",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: { default: 0 },
        },
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
