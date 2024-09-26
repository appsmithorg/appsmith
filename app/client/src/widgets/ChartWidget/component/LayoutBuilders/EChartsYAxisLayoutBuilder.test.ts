import { EChartsYAxisLayoutBuilder } from "./EChartsYAxisLayoutBuilder";

const font = "14px Nunito Sans";

describe("EChartsYAxisLayoutBuilder", () => {
  describe("maxWidthForLabels", () => {
    it("returns the max width for labels to equal sum of label width in pixels and an offset", () => {
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: 100,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      expect(builder.maxWidthForLabels()).toEqual(6);
    });
  });

  describe("width for labels", () => {
    it("if available space is greater than label width, it returns value equal to label width", () => {
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: 300,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.maxWidthForLabels()).toEqual(6);
      expect(builder.widthForLabels()).toEqual(6);
    });

    it("if available space is lesser than label width, it returns available space", () => {
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: 160,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.maxWidthForLabels()).toEqual(6);
      expect(builder.widthForLabels()).toEqual(6);
    });
  });

  describe("visibility of y axis config", () => {
    it("shows y axis if width is more than minimum width", () => {
      const widgetWidth = 160;
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: widgetWidth,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(true);
    });

    it("hides y axis if width is more than minimum width", () => {
      const widgetWidth = 149;
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: widgetWidth,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(false);
    });
  });

  describe("y axis grid left offset", () => {
    it("when y axis is visible, offset is equal to sum of label width and offsets", () => {
      const widgetWidth = 160;
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: widgetWidth,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(true);
      expect(builder.labelsWidth).toEqual(6);
      expect(builder.gridLeftOffset()).toEqual(54);
    });

    it("when y axis is not visible, offset is 5", () => {
      const widgetWidth = 149;
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: widgetWidth,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(false);
      expect(builder.gridLeftOffset()).toEqual(5);
    });
  });

  describe("y axis config", () => {
    it("returns correct y axis config based on props", () => {
      const widgetWidth = 160;
      const builder = new EChartsYAxisLayoutBuilder({
        widgetWidth: widgetWidth,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "x label", y: "123456" },
      });

      const expectedOutput = {
        show: true,
        nameGap: 24,
        axisLabel: {
          width: 6,
          overflow: "truncate",
        },
      };

      expect(builder.config()).toEqual(expectedOutput);
    });
  });
});
