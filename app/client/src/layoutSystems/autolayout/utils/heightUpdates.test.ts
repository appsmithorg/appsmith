import { updateWidgetPositions } from "./positionUtils";
import * as utils from "./flexWidgetUtils";
import {
  MAIN_CONTAINER_WIDGET_WITH_BUTTON,
  buttonData,
} from "./data/heightTestData";
import { EMPTY_TABS_DATA, TABS_DATA } from "./data/tabsData";

describe("auto-layout: heightUpdates", () => {
  beforeEach(() => {
    jest
      .spyOn(utils, "getWidgetMinMaxDimensionsInPixel")
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((widget: any) => {
        if (widget?.type === "CONTAINER_WIDGET")
          return {
            minWidth: 280,
            minHeight: 50,
            maxWidth: undefined,
            maxHeight: undefined,
          };

        return {
          minWidth: undefined,
          minHeight: undefined,
          maxWidth: undefined,
          maxHeight: undefined,
        };
      });
  });
  it("Canvas and container should increase in height on adding new widgets in a new row", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = { ...MAIN_CONTAINER_WIDGET_WITH_BUTTON };
    let updatedWidgets = updateWidgetPositions(data, "3", false, 4896);

    expect(updatedWidgets["2"].bottomRow).toBe(6);

    // Add a button in a new row
    const newButton = buttonData("5", "3");
    const data2 = {
      ...data,
      "5": newButton,
      "3": {
        ...data["3"],
        children: ["4", "5"],
        flexLayers: [
          {
            children: [
              {
                id: "4",
                align: "start",
              },
            ],
          },
          {
            children: [
              {
                id: "5",
                align: "start",
              },
            ],
          },
        ],
      },
    };

    updatedWidgets = updateWidgetPositions(data2, "3", false, 4896);
    /**
     * buttonHeight = 4
     * rowGap = 1.2
     * buffer = 2
     * total = 4 + 4 + 1.2 + 2 = 11.2
     */
    expect(updatedWidgets["2"].bottomRow).toBeGreaterThan(6);
    expect(Math.round(updatedWidgets["2"].bottomRow)).toBe(11);
  });

  it("canvas and container should decrease in height on removing widgets", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = { ...MAIN_CONTAINER_WIDGET_WITH_BUTTON };
    // Add a button in a new row
    const newButton = buttonData("5", "3");
    const data2 = {
      ...data,
      "5": newButton,
      "3": {
        ...data["3"],
        children: ["4", "5"],
        flexLayers: [
          {
            children: [
              {
                id: "4",
                align: "start",
              },
            ],
          },
          {
            children: [
              {
                id: "5",
                align: "start",
              },
            ],
          },
        ],
      },
    };
    let updatedWidgets = updateWidgetPositions(data2, "3", false, 4896);

    /**
     * buttonHeight = 4
     * rowGap = 1.2
     * buffer = 2
     * total = 4 + 4 + 1.2 + 2 = 11.2
     */
    expect(Math.round(updatedWidgets["2"].bottomRow)).toBe(11);

    // Remove the button
    const data3 = {
      "0": data["0"],
      "2": data["2"],
      "3": {
        ...data["3"],
        children: ["4"],
        flexLayers: [
          {
            children: [
              {
                id: "4",
                align: "start",
              },
            ],
          },
        ],
      },
      "4": data["4"],
    };

    updatedWidgets = updateWidgetPositions(data3, "3", false, 4896);
    expect(updatedWidgets["2"].bottomRow).toBe(6);
  });

  it("should update canvas height on deleting all children", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = { ...MAIN_CONTAINER_WIDGET_WITH_BUTTON };
    // Add a button in a new row
    const newButton = buttonData("5", "3");
    const data2 = {
      ...data,
      "5": newButton,
      "3": {
        ...data["3"],
        children: ["4", "5"],
        flexLayers: [
          {
            children: [
              {
                id: "4",
                align: "start",
              },
            ],
          },
          {
            children: [
              {
                id: "5",
                align: "start",
              },
            ],
          },
        ],
      },
    };
    let updatedWidgets = updateWidgetPositions(data2, "3", false, 4896);

    expect(Math.round(updatedWidgets["2"].bottomRow)).toBe(11);

    // Remove all child widgets
    const data3 = {
      "0": data["0"],
      "2": data["2"],
      "3": {
        ...data["3"],
        children: [],
        flexLayers: [],
      },
      "4": data["4"],
    };

    updatedWidgets = updateWidgetPositions(data3, "3", false, 4896);
    /**
     * Container (minHeight = 5)
     *   Canvas
     *
     * total height = 5
     */
    expect(updatedWidgets["2"].bottomRow).toBe(5);
  });
});

