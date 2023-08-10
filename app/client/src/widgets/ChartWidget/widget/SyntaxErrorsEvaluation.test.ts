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
    chartName: "chart name",
    type: "CHART_WIDGET",
    chartType: "AREA_CHART",
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

  describe("when errors are present in non data fields", () => {
    const props = JSON.parse(JSON.stringify(defaultProps));

    it("returns errors", () => {
      const widgetError1: WidgetError = {
        type: "property",
        path: "accentColor",
        name: "ErrorName",
        message: "ErrorMessage",
      };
      props.errors = [widgetError1];
      const syntaxErrors = syntaxErrorsFromProps(props);
      expect(syntaxErrors.length).toEqual(1);
      expect(syntaxErrors[0].name).toEqual("ErrorName");
    });
  });

  describe("when errors are absent in non data fields", () => {
    describe("When chart type is Custom Fusion Charts", () => {
      it("returns errors when errors are presnt in customFusionCharts", () => {
        const props = JSON.parse(JSON.stringify(defaultProps));

        const widgetError1: WidgetError = {
          type: "property",
          path: "customFusionChartConfig",
          name: "ErrorName",
          message: "ErrorMessage",
        };
        props.errors = [widgetError1];
        props.chartType = "CUSTOM_FUSION_CHART";

        const syntaxErrors = syntaxErrorsFromProps(props);
        expect(syntaxErrors.length).toEqual(1);
        expect(syntaxErrors[0].name).toEqual("ErrorName");
      });

      it("doesn't return errors when errors are not present in customFusionCharts", () => {
        const props = JSON.parse(JSON.stringify(defaultProps));

        const widgetError1: WidgetError = {
          type: "property",
          path: "chartData",
          name: "ErrorName",
          message: "ErrorMessage",
        };
        props.errors = [widgetError1];
        props.chartType = "CUSTOM_FUSION_CHART";

        const syntaxErrors = syntaxErrorsFromProps(props);
        expect(syntaxErrors.length).toEqual(0);
      });
    });

    describe("When chart type is not Custom Fusion Charts", () => {
      it("returns errors when errors are presnt in chart data field", () => {
        const props = JSON.parse(JSON.stringify(defaultProps));

        const widgetError1: WidgetError = {
          type: "property",
          path: "chartData",
          name: "ErrorName",
          message: "ErrorMessage",
        };
        props.errors = [widgetError1];
        props.chartType = "LINE_CHART";

        const syntaxErrors = syntaxErrorsFromProps(props);
        expect(syntaxErrors.length).toEqual(1);
        expect(syntaxErrors[0].name).toEqual("ErrorName");
      });

      it("doesn't return errors when errors are not present in chart data field", () => {
        const props = JSON.parse(JSON.stringify(defaultProps));

        const widgetError1: WidgetError = {
          type: "property",
          path: "customFusionChartConfig",
          name: "ErrorName",
          message: "ErrorMessage",
        };
        props.errors = [widgetError1];
        props.chartType = "LINE_CHART";

        const syntaxErrors = syntaxErrorsFromProps(props);
        expect(syntaxErrors.length).toEqual(0);
      });

      describe("when chart type is PIE CHART", () => {
        it("returns error if there is syntax error in first series data", () => {
          const props = JSON.parse(JSON.stringify(defaultProps));

          const widgetError1: WidgetError = {
            type: "property",
            path: "chartData.seriesID1.data",
            name: "ErrorName",
            message: "ErrorMessage",
          };
          props.errors = [widgetError1];
          props.chartType = "PIE_CHART";

          const syntaxErrors = syntaxErrorsFromProps(props);
          expect(syntaxErrors.length).toEqual(1);
          expect(syntaxErrors[0].name).toEqual("ErrorName");
        });

        it("doesn't return an error if there is syntax error in second series data", () => {
          const props = JSON.parse(JSON.stringify(defaultProps));

          const widgetError1: WidgetError = {
            type: "property",
            path: "chartData.seriesID2.data",
            name: "ErrorName",
            message: "ErrorMessage",
          };
          props.errors = [widgetError1];
          props.chartType = "PIE_CHART";

          const syntaxErrors = syntaxErrorsFromProps(props);
          expect(syntaxErrors.length).toEqual(0);
        });
      });
    });
  });
});
