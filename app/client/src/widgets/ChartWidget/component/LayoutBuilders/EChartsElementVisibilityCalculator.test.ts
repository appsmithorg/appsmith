import { EChartElementVisibilityCalculator } from "./EChartsElementVisibilityCalculator";
import type { EChartElementLayoutParams } from "./EChartsElementVisibilityCalculator";

describe("EChartsElementVisibilityCalculator", () => {
  describe("visibility calculator", () => {
    it("returns no elements if current height is equal to minimumHeight", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          height: 10,
          position: "top",
        },
        {
          elementName: "element2",
          height: 10,
          position: "bottom",
        },
      ];

      const minimumHeight = 80;
      const heightAvailable = 80;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        minimumHeight: minimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.top.length).toEqual(0);
      expect(builder.visibleElements.bottom.length).toEqual(0);
    });

    it("fits as many elements possible within the height available", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          height: 10,
          position: "top",
        },
        {
          elementName: "element2",
          height: 30,
          position: "bottom",
        },
      ];
      const minimumHeight = 80;
      const heightAvailable = 120;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        minimumHeight: minimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.top.length).toEqual(1);
      expect(builder.visibleElements.bottom.length).toEqual(1);

      expect(builder.visibleElements.top[0]).toEqual(elements[0]);
      expect(builder.visibleElements.bottom[0]).toEqual(elements[1]);
    });

    it("excludes elements that can't fit within the height available", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          height: 10,
          position: "top",
        },
        {
          elementName: "element2",
          height: 30,
          position: "bottom",
        },
      ];

      const minimumHeight = 80;
      const heightAvailable = 100;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        minimumHeight: minimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.top.length).toEqual(1);
      expect(builder.visibleElements.bottom.length).toEqual(0);

      expect(builder.visibleElements.top[0]).toEqual(elements[0]);
    });

    it("excludes lower priority fitting elements if higher priority elements can't fit", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          height: 30,
          position: "top",
        },
        {
          elementName: "element2",
          height: 10,
          position: "bottom",
        },
      ];
      const minimumHeight = 80;
      const heightAvailable = 90;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        minimumHeight: minimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.top.length).toEqual(0);
      expect(builder.visibleElements.bottom.length).toEqual(0);
    });
  });

  describe("offsets calculator", () => {
    it("includes the height of visible elements in calculating top and bottom grid offsets", () => {
      const topElementHeight = 10;
      const bottomElementHeight = 30;

      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          height: topElementHeight,
          position: "top",
        },
        {
          elementName: "element2",
          height: bottomElementHeight,
          position: "bottom",
        },
      ];
      const minimumHeight = 80;
      const heightAvailable = 120;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        minimumHeight: minimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.top.length).toEqual(1);
      expect(builder.visibleElements.bottom.length).toEqual(1);

      expect(builder.visibleElements.top[0]).toEqual(elements[0]);
      expect(builder.visibleElements.bottom[0]).toEqual(elements[1]);

      const offsets = builder.calculateOffsets();
      expect(offsets.top).toEqual(topElementHeight);
      expect(offsets.bottom).toEqual(bottomElementHeight);
    });

    it("uses custom top padding if no top element is included in config", () => {
      const elementHeight = 10;
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          height: elementHeight,
          position: "bottom",
        },
      ];
      const minimumHeight = 80;
      const heightAvailable = 90;

      const customPadding = 5;
      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: customPadding,
        minimumHeight: minimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.top.length).toEqual(0);
      expect(builder.visibleElements.bottom.length).toEqual(1);

      const offsets = builder.calculateOffsets();

      expect(offsets.top).toEqual(customPadding);
      expect(offsets.bottom).toEqual(elementHeight);
    });

    it("uses custom bottom padding if no bottom element is included in config", () => {
      const elementHeight = 10;
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          height: elementHeight,
          position: "top",
        },
      ];
      const minimumHeight = 80;
      const heightAvailable = 90;

      const customPadding = 5;
      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: customPadding,
        minimumHeight: minimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.top.length).toEqual(1);
      expect(builder.visibleElements.bottom.length).toEqual(0);

      const offsets = builder.calculateOffsets();

      expect(offsets.top).toEqual(elementHeight);
      expect(offsets.bottom).toEqual(customPadding);
    });
  });
});
