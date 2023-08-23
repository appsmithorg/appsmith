import { EChartsYAxisLayoutBuilder } from "./EChartsYAxisLayoutBuilder";

describe("EChartsYAxisLayoutBuilder", () => {
  describe("visibility of y axis config", () => {
    it("shows y axis if width is more than minimum width", () => {
      const width = 150;
      const builder = new EChartsYAxisLayoutBuilder(width);

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(true);
    });

    it("hides y axis if width is more than minimum width", () => {
      const width = 149;
      const builder = new EChartsYAxisLayoutBuilder(width);

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(false);
    });
  });

  describe("y axis grid left offset", () => {
    it("when y axis is visible, offset is 100", () => {
      const width = 150;
      const builder = new EChartsYAxisLayoutBuilder(width);

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(true);
      expect(builder.gridLeftOffset()).toEqual(100);
    });

    it("when y axis is not visible, offset is 5", () => {
      const width = 149;
      const builder = new EChartsYAxisLayoutBuilder(width);

      expect(builder.minimumWidth).toEqual(150);
      expect(builder.showYAxisConfig()).toEqual(false);
      expect(builder.gridLeftOffset()).toEqual(5);
    });
  });

  describe("y axis config", () => {
    it("returns correct y axis config based on props", () => {
      const width = 150;
      const builder = new EChartsYAxisLayoutBuilder(width);

      const expectedOutput = {
        show: true,
        nameGap: 70,
        axisLabel: {
          width: 60,
        },
      };
      expect(builder.config()).toEqual(expectedOutput);
    });
  });
});
