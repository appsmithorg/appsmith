import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  getAffectedWidgetsFromLayers,
  getAllChildWidgets,
} from "./WidgetPositionsUtils";

const widgets = {
  "0": {
    children: ["1", "3", "4"],
    detachFromLayout: true,
    flexLayers: [
      { children: [{ id: "1" }, { id: "3" }] },
      { children: [{ id: "4" }] },
    ],
  },
  "1": {
    children: ["2"],
  },
  "2": {
    children: ["5", "6", "7", "8"],
    detachFromLayout: true,
    flexLayers: [
      { children: [{ id: "5" }] },
      { children: [{ id: "6" }, { id: "7" }] },
      { children: [{ id: "8" }] },
    ],
  },
  "3": { children: [] },
  "4": { children: [] },
  "5": { children: [] },
  "6": { children: [] },
  "7": { children: [] },
  "8": { children: [] },
} as unknown as CanvasWidgetsReduxState;

describe("should test getAffectedWidgetsFromLayers", () => {
  const layerQueue1 = {
    "0": 0,
  };

  const layerQueue2 = {
    "0": 1,
    "2": 1,
  };

  const layerQueue3 = {
    "2": 0,
  };

  const layerQueue4 = {
    "0": 1,
    "2": 2,
  };

  const affectedWidgets1 = {
    "1": true,
    "3": true,
    "4": true,
    "5": true,
    "6": true,
    "7": true,
    "8": true,
  };

  const affectedWidgets2 = {
    "4": true,
    "6": true,
    "7": true,
    "8": true,
  };

  const affectedWidgets3 = {
    "5": true,
    "6": true,
    "7": true,
    "8": true,
  };

  const affectedWidgets4 = {
    "4": true,
    "8": true,
  };

  it("should return all the affected widgets derived from layer queue", () => {
    expect(getAffectedWidgetsFromLayers(layerQueue1, widgets)).toEqual(
      affectedWidgets1,
    );
    expect(getAffectedWidgetsFromLayers(layerQueue2, widgets)).toEqual(
      affectedWidgets2,
    );
    expect(getAffectedWidgetsFromLayers(layerQueue3, widgets)).toEqual(
      affectedWidgets3,
    );
    expect(getAffectedWidgetsFromLayers(layerQueue4, widgets)).toEqual(
      affectedWidgets4,
    );
  });
});

describe("should test getAllChildWidgets", () => {
  const widget1 = {
    widgetId: "0",
    children: ["1", "3", "4"],
  } as unknown as WidgetProps;

  const widget2 = {
    widgetId: "1",
    children: ["2"],
  } as unknown as WidgetProps;

  const widget3 = {
    widgetId: "2",
    children: ["5", "6", "7", "8"],
  } as unknown as WidgetProps;

  const widget4 = {
    widgetId: "3",
    children: [],
  } as unknown as WidgetProps;

  const childWidgets1 = {
    "1": true,
    "3": true,
    "4": true,
    "5": true,
    "6": true,
    "7": true,
    "8": true,
  };

  const childWidgets2 = {
    "5": true,
    "6": true,
    "7": true,
    "8": true,
  };

  const childWidgets3 = {
    "5": true,
    "6": true,
    "7": true,
    "8": true,
  };

  const childWidgets4 = {};

  it("should return all the child widgets except canvas widgets", () => {
    expect(getAllChildWidgets(widget1, widgets)).toEqual(childWidgets1);
    expect(getAllChildWidgets(widget2, widgets)).toEqual(childWidgets2);
    expect(getAllChildWidgets(widget3, widgets)).toEqual(childWidgets3);
    expect(getAllChildWidgets(widget4, widgets)).toEqual(childWidgets4);
  });
});
