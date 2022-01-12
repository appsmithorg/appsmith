import React from "react";
import SelectWidget, { SelectWidgetProps } from ".";
import configureStore from "redux-mock-store";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider, theme, dark } from "constants/DefaultTheme";

import "@testing-library/jest-dom";

import { RenderModes } from "constants/WidgetConstants";

jest.mock("react-dnd", () => ({
  useDrag: jest.fn().mockReturnValue([{ isDragging: false }, jest.fn()]),
}));

describe("<SelectWidget />", () => {
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
    },
    entities: { canvasWidgets: {}, app: { mode: "canvas" } },
  };

  function renderSelectWidget(props: SelectWidgetProps) {
    // Mock store to bypass the error of react-redux
    const store = configureStore()(initialState);
    return render(
      <Provider store={store}>
        <ThemeProvider
          theme={{ ...theme, colors: { ...theme.colors, ...dark } }}
        >
          <SelectWidget {...props} />
        </ThemeProvider>
      </Provider>,
    );
  }

  test("should not render dropdown wrapper if options are empty", async () => {
    const mockDataWithEmptyOptions = {
      widgetId: "Widget1",
      type: "SELECT_WIDGET",
      widgetName: "Select1",
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
      defaultOptionValue: { label: "", value: "" },
      onOptionChange: "mock-option-change",
      isRequired: false,
      isFilterable: false,
      defaultValue: "mock-label-1",
      selectedOptionLabel: "mock-label-1",
      serverSideFiltering: false,
      onFilterUpdate: "mock-update",
      updateWidgetMetaProperty: jest.fn(),
    };
    renderSelectWidget(mockDataWithEmptyOptions);

    const selectElement = screen.getByText("-- Select --");
    fireEvent.click(selectElement);

    expect(screen.getByText("No Results Found")).toBeInTheDocument();
  });
});
