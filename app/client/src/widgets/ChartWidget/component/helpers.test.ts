import type { ChartType } from "../constants";
import {
  parseOnDataPointClickParams,
  parseOnDataPointClickForCustomEChart,
  parseOnDataPointClickForCustomFusionChart,
  is3DChart,
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

describe("is3DChart", () => {
  it("returns true if any of the 3D Chart config keys is present", () => {
    const threeDChartKey = "globe";
    const config: Record<string, unknown> = {
      source: {},
    };

    config[threeDChartKey] = {};
    expect(is3DChart(config)).toEqual(true);
  });

  it("returns true if any of the 3D series type is present in an array of series", () => {
    const config: Record<string, unknown> = {
      source: {},
      series: [
        {
          type: "line3D",
        },
      ],
    };

    expect(is3DChart(config)).toEqual(true);
  });

  it("returns true if any of the 3D series type is present in single series", () => {
    const config: Record<string, unknown> = {
      source: {},
      series: {
        type: "line3D",
      },
    };

    expect(is3DChart(config)).toEqual(true);
  });

  it("returns false if none of the 3D fields is present", () => {
    const config: Record<string, unknown> = {
      source: {},
      series: {
        type: "line",
      },
    };

    expect(is3DChart(config)).toEqual(false);
  });

  it("returns false if none of the 3D fields is present and series config is null", () => {
    const config: Record<string, unknown> = {
      source: {},
      series: null,
    };

    expect(is3DChart(config)).toEqual(false);
  });

  it("returns false if none of the 3D fields is present and series type is null", () => {
    const config: Record<string, unknown> = {
      source: {},
      series: {},
    };

    expect(is3DChart(config)).toEqual(false);
  });
});
