import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { Provider } from "react-redux";
import store from "store";
import { AnvilWidgetName } from ".";

const handler = {
  log: jest.fn(),
};
const logSpy = jest.spyOn(handler, "log");
const props = {
  widgetId: "widgetId",
  widgetName: "widgetName",
  layoutId: "layoutId",
  parentId: "parentId",
  widgetType: "widgetType",
};

// function getExampleDOM() {
//   const widgetEditor = document.createElement("div");
//   widgetEditor.setAttribute("id", "widgets-editor");
//   widgetEditor.setAttribute("height", "1200px");
//   widgetEditor.setAttribute("width", "500px");
//   widgetEditor.style.display = "flex";
//   widgetEditor.style.padding = "30px";
//   const widgetElement = document.createElement("div");
//   widgetElement.setAttribute("id", "anvil_widget_widgetId");
//   widgetElement.setAttribute("height", "200px");
//   widgetElement.setAttribute("width", "50px");

//   widgetEditor.appendChild(widgetElement);
// }

jest.mock("react-redux");

const shouldSelectOrFocus = jest.fn();
const getWidgetNameComponentStyleProps = jest.fn();
const getWidgetErrorCount = jest.fn();
const useSelector = jest.fn();

describe("AnvilWidgetName", () => {
  it("should not show AnvilWidgetName", async () => {
    shouldSelectOrFocus.mockReturnValue("focus");
    getWidgetNameComponentStyleProps.mockReturnValue({
      disableParentToggle: false,
      bGCSSVar: "--something",
      colorCSSVar: "--something",
      selectionBGCSSVar: "--something",
      selectionColorCSSVar: "--something",
    });
    getWidgetErrorCount.mockReturnValue(0);
    render(
      <Provider store={store}>
        <AnvilWidgetName {...props} />
        <div
          id="widgets-editor"
          style={{
            height: "1200px",
            width: "500px",
            display: "flex",
            padding: "30px",
          }}
        >
          <div
            id="anvil_widget_widgetId"
            style={{ height: "200px", width: "50px" }}
          />
        </div>
      </Provider>,
    );

    expect(screen.getByText("widgetName")).toBeInTheDocument();
  });

  //   it("should show Call the drag event handler on drag", async () => {
  //     const _props = {
  //       ...props,
  //       onDragStart: () => {
  //         handler.log("Dragged!");
  //       },
  //     };
  //     render(
  //       <Provider store={store}>
  //         <AnvilWidgetName {..._props} />
  //       </Provider>
  //     );

  //     const draggableNameComponent = screen.getByTestId(
  //       "t--anvil-draggable-widget-name",
  //     );
  //     expect(draggableNameComponent).toBeInTheDocument();
  //     fireEvent.dragStart(draggableNameComponent);

  //     expect(logSpy).toHaveBeenCalledWith("Dragged!");
  //   });
});
