import { LabelOrientation } from "widgets/ChartWidget/constants";
import { EChartsLayoutBuilder } from "./EChartsLayoutBuilder";

describe("priority order of layout", () => {
  it("returns the correct priority order", () => {
    const builder = new EChartsLayoutBuilder({
      allowScroll: false,
      height: 0,
      width: 0,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
    });
    expect(builder.priorityOrderOfInclusion).toEqual([
      "xAxis",
      "legend",
      "title",
      "scrollBar",
    ]);
  });
});

describe("layout configs to include", () => {
  it("includes scroll bar if allow scroll is true", () => {
    const allowScroll = true;
    const builder = new EChartsLayoutBuilder({
      allowScroll: allowScroll,
      height: 0,
      width: 0,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
    });
    const output = builder.configsToInclude();
    expect(output).toEqual(["xAxis", "legend", "title", "scrollBar"]);
  });

  it("excludes scroll bar if allow scroll is false", () => {
    const allowScroll = false;
    const builder = new EChartsLayoutBuilder({
      allowScroll: allowScroll,
      height: 0,
      width: 0,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
    });
    const output = builder.configsToInclude();
    expect(output).toEqual(["xAxis", "legend", "title"]);
  });

  it("doesn't include title if chart title length is 0", () => {
    const emptyChartTitle = "";

    const allowScroll = false;
    const builder = new EChartsLayoutBuilder({
      allowScroll: allowScroll,
      height: 0,
      width: 0,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      chartTitle: emptyChartTitle,
    });
    const output = builder.configsToInclude();
    expect(output).toEqual(["xAxis", "legend"]);
  });
});

describe("legend top offset", () => {
  it("legend top offset is 50 if title is visible", () => {
    const chartTitle = "chartTitle";
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      height: 400,
      width: 300,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      chartTitle: chartTitle,
    });
    const output = builder.layoutConfigForElements();
    expect(output.title.show).toEqual(true);
    expect(output.legend.top).toEqual(50);
  });

  it("legend top offset is 0 if title is not visible", () => {
    const emptyChartTitle = "";
    const builder = new EChartsLayoutBuilder({
      allowScroll: true,
      height: 400,
      width: 300,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
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
      height: 400,
      width: 300,
      labelOrientation: LabelOrientation.AUTO,
      chartType: "LINE_CHART",
      chartTitle: "chartTitle",
    });
    const output = builder.layoutConfigForElements();
    expect(output).toEqual({
      xAxis: {
        show: true,
        nameGap: 40,
        axisLabel: {
          width: 60,
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
        top: 100,
        bottom: 140,
        left: 100,
      },
      yAxis: {
        show: true,
        nameGap: 70,
        axisLabel: {
          width: 60,
        },
      },
    });
  });
});
