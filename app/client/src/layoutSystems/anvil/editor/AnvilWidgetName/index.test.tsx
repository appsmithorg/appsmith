import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { Provider } from "react-redux";
import { AnvilWidgetName } from ".";
import store from "store";
import { getWidgetNameComponentStyleProps } from "./utils";
import { getWidgetErrorCount, shouldSelectOrFocus } from "./selectors";

/* Mock Redux */
jest.mock("react-redux");
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  getWidgetNameComponentStyleProps: jest.fn(),
}));

jest.mock("./selectors", () => ({
  shouldSelectOrFocus: jest.fn(),
  getWidgetErrorCount: jest.fn(),
}));

jest.mock("react-redux", () => {
  return {
    ...jest.requireActual("react-redux"),
    useSelector: jest.fn((callback) => {
      if (typeof callback === "string") return callback;
      else return callback();
    }),
    useDispatch: () => jest.fn(),
  };
});
/* EO Mock Redux */

// This function mocks DOM HIERARCHY
function getExampleDOM() {
  const widgetEditor = document.createElement("div");
  widgetEditor.setAttribute("id", "widgets-editor");
  widgetEditor.setAttribute("height", "1200px");
  widgetEditor.setAttribute("width", "500px");
  widgetEditor.style.display = "flex";
  widgetEditor.style.padding = "30px";

  const widgetElement = document.createElement("div");
  widgetElement.setAttribute("id", "anvil_widget_widgetId");
  widgetElement.setAttribute("height", "200px");
  widgetElement.setAttribute("width", "50px");
  widgetElement.style.display = "flex";
  widgetElement.style.padding = "20px";
  widgetElement.style.margin = "50px";

  const widgetComponent = document.createElement("div");
  widgetComponent.innerHTML = "<p></p>";
  widgetComponent.setAttribute("id", "anvil_copmponent_widgetId");

  widgetElement.appendChild(widgetComponent);
  widgetEditor.appendChild(widgetElement);
  document.body.appendChild(widgetEditor);
}

const props = {
  widgetId: "widgetId",
  widgetName: "widgetName",
  layoutId: "layoutId",
  parentId: "parentId",
  widgetType: "widgetType",
};

const commonProps = {
  bGCSSVar: "--something",
  colorCSSVar: "--something",
  selectionBGCSSVar: "--something",
  selectionColorCSSVar: "--something",
};

describe("AnvilWidgetName", () => {
  getExampleDOM();

  it("should show AnvilWidgetName component", async () => {
    (shouldSelectOrFocus as jest.Mock).mockReturnValue("focus"); // This widget is focused
    (getWidgetNameComponentStyleProps as jest.Mock).mockReturnValue({
      disableParentToggle: false, // show parent toggle
      ...commonProps,
    });
    (getWidgetErrorCount as jest.Mock).mockReturnValue(0); // No errors in this widget

    render(
      <Provider store={store}>
        <div>
          <AnvilWidgetName {...props} />
        </div>
      </Provider>,
    );
    await act(async () => {}); // Flush microtasks.

    expect(screen.getByText("widgetName")).toBeInTheDocument(); // widget name displays
    expect(
      screen.getByTestId("t--splitbutton-clickable-button"), // widget name component shows
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--splitbutton-left-toggle"), // parent selection toggle exists
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("t--splitbutton-right-toggle"), // No error toggle to be shown
    ).not.toBeInTheDocument();
  });

  it("should not show AnvilWidgetName component", async () => {
    (shouldSelectOrFocus as jest.Mock).mockReturnValue("none"); // No selection or focus state for widget
    (getWidgetNameComponentStyleProps as jest.Mock).mockReturnValue({
      disableParentToggle: false,
      ...commonProps,
    });
    (getWidgetErrorCount as jest.Mock).mockReturnValue(0);

    render(
      <Provider store={store}>
        <div>
          <AnvilWidgetName {...props} />
        </div>
      </Provider>,
    );
    await act(async () => {}); // Flush microtasks.

    expect(screen.queryByText("widgetName")).not.toBeInTheDocument(); // Widget name component should not show
  });

  it("should show error toggle when errors exist", async () => {
    (shouldSelectOrFocus as jest.Mock).mockReturnValue("select");
    (getWidgetNameComponentStyleProps as jest.Mock).mockReturnValue({
      disableParentToggle: false,
      ...commonProps,
    });
    (getWidgetErrorCount as jest.Mock).mockReturnValue(1); // has errors

    render(
      <Provider store={store}>
        <div>
          <AnvilWidgetName {...props} />
        </div>
      </Provider>,
    );
    await act(async () => {}); // Flush microtasks.

    expect(screen.getByText("widgetName")).toBeInTheDocument();
    expect(
      screen.getByTestId("t--splitbutton-clickable-button"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--splitbutton-right-toggle"), // should show error toggle
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--splitbutton-left-toggle"),
    ).toBeInTheDocument();
  });

  it("should show not show parent toggle when disabled", async () => {
    (shouldSelectOrFocus as jest.Mock).mockReturnValue("select"); // This widget is selected
    (getWidgetNameComponentStyleProps as jest.Mock).mockReturnValue({
      disableParentToggle: true, // Do not show parent toggle
      ...commonProps,
    });
    (getWidgetErrorCount as jest.Mock).mockReturnValue(1); // One error exists in widget

    render(
      <Provider store={store}>
        <div>
          <AnvilWidgetName {...props} />
        </div>
      </Provider>,
    );
    await act(async () => {}); // Flush microtasks.

    expect(screen.getByText("widgetName")).toBeInTheDocument(); // Widget name component shows
    expect(
      screen.getByTestId("t--splitbutton-clickable-button"), // Widget name component button shows
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--splitbutton-right-toggle"), // widget name right toggle (error toggle) shows
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("t--splitbutton-left-toggle"), // widget name parent selection toggle (left toggle) does not show
    ).not.toBeInTheDocument();
  });
});
