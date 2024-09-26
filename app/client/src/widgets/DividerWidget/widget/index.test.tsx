import { render } from "@testing-library/react";
import { dark, theme } from "constants/DefaultTheme";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import type { DividerWidgetProps } from "./";
import DividerWidget from "./";

describe("<DividerWidget />", () => {
  const initialState = {
    ui: {
      appSettingsPane: {
        isOpen: false,
      },
      users: {
        featureFlag: {
          data: {},
        },
      },
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
      editor: {
        isPreviewMode: false,
      },
      widgetReflow: {
        enableReflow: true,
      },
      autoHeightUI: {
        isAutoHeightWithLimitsChanging: false,
      },
      mainCanvas: {
        width: 1159,
      },
      canvasSelection: {
        isDraggingForSelection: false,
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
    const { getByTestId } = renderDividerWidget();

    expect(getByTestId("dividerHorizontal")).toBeTruthy();
  });

  test("should render Divider vertical", async () => {
    const { getByTestId } = renderDividerWidget({ orientation: "vertical" });

    expect(getByTestId("dividerVertical")).toBeTruthy();
  });
});
