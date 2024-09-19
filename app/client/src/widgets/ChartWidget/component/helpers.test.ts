import type { ChartType } from "../constants";
import {
  parseOnDataPointClickParams,
  parseOnDataPointClickForCustomEChart,
  parseOnDataPointClickForCustomFusionChart,
} from "./helpers";

describe("parseOnDataPointClickParams", () => {
  it("returns appropriate chart selected point from user click data", () => {
    const chartType: ChartType = "CUSTOM_ECHART";
    const event = {
      data: {
        dataKey: "dataValue",
      },
    };
    const parsedEvent = parseOnDataPointClickParams(event, chartType);

    expect(parsedEvent.rawEventData).toEqual(event);
  });
});

describe("parseOnDataPointClickForCustomEChart", () => {
  it("return correct rawEventData", () => {
    const event = {
      data: {
        dataKey: "dataValue",
      },
      seriesName: "seriesName",
    };
    const parsedEvent = parseOnDataPointClickForCustomEChart(event);

    expect(parsedEvent.rawEventData).toEqual(event);
  });

  it("omits mouse event data", () => {
    const event = {
      data: {
        dataKey: "dataValue",
      },
      seriesName: "seriesName",
      event: {
        mouseEventClickX: 1,
        mouseEventClickY: 1,
      },
    };
    const parsedEvent = parseOnDataPointClickForCustomEChart(event);

    expect(Object.keys(parsedEvent.rawEventData ?? [])).toEqual([
      "data",
      "seriesName",
    ]);
  });

  it("returns other properties of selected point as undefined", () => {
    const event = {
      data: {
        dataKey: "dataValue",
      },
      seriesName: "seriesName",
      event: {
        mouseEventClickX: 1,
        mouseEventClickY: 1,
      },
    };
    const parsedEvent = parseOnDataPointClickForCustomEChart(event);

    expect(parsedEvent.x).toBeUndefined();
    expect(parsedEvent.y).toBeUndefined();
    expect(parsedEvent.seriesTitle).toBeUndefined();
    expect(parsedEvent.rawEventData).not.toBeUndefined();
  });
});

describe("parseOnDataPointClickForCustomFusionChart", () => {
  it("includes raw event data", () => {
    const eventData = {
      dataKey: "dataValue",
    };
    const event = {
      data: eventData,
      otherKey: "otherValue",
    };
    const parsedEvent = parseOnDataPointClickForCustomFusionChart(event);

    expect(parsedEvent.rawEventData).toEqual(eventData);
  });

  it("returns x and y with values from appropriate fields", () => {
    const eventData = {
      dataKey: "dataValue",
      categoryLabel: "x value",
      dataValue: "y value",
      datasetName: "series name",
    };
    const event = {
      data: eventData,
      otherKey: "otherValue",
    };
    const parsedEvent = parseOnDataPointClickForCustomFusionChart(event);

    expect(parsedEvent.rawEventData).toEqual(eventData);
    expect(parsedEvent.x).toEqual("x value");
    expect(parsedEvent.y).toEqual("y value");
    expect(parsedEvent.seriesTitle).toEqual("series name");
  });

  it("returns x, y and seriesTitle as undefined if appropriate fields are not present", () => {
    const eventData = {
      dataKey: "dataValue",
    };
    const event = {
      data: eventData,
      otherKey: "otherValue",
    };
    const parsedEvent = parseOnDataPointClickForCustomFusionChart(event);

    expect(parsedEvent.rawEventData).toEqual(eventData);
    expect(parsedEvent.x).toBeUndefined();
    expect(parsedEvent.y).toBeUndefined();
    expect(parsedEvent.seriesTitle).toBeUndefined();
  });
});
