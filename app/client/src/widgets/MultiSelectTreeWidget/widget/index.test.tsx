import { render, screen } from "@testing-library/react";
import { dark, theme } from "constants/DefaultTheme";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import type { MultiSelectTreeWidgetProps } from "./";
import MultiSelectTreeWidget from "./";

import "@testing-library/jest-dom";

import { RenderModes } from "constants/WidgetConstants";

describe("<MultiSelectTreeWidget />", () => {
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

  const renderMultiSelectTreeWidget = (props: MultiSelectTreeWidgetProps) => {
    const store = configureStore()(initialState);
    return render(
      <Provider store={store}>
        <ThemeProvider
          theme={{ ...theme, colors: { ...theme.colors, ...dark } }}
        >
          <MultiSelectTreeWidget {...props} />
        </ThemeProvider>
      </Provider>,
    );
  };

  test("should show error when Required is true and default selected value is empty", async () => {
    const mockDataWithOptions: MultiSelectTreeWidgetProps = {
      widgetId: "Widget1",
      type: "MULTI_SELECT_TREE_WIDGET",
      widgetName: "MultiTreeSelect1",
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
      defaultOptionValue: [],
      selectedOptionValue: "",
      isWidgetSelected: true,
      allowClear: false,
      selectedLabel: [],
      selectedOptionValueArr: [],
      selectedOptionValues: [],
      selectedOptionLabels: [],
      expandAll: false,
      mode: "SHOW_ALL",
      borderRadius: "",
      accentColor: "",
      isDirty: false,
    };

    renderMultiSelectTreeWidget(mockDataWithOptions);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });
});
