import { render, screen } from "@testing-library/react";
import { dark, theme } from "constants/DefaultTheme";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import type { SelectWidgetProps } from "./";
import SelectWidget from "./";
import "@testing-library/jest-dom";
import { RenderModes } from "constants/WidgetConstants";

describe("<SelectWidget />", () => {
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

  const renderSelectWidget = (props: SelectWidgetProps) => {
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
  };

  test("should show error when Required is true and default selected value is empty", async () => {
    const mockDataWithOptions: SelectWidgetProps = {
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
      options: [
        {
          label: "female",
          value: "F",
        },
        {
          label: "male",
          value: "M",
        },
      ],
      onOptionChange: "mock-option-change",
      isRequired: true,
      isFilterable: false,
      serverSideFiltering: false,
      onFilterUpdate: "mock-update",
      updateWidgetMetaProperty: jest.fn(),
      labelText: "select label",
      filterText: "",
      selectedOptionLabel: "",
      defaultOptionValue: "",
      selectedOptionValue: "",
      isWidgetSelected: true,
    };

    renderSelectWidget(mockDataWithOptions);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });
  test("should not show error when Required is true and default selected value is not empty", async () => {
    const mockDataWithOptions: SelectWidgetProps = {
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
      options: [
        {
          label: "female",
          value: "F",
        },
        {
          label: "male",
          value: "M",
        },
      ],
      onOptionChange: "mock-option-change",
      isRequired: true,
      isFilterable: false,
      serverSideFiltering: false,
      onFilterUpdate: "mock-update",
      updateWidgetMetaProperty: jest.fn(),
      labelText: "select label",
      filterText: "",
      selectedOptionLabel: "",
      defaultOptionValue: "M",
      selectedOptionValue: "M",
      isWidgetSelected: true,
    };

    renderSelectWidget(mockDataWithOptions);
    expect(
      screen.queryByText("This field is required"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("male")).toBeInTheDocument();
  });
});
