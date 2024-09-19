import { fireEvent, render, screen } from "@testing-library/react";
import { AnvilWidgetNameComponent } from "./AnvilWidgetNameComponent";
import "@testing-library/jest-dom";
import React from "react";
import { Provider } from "react-redux";
import store from "store";

const handler = {
  log: jest.fn(),
};
const logSpy = jest.spyOn(handler, "log");
const props = {
  name: "WidgetName",
  widgetId: "widgetId",
  selectionBGCSSVar: "--something",
  selectionColorCSSVar: "--something",
  bGCSSVar: "--something",
  colorCSSVar: "--something",
  disableParentSelection: false,
  showError: false,
  onDragStart: () => {},
};

describe("AnvilWidgetNameComponent", () => {
  it("should show SplitButton", async () => {
    render(
      <Provider store={store}>
        <AnvilWidgetNameComponent {...props} />
      </Provider>,
    );
    expect(screen.getByText("WidgetName")).toBeInTheDocument();
  });

  it("should show Call the drag event handler on drag", async () => {
    const _props = {
      ...props,
      onDragStart: () => {
        handler.log("Dragged!");
      },
    };

    render(
      <Provider store={store}>
        <AnvilWidgetNameComponent {..._props} />
      </Provider>,
    );

    const draggableNameComponent = screen.getByTestId(
      "t--anvil-draggable-widget-name",
    );

    expect(draggableNameComponent).toBeInTheDocument();
    fireEvent.dragStart(draggableNameComponent);

    expect(logSpy).toHaveBeenCalledWith("Dragged!");
  });
});