describe("auto-layout dynamic height: tabs widget", () => {
  beforeEach(() => {
    jest
      .spyOn(utils, "getWidgetMinMaxDimensionsInPixel")
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((widget: any) => {
        if (widget?.type === "TABS_WIDGET")
          return {
            minWidth: 280,
            minHeight: 300,
            maxWidth: undefined,
            maxHeight: undefined,
          };

        return {
          minWidth: undefined,
          minHeight: undefined,
          maxWidth: undefined,
          maxHeight: undefined,
        };
      });
  });

  it("should assign a height of 30 rows (minHeight) to an empty tabs widget", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = EMPTY_TABS_DATA;
    const updatedWidgets = updateWidgetPositions(
      data,
      "2",
      false,
      4896,
      false,
      { "1": { selectedTabWidgetId: "2" } },
    );

    /**
     * minHeight of TabsWidget = 30;
     * Buffer for Tabs header = 4;
     * Height of canvas = 30 - 4 = 26 * 10 = 260;
     */
    expect(updatedWidgets["1"].bottomRow).toBe(30);
    expect(updatedWidgets["2"].bottomRow).toBe(260);
  });

  it("should update height of Tabs widget based on selected tab height", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = TABS_DATA;
    let selectedTabWidgetId = "2";
    const updatedWidgets = updateWidgetPositions(
      data,
      selectedTabWidgetId,
      false,
      4896,
      false,
      { "1": { selectedTabWidgetId: selectedTabWidgetId } },
    );

    /**
     * TABS
     *  CANVAS
     *    AUDIO RECORDER (height = 7)
     *     TABLE (height = 30)
     *
     * canvas height = 7 + 30 + 1.2 (row gap) + 2 (buffer) = 40.2 * 10 = 402
     * tabs height = 40.2 + 4 (buffer for tabs header) = 44.2
     */
    expect(updatedWidgets["1"].bottomRow).toBe(44.2);
    expect(updatedWidgets["2"].bottomRow).toBe(402);

    // Switch to second tab which is empty
    selectedTabWidgetId = "3";
    const updatedWidgets2 = updateWidgetPositions(
      data,
      selectedTabWidgetId,
      false,
      4896,
      false,
      { "1": { selectedTabWidgetId: selectedTabWidgetId } },
    );

    expect(updatedWidgets2["1"].bottomRow).toBe(30);
    expect(updatedWidgets2["3"].bottomRow).toBe(260);
  });

  it("should account for the height of the tabs header", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = TABS_DATA;
    const selectedTabWidgetId = "2";
    const updatedWidgets = updateWidgetPositions(
      data,
      selectedTabWidgetId,
      false,
      4896,
      false,
      { "1": { selectedTabWidgetId: selectedTabWidgetId } },
    );

    /**
     * TABS
     *  CANVAS
     *    AUDIO RECORDER (height = 7)
     *     TABLE (height = 30)
     *
     * canvas height = 7 + 30 + 1.2 (row gap) + 2 (buffer) = 40.2 * 10 = 402
     * tabs height = 40.2 + 4 (buffer for tabs header) = 44.2
     */
    expect(updatedWidgets["1"].bottomRow).toBe(44.2);
    expect(updatedWidgets["2"].bottomRow).toBe(402);

    // set shouldShowTabs to false
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data2: { [k: string]: any } = {
      ...TABS_DATA,
      "1": {
        ...TABS_DATA["1"],
        shouldShowTabs: false,
      },
      "2": {
        ...TABS_DATA["2"],
        bottomRow: 300, // height of tabs widget is being set by a prior saga, so changing bottomRow here to trigger parent height update.
      },
    };
    const updatedWidgets2 = updateWidgetPositions(
      data2,
      selectedTabWidgetId,
      false,
      4896,
      false,
      { "1": { selectedTabWidgetId: selectedTabWidgetId } },
    );

    // height of canvas remains the same.
    expect(updatedWidgets2["2"].bottomRow).toBe(402);
    expect(updatedWidgets2["1"].bottomRow).toBe(40.2);
  });

  it("should not add buffer for header if showShouldTabs is false", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = {
      ...TABS_DATA,
      "1": {
        ...TABS_DATA["1"],
        shouldShowTabs: false,
      },
      "2": {
        ...TABS_DATA["2"],
        bottomRow: 300,
      },
    };
    const updatedWidgets = updateWidgetPositions(
      data,
      "2",
      false,
      4896,
      false,
      { "1": { selectedTabWidgetId: "2" } },
    );

    expect(updatedWidgets["2"].bottomRow).toBe(402);
    expect(updatedWidgets["1"].bottomRow).toBe(40.2);
  });

  it("should use the first child canvas for height calculation if selectedTabWidgetId is undefined", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = {
      ...TABS_DATA,
      "1": {
        ...TABS_DATA["1"],
        shouldShowTabs: false,
      },
    };
    const updatedWidgets = updateWidgetPositions(
      data,
      "1",
      false,
      4896,
      false,
      { "1": { selectedTabWidgetId: undefined } },
    );

    expect(updatedWidgets["2"].bottomRow).toBe(402);
    expect(updatedWidgets["1"].bottomRow).toBe(40.2);
  });

  it("should stretch on mobile viewport to accommodate widget wrapping", () => {
    // Place the two child fill widgets in the same row so that they wrap on mobile viewport.
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [k: string]: any } = {
      ...TABS_DATA,
      "2": {
        ...TABS_DATA["2"],
        flexLayers: [
          {
            children: [
              {
                id: "4",
                align: "start",
              },
              {
                id: "5",
                align: "start",
              },
            ],
          },
        ],
      },
    };
    const updatedWidgets = updateWidgetPositions(
      data,
      "2",
      false,
      4896,
      false,
      {
        "1": { selectedTabWidgetId: "2" },
      },
    );
    const bottomRow = updatedWidgets["1"].bottomRow;
    const updatedWidgets2 = updateWidgetPositions(data, "2", true, 478, false, {
      "1": { selectedTabWidgetId: "2" },
    });
    const mobileBottomRow = updatedWidgets2["1"].mobileBottomRow;

    expect(mobileBottomRow).toBeGreaterThan(bottomRow);
  });
});
