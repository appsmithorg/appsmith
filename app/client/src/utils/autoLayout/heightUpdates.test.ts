import { updateWidgetPositions } from "./positionUtils";
import {
  MAIN_CONTAINER_WIDGET_WITH_BUTTON,
  buttonData,
} from "./data/heightTestData";

describe("auto layout: heightUpdates", () => {
  it("Canvas and container should increase in height on adding new widgets in a new row", () => {
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
});
