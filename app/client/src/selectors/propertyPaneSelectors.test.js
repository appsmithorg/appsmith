import { getCanvasWidgets } from "./propertyPaneSelectors";

describe("propertyPaneSelectors", () => {
  it("it tests getCanvasWidgets selectors", () => {
    const mockState = {
      entities: {
        canvasWidgets: "list-of-canvas-widgets",
      },
      evaluations: {},
    };

    const selected = getCanvasWidgets(mockState);
    expect(selected).toBe(mockState.entities.canvasWidgets);
  });
});
