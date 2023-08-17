import { Colors } from "constants/Colors";
import type { ChartComponentProps } from ".";
import type { ChartData } from "../constants";
import { LabelOrientation } from "../constants";
import { EChartsConfigurationBuilder } from "./EChartsConfigurationBuilder";

describe("EChartsConfigurationBuilder", () => {
  const builder = new EChartsConfigurationBuilder();

  const dataZoomConfig = [
    {
      filterMode: "filter",
      bottom: "50",
      start: "20",
      type: "slider",
    },
  ];

  const chartData1: ChartData = {
    seriesName: "series1",
    data: [{ x: "x1", y: "y1" }],
    color: "series1color",
  };
  const chartData2: ChartData = {
    seriesName: "series2",
    data: [{ x: "x1", y: "y1" }],
    color: "series2color",
  };

  const chartData = { seriesID1: chartData1, seriesID2: chartData2 };

  const defaultProps: ChartComponentProps = {
    allowScroll: false,
    showDataPointLabel: true,
    chartData: chartData,
    chartName: "chart name",
    chartType: "LINE_CHART",
    customFusionChartConfig: { type: "type", dataSource: undefined },
    hasOnDataPointClick: false,
    isVisible: true,
    isLoading: false,
    setAdaptiveYMin: false,
    labelOrientation: LabelOrientation.AUTO,
    onDataPointClick: (point) => {
      point.x;
    },
    widgetId: "widgetID",
    xAxisName: "xaxisname",
    yAxisName: "yaxisname",
    borderRadius: "1",
    boxShadow: "1",
    primaryColor: "primarycolor",
    fontFamily: "fontfamily",
    dimensions: { componentWidth: 1, componentHeight: 1 },
    parentColumnSpace: 1,
    parentRowSpace: 1,
    topRow: 0,
    bottomRow: 0,
    leftColumn: 0,
    rightColumn: 0,
  };
  const defaultExpectedConfig = {
    dataZoom: [],
    legend: {
      align: "left",
      left: "center",
      orient: "horizontal",
      textStyle: { fontFamily: "fontfamily" },
      padding: [5, 50],
      top: "50",
      type: "scroll",
    },
    grid: { top: 100, bottom: 100, left: "100" },
    title: {
      text: defaultProps.chartName,
      left: "center",
      padding: [5, 50],
      textStyle: {
        fontFamily: "fontfamily",
        fontSize: 24,
        color: Colors.THUNDER,
        overflow: "truncate",
        width: -99,
      },
    },
    tooltip: {
      trigger: "item",
    },
    xAxis: {
      type: "category",
      axisLabel: {
        rotate: "0",
        fontFamily: "fontfamily",
        color: Colors.DOVE_GRAY2,
      },
      name: "xaxisname",
      nameLocation: "middle",
      nameGap: 40,
      nameTextStyle: {
        fontSize: 14,
        fontFamily: "fontfamily",
        color: Colors.DOVE_GRAY2,
      },
    },
    yAxis: {
      axisLabel: {
        fontFamily: "fontfamily",
        color: Colors.DOVE_GRAY2,
      },
      name: "yaxisname",
      nameLocation: "middle",
      nameGap: 70,
      nameTextStyle: {
        fontSize: 14,
        fontFamily: "fontfamily",
        color: Colors.DOVE_GRAY2,
      },
    },
    series: [
      {
        type: "line",
        name: "series1",
        itemStyle: { color: "series1color" },
        label: {
          show: true,
          position: "top",
        },
      },
      {
        type: "line",
        name: "series2",
        itemStyle: { color: "series2color" },
        label: {
          show: true,
          position: "top",
        },
      },
    ],
  };

  it("1. builds a right chart configuration", () => {
    const output = builder.prepareEChartConfig(defaultProps, chartData);
    expect(output).toEqual(defaultExpectedConfig);
  });

  describe("2. Allow scroll variations", () => {
    it("2.1 data zoom property isn't present if allowScroll is false", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.allowScroll = false;

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.dataZoom = [];

      const output = builder.prepareEChartConfig(props, chartData);

      expect(output).toStrictEqual(expectedConfig);
    });

    it("2.2 Data zoom property is present if allowScroll is true and chart type isn't PIE_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.allowScroll = true;

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.dataZoom = dataZoomConfig;

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.dataZoom).toStrictEqual(expectedConfig.dataZoom);
    });

    it("2.3 data zoom property isn't present if chart type is pie chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";
      props.allowScroll = true;

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.dataZoom = [];

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.dataZoom).toStrictEqual(expectedConfig.dataZoom);
    });
  });

  describe("3. Title configuration variations", () => {
    it("3.1 includes default title config for non PIE_CHART chart types", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "BAR_CHART";

      const expectedConfig: any = { ...defaultExpectedConfig };
      expectedConfig.title = {
        text: "chart name",
        left: "center",
        padding: [5, 50],
        textStyle: {
          fontFamily: "fontfamily",
          fontSize: 24,
          color: Colors.THUNDER,
          overflow: "truncate",
          width: -99,
        },
      };

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.title).toStrictEqual(expectedConfig.title);
    });

    it("3.2 includes layout infomration for pie chart chart type", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "PIE_CHART";

      const expectedConfig: any = { ...defaultExpectedConfig };
      expectedConfig.title = [
        {
          text: "chart name",
          left: "center",
          padding: [5, 50],
          textStyle: {
            fontFamily: "fontfamily",
            fontSize: 24,
            color: Colors.THUNDER,
            overflow: "truncate",
            width: -99,
          },
        },
        {
          top: "25%",
          left: "33.333333333333336%",
          textAlign: "center",
          text: "series1",
        },
        {
          top: "25%",
          left: "66.66666666666667%",
          textAlign: "center",
          text: "series2",
        },
      ];

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.title).toStrictEqual(expectedConfig.title);
    });
  });

  describe("4. x-axis configuration variations", () => {
    it("4.1 returns appropriate config type for BAR_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "BAR_CHART";

      const expectedConfig: any = { ...defaultExpectedConfig };
      expectedConfig.xAxis = { ...expectedConfig.xAxis };
      expectedConfig.xAxis.type = "value";

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });

    it("4.2 should configuration for label orientation SLANT", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.labelOrientation = LabelOrientation.SLANT;

      const expectedConfig: any = { ...defaultExpectedConfig };
      expectedConfig.xAxis = { ...expectedConfig.xAxis };
      expectedConfig.xAxis.axisLabel = { ...expectedConfig.xAxis.axisLabel };
      expectedConfig.xAxis.axisLabel.rotate = "45"; // slant configuration needs rotate = 45;

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });

    describe("4.3 when label orientation is rotate", () => {
      const labelRotatedProps = JSON.parse(JSON.stringify(defaultProps));
      labelRotatedProps.labelOrientation = LabelOrientation.ROTATE;

      const labelRotatedConfig = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      labelRotatedConfig.xAxis.axisLabel.rotate = "90";

      it("4.3.1 returns correct configuration for label orientation ROTATE", () => {
        const output = builder.prepareEChartConfig(
          labelRotatedProps,
          chartData,
        );
        expect(output).toStrictEqual(labelRotatedConfig);
      });

      it("4.3.2 if chart height is greater or equal to 342, name gap is 12% of chart height", () => {
        const props = JSON.parse(JSON.stringify(labelRotatedProps));
        props.dimensions.componentHeight = 342;

        const expectedConfig = JSON.parse(JSON.stringify(labelRotatedConfig));
        expectedConfig.xAxis.nameGap = 41.04;

        const output = builder.prepareEChartConfig(props, chartData);
        expect(output).toEqual(expectedConfig);
      });
    });

    it("4.4 returns correct configuration for label orientation AUTO", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.labelOrientation = LabelOrientation.AUTO;

      const expectedConfig: any = { ...defaultExpectedConfig };
      expectedConfig.xAxis = { ...expectedConfig.xAxis };
      expectedConfig.xAxis.axisLabel = { ...expectedConfig.xAxis.axisLabel };
      expectedConfig.xAxis.axisLabel.rotate = "0";

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });

    it("4.5 returns correct xAxis configuration for PIE_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "PIE_CHART";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.xAxis = {
        type: "category",
        axisLabel: { ...defaultExpectedConfig.xAxis.axisLabel },
        show: false,
      };

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });
  });

  describe("5. y axis configuration variations", () => {
    it("5.1 returns appropriate y axis type for BAR_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "BAR_CHART";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.yAxis.type = "category";

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.yAxis).toStrictEqual(expectedConfig.yAxis);
    });

    it("5.2 returns correct y axis config for adaptive y axis option", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.setAdaptiveYMin = true;

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.yAxis.min = "dataMin"; // "datamin" means that the y axis is adaptive in echarts

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output).toStrictEqual(expectedConfig);
    });

    it("5.3 returns correct y axis configuration for chart type PIE_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "PIE_CHART";

      const config = {
        axisLabel: defaultExpectedConfig.yAxis.axisLabel,
      };

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.yAxis).toStrictEqual(config);
    });
  });

  describe("6. series configuration", () => {
    it("6.1 chooses the app primary color for first series if no series color is present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      const modifiedChartData = JSON.parse(JSON.stringify(chartData));
      modifiedChartData.seriesID1.color = "";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.series[0].itemStyle.color = "primarycolor";

      const output = builder.prepareEChartConfig(props, modifiedChartData);
      expect(output).toStrictEqual(expectedConfig);
    });

    it("6.2 doesn't choose the app primary color for second series if its series color isn't present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      const modifiedChartData = JSON.parse(JSON.stringify(chartData));
      modifiedChartData.seriesID2.color = "";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.series[1].itemStyle.color = "";

      const output = builder.prepareEChartConfig(props, modifiedChartData);
      expect(output).toStrictEqual(expectedConfig);
    });

    it("6.3 chooses the appropriate configuration for bar chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "BAR_CHART";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].type = "bar";
      expectedConfig.series[0].label.position = "right";

      expectedConfig.series[1].type = "bar";
      expectedConfig.series[1].label.position = "right";

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.4 chooses the appropriate configuration for line chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "LINE_CHART";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.series[0].type = "line";
      expectedConfig.series[1].type = "line";

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.5 chooses the appropriate configuration for column chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "COLUMN_CHART";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.series[0].type = "bar";
      expectedConfig.series[1].type = "bar";

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.6 chooses the appropriate configuration for area chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "AREA_CHART";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.series[0].type = "line";
      expectedConfig.series[1].type = "line";
      expectedConfig.series[0].areaStyle = {};
      expectedConfig.series[1].areaStyle = {};

      const output = builder.prepareEChartConfig(props, chartData);
      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.7 chooses the appropriate configuration for pie chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "PIE_CHART";

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.series = [
        {
          type: "pie",
          radius: "40%",
          center: ["50%", "55%"],
          name: "series1",
          encode: {
            itemName: "Category",
            tooltip: "seriesID1",
            value: "seriesID1",
          },
          label: {
            show: true,
            fontFamily: "fontfamily",
            color: Colors.DOVE_GRAY2,
            formatter: "{b} : {d}%",
          },
        },
      ];

      const output = builder.prepareEChartConfig(props, {
        seriesID1: chartData1,
      });
      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.8 chooses a default series name for the legend if series name prop is empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      const chartDataParams = JSON.parse(JSON.stringify(chartData));
      chartDataParams.seriesID1.seriesName = "";

      let output = builder.prepareEChartConfig(props, chartDataParams);
      let firstSeriesName = (output.series as any[])[0].name;
      expect(firstSeriesName).toEqual("Undefined");

      chartDataParams.seriesID1.seriesName = undefined;
      output = builder.prepareEChartConfig(props, chartDataParams);
      firstSeriesName = (output.series as any[])[0].name;
      expect(firstSeriesName).toEqual("Undefined");
    });

    it("6.9 PIE-CHART chooses a default series name for the legend if series name prop is empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "PIE_CHART";

      const chartDataParams = JSON.parse(JSON.stringify(chartData1));
      chartDataParams.seriesName = "";

      let output = builder.prepareEChartConfig(props, {
        seriesID1: chartDataParams,
      });
      let firstSeriesName = (output.series as any[])[0].name;
      expect(firstSeriesName).toEqual("Undefined");

      chartDataParams.seriesName = undefined;
      output = builder.prepareEChartConfig(props, {
        seriesID1: chartDataParams,
      });
      firstSeriesName = (output.series as any[])[0].name;
      expect(firstSeriesName).toEqual("Undefined");
    });

    it("6.10 shows labels on series data if Show Labels if true otherwise false", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.showDataPointLabel = true;

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].label.show = true;
      expectedConfig.series[1].label.show = true;

      let output = builder.prepareEChartConfig(props, chartData);
      expect(output.series).toStrictEqual(expectedConfig.series);

      props.showDataPointLabel = false;
      expectedConfig.series[0].label.show = false;
      expectedConfig.series[1].label.show = false;

      output = builder.prepareEChartConfig(props, chartData);
      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.11 shows labels on series data if Show Labels if true, else false for PIE Chart as well", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.chartType = "PIE_CHART";
      props.showDataPointLabel = true;

      let output = builder.prepareEChartConfig(props, chartData);
      let seriesConfig = output.series as Record<
        string,
        Record<string, unknown>
      >[];

      expect(seriesConfig[0].label.show).toEqual(true);

      props.showDataPointLabel = false;

      output = builder.prepareEChartConfig(props, chartData);
      seriesConfig = output.series as Record<string, Record<string, unknown>>[];

      expect(seriesConfig[0].label.show).toEqual(false);
    });
  });

  describe("7. grid bottom offsets", () => {
    it("7.1 offset increases by 50 if bottom scroll bar is present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      props.allowScroll = true;

      const output = builder.prepareEChartConfig(props, chartData);

      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      expectedConfig.dataZoom = dataZoomConfig;
      expectedConfig.grid.bottom = 150;

      expect(output).toEqual(expectedConfig);
    });

    describe("7.2 when x axis labels are rotated", () => {
      const labelRotatedProps = JSON.parse(JSON.stringify(defaultProps));
      labelRotatedProps.labelOrientation = LabelOrientation.ROTATE;

      const labelRotateExpectedConfig = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );
      labelRotateExpectedConfig.xAxis.axisLabel.rotate = "90";

      it("7.2.1 the minimum grid bottom offset is 100", () => {
        const output = builder.prepareEChartConfig(
          labelRotatedProps,
          chartData,
        );
        expect(output).toEqual(labelRotateExpectedConfig);
      });

      describe("7.2.2 20% of chart height is more than 100 px", () => {
        const bigHeightChartProps = JSON.parse(
          JSON.stringify(labelRotatedProps),
        );
        bigHeightChartProps.dimensions.componentHeight = 505;

        it("7.2.2.1 bottom offset should be 20% of the chart height", () => {
          const output = builder.prepareEChartConfig(
            bigHeightChartProps,
            chartData,
          );
          const expectedConfig: any = JSON.parse(
            JSON.stringify(labelRotateExpectedConfig),
          );
          expectedConfig.grid.bottom = 101;
          expect(output.grid).toEqual(expectedConfig.grid);
        });

        it("7.2.2.2 if allow scroll is true, 50px are added for allow scroll UI", () => {
          const props = JSON.parse(JSON.stringify(bigHeightChartProps));
          props.allowScroll = true;

          const expectedConfig: any = JSON.parse(
            JSON.stringify(labelRotateExpectedConfig),
          );
          expectedConfig.grid.bottom = 151;

          const output = builder.prepareEChartConfig(props, chartData);
          expect(output.grid).toEqual(expectedConfig.grid);
        });
      });
    });
  });
});
