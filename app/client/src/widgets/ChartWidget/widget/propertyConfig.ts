import { ChartWidgetProps } from "widgets/ChartWidget/widget";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { CUSTOM_CHART_TYPES, LabelOrientation } from "../constants";
import { isLabelOrientationApplicableFor } from "../component";

export default [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Adds a title to the chart",
        placeholderText: "Sales Report",
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
        helpText: "Configure a Custom FusionChart see docs.appsmith.com",
        placeholderText: `Fusion Chart Config`,
        propertyName: "customFusionChartConfig",
        label: "Custom Fusion Chart",
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
                        allowedKeys: [
                          {
                            name: "paletteColors",
                            type: ValidationTypes.TEXT,
                            params: {
                              strict: true,
                              ignoreCase: true,
                            },
                          },
                        ],
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
        dependencies: ["chartType"],
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        helpText: "Populates the chart with the data",
        propertyName: "chartData",
        placeholderText: '[{ "x": "2021", "y": "94000" }]',
        label: "Chart Series",
        controlType: "CHART_DATA",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: ChartWidgetProps) =>
          props.chartType === "CUSTOM_FUSION_CHART",
        dependencies: ["chartType"],
        children: [
          {
            helpText: "Series data",
            propertyName: "data",
            label: "Series Data",
            controlType: "INPUT_TEXT_AREA",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "x",
                        type: ValidationTypes.TEXT,
                        params: {
                          required: true,
                          default: "",
                        },
                      },
                      {
                        name: "y",
                        type: ValidationTypes.NUMBER,
                        params: {
                          required: true,
                          default: 10,
                        },
                      },
                    ],
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Series Name",
            propertyName: "seriesName",
            label: "Series Name",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
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
      {
        propertyName: "animateLoading",
        label: "Animate Loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Enables scrolling inside the chart",
        propertyName: "allowScroll",
        label: "Allow scroll",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (x: ChartWidgetProps) =>
          x.chartType === "CUSTOM_FUSION_CHART" || x.chartType === "PIE_CHART",
        dependencies: ["chartType"],
      },
    ],
  },
  {
    sectionName: "Axis",
    children: [
      {
        helpText: "Specifies the label of the x-axis",
        propertyName: "xAxisName",
        placeholderText: "Dates",
        label: "x-axis Label",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (x: any) => x.chartType === "CUSTOM_FUSION_CHART",
        dependencies: ["chartType"],
      },
      {
        helpText: "Specifies the label of the y-axis",
        propertyName: "yAxisName",
        placeholderText: "Revenue",
        label: "y-axis Label",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (x: any) => x.chartType === "CUSTOM_FUSION_CHART",
        dependencies: ["chartType"],
      },
      {
        helpText: "Changes the x-axis label orientation",
        propertyName: "labelOrientation",
        label: "x-axis Label Orientation",
        hidden: (x: ChartWidgetProps) =>
          !isLabelOrientationApplicableFor(x.chartType),
        isBindProperty: false,
        isTriggerProperty: false,
        dependencies: ["chartType"],
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Auto",
            value: LabelOrientation.AUTO,
          },
          {
            label: "Slant",
            value: LabelOrientation.SLANT,
          },
          {
            label: "Rotate",
            value: LabelOrientation.ROTATE,
          },
          {
            label: "Stagger",
            value: LabelOrientation.STAGGER,
          },
        ],
      },
      {
        propertyName: "setAdaptiveYMin",
        label: "Adaptive Axis",
        helpText: "Define the minimum scale for X/Y axis",
        controlType: "SWITCH",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Events",
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
