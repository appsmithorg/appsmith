import { fireEvent, render, screen } from "@testing-library/react";
import { dark, theme } from "constants/DefaultTheme";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import type { DropdownWidgetProps } from "./";
import DropdownWidget from "./";

import "@testing-library/jest-dom";

import { RenderModes } from "constants/WidgetConstants";

describe("<DropdownWidget />", () => {
  const initialState = {
    ui: {
      appSettingsPane: {
        isOpen: false,
      },
      widgetDragResize: {
        lastSelectedWidget: "Widget1",
        selectedWidgets: ["Widget1"],
      },
      users: {
        featureFlag: {
          data: {},
        },
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

  function renderDropdownWidget(props: DropdownWidgetProps) {
    // Mock store to bypass the error of react-redux
    const store = configureStore()(initialState);

    return render(
      <Provider store={store}>
        <ThemeProvider
          theme={{ ...theme, colors: { ...theme.colors, ...dark } }}
        >
          <DropdownWidget {...props} />
        </ThemeProvider>
      </Provider>,
    );
  }

  test("should not render dropdown wrapper if options are empty", async () => {
    const mockDataWithEmptyOptions = {
      widgetId: "Widget1",
      type: "DIVIDER_WIDGET",
      widgetName: "Divider 1",
      renderMode: RenderModes.CANVAS,
      parentColumnSpace: 2,
      parentRowSpace: 3,
      leftColumn: 2,
      rightColumn: 4,
      topRow: 1,
      bottomRow: 2,
      isLoading: false,
      version: 1,
      selectedOption: { label: "", value: "" },
      options: [],
      onOptionChange: "mock-option-change",
      isRequired: false,
      isFilterable: false,
      defaultValue: "mock-label-1",
      selectedOptionLabel: "mock-label-1",
      serverSideFiltering: false,
      onFilterUpdate: "mock-update",
      updateWidgetMetaProperty: jest.fn(),
    };

    // @ts-expect-error: type mismatch
    renderDropdownWidget(mockDataWithEmptyOptions);

    const selectElement = screen.getByText("-- Select --");

    fireEvent.click(selectElement);

    expect(screen.getByText("No Results Found")).toBeInTheDocument();
  });
});
