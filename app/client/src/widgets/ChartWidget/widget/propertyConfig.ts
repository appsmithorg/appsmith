import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";
import type { ChartWidgetProps } from "widgets/ChartWidget/widget";
import {
  CUSTOM_CHART_TYPES,
  LabelOrientation,
  LABEL_ORIENTATION_COMPATIBLE_CHARTS,
} from "../constants";
import type { WidgetProps } from "widgets/BaseWidget";

export const isLabelOrientationApplicableFor = (chartType: string) =>
  LABEL_ORIENTATION_COMPATIBLE_CHARTS.includes(chartType);

const labelOptions = () => {
  const options = [
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
      label: "Custom EChart",
      value: "CUSTOM_ECHART",
    },
    {
      label: "Custom Fusion Charts (deprecated)",
      value: "CUSTOM_FUSION_CHART",
    },
  ];

  return options;
};

export const contentConfig = () => {
  return [
    {
      sectionName: "Data",
      children: [
        {
          helpText: "Changes the visualisation of the chart data",
          propertyName: "chartType",
          label: "Chart type",
          controlType: "DROP_DOWN",
          options: labelOptions(),
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
                "CUSTOM_ECHART",
                "CUSTOM_FUSION_CHART",
              ],
            },
          },
        },
        {
          helpText: "Configure a custom ECHART see docs.appsmith.com",
          placeholderText: `Custom ECharts Configuration`,
          propertyName: "customEChartConfig",
          label: "Custom ECharts Configuration",
          controlType: "WRAPPED_CODE_EDITOR",
          controlConfig: {
            wrapperCode: {
              prefix: "{{ ((chartType) => ( ",
              suffix: (widget: WidgetProps) =>
                `))(${widget.widgetName}.chartType) }}`,
            },
          },
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.OBJECT_WITH_FUNCTION,
            params: {
              default: {},
            },
          },
          hidden: (props: ChartWidgetProps) =>
            props.chartType !== "CUSTOM_ECHART",
          dependencies: ["chartType"],
        },
        {
          helpText: "Configure a custom FusionChart see docs.appsmith.com",
          placeholderText: `Fusion Chart Config`,
          propertyName: "customFusionChartConfig",
          label: "Custom fusion chart",
          controlType: "INPUT_TEXT",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.OBJECT,
            params: {
              default: {},
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
                    required: true,
                    ignoreCase: false,
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
          evaluationSubstitutionType:
            EvaluationSubstitutionType.SMART_SUBSTITUTE,
        },
        {
          helpText: "Populates the chart with the data",
          propertyName: "chartData",
          placeholderText: '[{ "x": "2021", "y": "94000" }]',
          label: "Chart series",
          controlType: "CHART_DATA",
          isBindProperty: false,
          isTriggerProperty: false,
          hidden: (props: ChartWidgetProps) =>
            ["CUSTOM_FUSION_CHART", "CUSTOM_ECHART"].includes(props.chartType),
          dependencies: ["chartType"],
          children: [
            {
              helpText: "Series data",
              propertyName: "data",
              label: "Series data",
              controlType: "INPUT_TEXT_AREA",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.ARRAY,
                params: {
                  default: [],
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
              helpText: "Series name",
              propertyName: "seriesName",
              label: "Series name",
              controlType: "INPUT_TEXT",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.TEXT },
            },
          ],
        },
      ],
    },
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
          hidden: (props: ChartWidgetProps) =>
            ["CUSTOM_ECHART"].includes(props.chartType),
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
          label: "Animate loading",
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
          hidden: (props: ChartWidgetProps) =>
            ["CUSTOM_FUSION_CHART", "PIE_CHART", "CUSTOM_ECHART"].includes(
              props.chartType,
            ),
          dependencies: ["chartType"],
        },
        {
          helpText: "Hides/Display data point labels on series data",
          propertyName: "showDataPointLabel",
          label: "Show Labels",
          controlType: "SWITCH",
          isBindProperty: false,
          isTriggerProperty: false,
          hidden: (props: ChartWidgetProps) =>
            ["CUSTOM_FUSION_CHART", "CUSTOM_ECHART"].includes(props.chartType),
          dependencies: ["chartType"],
        },
      ],
    },
    {
      sectionName: "Axis",
      children: [
        {
          propertyName: "setAdaptiveYMin",
          label: "Adaptive axis",
          helpText: "Define the minimum scale for X/Y axis",
          controlType: "SWITCH",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hidden: (props: any) => props.chartType == "CUSTOM_ECHART",
        },
        {
          helpText: "Specifies the label of the x-axis",
          propertyName: "xAxisName",
          placeholderText: "Dates",
          label: "x-axis label",
          controlType: "INPUT_TEXT",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hidden: (props: any) =>
            ["CUSTOM_FUSION_CHART", "CUSTOM_ECHART"].includes(props.chartType),
          dependencies: ["chartType"],
        },
        {
          helpText: "Specifies the label of the y-axis",
          propertyName: "yAxisName",
          placeholderText: "Revenue",
          label: "y-axis label",
          controlType: "INPUT_TEXT",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hidden: (props: any) =>
            ["CUSTOM_FUSION_CHART", "CUSTOM_ECHART"].includes(props.chartType),
          dependencies: ["chartType"],
        },
        {
          helpText: "Changes the x-axis label orientation",
          propertyName: "labelOrientation",
          label: "x-axis label orientation",
          hidden: (props: ChartWidgetProps) =>
            !isLabelOrientationApplicableFor(props.chartType),
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
          ],
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
};

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
