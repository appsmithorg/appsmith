import { LabelOrientation } from "../constants";
import type { ChartWidgetProps } from ".";
import type { ChartData } from "../constants";
import type { WidgetError } from "widgets/BaseWidget";
import { syntaxErrorsFromProps } from "./SyntaxErrorsEvaluation";
import { RenderModes } from "constants/WidgetConstants";

describe("SyntaxErrorsEvaluation", () => {
  const seriesData1: ChartData = {
    seriesName: "series1",
    data: [{ x: "x1", y: 1 }],
    color: "series1color",
  };
  const seriesData2: ChartData = {
    seriesName: "series2",
    data: [{ x: "x1", y: 2 }],
    color: "series2color",
  };
  const defaultProps: ChartWidgetProps = {
    allowScroll: true,
    chartData: {
      seriesID1: seriesData1,
      seriesID2: seriesData2,
    },
    showDataPointLabel: true,
    chartName: "chart name",
    type: "CHART_WIDGET",
    chartType: "AREA_CHART",
    customEChartConfig: {},
    customFusionChartConfig: { type: "type", dataSource: undefined },
    hasOnDataPointClick: true,
    isVisible: true,
    isLoading: false,
    setAdaptiveYMin: false,
    labelOrientation: LabelOrientation.AUTO,
    onDataPointClick: "",
    widgetId: "widgetID",
    xAxisName: "xaxisname",
    yAxisName: "yaxisname",
    borderRadius: "1",
    boxShadow: "1",
    primaryColor: "primarycolor",
    fontFamily: "fontfamily",
    dimensions: { componentWidth: 11, componentHeight: 11 },
    parentColumnSpace: 1,
    parentRowSpace: 1,
    topRow: 0,
    bottomRow: 0,
    leftColumn: 0,
    rightColumn: 0,
    widgetName: "widgetName",
    version: 1,
    renderMode: RenderModes.CANVAS,
  };

  it("returns zero errors when errors field is undefined", () => {
    const props = JSON.parse(JSON.stringify(defaultProps));

    props.errors = undefined;

    const syntaxErrors = syntaxErrorsFromProps(props);

    expect(syntaxErrors.length).toEqual(0);
  });

  it("returns zero errors when errors field is null", () => {
    const props = JSON.parse(JSON.stringify(defaultProps));

    props.errors = null;

    const syntaxErrors = syntaxErrorsFromProps(props);

    expect(syntaxErrors.length).toEqual(0);
  });

  describe("when errors are present in non data fields", () => {
    const props = JSON.parse(JSON.stringify(defaultProps));

    it("returns errors when chart type is basic echarts", () => {
      props.chartType = "LINE_CHART";

      const nonDataFieldPropertyPath = "accentColor";
      const widgetError: WidgetError = {
        type: "property",
        path: nonDataFieldPropertyPath,
        name: "ErrorName",
        message: "ErrorMessage",
      };

      props.errors = [widgetError];
      const syntaxErrors = syntaxErrorsFromProps(props);

      expect(syntaxErrors.length).toEqual(1);
      expect(syntaxErrors[0].name).toEqual("ErrorName");
    });

    it("returns errors when chart type is custom fusion charts", () => {
      props.chartType = "CUSTOM_FUSION_CHART";

      const nonDataFieldPropertyPath = "accentColor";
      const widgetError: WidgetError = {
        type: "property",
        path: nonDataFieldPropertyPath,
        name: "ErrorName",
        message: "ErrorMessage",
      };

      props.errors = [widgetError];
      const syntaxErrors = syntaxErrorsFromProps(props);

      expect(syntaxErrors.length).toEqual(1);
      expect(syntaxErrors[0].name).toEqual("ErrorName");
    });

    it("returns errors when chart type is basic echarts", () => {
      props.chartType = "CUSTOM_ECHART";

      const nonDataFieldPropertyPath = "accentColor";
      const widgetError: WidgetError = {
        type: "property",
        path: nonDataFieldPropertyPath,
        name: "ErrorName",
        message: "ErrorMessage",
      };

      props.errors = [widgetError];
      const syntaxErrors = syntaxErrorsFromProps(props);

      expect(syntaxErrors.length).toEqual(1);
      expect(syntaxErrors[0].name).toEqual("ErrorName");
    });
  });

  describe("when errors are present in data fields", () => {
    describe("When chart type is Custom Fusion Charts", () => {
      const customFusionChartProps = JSON.parse(JSON.stringify(defaultProps));

      customFusionChartProps.chartType = "CUSTOM_FUSION_CHART";

      it("returns errors when errors are present in customFusionCharts", () => {
        const props = JSON.parse(JSON.stringify(customFusionChartProps));
        const customFusionChartDataFieldPropertyPath =
          "customFusionChartConfig";

        const widgetError: WidgetError = {
          type: "property",
          path: customFusionChartDataFieldPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(1);
        expect(syntaxErrors[0].name).toEqual("ErrorName");
      });

      it("doesn't return errors when errors are present in basic echarts data field", () => {
        const props = JSON.parse(JSON.stringify(customFusionChartProps));
        const basicEChartsDataFieldPropertyPath = "chartData";

        const widgetError: WidgetError = {
          type: "property",
          path: basicEChartsDataFieldPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(0);
      });

      it("doesn't return errors when errors are present in custom echarts data field", () => {
        const props = JSON.parse(JSON.stringify(customFusionChartProps));
        const customEChartsDataFieldPropertyPath = "customEChartConfig";

        const widgetError: WidgetError = {
          type: "property",
          path: customEChartsDataFieldPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(0);
      });
    });

    describe("When chart type is basic ECharts", () => {
      const basicEChartsProps = JSON.parse(JSON.stringify(defaultProps));

      basicEChartsProps.chartType = "LINE_CHART";

      it("returns errors when errors are present in chart data field", () => {
        const props = JSON.parse(JSON.stringify(basicEChartsProps));
        const echartDataPropertyPath = "chartData";

        const widgetError: WidgetError = {
          type: "property",
          path: echartDataPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(1);
        expect(syntaxErrors[0].name).toEqual("ErrorName");
      });

      it("doesn't return errors when errors are present in custom fusion chart", () => {
        const props = JSON.parse(JSON.stringify(basicEChartsProps));
        const customFusionChartDataPropertyPath = "customFusionChartConfig";

        const widgetError: WidgetError = {
          type: "property",
          path: customFusionChartDataPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(0);
      });

      it("doesn't return errors when errors are present in custom echarts", () => {
        const props = JSON.parse(JSON.stringify(basicEChartsProps));
        const customEChartsDataPropertyPath = "customEChartConfig";

        const widgetError: WidgetError = {
          type: "property",
          path: customEChartsDataPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(0);
      });

      describe("when chart type is PIE CHART", () => {
        const pieChartProps = JSON.parse(JSON.stringify(basicEChartsProps));

        pieChartProps.chartType = "PIE_CHART";

        it("returns error if there is syntax error in first series data", () => {
          const props = JSON.parse(JSON.stringify(pieChartProps));
          const firstSeriesDataPath = "chartData.seriesID1.data";

          const widgetError: WidgetError = {
            type: "property",
            path: firstSeriesDataPath,
            name: "ErrorName",
            message: "ErrorMessage",
          };

          props.errors = [widgetError];

          const syntaxErrors = syntaxErrorsFromProps(props);

          expect(syntaxErrors.length).toEqual(1);
          expect(syntaxErrors[0].name).toEqual("ErrorName");
        });

        it("doesn't return an error if there is syntax error in second series data", () => {
          const props = JSON.parse(JSON.stringify(pieChartProps));
          const secondSeriesDataPath = "chartData.seriesID2.data";

          const widgetError: WidgetError = {
            type: "property",
            path: secondSeriesDataPath,
            name: "ErrorName",
            message: "ErrorMessage",
          };

          props.errors = [widgetError];

          const syntaxErrors = syntaxErrorsFromProps(props);

          expect(syntaxErrors.length).toEqual(0);
        });
      });
    });

    describe("When chart type is custom ECharts", () => {
      const customEChartsProps = JSON.parse(JSON.stringify(defaultProps));

      customEChartsProps.chartType = "CUSTOM_ECHART";

      it("returns errors when errors are present in custom Echart config field", () => {
        const props = JSON.parse(JSON.stringify(customEChartsProps));
        const customEChartDataPropertyPath = "customEChartConfig";

        const widgetError: WidgetError = {
          type: "property",
          path: customEChartDataPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(1);
        expect(syntaxErrors[0].name).toEqual("ErrorName");
      });

      it("doesn't return errors when errors are present in custom fusion chart", () => {
        const props = JSON.parse(JSON.stringify(customEChartsProps));
        const customFusionChartDataPropertyPath = "customFusionChartConfig";

        const widgetError: WidgetError = {
          type: "property",
          path: customFusionChartDataPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(0);
      });

      it("doesn't return errors when errors are present in basic echarts data field", () => {
        const props = JSON.parse(JSON.stringify(customEChartsProps));
        const basicEChartsDataFieldPropertyPath = "chartData";

        const widgetError: WidgetError = {
          type: "property",
          path: basicEChartsDataFieldPropertyPath,
          name: "ErrorName",
          message: "ErrorMessage",
        };

        props.errors = [widgetError];

        const syntaxErrors = syntaxErrorsFromProps(props);

        expect(syntaxErrors.length).toEqual(0);
      });
    });
  });
});
