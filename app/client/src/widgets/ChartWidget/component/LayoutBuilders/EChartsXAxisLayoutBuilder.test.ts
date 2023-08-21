import type { ChartType } from "../../constants";
import { LabelOrientation } from "../../constants";
import { EChartsXAxisLayoutBuilder } from "./EChartsXAxisLayoutBuilder";

describe("EChartsXAxisLayoutBuilder", () => {
  describe("width for xaxis labels", () => {
    it("width is 50 when label orientation is 50", () => {
      const labelOrientation = LabelOrientation.SLANT;
      const builder = new EChartsXAxisLayoutBuilder(
        labelOrientation,
        "LINE_CHART",
      );
      expect(builder.widthForXAxisLabels()).toEqual(50);
    });

    it("width is 60 when label orientation is not slant", () => {
      const labelOrientation = LabelOrientation.AUTO;
      const builder = new EChartsXAxisLayoutBuilder(
        labelOrientation,
        "LINE_CHART",
      );
      expect(builder.widthForXAxisLabels()).toEqual(60);
    });
  });
  describe("height of x axis labels", () => {
    it("when label orientation isn't auto, it is equal to sum of width of x axis labels and a fixed offset", () => {
      const labelOrientation = LabelOrientation.SLANT;
      const builder = new EChartsXAxisLayoutBuilder(
        labelOrientation,
        "LINE_CHART",
      );

      expect(builder.gapBetweenLabelAndName).toEqual(10);
      expect(builder.widthForXAxisLabels()).toEqual(50);
      expect(builder.heightForXAxisLabels()).toEqual(60);
    });

    it("is equal to a default height when label orientation is auto", () => {
      const labelOrientation = LabelOrientation.AUTO;
      const builder = new EChartsXAxisLayoutBuilder(
        labelOrientation,
        "LINE_CHART",
      );

      expect(builder.gapBetweenLabelAndName).toEqual(10);
      expect(builder.defaultHeightForXAxisLabels).toEqual(30);
      expect(builder.heightForXAxisLabels()).toEqual(40);
    });
  });

  describe("height of x axis", () => {
    it("is equal to sum of height of x axis labels and an offset", () => {
      const labelOrientation = LabelOrientation.SLANT;
      const builder = new EChartsXAxisLayoutBuilder(
        labelOrientation,
        "LINE_CHART",
      );

      expect(builder.defaultHeightForXAxisName).toEqual(40);
      expect(builder.heightForXAxisLabels()).toEqual(60);
      expect(builder.heightForXAxis()).toEqual(100);
    });

    it("is equal to 0 when chart type is pie chart", () => {
      const labelOrientation = LabelOrientation.SLANT;
      const chartType: ChartType = "PIE_CHART";
      const builder = new EChartsXAxisLayoutBuilder(
        labelOrientation,
        chartType,
      );

      expect(builder.heightForXAxis()).toEqual(0);
    });
  });

  describe("config for x axis", () => {
    it("returns x axis config for chart layout", () => {
      const labelOrientation = LabelOrientation.SLANT;
      const chartType: ChartType = "LINE_CHART";
      const builder = new EChartsXAxisLayoutBuilder(
        labelOrientation,
        chartType,
      );

      const expectedOutput = {
        nameGap: 60,
        axisLabel: {
          width: 50,
        },
      };
      expect(builder.configForXAxis()).toEqual(expectedOutput);
    });
  });
});
