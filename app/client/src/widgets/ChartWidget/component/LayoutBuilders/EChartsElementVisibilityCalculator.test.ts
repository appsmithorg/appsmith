import { EChartElementVisibilityCalculator } from "./EChartsElementVisibilityCalculator";
import type { EChartElementLayoutParams } from "./EChartsElementVisibilityCalculator";

describe("EChartsElementVisibilityCalculator", () => {
  describe("visibility calculator", () => {
    it("returns no elements if element minHeight is equal to gridMinimumHeight", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: 10,
          maxHeight: 10,
          position: "top",
        },
        {
          elementName: "element2",
          minHeight: 10,
          maxHeight: 10,
          position: "bottom",
        },
      ];

      const gridMinimumHeight = 80;
      const heightAvailable = 80;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(0);
    });

    it("fits as many elements possible within the height available", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: 10,
          maxHeight: 10,
          position: "top",
        },
        {
          elementName: "element2",
          minHeight: 30,
          maxHeight: 30,
          position: "bottom",
        },
      ];
      const gridMinimumHeight = 80;
      const heightAvailable = 120;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(2);
    });

    it("excludes elements that can't fit within the height available", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: 10,
          maxHeight: 10,
          position: "top",
        },
        {
          elementName: "element2",
          minHeight: 30,
          maxHeight: 30,
          position: "bottom",
        },
      ];

      const gridMinimumHeight = 80;
      const heightAvailable = 100;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(1);
      expect(builder.visibleElements[0].elementName).toEqual("element1");
    });

    it("excludes lower priority fitting elements if higher priority elements can't fit", () => {
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: 30,
          maxHeight: 30,
          position: "top",
        },
        {
          elementName: "element2",
          minHeight: 10,
          maxHeight: 10,
          position: "bottom",
        },
      ];
      const gridMinimumHeight = 80;
      const heightAvailable = 90;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(0);
    });
  });

  describe("offsets calculator", () => {
    it("includes the height of visible elements in calculating top and bottom grid offsets", () => {
      const topElementHeight = 10;
      const bottomElementHeight = 30;

      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: topElementHeight,
          maxHeight: topElementHeight,
          position: "top",
        },
        {
          elementName: "element2",
          minHeight: bottomElementHeight,
          maxHeight: bottomElementHeight,
          position: "bottom",
        },
      ];
      const gridMinimumHeight = 80;
      const heightAvailable = 120;

      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: 0,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(2);

      const offsets = builder.calculateOffsets();

      expect(offsets.top).toEqual(topElementHeight);
      expect(offsets.bottom).toEqual(bottomElementHeight);
    });

    it("uses custom top padding if no top element is included in config", () => {
      const elementHeight = 10;
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: elementHeight,
          maxHeight: elementHeight,
          position: "bottom",
        },
      ];
      const gridMinimumHeight = 80;
      const heightAvailable = 90;

      const customPadding = 5;
      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: customPadding,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(1);

      const offsets = builder.calculateOffsets();

      expect(offsets.top).toEqual(customPadding);
      expect(offsets.bottom).toEqual(elementHeight);
    });

    it("uses custom bottom padding if no bottom element is included in config", () => {
      const elementHeight = 10;
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: elementHeight,
          maxHeight: elementHeight,
          position: "top",
        },
      ];
      const gridMinimumHeight = 80;
      const heightAvailable = 90;

      const customPadding = 5;
      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: customPadding,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(1);

      const offsets = builder.calculateOffsets();

      expect(offsets.top).toEqual(elementHeight);
      expect(offsets.bottom).toEqual(customPadding);
    });

    it("allocates max height to element if there is remaining space inside the widget", () => {
      const minElementHeight = 10;
      const maxElementHeight = 40;
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: minElementHeight,
          maxHeight: maxElementHeight,
          position: "bottom",
        },
      ];
      const gridMinimumHeight = 80;
      const heightAvailable = 120;

      const customPadding = 5;
      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: customPadding,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(1);
      expect(builder.visibleElements[0].height).toEqual(maxElementHeight);

      const offsets = builder.calculateOffsets();

      expect(offsets.top).toEqual(customPadding);
      expect(offsets.bottom).toEqual(maxElementHeight);
    });

    it("allocates max height possible to element if there is remaining space inside the widget", () => {
      const minElementHeight = 10;
      const maxElementHeight = 40;
      const elements: EChartElementLayoutParams[] = [
        {
          elementName: "element1",
          minHeight: minElementHeight,
          maxHeight: maxElementHeight,
          position: "bottom",
        },
      ];
      const gridMinimumHeight = 80;
      const heightAvailable = 110;

      const customPadding = 5;
      const builder = new EChartElementVisibilityCalculator({
        height: heightAvailable,
        padding: customPadding,
        gridMinimumHeight: gridMinimumHeight,
        layoutConfigs: elements,
      });

      expect(builder.visibleElements.length).toEqual(1);
      expect(builder.visibleElements[0].height).toEqual(30);

      const offsets = builder.calculateOffsets();

      expect(offsets.top).toEqual(customPadding);
      expect(offsets.bottom).toEqual(30);
    });
  });
});
