import React from "react";
import DividerWidget, { DividerWidgetProps } from "./";
import configureStore from "redux-mock-store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider, theme, dark } from "constants/DefaultTheme";

jest.mock("react-dnd", () => ({
  useDrag: jest.fn().mockReturnValue([{ isDragging: false }, jest.fn()]),
}));

describe("<DividerWidget />", () => {
  const initialState = {
    ui: {
      widgetDragResize: {
        lastSelectedWidget: "Widget1",
        selectedWidgets: ["Widget1"],
      },
      propertyPane: {
        isVisible: true,
        widgetId: "Widget1",
      },
      debugger: {
        errors: {},
      },
      comments: {
        dragPointerOffset: null,
      },
      editor: {
        isPreviewMode: false,
      },
      widgetReflow: {
        enableReflow: true,
      },
    },
    entities: { canvasWidgets: {}, app: { mode: "canvas" } },
  };

  function renderDividerWidget(props: Partial<DividerWidgetProps> = {}) {
    const defaultProps: DividerWidgetProps = {
      orientation: "horizontal",
      capType: "nc",
      capSide: -1,
      strokeStyle: "solid",
      dividerColor: "black",
      thickness: 2,
      widgetId: "Widget1",
      type: "DIVIDER_WIDGET",
      widgetName: "Divider 1",
      parentId: "Container1",
      renderMode: "CANVAS",
      parentColumnSpace: 2,
      parentRowSpace: 3,
      leftColumn: 2,
      rightColumn: 4,
      topRow: 1,
      bottomRow: 2,
      isLoading: false,
      version: 1,
      disablePropertyPane: false,
      ...props,
    };
    // Mock store to bypass the error of react-redux
    const store = configureStore()(initialState);
    return render(
      <Provider store={store}>
        <ThemeProvider
          theme={{ ...theme, colors: { ...theme.colors, ...dark } }}
        >
          <DividerWidget {...defaultProps} />
        </ThemeProvider>
      </Provider>,
    );
  }

  test("should render Divider widget horizontal by default", async () => {
    const { queryByTestId } = renderDividerWidget();

    expect(queryByTestId("dividerHorizontal")).toBeTruthy();
  });

  test("should render Divider vertical", async () => {
    const { queryByTestId } = renderDividerWidget({ orientation: "vertical" });

    expect(queryByTestId("dividerVertical")).toBeTruthy();
  });
});
