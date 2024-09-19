import { LabelOrientation } from "widgets/ChartWidget/constants";
import { EChartsLayoutBuilder } from "./EChartsLayoutBuilder";

const font = "14px Nunito Sans";

describe("priority order of layout", () => {
  it("returns the correct priority order", () => {
    const builder = new EChartsLayoutBuilder({
      allowScroll: false,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
      seriesConfigs: {},
      font: font,
      longestLabels: { x: "123", y: "123" },
    });

    expect(builder.priorityOrderOfInclusion).toEqual([
      "legend",
      "title",
      "xAxis",
      "scrollBar",
    ]);
  });
});

describe("layout configs to include", () => {
  it("includes scroll bar if allow scroll is true", () => {
    const allowScroll = true;
    const builder = new EChartsLayoutBuilder({
      allowScroll: allowScroll,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      seriesConfigs: {
        series1ID: {
          data: [],
          seriesName: "series name",
        },
      },
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
      font: font,
      longestLabels: { x: "123", y: "123" },
    });
    const output = builder.configsToInclude();

    expect(output).toEqual(["legend", "title", "xAxis", "scrollBar"]);
  });

  it("excludes scroll bar if allow scroll is false", () => {
    const allowScroll = false;
    const builder = new EChartsLayoutBuilder({
      allowScroll: allowScroll,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      seriesConfigs: {
        series1ID: {
          data: [],
          seriesName: "series name",
        },
      },
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
      font: font,
      longestLabels: { x: "123", y: "123" },
    });
    const output = builder.configsToInclude();

    expect(output).toEqual(["legend", "title", "xAxis"]);
  });

  it("doesn't include title if chart title length is 0", () => {
    const emptyChartTitle = "";

    const allowScroll = false;
    const builder = new EChartsLayoutBuilder({
      allowScroll: allowScroll,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      font: font,
      seriesConfigs: {
        series1ID: {
          data: [],
          seriesName: "series name",
        },
      },
      longestLabels: { x: "123", y: "123" },
      chartTitle: emptyChartTitle,
    });
    const output = builder.configsToInclude();

    expect(output).toEqual(["legend", "xAxis"]);
  });

  it("includes legend if number of series data is more than 1", () => {
    const seriesConfigs = {
      series1ID: {
        data: [],
      },
      series2ID: {
        data: [],
      },
    };
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      seriesConfigs: seriesConfigs,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
      font: font,
      longestLabels: { x: "123", y: "123" },
    });
    const output = builder.configsToInclude();

    expect(output).toEqual(["legend", "title", "xAxis", "scrollBar"]);
  });

  it("doesn't include legend if number of series data is 0", () => {
    const seriesConfigs = {};
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      seriesConfigs: seriesConfigs,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
      font: font,
      longestLabels: { x: "123", y: "123" },
    });
    const output = builder.configsToInclude();

    expect(output).toEqual(["title", "xAxis", "scrollBar"]);
  });

  it("if number of series configs is 1, doesn't include legend if series name is missing", () => {
    const seriesConfigs = {
      series1ID: {
        data: [],
      },
    };
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      seriesConfigs: seriesConfigs,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
      font: font,
      longestLabels: { x: "123", y: "123" },
    });
    const output = builder.configsToInclude();

    expect(output).toEqual(["title", "xAxis", "scrollBar"]);
  });

  it("if number of series configs is 1, includes legend if series name is present", () => {
    const seriesConfigs = {
      series1ID: {
        seriesName: "seriesNamePresent",
        data: [],
      },
    };
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      widgetHeight: 0,
      widgetWidth: 0,
      labelOrientation: LabelOrientation.AUTO,
      seriesConfigs: seriesConfigs,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
      font: font,
      longestLabels: { x: "123", y: "123" },
    });
    const output = builder.configsToInclude();

    expect(output).toEqual(["legend", "title", "xAxis", "scrollBar"]);
  });
});

describe("legend top offset", () => {
  it("legend top offset is 50 if title is visible", () => {
    const chartTitle = "chartTitle";
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      widgetHeight: 400,
      widgetWidth: 300,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      font: font,
      seriesConfigs: {},
      chartTitle: chartTitle,
      longestLabels: { x: "123", y: "123" },
    });
    const output = builder.layoutConfigForElements();

    expect(output.title.show).toEqual(true);
    expect(output.legend.top).toEqual(50);
  });

  it("legend top offset is 0 if title is not visible", () => {
    const emptyChartTitle = "";
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      widgetHeight: 400,
      widgetWidth: 300,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      font: font,
      seriesConfigs: {},
      longestLabels: { x: "123", y: "123" },
      chartTitle: emptyChartTitle,
    });
    const output = builder.layoutConfigForElements();

    expect(output.title.show).toEqual(false);
    expect(output.legend.top).toEqual(0);
  });
});

describe("layout configs", () => {
  it("generates correct chart layout config", () => {
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      widgetHeight: 400,
      widgetWidth: 300,
      labelOrientation: LabelOrientation.ROTATE,
      chartType: "LINE_CHART",
      font: font,
      longestLabels: { x: "123", y: "123" },
      seriesConfigs: {
        seriesID1: {
          data: [],
          seriesName: "seriesName",
        },
      },
      chartTitle: "chartTitle",
    });
    const output = builder.layoutConfigForElements();

    expect(output).toEqual({
      xAxis: {
        show: true,
        nameGap: 13,
        axisLabel: {
          width: 3,
          overflow: "truncate",
        },
      },
      legend: {
        show: true,
        top: 50,
      },
      title: {
        show: true,
      },
      scrollBar: {
        show: true,
        bottom: 30,
        height: 30,
      },
      grid: {
        top: 110,
        bottom: 113,
        left: 51,
      },
      yAxis: {
        show: true,
        nameGap: 21,
        axisLabel: {
          width: 3,
          overflow: "truncate",
        },
      },
    });
  });
});
