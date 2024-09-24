import { Colors } from "constants/Colors";
import type { ChartComponentProps } from ".";
import type { ChartData } from "../constants";
import { LabelOrientation } from "../constants";
import { EChartsConfigurationBuilder } from "./EChartsConfigurationBuilder";

describe("EChartsConfigurationBuilder", () => {
  const builder = new EChartsConfigurationBuilder();
  const longestLabels = { x: "x1", y: "y1" };

  const dataZoomConfig = [
    {
      filterMode: "filter",
      bottom: 30,
      start: "0",
      end: "50",
      type: "slider",
      show: true,
      height: 30,
    },
    {
      filterMode: "filter",
      start: "0",
      end: "50",
      type: "inside",
      show: true,
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
    customEChartConfig: {},
    customFusionChartConfig: { type: "type", dataSource: undefined },
    hasOnDataPointClick: false,
    isVisible: true,
    isLoading: false,
    setAdaptiveYMin: false,
    labelOrientation: LabelOrientation.ROTATE,
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
    dimensions: { componentWidth: 1000, componentHeight: 1000 },
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
      top: 50,
      type: "scroll",
      show: true,
    },
    grid: { top: 110, bottom: 52, left: 50, show: false },
    title: {
      show: true,
      text: defaultProps.chartName,
      left: "center",
      padding: [15, 50],
      textStyle: {
        fontFamily: "fontfamily",
        fontSize: 24,
        color: Colors.THUNDER,
        overflow: "truncate",
        width: 900,
      },
    },
    tooltip: {
      trigger: "item",
    },
    xAxis: {
      type: "category",
      axisLabel: {
        rotate: 90,
        fontFamily: "fontfamily",
        color: Colors.DOVE_GRAY2,
        show: true,
        width: 2,
        overflow: "truncate",
      },
      show: true,
      name: "xaxisname",
      nameLocation: "middle",
      nameGap: 12,
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
        overflow: "truncate",
        show: true,
        width: 2,
      },
      show: true,
      name: "yaxisname",
      nameLocation: "middle",
      nameGap: 20,
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
    const output = builder.prepareEChartConfig(
      defaultProps,
      chartData,
      longestLabels,
    );

    expect(output).toEqual(defaultExpectedConfig);
  });

  describe("2. Allow scroll variations", () => {
    it("2.1 data zoom property isn't present if allowScroll is false", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.allowScroll = false;

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.dataZoom = [];

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output).toStrictEqual(expectedConfig);
    });

    it("2.2 Data zoom property is present if allowScroll is true and chart type isn't PIE_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.allowScroll = true;

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.dataZoom = dataZoomConfig;

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.dataZoom).toStrictEqual(expectedConfig.dataZoom);
    });

    it("2.3 data zoom property isn't present if chart type is pie chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";
      props.allowScroll = true;

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.dataZoom = [];

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.dataZoom).toStrictEqual(expectedConfig.dataZoom);
    });
  });

  describe("3. Title configuration variations", () => {
    it("3.1 includes default title config for non PIE_CHART chart types", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "BAR_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = { ...defaultExpectedConfig };

      expectedConfig.title = {
        text: "chart name",
        left: "center",
        padding: [15, 50],
        show: true,
        textStyle: {
          fontFamily: "fontfamily",
          fontSize: 24,
          color: Colors.THUNDER,
          overflow: "truncate",
          width: 900,
        },
      };

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.title).toStrictEqual(expectedConfig.title);
    });

    it("3.2 includes layout infomration for pie chart chart type", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = { ...defaultExpectedConfig };

      expectedConfig.title = [
        {
          text: "chart name",
          left: "center",
          padding: [15, 50],
          show: true,
          textStyle: {
            fontFamily: "fontfamily",
            fontSize: 24,
            color: Colors.THUNDER,
            overflow: "truncate",
            width: 900,
          },
        },
        {
          top: 90,
          left: 495,
          textAlign: "center",
          text: "series1",
        },
        {
          top: 90,
          left: 495,
          textAlign: "center",
          text: "series2",
        },
      ];

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.title).toStrictEqual(expectedConfig.title);
    });
  });

  describe("4. x-axis configuration variations", () => {
    it("4.1 returns appropriate config type for BAR_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "BAR_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.xAxis.type = "value";
      expectedConfig.xAxis.axisLabel.rotate = 0;

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });

    it("4.2 should configuration for label orientation SLANT", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.labelOrientation = LabelOrientation.SLANT;

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.xAxis.axisLabel.rotate = 45; // slant configuration needs rotate = 45;
      expectedConfig.xAxis.axisLabel.width = 2;
      expectedConfig.xAxis.nameGap = 12;

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });

    describe("4.3 when label orientation is rotate", () => {
      it("4.3.1 returns correct configuration for label orientation ROTATE", () => {
        const labelRotatedProps = JSON.parse(JSON.stringify(defaultProps));

        labelRotatedProps.labelOrientation = LabelOrientation.ROTATE;

        const labelRotatedConfig = JSON.parse(
          JSON.stringify(defaultExpectedConfig),
        );

        labelRotatedConfig.xAxis.axisLabel.rotate = 90;
        labelRotatedConfig.xAxis.nameGap = 12;
        labelRotatedConfig.grid.bottom = 52;

        const output = builder.prepareEChartConfig(
          labelRotatedProps,
          chartData,
          longestLabels,
        );

        expect(output).toStrictEqual(labelRotatedConfig);
      });
    });

    it("4.4 returns correct configuration for label orientation AUTO", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.labelOrientation = LabelOrientation.AUTO;

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.xAxis.axisLabel = {
        color: Colors.DOVE_GRAY2,
        fontFamily: "fontfamily",
        rotate: 0,
        show: true,
      };
      expectedConfig.xAxis.nameGap = 40;

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });

    it("4.5 returns correct xAxis configuration for PIE_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.xAxis = {
        type: "category",
        axisLabel: { ...defaultExpectedConfig.xAxis.axisLabel, width: -50 },
        show: false,
      };
      expectedConfig.xAxis.axisLabel.show = false;

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.xAxis).toStrictEqual(expectedConfig.xAxis);
    });
  });

  describe("5. y axis configuration variations", () => {
    it("5.1 returns appropriate y axis type for BAR_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "BAR_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.yAxis.type = "category";

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.yAxis).toStrictEqual(expectedConfig.yAxis);
    });

    it("5.2 returns correct y axis config for adaptive y axis option", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.setAdaptiveYMin = true;

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.yAxis.min = "dataMin"; // "datamin" means that the y axis is adaptive in echarts

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output).toStrictEqual(expectedConfig);
    });

    it("5.3 includes only axisLabel configuration for y axis when chart type is PIE_CHART", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";

      const config = {
        axisLabel: defaultExpectedConfig.yAxis.axisLabel,
        show: true,
      };

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.yAxis).toStrictEqual(config);
    });
  });

  describe("6. series configuration", () => {
    it("6.1 chooses the app primary color for first series if no series color is present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      const modifiedChartData = JSON.parse(JSON.stringify(chartData));

      modifiedChartData.seriesID1.color = "";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].itemStyle.color = "primarycolor";

      const output = builder.prepareEChartConfig(
        props,
        modifiedChartData,
        longestLabels,
      );

      expect(output).toStrictEqual(expectedConfig);
    });

    it("6.2 doesn't choose the app primary color for second series if its series color isn't present", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      const modifiedChartData = JSON.parse(JSON.stringify(chartData));

      modifiedChartData.seriesID2.color = "";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[1].itemStyle.color = "";

      const output = builder.prepareEChartConfig(
        props,
        modifiedChartData,
        longestLabels,
      );

      expect(output).toStrictEqual(expectedConfig);
    });

    it("6.3 chooses the appropriate configuration for bar chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "BAR_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].type = "bar";
      expectedConfig.series[0].label.position = "right";

      expectedConfig.series[1].type = "bar";
      expectedConfig.series[1].label.position = "right";

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.4 chooses the appropriate configuration for line chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "LINE_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].type = "line";
      expectedConfig.series[1].type = "line";

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.5 chooses the appropriate configuration for column chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "COLUMN_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].type = "bar";
      expectedConfig.series[1].type = "bar";

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.6 chooses the appropriate configuration for area chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "AREA_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].type = "line";
      expectedConfig.series[1].type = "line";
      expectedConfig.series[0].areaStyle = {};
      expectedConfig.series[1].areaStyle = {};

      const output = builder.prepareEChartConfig(
        props,
        chartData,
        longestLabels,
      );

      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.7 chooses the appropriate configuration for pie chart", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series = [
        {
          type: "pie",
          top: 110,
          bottom: 30,
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

      const output = builder.prepareEChartConfig(
        props,
        {
          seriesID1: chartData1,
        },
        longestLabels,
      );

      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.8 chooses a default series name for the legend if series name prop is empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));
      const chartDataParams = JSON.parse(JSON.stringify(chartData));

      chartDataParams.seriesID1.seriesName = "";

      let output = builder.prepareEChartConfig(
        props,
        chartDataParams,
        longestLabels,
      );
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let firstSeriesName = (output.series as any[])[0].name;

      expect(firstSeriesName).toEqual("Series");

      chartDataParams.seriesID1.seriesName = undefined;
      output = builder.prepareEChartConfig(
        props,
        chartDataParams,
        longestLabels,
      );
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firstSeriesName = (output.series as any[])[0].name;
      expect(firstSeriesName).toEqual("Series");
    });

    it("6.9 PIE-CHART chooses a default series name for the legend if series name prop is empty", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";

      const chartDataParams = JSON.parse(JSON.stringify(chartData1));

      chartDataParams.seriesName = "";

      let output = builder.prepareEChartConfig(
        props,
        {
          seriesID1: chartDataParams,
        },
        longestLabels,
      );
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let firstSeriesName = (output.series as any[])[0].name;

      expect(firstSeriesName).toEqual("Series");

      chartDataParams.seriesName = undefined;
      output = builder.prepareEChartConfig(
        props,
        {
          seriesID1: chartDataParams,
        },
        longestLabels,
      );
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firstSeriesName = (output.series as any[])[0].name;
      expect(firstSeriesName).toEqual("Series");
    });

    it("6.10 shows labels on series data if Show Labels if true otherwise false", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.showDataPointLabel = true;

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedConfig: any = JSON.parse(
        JSON.stringify(defaultExpectedConfig),
      );

      expectedConfig.series[0].label.show = true;
      expectedConfig.series[1].label.show = true;

      let output = builder.prepareEChartConfig(props, chartData, longestLabels);

      expect(output.series).toStrictEqual(expectedConfig.series);

      props.showDataPointLabel = false;
      expectedConfig.series[0].label.show = false;
      expectedConfig.series[1].label.show = false;

      output = builder.prepareEChartConfig(props, chartData, longestLabels);
      expect(output.series).toStrictEqual(expectedConfig.series);
    });

    it("6.11 shows labels on series data if Show Labels if true, else false for PIE Chart as well", () => {
      const props = JSON.parse(JSON.stringify(defaultProps));

      props.chartType = "PIE_CHART";
      props.showDataPointLabel = true;

      let output = builder.prepareEChartConfig(props, chartData, longestLabels);
      let seriesConfig = output.series as Record<
        string,
        Record<string, unknown>
      >[];

      expect(seriesConfig[0].label.show).toEqual(true);

      props.showDataPointLabel = false;

      output = builder.prepareEChartConfig(props, chartData, longestLabels);
      seriesConfig = output.series as Record<string, Record<string, unknown>>[];

      expect(seriesConfig[0].label.show).toEqual(false);
    });
  });
});
