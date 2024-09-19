import type { ChartType } from "../../constants";
import { LabelOrientation } from "../../constants";
import { EChartsXAxisLayoutBuilder } from "./EChartsXAxisLayoutBuilder";

const font = "14px Nunito Sans";

describe("EChartsXAxisLayoutBuilder", () => {
  describe("width for xaxis labels", () => {
    it("returns a default width when label orientation is auto", () => {
      const labelOrientation = LabelOrientation.AUTO;

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "123456", y: "123" },
      });

      expect(builder.widthForXAxisLabels()).toEqual(0);
    });

    describe("when label orientation is not auto", () => {
      it("when chart type is not BAR_CHART, returns the width of the longest x label", () => {
        const labelOrientation = LabelOrientation.ROTATE;
        const builder = new EChartsXAxisLayoutBuilder({
          labelOrientation: labelOrientation,
          chartType: "LINE_CHART",
          font: font,
          longestLabel: { x: "123456", y: "123" },
        });

        expect(builder.widthForXAxisLabels()).toEqual(6);
      });

      it("when chart type is BAR_CHART, returns the width of the longest y label", () => {
        const labelOrientation = LabelOrientation.ROTATE;
        const builder = new EChartsXAxisLayoutBuilder({
          labelOrientation: labelOrientation,
          chartType: "BAR_CHART",
          font: font,
          longestLabel: { x: "123456", y: "123" },
        });

        expect(builder.widthForXAxisLabels()).toEqual(3);
      });
    });
  });

  describe("maxHeightForLabels", () => {
    it("returns a default height when label orientation is auto", () => {
      const labelOrientation = LabelOrientation.AUTO;

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "123456", y: "123" },
      });

      expect(builder.defaultHeightForXAxisLabels).toEqual(30);
      expect(builder.gapBetweenLabelAndName).toEqual(10);

      expect(builder.maxHeightForXAxisLabels()).toEqual(40);
    });

    it("returns sum of label width and an offset when label orientation is not auto", () => {
      const labelOrientation = LabelOrientation.ROTATE;

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "123456", y: "123" },
      });

      expect(builder.gapBetweenLabelAndName).toEqual(10);
      expect(builder.widthForXAxisLabels()).toEqual(6);

      expect(builder.maxHeightForXAxisLabels()).toEqual(16);
    });
  });

  describe("minHeightForLabels", () => {
    it("returns 0 height for pie chart", () => {
      const labelOrientation = LabelOrientation.AUTO;
      const chartType: ChartType = "PIE_CHART";

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: chartType,
        font: font,
        longestLabel: { x: "123456", y: "123" },
      });

      expect(builder.minHeightForLabels()).toEqual(0);
    });

    describe("chart type is not PIE_CHART", () => {
      it("returns a fixed height when label orientation is auto", () => {
        const labelOrientation = LabelOrientation.AUTO;
        const chartType: ChartType = "LINE_CHART";

        const builder = new EChartsXAxisLayoutBuilder({
          labelOrientation: labelOrientation,
          chartType: chartType,
          font: font,
          longestLabel: { x: "123456", y: "123" },
        });

        expect(builder.defaultHeightForXAxisLabels).toEqual(30);
        expect(builder.gapBetweenLabelAndName).toEqual(10);
        expect(builder.defaultHeightForXAxisName).toEqual(40);

        expect(builder.minHeightForLabels()).toEqual(80);
      });

      it("returns a fixed height when label orientation is not auto", () => {
        const labelOrientation = LabelOrientation.ROTATE;
        const chartType: ChartType = "LINE_CHART";

        const builder = new EChartsXAxisLayoutBuilder({
          labelOrientation: labelOrientation,
          chartType: chartType,
          font: font,
          longestLabel: { x: "123456", y: "123" },
        });

        expect(builder.defaultHeightForRotatedLabels).toEqual(50);
        expect(builder.gapBetweenLabelAndName).toEqual(10);
        expect(builder.defaultHeightForXAxisName).toEqual(40);

        expect(builder.minHeightForLabels()).toEqual(100);
      });
    });
  });

  describe("maxHeightForXAxis", () => {
    it("when chart type is PIE_CHART, it returns zero height", () => {
      const labelOrientation = LabelOrientation.ROTATE;

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: "PIE_CHART",
        font: font,
        longestLabel: { x: "123456", y: "123" },
      });

      expect(builder.maxHeightForXAxis()).toEqual(0);
    });

    it("when chart type is not PIE_CHART, it returns sum of max height of labels and an offset", () => {
      const labelOrientation = LabelOrientation.ROTATE;

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: "LINE_CHART",
        font: font,
        longestLabel: { x: "123456", y: "123" },
      });

      expect(builder.maxHeightForXAxisLabels()).toEqual(16);
      expect(builder.defaultHeightForXAxisName).toEqual(40);
      expect(builder.maxHeightForXAxis()).toEqual(56);
    });
  });

  describe("heightConfigForLabels", () => {
    it("returns the minHeight and maxHeight required for labels", () => {
      const labelOrientation = LabelOrientation.ROTATE;
      const chartType: ChartType = "LINE_CHART";

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: chartType,
        font: font,
        longestLabel: {
          x: "this is a long text with width more than min width for xaxis labels",
          y: "123",
        },
      });

      expect(builder.minHeightForLabels()).toEqual(100);
      expect(builder.maxHeightForXAxis()).toEqual(117);

      expect(builder.heightConfigForXAxis()).toEqual({
        minHeight: 100,
        maxHeight: 117,
      });
    });

    it("returns minHeight the same as maxHeight if minHeight >= maxHeight", () => {
      const labelOrientation = LabelOrientation.ROTATE;
      const chartType: ChartType = "LINE_CHART";

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: chartType,
        font: font,
        longestLabel: {
          x: "123456",
          y: "123",
        },
      });

      expect(builder.minHeightForLabels()).toEqual(100);
      expect(builder.maxHeightForXAxis()).toEqual(56);

      expect(builder.heightConfigForXAxis()).toEqual({
        minHeight: 56,
        maxHeight: 56,
      });
    });
  });

  describe("axisLabelConfig", () => {
    it("when label orientation is AUTO, it returns empty axisLabelConfig", () => {
      const labelOrientation = LabelOrientation.AUTO;

      const chartType: ChartType = "LINE_CHART";

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: chartType,
        font: font,
        longestLabel: {
          x: "123456",
          y: "123",
        },
      });

      expect(builder.axisLabelConfig(100)).toEqual({});
    });

    it("when label orientation is not AUTO, it returns width for labels excluding padding and x axis name offsets", () => {
      const labelOrientation = LabelOrientation.ROTATE;

      const chartType: ChartType = "LINE_CHART";

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: chartType,
        font: font,
        longestLabel: {
          x: "123456",
          y: "123",
        },
      });

      const allocatedXAxisHeight = 100;
      const labelWidth =
        allocatedXAxisHeight -
        builder.defaultHeightForXAxisName -
        builder.gapBetweenLabelAndName;

      const expectedConfig = {
        width: labelWidth,
        overflow: "truncate",
      };

      expect(builder.axisLabelConfig(allocatedXAxisHeight)).toEqual(
        expectedConfig,
      );
    });
  });

  describe("xAxis config", () => {
    it("returns xAxis config with gap between labels and xaxis name equal to allocated height minus default xaxis name height", () => {
      const labelOrientation = LabelOrientation.ROTATE;

      const chartType: ChartType = "LINE_CHART";

      const builder = new EChartsXAxisLayoutBuilder({
        labelOrientation: labelOrientation,
        chartType: chartType,
        font: font,
        longestLabel: {
          x: "123456",
          y: "123",
        },
      });

      expect(builder.defaultHeightForXAxisName).toEqual(40);

      const allocatedXAxisHeight = 100;
      const labelWidth =
        allocatedXAxisHeight -
        builder.defaultHeightForXAxisName -
        builder.gapBetweenLabelAndName;

      const nameGap = allocatedXAxisHeight - builder.defaultHeightForXAxisName;

      expect(builder.defaultHeightForXAxisName).toEqual(40);
      expect(nameGap).toEqual(60);

      const expectedConfig = {
        nameGap: nameGap,
        axisLabel: {
          width: labelWidth,
          overflow: "truncate",
        },
      };

      expect(builder.configForXAxis(allocatedXAxisHeight)).toEqual(
        expectedConfig,
      );
    });
  });

  // describe("height of x axis labels", () => {
  //   it("when label orientation isn't auto, it is equal to sum of width of x axis labels and a fixed offset", () => {
  //     const labelOrientation = LabelOrientation.SLANT;
  //     const builder = new EChartsXAxisLayoutBuilder(
  //       labelOrientation,
  //       "LINE_CHART",
  //     );

  //     expect(builder.gapBetweenLabelAndName).toEqual(10);
  //     expect(builder.widthForXAxisLabels()).toEqual(50);
  //     expect(builder.heightForXAxisLabels()).toEqual(60);
  //   });

  //   it("is equal to a default height when label orientation is auto", () => {
  //     const labelOrientation = LabelOrientation.AUTO;
  //     const builder = new EChartsXAxisLayoutBuilder(
  //       labelOrientation,
  //       "LINE_CHART",
  //     );

  //     expect(builder.gapBetweenLabelAndName).toEqual(10);
  //     expect(builder.defaultHeightForXAxisLabels).toEqual(30);
  //     expect(builder.heightForXAxisLabels()).toEqual(40);
  //   });
  // });

  // describe("height of x axis", () => {
  //   it("is equal to sum of height of x axis labels and an offset", () => {
  //     const labelOrientation = LabelOrientation.SLANT;
  //     const builder = new EChartsXAxisLayoutBuilder(
  //       labelOrientation,
  //       "LINE_CHART",
  //     );

  //     expect(builder.defaultHeightForXAxisName).toEqual(40);
  //     expect(builder.heightForXAxisLabels()).toEqual(60);
  //     expect(builder.heightForXAxis()).toEqual(100);
  //   });

  //   it("is equal to 0 when chart type is pie chart", () => {
  //     const labelOrientation = LabelOrientation.SLANT;
  //     const chartType: ChartType = "PIE_CHART";
  //     const builder = new EChartsXAxisLayoutBuilder(
  //       labelOrientation,
  //       chartType,
  //     );

  //     expect(builder.heightForXAxis()).toEqual(0);
  //   });
  // });

  // describe("config for x axis", () => {
  //   it("returns x axis config for chart layout", () => {
  //     const labelOrientation = LabelOrientation.SLANT;
  //     const chartType: ChartType = "LINE_CHART";
  //     const builder = new EChartsXAxisLayoutBuilder(
  //       labelOrientation,
  //       chartType,
  //     );

  //     const expectedOutput = {
  //       nameGap: 60,
  //       axisLabel: {
  //         width: 50,
  //       },
  //     };
  //     expect(builder.configForXAxis()).toEqual(expectedOutput);
  //   });
  // });
});
