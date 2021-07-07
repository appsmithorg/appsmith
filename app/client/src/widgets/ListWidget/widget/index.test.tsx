import React from "react";
import { WidgetProps } from "widgets/BaseWidget";
import ListWidget from ".";
import configureStore from "redux-mock-store";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider, theme, dark } from "constants/DefaultTheme";
import { ListWidgetProps } from "../constants";

jest.mock("react-dnd", () => ({
  useDrag: jest.fn().mockReturnValue([{ isDragging: false }, jest.fn()]),
}));

describe("<ListWidget />", () => {
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
    },
    entities: { canvasWidgets: {}, app: { mode: "canvas" } },
  };

  function renderListWidget(props: Partial<ListWidgetProps<WidgetProps>> = {}) {
    const defaultProps: ListWidgetProps<WidgetProps> = {
      image: "",
      defaultImage: "",
      widgetId: "Widget1",
      type: "LIST_WIDGET",
      widgetName: "List1",
      parentId: "Container1",
      renderMode: "CANVAS",
      parentColumnSpace: 2,
      parentRowSpace: 3,
      leftColumn: 2,
      rightColumn: 3,
      topRow: 1,
      bottomRow: 3,
      isLoading: false,
      listData: [],
      version: 16,
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
          <ListWidget {...defaultProps} />
        </ThemeProvider>
      </Provider>,
    );
  }

  test("should render settings control wrapper", async () => {
    const { queryByTestId } = renderListWidget();

    expect(
      queryByTestId("t--settings-controls-positioned-wrapper"),
    ).toBeTruthy();
  });

  test("should not render settings control wrapper", async () => {
    const { queryByTestId } = renderListWidget({ widgetId: "ListNew1" });

    expect(
      queryByTestId("t--settings-controls-positioned-wrapper"),
    ).toBeFalsy();
  });
});
